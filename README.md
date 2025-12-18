# Tesla Wrap Studio 🚗✨

专业车身改色与拉花设计工具 - Web 版

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![Fabric.js](https://img.shields.io/badge/Fabric.js-5.3-orange.svg)

## ✨ 功能特性

- 🎨 **智能遮罩处理** - 自动识别车身区域，外部自动遮盖
- 📦 **贴图层管理** - 支持导入、拖拽、旋转、缩放、层级调整
- ✍️ **文字填充** - 在车身区域内生成重复文字图案
- 🖼️ **高质量导出** - 保持原模板分辨率，PNG 透明背景
- 📱 **跨平台** - 浏览器即可使用，无需安装


## 📖 使用指南

1. **选择车型** - 从下拉菜单中选择 Tesla 车型
2. **导入贴图** - 点击「导入图案/改色膜」上传图片
3. **调整贴图** - 拖拽移动，使用滑块调整旋转和缩放
4. **文字填充** - 输入文字，调整参数后点击「生成文字填充」
5. **导出设计** - 点击「导出高清设计图」保存作品

## 🛠️ 技术栈

- **React 18** - 现代 UI 框架
- **Fabric.js** - 强大的 Canvas 操作库
- **Tailwind CSS** - 原子化 CSS 框架
- **Vite** - 极速构建工具

## 📁 项目结构

```
root/
│---assets/           # 车型模板图片
├── src/
│   ├── utils/
│   │   ├── maskProcessor.js   # 遮罩处理算法
│   │   └── textGenerator.js   # 文字填充生成器
│   ├── App.jsx           # 主应用组件
│   ├── main.jsx          # 入口文件
│   └── index.css         # 全局样式
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🔧 核心算法

### 遮罩处理 (Flood Fill)

使用扫描线优化的泛洪填充算法，从图像四角开始填充，自动识别车身内外区域：

```javascript
// 三层结构
1. 线条区域 → 浅白色（车身轮廓）
2. 外部区域 → 背景色（遮盖外部）
3. 内部区域 → 透明（显示贴图）
```

### 文字填充

支持交错排列、旋转、自定义间距，仅在车身内部区域渲染文字。