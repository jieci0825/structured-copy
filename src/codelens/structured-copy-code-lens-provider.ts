import { CodeLens, EventEmitter, Range, window, workspace } from 'vscode'

import { copySelectionCommandId } from '@/commands'
import { canStructuredCopyEditor, structuredCopySupportedSchemes } from '@/shared'

import type {
    CancellationToken,
    CodeLensProvider,
    Disposable,
    DocumentSelector,
    Event,
    Selection,
    TextDocument,
    TextEditor,
    TextEditorSelectionChangeEvent,
    WindowState,
} from 'vscode'

const DEFAULT_CODE_LENS_DEBOUNCE_DELAY = 200
const STRUCTURED_COPY_CODE_LENS_TITLE = 'Structured Copy'

interface StableSelectionSnapshot {
    readonly documentUri: string
    readonly selection: Selection
}

export const structuredCopyDocumentSelector: DocumentSelector =
    Array.from(structuredCopySupportedSchemes, scheme => {
        return { scheme }
    })

/**
 * 将配置中的 CodeLens 延迟归一化为可用毫秒值。
 */
const normalizeCodeLensDebounceDelay = (value: number | undefined): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return DEFAULT_CODE_LENS_DEBOUNCE_DELAY
    }

    return Math.max(0, Math.floor(value))
}

/**
 * 为指定编辑器创建当前主选区快照。
 */
const createSelectionSnapshot = (
    editor: TextEditor
): StableSelectionSnapshot => {
    return {
        documentUri: editor.document.uri.toString(),
        selection: editor.selection,
    }
}

/**
 * 判断两个选区范围是否表示同一段内容。
 */
const areSelectionsEqual = (left: Selection, right: Selection): boolean => {
    return left.start.isEqual(right.start) && left.end.isEqual(right.end)
}

/**
 * 判断两个稳定选区快照是否一致。
 */
const areSelectionSnapshotsEqual = (
    left: StableSelectionSnapshot | undefined,
    right: StableSelectionSnapshot | undefined
): boolean => {
    if (!left && !right) {
        return true
    }

    if (!left || !right) {
        return false
    }

    return (
        left.documentUri === right.documentUri &&
        areSelectionsEqual(left.selection, right.selection)
    )
}

export class StructuredCopyCodeLensProvider implements CodeLensProvider {
    private readonly onDidChangeCodeLensesEmitter = new EventEmitter<void>()
    private readonly disposables: Disposable[] = []
    private stableSelectionSnapshot: StableSelectionSnapshot | undefined
    private pendingSelectionSnapshot: StableSelectionSnapshot | undefined
    private debounceTimer: NodeJS.Timeout | undefined

    public readonly onDidChangeCodeLenses: Event<void> =
        this.onDidChangeCodeLensesEmitter.event

    /**
     * 初始化 CodeLens provider，并接管选区与窗口状态监听。
     */
    public constructor() {
        this.disposables.push(
            window.onDidChangeActiveTextEditor(editor => {
                this.handleActiveTextEditorChange(editor)
            }),
            window.onDidChangeTextEditorSelection(event => {
                this.handleTextEditorSelectionChange(event)
            }),
            window.onDidChangeWindowState(windowState => {
                this.handleWindowStateChange(windowState)
            })
        )

        this.syncSelectionTracking(window.activeTextEditor)
    }

    /**
     * 刷新已注册的 Structured Copy CodeLens provider。
     */
    public refresh(): void {
        this.onDidChangeCodeLensesEmitter.fire()
    }

    /**
     * 在 CodeLens 配置变化后同步可见状态。
     */
    public handleConfigurationChange(): void {
        if (!this.isCodeLensEnabled()) {
            this.clearPendingSelection()
            this.clearStableSelection()
            return
        }

        this.clearPendingSelection()
        this.clearStableSelection()
        this.syncSelectionTracking(window.activeTextEditor)
    }

    /**
     * 根据当前稳定选区返回可渲染的 Structured Copy CodeLens。
     */
    public provideCodeLenses(
        document: TextDocument,
        _token: CancellationToken
    ): CodeLens[] {
        const stableSelectionSnapshot =
            this.getStableSelectionSnapshotForDocument(document)

        if (!stableSelectionSnapshot) {
            return []
        }

        return [
            new CodeLens(
                new Range(
                    stableSelectionSnapshot.selection.start.line,
                    0,
                    stableSelectionSnapshot.selection.start.line,
                    0
                ),
                {
                    title: STRUCTURED_COPY_CODE_LENS_TITLE,
                    command: copySelectionCommandId,
                }
            ),
        ]
    }

    public dispose(): void {
        this.clearPendingSelection()
        this.disposables.forEach(disposable => {
            disposable.dispose()
        })
        this.onDidChangeCodeLensesEmitter.dispose()
    }

    /**
     * 处理活动编辑器切换，并为新的主选区重新开始稳定计时。
     */
    private handleActiveTextEditorChange(editor: TextEditor | undefined): void {
        this.syncSelectionTracking(editor)
    }

    /**
     * 在主选区变化时移除现有 CodeLens，并等待选区重新稳定。
     */
    private handleTextEditorSelectionChange(
        event: TextEditorSelectionChangeEvent
    ): void {
        if (event.textEditor !== window.activeTextEditor) {
            return
        }

        this.syncSelectionTracking(event.textEditor)
    }

