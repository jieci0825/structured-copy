# Structured Copy

Structured Copy 是一个 `VS Code` 扩展，用于把当前主选区复制成可直接发给 AI、聊天工具、文档或评审场景的结构化引用文本。

当前版本已完成 MVP 主链路、三种触发入口、异常兜底和回归文档补充，可作为最小可演示、可交接版本继续迭代。

## MVP 能力

- 提供统一命令 `structuredCopy.copySelection`。
- 仅处理当前活动编辑器的主选区。
- 将选区复制为固定结构：
  - 文件路径
  - 选区范围
  - 语言标识
  - 原始代码块
- 路径优先输出工作区相对路径：
  - 单工作区：`相对路径`
  - 多工作区：`工作区名/相对路径`
  - 非工作区文件：降级为绝对路径
- 范围按 `1-based` 行列号输出。
- 语言标识支持常见别名映射：
  - `typescriptreact -> tsx`
  - `javascriptreact -> jsx`
  - `shellscript -> bash`
  - 未识别值降级为 `text`
- 复制成功后不额外弹出成功提示。

## 使用入口

### 1. 命令面板

在 `Command Palette` 中搜索并执行 `Structured Copy`。

适用场景：

- 首次验证扩展是否安装成功
- 不记快捷键时临时使用

### 2. 编辑器右键菜单

在文本编辑器中选中一段非空内容后，右键菜单会显示 `Structured Copy`。

适用场景：

- 鼠标操作为主的日常复制
- 演示时直观展示“选中即复制结构化引用”

### 3. 默认快捷键

- macOS：`cmd+shift+alt+c`
- Windows / Linux：`ctrl+shift+alt+c`

适用场景：

- 高频复制代码片段
- 不希望打断当前编辑节奏

### 4. CodeLens 延时入口

在活动编辑器中选中一段非空内容并稳定停留默认约 `200ms` 后，会在选区首行上方看到 `Structured Copy`。

行为说明：

- 支持通过 `structuredCopy.codeLensDebounceMs` 调整显示延迟
- 当选区变化、选区清空、编辑器切换或窗口失焦时自动隐藏

适用场景：

- 希望“选中后就地操作”
- 不想依赖右键菜单或快捷键

## 输出格式

复制后的剪贴板内容固定为：

````text
[file] src/core/format-range.ts
[range] 1:1-4:2
[lang] typescript

```typescript
export const formatRange = (selection: Selection): string => {
    const startLine = selection.start.line + 1
    return `${startLine}:1-4:2`
}
```
````

字段说明：

- `[file]`：文件定位路径
- `[range]`：选区范围，格式为 `startLine:startColumn-endLine:endColumn`
- `[lang]`：代码块语言标识
- 代码块：原始选中文本

## 已知边界

当前版本明确不支持以下内容：

- 改造系统默认 `Cmd/Ctrl + C`
- 多选区聚合复制
- 跨多次复制累积多个片段
- 多文件片段收集器
- 自定义复制模板
- 复制前预览面板
- 绝对路径 / 相对路径切换等复杂配置化能力

这意味着当前 MVP 的目标是稳定完成“单文件单选区结构化复制”，而不是做完整的片段管理工具。

## 本地开发与演示

1. 安装依赖

```bash
npm install
```

2. 编译扩展

```bash
npm run compile
```

3. 执行仓库内回归

```bash
npm run verify:step5
```

4. 启动 `Extension Development Host`

- 使用 `VS Code` 打开当前项目目录
- 按 `F5` 启动调试
- 在新打开的扩展调试窗口中打开任意文本文件
- 选中一段代码后，通过命令面板、右键菜单、快捷键或 `CodeLens` 触发 `Structured Copy`

## 验收与交接资料

- MVP 文档：`docs/structured-copy-mvp.md`
- 执行计划：`docs/structured-copy-execution-plan.md`
- Step 1 样例：`docs/structured-copy-step1-samples.md`
- Step 5 验收记录：`docs/structured-copy-step5-acceptance.md`
- 下一阶段 Roadmap：`docs/structured-copy-roadmap.md`

## 当前状态

当前仓库已经完成 `step6`：

- MVP 主链路、右键菜单、快捷键和 `CodeLens` 入口已具备。
- 核心格式化规则、异常兜底和状态治理已落地。
- 回归脚本与验收记录已补齐。
- 交付 README 和下一阶段 Roadmap 已补齐。

如需继续推进下一阶段能力，请从 `docs/structured-copy-roadmap.md` 开始。
