import { window } from 'vscode'
import type { TextDocument, TextEditor } from 'vscode'

export const structuredCopySupportedSchemes = new Set(['file', 'untitled'])

/**
 * 在存在活动文本编辑器时返回当前编辑器实例。
 */
export const getActiveTextEditor = (): TextEditor | undefined => {
    return window.activeTextEditor
}

/**
 * 判断编辑器当前主选区是否为非空选区。
 */
export const hasNonEmptySelection = (editor: TextEditor): boolean => {
    return !editor.selection.isEmpty
}

/**
 * 判断当前文档是否属于 Structured Copy 支持的文本来源。
 */
export const isStructuredCopyDocument = (document: TextDocument): boolean => {
    return structuredCopySupportedSchemes.has(document.uri.scheme)
}

/**
 * 判断当前编辑器是否满足 Structured Copy 的基础执行条件。
 */
export const canStructuredCopyEditor = (
    editor: TextEditor | undefined
): editor is TextEditor => {
    return !!editor && isStructuredCopyDocument(editor.document) && hasNonEmptySelection(editor)
}
