const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const { formatRange } = require('../dist/core/format-range')
const { formatSelection } = require('../dist/core/format-selection')
const { normalizeLanguage } = require('../dist/core/normalize-language')

/**
 * 读取扩展清单内容，用于校验 step5 需要回归的入口配置。
 */
function readPackageJson() {
    const packageJsonPath = path.join(__dirname, '..', 'package.json')
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')

    return JSON.parse(packageJsonContent)
}

/**
 * 构造结构化复制文本的期望输出，便于断言格式保持稳定。
 */
function createExpectedStructuredCopy({ code, filePath, language, range }) {
    return `[file] ${filePath}
[range] ${range}
[lang] ${language}

\`\`\`${language}
${code.endsWith('\n') ? code : `${code}\n`}\`\`\``
}

/**
 * 校验核心格式化逻辑是否满足 step5 回归要求。
 */
function verifyCoreFormatting() {
    assert.equal(
        formatRange({
            start: { line: 0, character: 0 },
            end: { line: 3, character: 1 },
        }),
        '1:1-4:2'
    )

    assert.equal(normalizeLanguage('typescriptreact'), 'tsx')
    assert.equal(normalizeLanguage('javascriptreact'), 'jsx')
    assert.equal(normalizeLanguage('shellscript'), 'bash')
    assert.equal(normalizeLanguage('plaintext'), 'text')
    assert.equal(normalizeLanguage('   '), 'text')
    assert.equal(normalizeLanguage('custom language'), 'text')

    assert.equal(
        formatSelection({
            code: 'console.log("structured copy")',
            filePath: 'src/example.ts',
            language: 'typescript',
            range: '1:1-1:31',
        }),
        createExpectedStructuredCopy({
            code: 'console.log("structured copy")',
            filePath: 'src/example.ts',
            language: 'typescript',
            range: '1:1-1:31',
        })
    )
}

/**
 * 校验扩展清单中的命令入口与 CodeLens 默认配置。
 */
function verifyContributionConfiguration() {
    const packageJson = readPackageJson()
    const commandIds = packageJson.contributes.commands.map(
        command => command.command
    )
    const editorContextMenuCommands = packageJson.contributes.menus[
        'editor/context'
    ].map(menu => menu.command)
    const keybindingCommands = packageJson.contributes.keybindings.map(
        keybinding => keybinding.command
    )
    const codeLensDebounceConfiguration =
        packageJson.contributes.configuration.properties[
            'structuredCopy.codeLensDebounceMs'
        ]

    assert.ok(commandIds.includes('structuredCopy.copySelection'))
    assert.ok(
        editorContextMenuCommands.includes('structuredCopy.copySelection')
    )
    assert.ok(keybindingCommands.includes('structuredCopy.copySelection'))
    assert.equal(codeLensDebounceConfiguration.default, 200)
}

/**
 * 执行 step5 的仓库内回归校验。
 */
function runStep5Verification() {
    verifyCoreFormatting()
    verifyContributionConfiguration()

    console.log('Step 5 verification passed.')
}

runStep5Verification()
