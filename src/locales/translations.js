// 语言翻译配置
export const translations = {
  zh: {
    // 车型
    carModels: {
      "Cybertruck": "Cybertruck",
      "焕新款 Model 3": "焕新款 Model 3",
      "焕新款 Model 3 高性能版": "焕新款 Model 3 高性能版",
      "Model 3": "Model 3",
      "焕新款 Model Y": "焕新款 Model Y",
      "焕新款 Model Y 高性能版": "焕新款 Model Y 高性能版",
      "焕新款 Model Y 长续航版": "焕新款 Model Y 长续航版",
      "Model Y L": "Model Y L",
      "Model Y": "Model Y",
    },
    
    // 标题和主要功能
    title: "特斯拉改色拉花设计工具",
    subtitle: "专业车身贴图设计平台",
    
    // 工具栏
    toolbar: {
      selectModel: "选择车型",
      importTexture: "导入贴图",
      undo: "撤销",
      redo: "重做",
      zoomIn: "放大",
      zoomOut: "缩小",
      clearAll: "清空画布",
      export: "导出设计",
      viewScale: "预览缩放（不影响导出尺寸）",
      viewScaleEn: "Preview Scale (does not affect export size)",
      language: "语言",
    },
    
    // 右侧面板标签
    panels: {
      layers: "图层",
      text: "文字",
      patterns: "图案",
      shapes: "形状",
      brush: "画笔",
      templates: "模板",
      colors: "颜色",
    },
    
    // 图层面板
    layersPanel: {
      title: "图层管理",
      noSelection: "未选中图层",
      selectTip: "请选择一个图层以查看属性",
      properties: "属性",
      rotation: "旋转",
      scale: "缩放",
      uniformScale: "等比缩放",
      width: "宽度",
      height: "高度",
      opacity: "不透明度",
      operations: "操作",
      delete: "删除",
      duplicate: "复制",
      flipH: "水平翻转",
      flipV: "垂直翻转",
      crop: "裁切",
      bringToTop: "置于顶层",
      sendToBack: "置于底层",
      lock: "锁定",
      unlock: "解锁",
      layerList: "图层列表",
      noLayers: "暂无图层",
      addTexture: "添加贴图后，可在此管理图层",
      cropMode: "裁切模式",
      applyCrop: "应用裁切",
      cancelCrop: "取消",
      cropTip: "只能裁切图片图层",
    },
    
    // 文字面板
    textPanel: {
      title: "文字填充",
      content: "文字内容",
      placeholder: "输入文字内容",
      fontSize: "字体大小",
      spacingX: "水平间距",
      spacingY: "垂直间距",
      textRotation: "文字旋转",
      generate: "生成文字层",
      regenerate: "重新生成",
      remove: "移除文字层",
      tip: "输入文字后点击生成，创建全屏文字填充图案",
    },
    
    // 图案面板
    patternsPanel: {
      title: "预设图案",
      category: "分类",
      all: "全部",
      gradient: "渐变",
      camo: "迷彩",
      texture: "纹理",
      fun: "趣味",
      holiday: "节日",
      other: "其他",
      loading: "加载中...",
      clickToAdd: "点击添加到画布",
      noPatterns: "该分类暂无图案",
    },
    
    // 形状面板
    shapesPanel: {
      title: "形状工具",
      type: "形状类型",
      rectangle: "矩形",
      circle: "圆形",
      triangle: "三角形",
      pentagon: "五边形",
      hexagon: "六边形",
      star: "星形",
      line: "直线",
      arrow: "箭头",
      fillColor: "填充颜色",
      strokeColor: "边框颜色",
      strokeWidth: "边框宽度",
      addShape: "添加形状",
    },
    
    // 画笔面板
    brushPanel: {
      title: "自由绘画",
      enable: "启用画笔",
      disable: "禁用画笔",
      color: "画笔颜色",
      width: "画笔粗细",
      tip: "启用后可在画布上自由绘制",
    },
    
    // 模板面板
    templatesPanel: {
      title: "设计模板",
      description: "选择预设设计模板快速开始",
      noTemplates: "当前车型暂无模板",
      switchModel: "切换车型以查看更多模板",
      loading: "加载中...",
      clickToApply: "点击应用模板",
    },
    
    // 颜色调整面板
    colorsPanel: {
      title: "颜色调整",
      hue: "色相",
      saturation: "饱和度",
      brightness: "亮度",
      contrast: "对比度",
      reset: "重置",
      tip: "调整选中图层的颜色属性",
      noSelection: "请先选择一个图层",
    },
    
    // 填充工具
    fillTool: {
      title: "填充工具",
      enable: "启用填充",
      disable: "禁用填充",
      color: "填充颜色",
      tolerance: "容差",
      tip: "点击画布区域进行填充",
    },
    
    // 快捷键提示
    shortcuts: {
      title: "快捷键",
      undo: "撤销",
      redo: "重做",
      delete: "删除选中",
      duplicate: "复制",
      move: "方向键微调位置",
    },
    
    // 消息提示
    messages: {
      exportSuccess: "导出成功",
      exportFailed: "导出失败",
      deleteConfirm: "确认删除所有图层？",
      loadingModel: "加载车型中...",
      loadingFailed: "加载失败",
      cropImageOnly: "只能裁切图片图层",
      selectLayer: "请先选择图层",
      textGenerated: "文字层已生成",
      textRemoved: "文字层已移除",
      patternAdded: "图案已添加",
      shapeAdded: "形状已添加",
    },
    
    // 按钮文本
    buttons: {
      ok: "确定",
      cancel: "取消",
      apply: "应用",
      reset: "重置",
      close: "关闭",
      save: "保存",
      delete: "删除",
    },
  },
  
  en: {
    // Car Models
    carModels: {
      "Cybertruck": "Cybertruck",
      "焕新款 Model 3": "Model 3 (2024)",
      "焕新款 Model 3 高性能版": "Model 3 Performance (2024)",
      "Model 3": "Model 3",
      "焕新款 Model Y": "Model Y (2025)",
      "焕新款 Model Y 高性能版": "Model Y Performance (2025)",
      "焕新款 Model Y 长续航版": "Model Y Long Range (2025)",
      "Model Y L": "Model Y L",
      "Model Y": "Model Y",
    },
    
    // Title and Main Features
    title: "Tesla Wrap Design Tool",
    subtitle: "Professional Vehicle Wrap Design Platform",
    
    // Toolbar
    toolbar: {
      selectModel: "Select Model",
      importTexture: "Import Texture",
      undo: "Undo",
      redo: "Redo",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      clearAll: "Clear Canvas",
      export: "Export Design",
      viewScale: "Preview Scale",
      language: "Language",
    },
    
    // Right Panel Tabs
    panels: {
      layers: "Layers",
      text: "Text",
      patterns: "Patterns",
      shapes: "Shapes",
      brush: "Brush",
      templates: "Templates",
      colors: "Colors",
    },
    
    // Layers Panel
    layersPanel: {
      title: "Layer Management",
      noSelection: "No Layer Selected",
      selectTip: "Select a layer to view its properties",
      properties: "Properties",
      rotation: "Rotation",
      scale: "Scale",
      uniformScale: "Uniform Scale",
      width: "Width",
      height: "Height",
      opacity: "Opacity",
      operations: "Operations",
      delete: "Delete",
      duplicate: "Duplicate",
      flipH: "Flip Horizontal",
      flipV: "Flip Vertical",
      crop: "Crop",
      bringToTop: "Bring to Front",
      sendToBack: "Send to Back",
      lock: "Lock",
      unlock: "Unlock",
      layerList: "Layer List",
      noLayers: "No Layers",
      addTexture: "Add textures to manage layers here",
      cropMode: "Crop Mode",
      applyCrop: "Apply Crop",
      cancelCrop: "Cancel",
      cropTip: "Can only crop image layers",
    },
    
    // Text Panel
    textPanel: {
      title: "Text Fill",
      content: "Text Content",
      placeholder: "Enter text content",
      fontSize: "Font Size",
      spacingX: "Horizontal Spacing",
      spacingY: "Vertical Spacing",
      textRotation: "Text Rotation",
      generate: "Generate Text Layer",
      regenerate: "Regenerate",
      remove: "Remove Text Layer",
      tip: "Enter text and click generate to create a full-screen text pattern",
    },
    
    // Patterns Panel
    patternsPanel: {
      title: "Preset Patterns",
      category: "Category",
      all: "All",
      gradient: "Gradient",
      camo: "Camouflage",
      texture: "Texture",
      fun: "Fun",
      holiday: "Holiday",
      other: "Other",
      loading: "Loading...",
      clickToAdd: "Click to add to canvas",
      noPatterns: "No patterns in this category",
    },
    
    // Shapes Panel
    shapesPanel: {
      title: "Shape Tools",
      type: "Shape Type",
      rectangle: "Rectangle",
      circle: "Circle",
      triangle: "Triangle",
      pentagon: "Pentagon",
      hexagon: "Hexagon",
      star: "Star",
      line: "Line",
      arrow: "Arrow",
      fillColor: "Fill Color",
      strokeColor: "Stroke Color",
      strokeWidth: "Stroke Width",
      addShape: "Add Shape",
    },
    
    // Brush Panel
    brushPanel: {
      title: "Free Drawing",
      enable: "Enable Brush",
      disable: "Disable Brush",
      color: "Brush Color",
      width: "Brush Width",
      tip: "Enable to draw freely on canvas",
    },
    
    // Templates Panel
    templatesPanel: {
      title: "Design Templates",
      description: "Select a preset template to get started quickly",
      noTemplates: "No templates for current model",
      switchModel: "Switch model to see more templates",
      loading: "Loading...",
      clickToApply: "Click to apply template",
    },
    
    // Color Adjustment Panel
    colorsPanel: {
      title: "Color Adjustment",
      hue: "Hue",
      saturation: "Saturation",
      brightness: "Brightness",
      contrast: "Contrast",
      reset: "Reset",
      tip: "Adjust color properties of selected layer",
      noSelection: "Please select a layer first",
    },
    
    // Fill Tool
    fillTool: {
      title: "Fill Tool",
      enable: "Enable Fill",
      disable: "Disable Fill",
      color: "Fill Color",
      tolerance: "Tolerance",
      tip: "Click on canvas area to fill",
    },
    
    // Shortcuts
    shortcuts: {
      title: "Shortcuts",
      undo: "Undo",
      redo: "Redo",
      delete: "Delete Selected",
      duplicate: "Duplicate",
      move: "Arrow keys to nudge position",
    },
    
    // Messages
    messages: {
      exportSuccess: "Export successful",
      exportFailed: "Export failed",
      deleteConfirm: "Confirm delete all layers?",
      loadingModel: "Loading model...",
      loadingFailed: "Loading failed",
      cropImageOnly: "Can only crop image layers",
      selectLayer: "Please select a layer first",
      textGenerated: "Text layer generated",
      textRemoved: "Text layer removed",
      patternAdded: "Pattern added",
      shapeAdded: "Shape added",
    },
    
    // Button Text
    buttons: {
      ok: "OK",
      cancel: "Cancel",
      apply: "Apply",
      reset: "Reset",
      close: "Close",
      save: "Save",
      delete: "Delete",
    },
  },
}

