/**
 * 描述结构化复制输出所需的上下文信息。
 */
export interface StructuredSelectionContext {
    code: string
    filePath: string
    language: string
    range: string
}

/**
 * 格式化结构化选区最终写入剪贴板的文本内容。
 */
export const formatSelection = (
    context: StructuredSelectionContext
): string => {
    const codeBlockContent = context.code.endsWith('\n')
        ? context.code
        : `${context.code}\n`

    return `[file] ${context.filePath}
[range] ${context.range}
[lang] ${context.language}

\`\`\`${context.language}
${codeBlockContent}\`\`\``
}
