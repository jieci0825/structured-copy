# Structured Copy Step 1 样例

这份样例用于回归验证 `step1` 的核心链路，重点覆盖路径、范围和语言标识的输出规则。

## 单工作区文件

场景：

- 工作区根目录：`structured-copy`
- 文档路径：`src/core/format-range.ts`
- `languageId`：`typescript`
- 选区范围：从第 `1` 行第 `1` 列到第 `4` 行第 `2` 列

期望输出：

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

## 多工作区文件

场景：

- 工作区根目录：`frontend-suite`
- 当前工作区名：`web-app`
- 文档路径：`src/app/page.tsx`
- `languageId`：`typescriptreact`

期望输出：

````text
[file] web-app/src/app/page.tsx
[range] 8:5-16:2
[lang] tsx

```tsx
export function Page() {
    return <main>Hello</main>
}
```
````

## 非工作区文件

场景：

- 文档绝对路径：`/Users/demo/Desktop/scratch.sh`
- `languageId`：`shellscript`

期望输出：

````text
[file] /Users/demo/Desktop/scratch.sh
[range] 1:1-3:1
[lang] bash

```bash
echo "structured copy"
exit 0
```
````

## 未识别语言文件

场景：

- 文档路径：`notes/snippet.foo`
- `languageId`：`plaintext`

期望输出：

````text
[file] notes/snippet.foo
[range] 3:1-6:1
[lang] text

```text
custom format
still copyable
```
````
