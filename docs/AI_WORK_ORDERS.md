# 可视化编辑器 - AI 并行开发派工单 (Work Orders)

> **说明**: 本文档由架构师（Antigravity）制定。旨在将剩余功能物理拆分为独立的不相交沙盒模块，以便其他 AI 可以并行开发。每个 AI 开发者收到发单后，请按照以下规约和“验收标准（DoD）”进行代码构建，构建完毕后向我（架构师）提交验收。

---

## 🛠 模块3：左侧物料拖拽区 (Left Panel Materials)

**发包对象：AI 03**
**专属沙盒目录**：`src/components/left-panel/*`

### 1. 开发目标
实现一个基于 `shadcn/ui` 风格的组件折叠面板库（如按“基础图形”、“图表”、“3D模型”分类）。用户可以通过 HTML5 Drag API 从面板将组件卡片拖拽到屏幕中间的 `CenterCanvas` 区域。

### 2. 约束与依赖
- **禁止动作**：无论如何，**绝对禁止你修改 `LeaferCanvas.tsx` 或 `useEditorStore.ts`**。
- **数据流向**：拖拽松手（`onDrop`）时，读取你挂载在 `dataTransfer` 上的组件 JSON 数据，调用 `useEditorStore.getState().addNode({ ... })` 注入全局状态。
- **i18n**：请使用 `t('panel.xxx')` 为所有物料卡片命名。

### 3. 架构师验收标准 (DoD)
- [ ] UI 外观使用了 Tailwind CSS，与整体暗色/亮色模式完美融合。
- [ ] 左侧拖拽出来的方形卡片，在画布上方松开鼠标时，画布能立刻生成对应的实体图元。

---

## 🛠 模块4：右侧属性热更面板 (Right Panel Properties)

**发包对象：AI 04**
**专属沙盒目录**：`src/components/right-panel/*`

### 1. 开发目标
实现一个通用的、动态的属性配置表单引擎。当用户在画布中选中图元时，这里展示对应元素的坐标(X, Y)、尺寸(W, H)、颜色填充(Fill)、文字内容(Text)等调节功能。

### 2. 约束与依赖
- **禁止动作**：不管需求多么复杂，**绝对禁止你修改 `LeaferCanvas.tsx` 或 `useEditorStore.ts`**。
- **数据流向**：从 `useEditorStore()` 读取 `activeId`。使用 `elements.find(el => el.id === activeId)` 拿到数据对象。渲染 `shadcn/ui` 的 `Input` 和 `Slider`。
- **防抖机制**：输入框 onChange 触发过快会导致频繁执行 `updateNode(activeId, { ... })`，必须加入简单的 `useDebounce` （或者由 Zustand 底层限流），不然会卡爆 5000 图元的画板。
- **i18n**：表单 Label（如“宽度”、“背景色”）必须使用多语言翻译。

### 3. 架构师验收标准 (DoD)
- [ ] 未选中任何节点时，面板显示空状态（需漂亮插图或文案提示）。
- [ ] 选中方块时，调节颜色输入框（支持 hex 格式），画布上方块瞬间变色，**没有导致画布全局闪烁重绘**。

---

## 🛠 模块5：图层树与锁定管理面板 (Layer Tree Manager)

**发包对象：AI 05**
**专属沙盒目录**：`src/components/left-panel/LayerTree.tsx` (可置于左侧下方)

### 1. 开发目标
用列表树展示画布中所有按顺序叠加的图元。支持拖拽调整上下顺序层级（Z-Index 变更），支持单击某一行选中画布图元，支持一键锁定或隐藏某图层。

### 2. 约束与依赖
- **禁止动作**：只专注于树形组件展示，不要为了排序去重写 Zustand 状态核心库。
- **数据流向**：通过 `elements` 数组的顺序渲染列表。若顺序发生变化（拖拽列表项），深拷贝 `elements` 数组重新排序后，一次性提交给 Zustand 的如 `reorderNodes(newElements)` 方法（如果没有，允许你向架构师申请增加这个 Action）。

### 3. 架构师验收标准 (DoD)
- [ ] 左下角完美显示所有生成的方块列表。
- [ ] 在列表里选中项与在画布点击图元，两者的亮色选中态（ActiveId）永远保持一致不脱节。

---

## 🛠 模块6：顶栏操作台与历史记录引擎 (Top Toolbar & Undo/Redo)

**发包对象：AI 06**
**专属沙盒目录**：`src/components/top-toolbar/*`

### 1. 开发目标
加入【撤销】、【重做】、【清空画布】、【导出 JSON】、【导出 PNG】5 个核心按钮。按钮采用 `shadcn` 的图标按钮风格（集成 `lucide-react`）。

### 2. 约束与依赖
- **时间旅行**：Zustand 本身自带的不可变数据很好扩展。你需要基于 `immer` 或一个轻量的时间旅行栈，拦截并记录 `elements` 的每次实质性变更（注意防抖记录连续拖拽）。
- **导出功能**：导出基于 Zustand Store 里面存的 JSON，或者直接调用 Leafer 原生挂载实例的方法抓图。禁止使用 `html2canvas` 等沉重的外挂库。

### 3. 架构师验收标准 (DoD)
- [ ] 实现撤销重做的 `Ctrl+Z` / `Ctrl+Y` 全局快捷键监听。
- [ ] 画布拖拽后点击撤销，组件瞬间回退到最初地点。

---

> **致所有接受派工单的 AI (To all Assisting AI Agents)**:
> 请在接到用户的发包 Prompt 时，先利用内置工具 `view_file` 或读取 `d:\pro\editor-2d\ARCHITECTURE.md` 以获悉全局红线。开发完毕后，将你写好的 `.tsx` 文件直接通过 `write_to_file` 落地。由总架构师统一拉起测试并合并审阅！
