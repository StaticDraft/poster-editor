# 🎨 Visual Poster Editor (极速高性能 Web 在线海报/图文编辑器)

> 基于 **Vite + React 18 + TypeScript + Leafer.js (HTML5 Canvas 渲染引擎) + TailwindCSS + i18next** 打造的高性能、可解耦、开箱即用的现代化海报与大屏图文设计工具。

---

## 🌟 核心特性与卖点概览

### 1. ⚡ 极速 Canvas 渲染架构 (Leafer.js 驱动)
- 相比传统 DOM/Fabric.js，Leafer.js 提供极高的图形渲染性能与毫秒级图元拖拽交互。
- 完整支持 **Text (文字)**、**Image (图片)**、**Shape (矩形/图形)**、**QRCode (二维码)**、**Barcode (条形码)** 以及 **Mosaic (马赛克打码遮罩)** 6 大核心图元。

### 2. 🖼️ 离屏 3x 高清导出系统 (Offscreen High-Res Export)
- 纯离屏隔离容器渲染，不受屏幕缩放与 DPI 影响。
- 支持 **PNG (无损透明)**、**JPG**、**WebP** 三种格式。
- 支持 **1x (标准)**、**2x (高清推荐)**、**3x (印刷级超清)** 导出倍率与压缩质量滑动调节。

### 3. ✨ 批量海报生成套打器 (Batch Export Engine)
- **商用杀手级功能**：支持输入/导入多组数据集（商品标题、特惠价格、描述文案、二维码 URL）。
- 自动离屏批量替换图元变量，一键批量渲染并打包下载多张高清海报。

### 4. 🎨 智能配色与居中大弹窗字体工坊 (Palette & Font Gallery)
- **AI 调色板**：内置 6 大精选配色方案（霓虹炫彩、极简黑白、马卡龙可爱、国潮红金、深海极客等），一键全画布调色。
- **字体工坊 modal 弹窗**：支持 Google Fonts 与中文艺术字体（站酷小薇、马善政毛笔、龙藏体等），内置实时自定义文案排版预览。

### 5. 💄 图像 P 图抠图与滤镜特效 (Image FX & Chroma Key)
- 一键纯浅白背景消融与单色绿幕抠图。
- 模糊打码与马赛克粒子调节。
- 赛博朋克、暖调复古、高对比胶片等一键滤镜预设。

### 6. 🌐 100% 深度国际化 (i18n Multi-language)
- 界面全量控件、属性面板、弹窗与提示无缝支持 **中文 (zh-CN)** 与 **英文 (en-US)** 动态切换。

---

## 🛠️ 技术栈架构

| 架构层级 | 使用技术 / 依赖包 |
| :--- | :--- |
| **前端框架** | React 18, TypeScript, Vite |
| **Canvas 渲染引擎** | Leafer.js (`leafer-ui`, `@leafer-in/export`) |
| **状态管理** | Zustand (`useEditorStore`) |
| **国际化多语言** | i18next, react-i18next |
| **样式与组件库** | TailwindCSS, Lucide Icons |
| **单元测试** | Vitest (内置 35+ 单元测试用例) |

---

## 🚀 快速启动指南

### 1. 克隆项目与安装依赖
```bash
git clone <repository-url>
cd poster-editor
npm install  # 或 yarn / pnpm install
```

### 2. 本地开发调试
```bash
npm run dev
```
打开浏览器访问 `http://localhost:5173` 即可开启海报设计体验。

### 3. 执行类型检查与单元测试
```bash
# 执行 TypeScript 类型安全检查
npx tsc --noEmit

# 执行 Vitest 自动化单元测试
npm run test
```

### 4. 打包构建生产版本
```bash
npm run build
```

---

## 📁 项目目录结构说明

```
poster-editor/
├── src/
│   ├── components/
│   │   ├── left-panel/      # 左侧资源面板（模板库、组件库、素材库、图层管理）
│   │   ├── right-panel/     # 右侧属性面板（图元属性、画布配置、字体工坊）
│   │   ├── top-toolbar/     # 顶部工具栏（尺寸预设、配色方案、快捷键、批量导出）
│   │   ├── feedback/        # 模态弹窗（高清导出、批量套打、快捷键对话框）
│   │   └── canvas/          # 核心 Canvas 编辑区与画幅自适应包装
│   ├── core/
│   │   ├── leafer/          # Leafer.js 渲染工厂与策略模式 runtime
│   │   ├── fonts/           # 字体库定义与加载器
│   │   └── export/          # 离屏导出与 Adapter 适配器
│   ├── locales/             # 国际化语言包 (zh.json, en.json, overrides.ts)
│   ├── store/               # Zustand 全局设计状态管理
│   └── lib/                 # 辅助函数库、预设模板与配色数据
├── 部署与二次开发指南.md      # 商业交付部署与扩展二次开发文档
└── package.json
```

---

## 📄 商业使用与二次开发

本源码结构解耦清晰、代码规范严谨（严格遵从策略模式、工厂模式与零魔法变量），非常适合用作：
- 毕业设计 / 前端课程大作业项目
- 商业外包二次开发（如电商在线套打、定制名片生成器、卡片制作 SaaS）
- 个人独立开发者的 MVP 极速搭建基础
