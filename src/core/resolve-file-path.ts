import { relative } from 'node:path'
import { workspace } from 'vscode'

import type { TextDocument } from 'vscode'
import type { WorkspaceFolder } from 'vscode'

const UNKNOWN_FILE_PATH = 'unknown'

/**
 * 将本地文件路径标准化为正斜杠格式。
 */
const normalizePathSeparators = (filePath: string): string => {
    return filePath.replace(/\\/g, '/')
}

/**
 * 解析文档在异常场景下可展示的降级路径。
 */
const resolveFallbackFilePath = (document: TextDocument): string => {
    const fallbackFilePath =
        document.fileName || document.uri.fsPath || document.uri.path || document.uri.toString()

    if (!fallbackFilePath) {
        return UNKNOWN_FILE_PATH
    }

    return normalizePathSeparators(fallbackFilePath)
}

/**
 * 判断当前是否处于多工作区场景。
 */
const hasMultipleWorkspaceFolders = (): boolean => {
    return (workspace.workspaceFolders?.length ?? 0) > 1
}

/**
 * 解析文档在所属工作区中的展示路径。
 */
const resolveWorkspaceRelativePath = (
    document: TextDocument,
    workspaceFolder: WorkspaceFolder
): string => {
    const relativePath = normalizePathSeparators(relative(workspaceFolder.uri.fsPath, document.uri.fsPath))

    if (!relativePath) {
        return resolveFallbackFilePath(document)
    }

    if (!hasMultipleWorkspaceFolders()) {
        return relativePath
    }

    if (!workspaceFolder.name) {
        return relativePath
    }

    return `${workspaceFolder.name}/${relativePath}`
}

/**
 * 解析当前文档用于展示的路径。
 */
export const resolveFilePath = (document: TextDocument): string => {
    try {
        const workspaceFolder = workspace.getWorkspaceFolder(document.uri)

        if (workspaceFolder) {
            return resolveWorkspaceRelativePath(document, workspaceFolder)
        }
    } catch {
        return resolveFallbackFilePath(document)
    }

    return resolveFallbackFilePath(document)
}