    /**
     * 在窗口失焦时立即清理入口，重新聚焦后按稳定选区规则恢复。
     */
    private handleWindowStateChange(windowState: WindowState): void {
        if (!windowState.focused) {
            this.clearPendingSelection()
            this.clearStableSelection()
            return
        }

        this.syncSelectionTracking(window.activeTextEditor)
    }

    /**
     * 判断当前编辑器是否满足 Structured Copy CodeLens 的显示前提。
     */
    private shouldTrackTextEditor(
        editor: TextEditor | undefined
    ): editor is TextEditor {
        if (!window.state.focused || !this.isCodeLensEnabled()) {
            return false
        }

        return canStructuredCopyEditor(editor)
    }

    /**
     * 读取当前可参与 Structured Copy CodeLens 跟踪的选区快照。
     */
    private getTrackableSelectionSnapshot(
        editor: TextEditor | undefined
    ): StableSelectionSnapshot | undefined {
        if (!this.shouldTrackTextEditor(editor)) {
            return undefined
        }

        return createSelectionSnapshot(editor)
    }

    /**
     * 根据当前编辑器状态同步 CodeLens 的待显示与已显示选区。
     */
    private syncSelectionTracking(editor: TextEditor | undefined): void {
        const nextSelectionSnapshot = this.getTrackableSelectionSnapshot(editor)

        if (!nextSelectionSnapshot) {
            this.clearPendingSelection()
            this.clearStableSelection()
            return
        }

        if (
            areSelectionSnapshotsEqual(
                this.stableSelectionSnapshot,
                nextSelectionSnapshot
            )
        ) {
            this.clearPendingSelection()
            return
        }

        if (
            areSelectionSnapshotsEqual(
                this.pendingSelectionSnapshot,
                nextSelectionSnapshot
            )
        ) {
            return
        }

        this.clearPendingSelection()
        this.clearStableSelection()
        this.pendingSelectionSnapshot = nextSelectionSnapshot
        this.debounceTimer = setTimeout(() => {
            this.promoteStableSelection(nextSelectionSnapshot)
        }, this.getCodeLensDebounceDelay())
    }

    /**
     * 在防抖结束后将仍然匹配的主选区提升为可显示状态。
     */
    private promoteStableSelection(
        selectionSnapshot: StableSelectionSnapshot
    ): void {
        const activeTextEditor = window.activeTextEditor
        const pendingSelectionSnapshot = this.pendingSelectionSnapshot

        if (
            !areSelectionSnapshotsEqual(
                pendingSelectionSnapshot,
                selectionSnapshot
            )
        ) {
            return
        }

        this.clearPendingSelection()

        if (!this.shouldTrackTextEditor(activeTextEditor)) {
            return
        }

        const latestSelectionSnapshot = createSelectionSnapshot(activeTextEditor)

        if (
            !areSelectionSnapshotsEqual(
                selectionSnapshot,
                latestSelectionSnapshot
            )
        ) {
            return
        }

        this.setStableSelectionSnapshot(selectionSnapshot)
    }

    /**
     * 读取当前文档对应的稳定选区快照，用于决定是否渲染 CodeLens。
     */
    private getStableSelectionSnapshotForDocument(
        document: TextDocument
    ): StableSelectionSnapshot | undefined {
        const activeTextEditor = window.activeTextEditor

        if (!this.shouldTrackTextEditor(activeTextEditor)) {
            return undefined
        }

        const stableSelectionSnapshot = this.stableSelectionSnapshot

        if (
            !stableSelectionSnapshot ||
            stableSelectionSnapshot.documentUri !== document.uri.toString()
        ) {
            return undefined
        }

        if (
            !areSelectionsEqual(
                activeTextEditor.selection,
                stableSelectionSnapshot.selection
            )
        ) {
            return undefined
        }

        return stableSelectionSnapshot
    }

    /**
     * 更新当前可见的稳定选区，并在状态变化时刷新 CodeLens。
     */
    private setStableSelectionSnapshot(
        selectionSnapshot: StableSelectionSnapshot | undefined
    ): void {
        if (
            areSelectionSnapshotsEqual(
                this.stableSelectionSnapshot,
                selectionSnapshot
            )
        ) {
            return
        }

        this.stableSelectionSnapshot = selectionSnapshot
        this.refresh()
    }

    /**
     * 清除当前可见的稳定选区状态。
     */
    private clearStableSelection(): void {
        this.setStableSelectionSnapshot(undefined)
    }

    /**
     * 停止尚未完成的选区稳定计时。
     */
    private clearPendingSelection(): void {
        this.pendingSelectionSnapshot = undefined

        if (!this.debounceTimer) {
            return
        }

        clearTimeout(this.debounceTimer)
        this.debounceTimer = undefined
    }

    /**
     * 判断当前是否允许显示 Structured Copy CodeLens。
     */
    private isCodeLensEnabled(): boolean {
        return workspace
            .getConfiguration('structuredCopy')
            .get('enableCodeLens', true)
    }

    /**
     * 读取当前 Structured Copy CodeLens 的防抖延迟配置。
     */
    private getCodeLensDebounceDelay(): number {
        const configuredDebounceDelay = workspace
            .getConfiguration('structuredCopy')
            .get<number>(
                'codeLensDebounceMs',
                DEFAULT_CODE_LENS_DEBOUNCE_DELAY
            )

        return normalizeCodeLensDebounceDelay(configuredDebounceDelay)
    }
}
