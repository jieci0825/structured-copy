import { commands, env, window } from 'vscode'

import {
    formatRange,
    formatSelection,
    normalizeLanguage,
    resolveFilePath,
} from '@/core'
import {
    getActiveTextEditor,
    hasNonEmptySelection,
    isStructuredCopyDocument,
} from '@/shared'

import type { Disposable, TextEditor } from 'vscode'

export const copySelectionCommandId = 'structuredCopy.copySelection'

/**
 * 构建当前主选区对应的结构化引用文本。
 */
const createStructuredReference = (editor: TextEditor): string => {
    const { document, selection } = editor

    return formatSelection({
        code: document.getText(selection),
        filePath: resolveFilePath(document),
        language: normalizeLanguage(document.languageId),
        range: formatRange(selection),
    })
}

/**
 * 执行 Structured Copy 主命令。
 */
const executeCopySelection = async (): Promise<void> => {
    const activeTextEditor = getActiveTextEditor()

    if (!activeTextEditor) {
        await window.showWarningMessage('请先打开一个文本编辑器后再使用 Structured Copy。')
        return
    }

    if (!isStructuredCopyDocument(activeTextEditor.document)) {
        await window.showWarningMessage('当前编辑器内容暂不支持 Structured Copy。')
        return
    }

    if (!hasNonEmptySelection(activeTextEditor)) {
        await window.showWarningMessage('请先选中一段代码后再使用 Structured Copy。')
        return
    }

    try {
        const structuredReference = createStructuredReference(activeTextEditor)

        await env.clipboard.writeText(structuredReference)
    } catch (error) {
        console.error('[Structured Copy] Failed to copy selection.', error)
        await window.showErrorMessage('Structured Copy 失败，请稍后重试。')
    }
}

/**
 * 注册 Structured Copy 的复制命令。
 */
export const registerCopySelectionCommand = (): Disposable => {
    return commands.registerCommand(copySelectionCommandId, executeCopySelection)
}
