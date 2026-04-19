# Structured Copy Step 5 验收记录

记录时间：`2026-04-19`

这份记录用于收敛 `step5` 的回归验证结果，并统一当前 MVP 文档中的参数口径。

## 本轮结论

- 当前 `CodeLens` 稳定显示延迟以实现为准，默认值为 `200ms`。
- 已将执行计划、MVP 文档和预览文档中的对应参数统一为 `200ms`。
- 已补充可重复执行的回归命令：`npm run verify:step5`。
- 已完成 `TypeScript` 编译与类型检查，当前仓库可以通过构建。

## 仓库内回归范围

执行命令：

```bash
npm run check-types
npm run verify:step5
```

覆盖内容：

- 结构化范围输出保持 `1-based` 格式。
- 结构化复制结果包含 `[file]`、`[range]`、`[lang]` 和代码块。
- 常见语言别名映射保持稳定：
  - `typescriptreact -> tsx`
  - `javascriptreact -> jsx`
  - `shellscript -> bash`
  - 异常或未知值降级为 `text`
- 扩展入口配置存在且可回归检查：
  - `structuredCopy.copySelection` 命令
  - 编辑器右键菜单入口
  - 默认快捷键入口
  - `structuredCopy.codeLensDebounceMs` 默认值为 `200`

## 手动验收清单

以下场景仍需在 `Extension Development Host` 中逐条确认：

- 普通文本文件执行右键菜单复制。
- `ts` / `tsx` / `js` / `jsx` / `shellscript` 文件执行快捷键复制。
- 未识别语言文件输出 `text`。
- 工作区文件输出相对路径。
- 多工作区文件输出 `工作区名/相对路径`。
- 非工作区文件输出绝对路径降级。
- 选区稳定默认约 `200ms` 后显示 `CodeLens`。
- 快速拖选时不出现明显闪烁或残留。
- 清空选区、切换编辑器或窗口失焦后，`CodeLens` 正确消失。

## 相关回归材料

- 核心格式样例：`docs/structured-copy-step1-samples.md`
- Step 5 回归脚本：`scripts/verify-step5.js`
