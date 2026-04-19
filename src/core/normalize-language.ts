const languageAliasMap: Record<string, string> = {
    javascriptreact: 'jsx',
    plaintext: 'text',
    shellscript: 'bash',
    typescriptreact: 'tsx',
}
const safeMarkdownLanguagePattern = /^[a-z0-9_#+.-]+$/

/**
 * 将 VS Code 的 language id 标准化为 Structured Copy 输出值。
 */
export const normalizeLanguage = (
    languageId: string | null | undefined
): string => {
    if (typeof languageId !== 'string') {
        return 'text'
    }

    const normalizedLanguageId = languageId.trim().toLowerCase()

    if (!normalizedLanguageId) {
        return 'text'
    }

    const aliasedLanguageId =
        languageAliasMap[normalizedLanguageId] ?? normalizedLanguageId

    if (!safeMarkdownLanguagePattern.test(aliasedLanguageId)) {
        return 'text'
    }

    return aliasedLanguageId
}
