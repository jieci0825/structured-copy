import type { Selection } from 'vscode'

/**
 * 将 VS Code 选区格式化为 1-based 的范围字符串。
 */
export const formatRange = (selection: Selection): string => {
    const startLine = selection.start.line + 1
    const startCharacter = selection.start.character + 1
    const endLine = selection.end.line + 1
    const endCharacter = selection.end.character + 1

    return `${startLine}:${startCharacter}-${endLine}:${endCharacter}`
}
