# 可视化编辑器 AI 协同开发总纲 (AI_DEV_GUIDELINES)

> **警告：所有接入本项目的 AI 开发者（或者人类开发者），在修改任何一行代码前，必须严格通读并遵守本文档中的所有规范。如果代码违反下述红线，将被无情 Refuse 并要求重写！**

## 1. 核心架构与设计模式约束 (Architecture & Patterns)
本项目旨在打造高级企业级可视化编辑器，严禁堆砌冗余的“面条代码”。开发过程必须遵循以下设计原则与模式：

- **状态总线分离 (MVVM 架构)**：`Zustand` 为系统唯一的 Single Source of Truth（Model 层）。严禁在 React 组件内部跨层级传递 Props 或者乱写 EventBus。各面板（View 层）直接订阅 Store。
- **命令模式 (Command Pattern)**：【强制核心】所有针对画布图元（Node）的新增、删除、位移、样式修改操作，**不可直接篡改数据**，必须封装为带有 `execute()` 和 `undo()` 的命令对象，压入撤销重做栈，保障编辑器时光回溯的稳定性。
- **工厂方法与策略模式 (Factory / Strategy)**：图形元素的渲染、面板字段的生成，必须由工厂方法根据 `Node.type` 统一调度返回，抹平未来多引擎（2D Leafer.js 和 3D R3F）的数据结构差异。

## 2. 国际化基建约束 (i18n & Localization)
我们要求项目自发版的第一天起即支持全球化。
- **工具集**：`react-i18next`
- **强制红线**：严禁在除了 `locales` 目录以外的任何 `.tsx`、`.ts` 文件中硬编码哪怕一个中文字符。所有界面标题、按钮文案、弹窗警告必须使用 `t('module.key')` 进行映射取值。

## 3. 全局动态主题系统 (Theming Protocol)
- **工具集**：Tailwind CSS + shadcn/ui 的 CSS Variables。
- **强制红线**：所有关于字体颜色、背景、边框的 CSS 抒写，**严禁使用绝对硬编码色值**（如 `#FFFFFF`，`rgba()`, 等）。必须一律使用如 `bg-background`, `text-muted-foreground`, `border-border` 等语义化原生变量。
- 所有面板组件必须完美兼容深浅色模式（Dark Mode / Light Mode）的平滑切换机制。

## 4. 测试与工程质量保障 (TDD / BDD)
每一次 AI 的增量发版，必须配有对应的自动化测试支持：

- **基建底座单元测试 (Unit Testing)**
  - 工具栈：`Vitest` + `@testing-library/react`
  - 覆盖率红线：状态流转函数、坐标换算算法、工具类纯函数必须达到 80%+ 测试覆盖度才能合并。

- **黑盒工作流端到端测试 (E2E Testing)**
  - 工具栈：`Playwright`
  - 检测集：任何涉及“从侧边栏拖拽组件至画布”、“选中组件并在右侧修改尺寸”的闭环核心操作，必须由 Playwright 提供的浏览器回放脚本严防死守，杜绝回归 Bug。

## 5. 三方模块物理边界隔离
为了配合大规模并行开发，AI 需要认领自己归属的沙盒目录，**完全禁止越权修改**：
- `src/core/`：只允许处理画布数学运算与跨引擎抹平（绝对不可入侵 UI 视图层代码）。
- `src/components/MaterialPanel/`：只负责展示左侧拖拽源的卡片布局。
- `src/components/ConfigPanel/`：只涉及读取目前聚焦的 `activeId`，动态生成右侧调节面板组件（InputSlider 等）。
- `src/store/`：唯一的数据流通脉络。

---

> *This document serves as the absolute constitution for all subsequent structural and functional enhancements within the **editor-2d** workspace.*
