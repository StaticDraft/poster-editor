<div align="center">

# 🎨 PosterCraft (画成) · 可视化海报排版设计编辑器

**现代化、轻量级、开箱即用的专业海报设计工具与稿定设计 / Canva 开源平替**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.10-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Engine](https://img.shields.io/badge/Engine-Leafer.js-836DFF?style=flat-square)](https://www.leaferjs.com/)
[![Desktop](https://img.shields.io/badge/Desktop-Electron_43-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.14-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-40_Passed-22c55e?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square)](https://github.com/)

<p align="center">
  <b>简体中文</b> | <a href="#english-overview">English</a>
</p>

</div>

---

> **PosterCraft（画成）** 是一款基于 **React 18 + TypeScript + Vite + Leafer.js + TailwindCSS + Electron** 构建的高性能可视化海报排版设计器。
> 兼具 **Web 网页端直接运行** 与 **Windows 桌面端单文件免安装绿色版 (.exe)**，专为电商促销做图、多规格批量套打、门店宣传、自媒体封面制作以及前端可视化毕设/二次开发打造。

<div align="center">
  <img src="docs/images/preview.png" alt="PosterCraft 海报编辑器界面截图" width="100%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
</div>

---

## 🌟 核心亮点与特色功能

### 1. ⚡ 超高性能 Leafer.js Canvas 渲染引擎
- **极速响应**：基于新一代 Leafer.js 场景树架构，图元多选、框选、旋转、缩放不卡顿，内存开销仅为传统老牌 Canvas 库的一半。
- **智能磁吸与标尺参考线**：双轴高精度像素标尺，拖拽图元实时计算中心/边缘中轴，毫秒级渲染天蓝色排版参考线与红色虚线磁吸对齐。
- **平滑交互控制**：支持鼠标中键双击/一键自适应视口居中、平滑滚轮缩放、图层编组 (Group/Ungroup) 与层级拖拽。

### 2. 🚀 电商批量套打神器 (Batch Templating)
- **批量批量批量！** 适合电商大促、门店商品换价等重复排版场景。
- 支持批量导入/修改多组商品标题、活动价格、描述文案与二维码 URL，一键全自动生成整套高清海报，原本几小时的工作 3 分钟搞定。

### 3. 🔤 动态矢量二维码与条形码生成器
- 画布原生内置 1st-Class 矢量二维码（QRCode）与条形码（Barcode）物料。
- 属性面板直接输入店铺网址、公众号链接或收款码，实时更新矢量图形，告别到处找第三方工具截图贴图的繁琐操作。

### 4. 🖼️ 多品类预置模板库与一键转场景
- 内置 **5 大精选业务大类海报模板**：
  - 🚀 **电商大促**：618 狂欢年中盛典、新品极简发售
  - 盛典邀请**：年度设计盛典、赛博电音狂欢夜
  - 🏮 **国潮经典**：国潮崛起·匠心造物、传统节气民俗
  - 🎓 **招聘招募**：加入我们·职等你来
  - ☕ **餐饮美食**：夏日冰爽饮品·买一送一、开业酬宾
- 点击模板卡片直接载入主画布编辑，支持右键将模板一键转存为独立场景管理。

### 5. 📂 本地 IndexedDB 素材分类库与图片压缩
- 支持用户创建多个自定义折叠目录（如 `商品图`、`品牌 Logo`、`促销贴纸`）。
- 导入图片时基于 Canvas 自动 Downscale 生成 160px 缩略图存入本地 IndexedDB，大幅降低内存压力并支持 2 列瀑布流无限滚动加载；拖至画布时无缝调用高保真原图。

### 6. 🎨 实用图片特效与艺术字工坊
- **智能抠图与特效**：支持一键纯浅白背景消融、单色绿幕抠图、马赛克局部打码、水平/垂直镜像翻转。
- **图像预设滤镜**：黑白、复古怀旧、高对比度、冷色调快速切换。
- **30+ 款免费中英艺术字体**：集成丰富字体包，支持渐变填充 (Linear / Radial)、行高、字间距、文字描边与投影。

### 7. 📤 1x / 2x / 3x 离屏高清无损导出
- 支持选择 **PNG / JPG / WebP** 格式。
- 提供 **1x / 2x / 3x 超清放大倍率** 离屏渲染导出，彻底消除主视口显示比例对成图质量的影响，满足印刷级喷绘要求。
- 支持离线工程包（`.poster` 格式）全量导入与解包备份。

### 8. 💻 Web 端 + Windows 桌面端双端就绪
- **Web 端**：极速热更新，完全免授权直接使用。
- **桌面端**：基于 Electron 提供 `electron-builder` 单文件绿色便携版构建（`.exe`），支持硬件机器码一机一码离线授权机制，无网络亦可运行。

---

## 🛠️ 技术栈架构

| 层级 | 技术选型 | 作用与说明 |
| :--- | :--- | :--- |
| **前端底座** | React 18 + TypeScript + Vite 5 | 现代化前端工程化框架，秒级编译热重载 |
| **Canvas 渲染引擎** | Leafer.js (`leafer-ui`, `@leafer-in/editor`, `@leafer-in/resize`, `@leafer-in/export`) | 下一代轻量高性能 2D 场景树图形引擎 |
| **状态管理与命令模式** | Zustand (`useEditorStore`) | 集中式 Model 层，封装带 `execute()` / `undo()` 的命令栈（支持 50 步时光回溯） |
| **样式与设计系统** | TailwindCSS + CSS Variables | 语义化设计 Token，全系统深浅色主题无缝切换 |
| **桌面跨平台** | Electron + electron-builder | Windows 单文件绿色免安装客户端打包 |
| **国际化 (i18n)** | react-i18next | 完整中英双语言包实时热切换 |
| **自动化测试** | Vitest + @testing-library/react | 内置 40+ 单元测试用例，覆盖核心状态、几何运算与图像处理 |

---

## 🚀 快速启动

### 1. 环境准备与安装依赖
推荐 Node.js 18+ 环境：
```bash
# 克隆仓库
git clone https://github.com/your-username/poster-editor.git
cd poster-editor

# 安装项目依赖
npm install  # 或 yarn / pnpm install
```

### 2. 本地开发调试 (Web 端)
```bash
npm run dev
```
打开浏览器访问 `http://localhost:5173` 即可开启海报设计体验。

### 3. 执行自动化测试与类型检查
```bash
# TypeScript 严格类型检查
npx tsc --noEmit

# 执行 Vitest 自动化单元测试 (40+ 用例)
npm run test
```

### 4. 生产构建打包
```bash
# 打包 Web 静态站点（生成 dist/ 目录）
npm run build

# 本地预览打包产物
npm run preview
```

### 5. 桌面端开发与构建 (Windows .exe)
```bash
# 启动 Electron 桌面端调试
npm run electron:dev

# 打包 Windows 单文件绿色免安装版 (.exe)
npm run electron:build:portable
```
打包成功后将在 `dist-electron/` 目录下生成可直接双击运行的便携版可执行程序。

---

## 📁 项目目录结构

```text
poster-editor/
├── src/
│   ├── core/                        # 核心渲染与算法引擎 (与 UI 解耦)
│   │   ├── leafer/                  # Leafer.js 画布运行时与封装
│   │   │   ├── LeaferCanvas.tsx     # 画布核心组件与视口事件挂载
│   │   │   ├── factories/           # 图元渲染工厂与动画策略注册表
│   │   │   ├── services/            # 磁吸对齐引擎与快捷键管理服务
│   │   │   └── smartGuides.ts       # 对齐辅助线计算算法
│   │   ├── export/                  # 离屏多格式、多倍率高清导出适配器
│   │   ├── fonts/                   # 字体库定义与异步加载器
│   │   └── templates/               # 5大类精选模板数据定义
│   ├── store/                       # 状态管理层 (Zustand Slices)
│   │   ├── commands/                # 命令模式: 撤销/重做命令栈
│   │   ├── slices/                  # canvas, node, scene, history, ui 切片
│   │   ├── useEditorStore.ts        # 全局设计态 Store
│   │   └── useLicenseStore.ts       # 商业激活码与机器指纹状态 Store
│   ├── components/                  # 界面视图组件层
│   │   ├── left-panel/              # 左侧侧边栏: 模板库、物料库、素材库(IDB)、图层树、多页面
│   │   ├── right-panel/             # 右侧属性栏: 图元样式调节、画布尺寸配置、字体工坊
│   │   ├── top-toolbar/             # 顶部工具栏: 尺寸选择、对齐分布、主题切换、保存状态
│   │   └── feedback/                # 模态弹窗: 高清导出、批量套打、快捷键指南、激活窗口
│   ├── locales/                     # 国际化语言包 (zh.json, en.json, overrides.ts)
│   └── lib/                         # 纯函数工具库: 图像处理、授权加密、工程导入导出
├── electron/                        # Electron 桌面端主进程与预加载脚本
├── docs/                            # 极度完备的商业交付、对标报告与使用指南
│   ├── images/                      # 文档与预览高清截图
│   ├── 买家快速开始.md
│   ├── 闲鱼上架与交付指南.md
│   ├── 商业授权与素材版权说明.md
│   └── 已实现功能清单.md
├── 部署与二次开发指南.md              # 部署与功能扩展指南
└── package.json
```

---

## 📖 交付和二次开发文档

- 📘 [买家快速开始教程](docs/买家快速开始.md)
- 🛍️ [闲鱼上架与交付变现指南](docs/闲鱼上架与交付指南.md)
- 📜 [商业授权与素材版权说明](docs/商业授权与素材版权说明.md)
- 📋 [已实现核心功能完整清单](docs/已实现功能清单.md)
- 🛠️ [系统部署与二次开发指南](部署与二次开发指南.md)

---

## 🎯 适合场景

- **毕业设计 / 前端课程大作业**：架构规范、设计模式完备、单元测试覆盖高，答辩加分项满满。
- **商业外包二次开发**：如电商在线批量做图工具、定制名片/胸卡制作系统、文印排版 SaaS。
- **个人独立开发者与电商卖家**：制作商品宣传图、小红书图文卡片、餐饮促销展架。

---

## ⚖️ 许可与素材声明

项目内置模板与图片主要用于演示编辑器能力。正式商业使用前，建议替换为自有版权或许可明确的图片、字体与品牌素材。

---

<div id="english-overview" align="center">

### English Overview

**PosterCraft** is a lightweight, high-performance web and desktop graphic design editor inspired by Canva and Gaoding. Built with **React 18, TypeScript, Leafer.js, TailwindCSS, and Electron**, it supports rich typography, smart snap alignment, layer management, QR code/barcode generation, local IndexedDB asset library, batch image templating, and 1x/2x/3x ultra-HD offline export.

</div>
