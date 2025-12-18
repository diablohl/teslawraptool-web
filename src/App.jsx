import React, { useState, useRef, useEffect, useCallback } from 'react'
import { fabric } from 'fabric'
import { saveAs } from 'file-saver'
import {
    Car, Upload, Trash2, Layers, RotateCcw, ZoomIn, ZoomOut,
    Type, Download, ChevronUp, Sparkles, Settings2, Maximize2
} from 'lucide-react'
import { processTemplateMask } from './utils/maskProcessor'
import { generateTextPattern } from './utils/textGenerator'

// 车型配置
const CAR_MODELS = {
    "Cybertruck": "cybertruck.png",
    "焕新款 Model 3": "model3-2024-base.png",
    "焕新款 Model 3 高性能版": "model3-2024-performance.png",
    "Model 3": "model3.png",
    "焕新款 Model Y": "modely-2025-base.png",
    "焕新款 Model Y 高性能版": "modely-2025-performance.png",
    "焕新款 Model Y 长续航版": "modely-2025-premium.png",
    "Model Y L": "modely-l.png",
    "Model Y": "modely.png",
}

// 画布背景色
const CANVAS_BG = '#1a1a1a'

export default function App() {
    const canvasRef = useRef(null)
    const fabricRef = useRef(null)
    const overlayRef = useRef(null)
    const maskDataRef = useRef(null)
    const fileInputRef = useRef(null)

    const [isCanvasReady, setIsCanvasReady] = useState(false)
    const [selectedModel, setSelectedModel] = useState(Object.keys(CAR_MODELS)[0])
    const [selectedObject, setSelectedObject] = useState(null)
    const [rotation, setRotation] = useState(0)
    const [scale, setScale] = useState(100)
    const [layerCount, setLayerCount] = useState(0)

    // 文字填充参数
    const [textContent, setTextContent] = useState('')
    const [fontSize, setFontSize] = useState(40)
    const [spacingX, setSpacingX] = useState(100)
    const [spacingY, setSpacingY] = useState(80)
    const [textRotation, setTextRotation] = useState(-15)
    const [textFillLayer, setTextFillLayer] = useState(null)

    // 预览缩放（仅用于查看，不影响导出）
    const [viewScale, setViewScale] = useState(100)

    // 初始化 Fabric Canvas
    useEffect(() => {
        // 设置初始尺寸
        const container = canvasRef.current?.parentElement
        const initialWidth = container?.clientWidth || 800
        const initialHeight = container?.clientHeight || 600

        const canvas = new fabric.Canvas(canvasRef.current, {
            backgroundColor: CANVAS_BG,
            selection: true,
            preserveObjectStacking: true,
            width: initialWidth,
            height: initialHeight,
        })

        fabricRef.current = canvas

        // 监听选择变化
        canvas.on('selection:created', handleSelection)
        canvas.on('selection:updated', handleSelection)
        canvas.on('selection:cleared', () => {
            setSelectedObject(null)
            setRotation(0)
            setScale(100)
        })

        // 监听对象修改
        canvas.on('object:modified', handleObjectModified)

        // 标记Canvas已就绪
        setIsCanvasReady(true)

        return () => {
            canvas.dispose()
        }
    }, [])

    // 处理选择事件
    const handleSelection = useCallback((e) => {
        const obj = e.selected?.[0]
        if (obj && obj !== overlayRef.current) {
            setSelectedObject(obj)
            setRotation(Math.round(obj.angle || 0))
            setScale(Math.round((obj.scaleX || 1) * 100))
        }
    }, [])

    // 处理对象修改
    const handleObjectModified = useCallback((e) => {
        const obj = e.target
        if (obj) {
            setRotation(Math.round(obj.angle || 0))
            setScale(Math.round((obj.scaleX || 1) * 100))
        }
    }, [])

    // 更新图层计数
    const updateLayerCount = useCallback(() => {
        if (!fabricRef.current) return
        const objects = fabricRef.current.getObjects()
        const count = objects.filter(obj => obj !== overlayRef.current).length
        setLayerCount(count)
    }, [])

    // 加载车型模板
    const loadCarModel = async (modelName) => {
        const canvas = fabricRef.current
        if (!canvas) return

        const filename = CAR_MODELS[modelName]
        if (!filename) return

        // 移除旧的遮罩层
        if (overlayRef.current) {
            canvas.remove(overlayRef.current)
            overlayRef.current = null
        }

        // 移除文字填充层
        if (textFillLayer) {
            canvas.remove(textFillLayer)
            setTextFillLayer(null)
        }

        try {
            // 加载并处理遮罩
            const imagePath = `/assets/${filename}`
            console.log('Loading car model:', imagePath)
            const { maskedImage, maskData, width, height } = await processTemplateMask(imagePath, CANVAS_BG)

            console.log('Mask processed, dimensions:', width, 'x', height)
            console.log('Mask data length:', maskData?.length)

            // 保存遮罩数据
            maskDataRef.current = maskData

            // 调整画布大小
            canvas.setDimensions({ width, height })

            // 创建遮罩图层
            fabric.Image.fromURL(maskedImage, (img) => {
                img.set({
                    left: 0,
                    top: 0,
                    selectable: false,
                    evented: false,
                    hoverCursor: 'default',
                })

                overlayRef.current = img
                canvas.add(img)

                // 确保遮罩始终在最上层
                canvas.bringToFront(img)
                canvas.renderAll()
            })

        } catch (error) {
            console.error('加载车型失败:', error)
        }
    }

    // 切换车型
    useEffect(() => {
        // 确保Canvas已初始化
        if (isCanvasReady && fabricRef.current) {
            loadCarModel(selectedModel)
        }
    }, [selectedModel, isCanvasReady])

    // 导入贴图
    const handleImportTexture = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            fabric.Image.fromURL(event.target.result, (img) => {
                const canvas = fabricRef.current

                // 缩放图片使其适应画布
                const maxSize = Math.min(canvas.width, canvas.height) * 0.6
                const scaleFactor = Math.min(maxSize / img.width, maxSize / img.height, 1)

                img.set({
                    left: canvas.width / 2,
                    top: canvas.height / 2,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scaleFactor,
                    scaleY: scaleFactor,
                })

                canvas.add(img)

                // 确保遮罩在最上层
                if (overlayRef.current) {
                    canvas.bringToFront(overlayRef.current)
                }

                canvas.setActiveObject(img)
                canvas.renderAll()
                updateLayerCount()
            })
        }
        reader.readAsDataURL(file)
        e.target.value = '' // 重置以便重复选择同一文件
    }

    // 删除选中层
    const handleDeleteSelected = () => {
        const canvas = fabricRef.current
        const activeObject = canvas.getActiveObject()

        if (activeObject && activeObject !== overlayRef.current) {
            if (activeObject === textFillLayer) {
                setTextFillLayer(null)
            }
            canvas.remove(activeObject)
            canvas.renderAll()
            setSelectedObject(null)
            updateLayerCount()
        }
    }

    // 清除所有贴图
    const handleClearAll = () => {
        const canvas = fabricRef.current
        const objects = canvas.getObjects().filter(obj => obj !== overlayRef.current)

        objects.forEach(obj => canvas.remove(obj))
        setTextFillLayer(null)
        canvas.renderAll()
        setSelectedObject(null)
        updateLayerCount()
    }

    // 置于顶层
    const handleBringToTop = () => {
        const canvas = fabricRef.current
        const activeObject = canvas.getActiveObject()

        if (activeObject && activeObject !== overlayRef.current) {
            canvas.bringToFront(activeObject)
            // 确保遮罩始终最上
            if (overlayRef.current) {
                canvas.bringToFront(overlayRef.current)
            }
            canvas.renderAll()
        }
    }

    // 更新旋转
    useEffect(() => {
        if (selectedObject && selectedObject !== overlayRef.current) {
            selectedObject.set('angle', rotation)
            fabricRef.current?.renderAll()
        }
    }, [rotation, selectedObject])

    // 更新缩放
    useEffect(() => {
        if (selectedObject && selectedObject !== overlayRef.current) {
            const s = scale / 100
            selectedObject.set({ scaleX: s, scaleY: s })
            fabricRef.current?.renderAll()
        }
    }, [scale, selectedObject])

    // 生成文字填充
    const handleGenerateTextFill = async () => {
        if (!textContent.trim()) return
        if (!maskDataRef.current) return

        const canvas = fabricRef.current

        // 移除旧的文字填充层
        if (textFillLayer) {
            canvas.remove(textFillLayer)
        }

        try {
            const patternDataUrl = await generateTextPattern({
                text: textContent,
                fontSize,
                spacingX,
                spacingY,
                rotation: textRotation,
                maskData: maskDataRef.current,
                width: canvas.width,
                height: canvas.height,
            })

            fabric.Image.fromURL(patternDataUrl, (img) => {
                img.set({
                    left: 0,
                    top: 0,
                    selectable: false,
                    evented: false,
                })

                canvas.add(img)

                // 确保遮罩在最上层
                if (overlayRef.current) {
                    canvas.bringToFront(overlayRef.current)
                }

                setTextFillLayer(img)
                canvas.renderAll()
                updateLayerCount()
            })
        } catch (error) {
            console.error('生成文字填充失败:', error)
        }
    }

    // 实时更新文字填充（拖动滑杆时即时预览）
    useEffect(() => {
        if (textFillLayer && textContent.trim()) {
            // 使用较短的防抖时间实现近乎实时的预览
            const debounce = setTimeout(() => {
                handleGenerateTextFill()
            }, 50)
            return () => clearTimeout(debounce)
        }
    }, [fontSize, spacingX, spacingY, textRotation])

    // 导出图片
    const handleExport = async () => {
        const canvas = fabricRef.current
        const maskData = maskDataRef.current
        if (!canvas) return

        // 取消选择以隐藏控制点
        canvas.discardActiveObject()
        
        // 临时移除背景色
        const originalBg = canvas.backgroundColor
        canvas.backgroundColor = null
        canvas.renderAll()

        // 导出画布
        const dataUrl = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 1,
        })

        // 恢复背景色
        canvas.backgroundColor = originalBg
        canvas.renderAll()

        // 如果有遮罩数据，处理外部区域使其透明
        if (maskData) {
            const img = new Image()
            img.src = dataUrl
            await new Promise(resolve => { img.onload = resolve })

            const width = canvas.width
            const height = canvas.height

            // 创建临时画布处理图片
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = width
            tempCanvas.height = height
            const tempCtx = tempCanvas.getContext('2d')
            tempCtx.drawImage(img, 0, 0)

            // 获取像素数据
            const imageData = tempCtx.getImageData(0, 0, width, height)
            const pixels = imageData.data

            // 将外部区域（maskData === 0）的像素变为透明
            for (let i = 0; i < width * height; i++) {
                if (maskData[i] === 0) {
                    pixels[i * 4 + 3] = 0  // 设置 alpha 为 0（透明）
                }
            }

            tempCtx.putImageData(imageData, 0, 0)

            // 导出处理后的图片
            tempCanvas.toBlob(blob => {
                saveAs(blob, `tesla-wrap-design-${Date.now()}.png`)
            }, 'image/png')
        } else {
            // 无遮罩数据时直接导出
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    saveAs(blob, `tesla-wrap-design-${Date.now()}.png`)
                })
        }
    }

    // 预览缩放控制
    const handleZoomIn = () => setViewScale(prev => Math.min(prev + 10, 200))
    const handleZoomOut = () => setViewScale(prev => Math.max(prev - 10, 20))
    const handleZoomReset = () => setViewScale(100)

    return (
        <div className="flex h-screen bg-canvas overflow-hidden">
            {/* 左侧画布区域 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 可滚动的画布容器 */}
                <div className="flex-1 overflow-auto p-6 canvas-container">
                    <div className="inline-block min-w-full min-h-full flex items-center justify-center">
                        <div 
                            className="relative shadow-2xl rounded-lg overflow-hidden"
                            style={{ 
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                                transform: `scale(${viewScale / 100})`,
                                transformOrigin: 'center center',
                            }}
                        >
                            <canvas ref={canvasRef} />
                        </div>
                    </div>
                </div>
                
                {/* 底部缩放控制栏 */}
                <div className="flex items-center justify-center gap-3 py-3 px-4 bg-panel border-t border-border">
                    <button
                        onClick={handleZoomOut}
                        className="p-2 rounded-lg bg-panel-light hover:bg-gray-700 text-gray-400 
                                   hover:text-white transition-colors"
                        title="缩小预览"
                    >
                        <ZoomOut size={18} />
                    </button>
                    
                    <div className="flex items-center gap-2 min-w-[120px] justify-center">
                        <input
                            type="range"
                            min="20"
                            max="200"
                            value={viewScale}
                            onChange={(e) => setViewScale(Number(e.target.value))}
                            className="w-24"
                        />
                        <span className="text-gray-400 text-sm font-mono w-12 text-right">
                            {viewScale}%
                        </span>
                    </div>
                    
                    <button
                        onClick={handleZoomIn}
                        className="p-2 rounded-lg bg-panel-light hover:bg-gray-700 text-gray-400 
                                   hover:text-white transition-colors"
                        title="放大预览"
                    >
                        <ZoomIn size={18} />
                    </button>
                    
                    <button
                        onClick={handleZoomReset}
                        className="p-2 rounded-lg bg-panel-light hover:bg-gray-700 text-gray-400 
                                   hover:text-white transition-colors ml-2"
                        title="重置为100%"
                    >
                        <Maximize2 size={18} />
                    </button>
                    
                    <span className="text-gray-600 text-xs ml-2">
                        预览缩放（不影响导出尺寸）
                    </span>
                </div>
            </div>

            {/* 右侧控制面板 */}
            <div className="w-80 bg-panel border-l border-border overflow-y-auto">
                {/* 标题 */}
                <div className="p-6 border-b border-border bg-gradient-to-r from-panel to-transparent">
                    <h1 className="font-display text-2xl font-bold tracking-wider text-white">
                        WRAP<span className="text-accent">STUDIO</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Tesla 车身设计工具</p>
                </div>

                {/* 车型选择 */}
                <div className="p-5 border-b border-border panel-section">
                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                        <Car size={16} />
                        <span className="text-sm font-medium uppercase tracking-wide">车型选择</span>
                    </div>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-panel-light border border-border rounded-lg px-4 py-3 text-white
                       focus:outline-none focus:border-accent transition-colors cursor-pointer
                       appearance-none"
                    >
                        {Object.keys(CAR_MODELS).map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>

                {/* 贴图管理 */}
                <div className="p-5 border-b border-border panel-section">
                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                        <Layers size={16} />
                        <span className="text-sm font-medium uppercase tracking-wide">贴图管理</span>
                        {layerCount > 0 && (
                            <span className="ml-auto bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full">
                {layerCount} 层
              </span>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <button
                        onClick={handleImportTexture}
                        className="w-full bg-accent hover:bg-accent-hover text-white font-semibold
                       py-3 px-4 rounded-lg transition-all duration-200 flex items-center
                       justify-center gap-2 btn-glow"
                    >
                        <Upload size={18} />
                        导入图案 / 改色膜
                    </button>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                            onClick={handleDeleteSelected}
                            disabled={!selectedObject}
                            className="bg-panel-light hover:bg-red-500/20 text-gray-300 hover:text-red-400
                         py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center
                         justify-center gap-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed
                         border border-transparent hover:border-red-500/30"
                        >
                            <Trash2 size={15} />
                            删除选中
                        </button>
                        <button
                            onClick={handleBringToTop}
                            disabled={!selectedObject}
                            className="bg-panel-light hover:bg-blue-500/20 text-gray-300 hover:text-blue-400
                         py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center
                         justify-center gap-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed
                         border border-transparent hover:border-blue-500/30"
                        >
                            <ChevronUp size={15} />
                            置于顶层
                        </button>
                    </div>

                    <button
                        onClick={handleClearAll}
                        className="w-full mt-2 bg-panel-light hover:bg-red-500/10 text-gray-400 hover:text-red-400
                       py-2 px-3 rounded-lg transition-all duration-200 text-sm
                       border border-transparent hover:border-red-500/20"
                    >
                        清除所有贴图
                    </button>
                </div>

                {/* 变换参数 */}
                <div className="p-5 border-b border-border panel-section">
                    <div className="flex items-center gap-2 text-gray-400 mb-4">
                        <Settings2 size={16} />
                        <span className="text-sm font-medium uppercase tracking-wide">变换参数</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <RotateCcw size={14} /> 旋转角度
                </span>
                                <span className="text-white font-mono">{rotation}°</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={rotation}
                                onChange={(e) => setRotation(Number(e.target.value))}
                                disabled={!selectedObject}
                                className="disabled:opacity-40"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <ZoomIn size={14} /> 缩放比例
                </span>
                                <span className="text-white font-mono">{scale}%</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="300"
                                value={scale}
                                onChange={(e) => setScale(Number(e.target.value))}
                                disabled={!selectedObject}
                                className="disabled:opacity-40"
                            />
                        </div>
                    </div>
                </div>

                {/* 文字填充 */}
                <div className="p-5 border-b border-border panel-section">
                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                        <Type size={16} />
                        <span className="text-sm font-medium uppercase tracking-wide">文字填充</span>
                    </div>

                    <input
                        type="text"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="输入文字或表情，如 TESLA 🚗"
                        className="w-full bg-panel-light border border-border rounded-lg px-4 py-3 text-white
                       placeholder-gray-500 focus:outline-none focus:border-accent transition-colors mb-3"
                    />

                    <button
                        onClick={handleGenerateTextFill}
                        disabled={!textContent.trim()}
                        className="w-full bg-gradient-to-r from-accent to-pink-600 hover:from-accent-hover
                       hover:to-pink-500 text-white font-semibold py-3 px-4 rounded-lg
                       transition-all duration-200 flex items-center justify-center gap-2
                       disabled:opacity-40 disabled:cursor-not-allowed btn-glow"
                    >
                        <Sparkles size={18} />
                        生成文字填充
                    </button>

                    <div className="mt-4 space-y-3">
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-gray-500">字体大小</span>
                                <span className="text-gray-400 font-mono">{fontSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="12"
                                max="120"
                                value={fontSize}
                                onChange={(e) => setFontSize(Number(e.target.value))}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-gray-500">横向间距</span>
                                <span className="text-gray-400 font-mono">{spacingX}px</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="300"
                                value={spacingX}
                                onChange={(e) => setSpacingX(Number(e.target.value))}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-gray-500">纵向间距</span>
                                <span className="text-gray-400 font-mono">{spacingY}px</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="300"
                                value={spacingY}
                                onChange={(e) => setSpacingY(Number(e.target.value))}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-gray-500">旋转角度</span>
                                <span className="text-gray-400 font-mono">{textRotation}°</span>
                            </div>
                            <input
                                type="range"
                                min="-90"
                                max="90"
                                value={textRotation}
                                onChange={(e) => setTextRotation(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* 导出 */}
                <div className="p-5">
                    <button
                        onClick={handleExport}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500
                       hover:to-teal-500 text-white font-semibold py-4 px-4 rounded-lg
                       transition-all duration-200 flex items-center justify-center gap-2
                       shadow-lg hover:shadow-emerald-500/25"
                    >
                        <Download size={20} />
                        导出高清设计图
                    </button>
                    <p className="text-center text-gray-600 text-xs mt-2">
                        原始分辨率 · PNG 格式
                    </p>
                </div>
            </div>
        </div>
    )
}