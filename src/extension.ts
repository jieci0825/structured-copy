import { languages, workspace } from 'vscode'
import type { ExtensionContext } from 'vscode'

import { registerCopySelectionCommand } from '@/commands'
import {
    StructuredCopyCodeLensProvider,
    structuredCopyDocumentSelector,
} from '@/codelens'

/**
 * 激活 Structured Copy 扩展。
 */
export const activate = (context: ExtensionContext): void => {
    const structuredCopyCodeLensProvider = new StructuredCopyCodeLensProvider()

    context.subscriptions.push(
        registerCopySelectionCommand(),
        structuredCopyCodeLensProvider,
        languages.registerCodeLensProvider(
            structuredCopyDocumentSelector,
            structuredCopyCodeLensProvider
        ),
        workspace.onDidChangeConfiguration(event => {
            if (
                event.affectsConfiguration('structuredCopy.enableCodeLens') ||
                event.affectsConfiguration('structuredCopy.codeLensDebounceMs')
            ) {
                structuredCopyCodeLensProvider.handleConfigurationChange()
            }
        })
    )
}

/**
 * 停用 Structured Copy 扩展。
 */
export const deactivate = (): void => {}
