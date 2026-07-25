# 项目规则与代码规范 (Workspace Rules)

## 1. 国际化优先原则 (i18n First)
- **强制约束**：任何新增或修改的 UI 界面文本、弹窗提示、按钮标签、下拉选项或菜单项目，**必须优先**进行国际化多语言封装（使用 `t(...)` 或 `tr(...)` 函数）。
- **同步补全**：修改组件文本时，必须同步检查并补全 `src/locales/zh.json`、`src/locales/en.json` 以及 `src/locales/overrides.ts` 中的多语言键值对，**严禁**在组件代码中直接硬编码中文或英文文本。

## 2. 主题与设计系统优先 (Theme & Design System First)
- **样式统一**：必须优先使用项目定义的语义化主题 Token 及 Tailwind 设计系统类名（如 `bg-editor`、`text-editor-text`、`bg-card`、`border-border` 等）。
- **严禁样式硬编码**：禁止随意使用 ad-hoc 硬编码颜色（如 `#111827`、`#334155` 等），保证深色与浅色主题下界面的可读性与高质感自适应。

## 3. 设计模式优先 (Design Patterns First)
- **架构解耦**：严禁大量堆砌冗长混乱的 `if-else` 或 `switch-case` 逻辑判断。
- **模式驱动**：新增功能与重构时，必须优先采用策略模式（Strategy Pattern）、工厂模式（Factory Pattern）、责任链模式（Chain of Responsibility）及注册表模式（Registry Pattern）等先进设计模式，确保模块高内聚低耦合、易拓展且单元测试友好。

## 4. 严禁魔法变量 (No Magic Constants / Variables)
- **常量抽离**：代码中严禁出现任何未经定义的魔法数字或硬编码魔数（如未说明含义的像素尺寸 `288`、`64`，超时毫秒数 `350`，默认缩放倍率 `0.08`，全局 Key 等）。
- **具名声明**：所有配置项、数学因子与 Key 值必须抽离为具名常量文件（如 `src/constants/`）或模块顶部的强类型 `const` / `enum` 声明。

## 5. Git 提交规范 (Git Commit Convention)
- **MANDATORY**：所有 Git commit 提交信息必须统一使用 **中文** 编写（例如：`feat: 优化顶栏自适应响应式布局` 或 `修复: ...` / `新增: ...`）。
- **严禁** 使用全英文或无意义的 commit 提交信息。

## 6. 界面布局与响应式规范 (UI & Responsive Layout)
- **顶栏与工具栏响应式**：顶部工具栏在窄屏时，非核心或次要功能（如对齐分布、模板导入导出、清空画布）必须折叠收纳至下拉菜单（Dropdown/Popover）中，保证核心按钮（撤销/重做、保存、预览、导出图片）在任意分辨率下均不重叠、不换行、不被剪切。
