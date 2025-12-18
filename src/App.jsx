import React, { useState, useRef, useEffect, useCallback } from 'react'
import { fabric } from 'fabric'
import { saveAs } from 'file-saver'
import {
    Car, Upload, Trash2, Layers, RotateCcw, ZoomIn, ZoomOut,
    Type, Download, ChevronUp, Sparkles, Settings2, Maximize2,
    Undo2, Redo2, FlipHorizontal, FlipVertical, Crop, Eye,
    Palette, Grid3X3, Lock, Unlock, Move, Copy, Scissors
} from 'lucide-react'
import { processTemplateMask } from './utils/maskProcessor'
import { generateTextPattern } from './utils/textGenerator'
import { PRESET_PATTERNS, getCategories, getPatternsByCategory } from './utils/patternGenerator'

// 车型配置
const CAR_MODELS = {
    "Cybertruck": "cybertruck.png",
    "焕新款 Model 3": "model3-2024-base.png",
    "焕新款 Model 3 高性能版": "model3-2024-performance.png",
    "Model 3": "model3.png",
    "焕新款 Model Y": "modely2025.png",
    "焕新款 Model Y 高性能版": "modely-2025-performance.png",
    "焕新款 Model Y 长续航版": "modely-2025-premium.png",
    "Model Y L": "modely-l.png",
    "Model Y": "modely.png",
}

// 画布背景色
const CANVAS_BG = '#1a1a1a'

// 最大历史记录数
const MAX_HISTORY = 50

export default function App() {
    const canvasRef = useRef(null)
    const fabricRef = useRef(null)
    const overlayRef = useRef(null)
    const maskDataRef = useRef(null)
    const fileInputRef = useRef(null)
    
    // 历史记录相关
    const historyRef = useRef([])
    const historyIndexRef = useRef(-1)
    const isUndoRedoRef = useRef(false)

    const [isCanvasReady, setIsCanvasReady] = useState(false)
    const [selectedModel, setSelectedModel] = useState(Object.keys(CAR_MODELS)[0])
    const [selectedObject, setSelectedObject] = useState(null)
    const [rotation, setRotation] = useState(0)
    const [scale, setScale] = useState(100)
    const [scaleX, setScaleX] = useState(100)
    const [scaleY, setScaleY] = useState(100)
    const [opacity, setOpacity] = useState(100)
    const [uniformScale, setUniformScale] = useState(true)
    const [layerCount, setLayerCount] = useState(0)

    // 历史记录状态
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // 裁切模式
    const [isCropMode, setIsCropMode] = useState(false)
    const [cropRect, setCropRect] = useState(null)

    // 文字填充参数
    const [textContent, setTextContent] = useState('')
    const [fontSize, setFontSize] = useState(40)
    const [spacingX, setSpacingX] = useState(100)
    const [spacingY, setSpacingY] = useState(80)
    const [textRotation, setTextRotation] = useState(-15)
    const [textFillLayer, setTextFillLayer] = useState(null)

    // 预设图案
    const [showPatterns, setShowPatterns] = useState(false)
    const [patternCategory, setPatternCategory] = useState('all')
    const [patternThumbnails, setPatternThumbnails] = useState({})

    // 预览缩放（仅用于查看，不影响导出）
    const [viewScale, setViewScale] = useState(100)

    // 当前激活的面板
    const [activePanel, setActivePanel] = useState('layers') // layers, text, patterns

    // 保存画布状态到历史记录
    const saveToHistory = useCallback(() => {
        if (isUndoRedoRef.current) return
        if (!fabricRef.current) return

        const canvas = fabricRef.current
        const json = canvas.toJSON(['selectable', 'evented', 'hoverCursor'])
        
        // 移除当前位置之后的历史记录
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
        
        // 添加新状态
        historyRef.current.push(json)
        
        // 限制历史记录数量
        if (historyRef.current.length > MAX_HISTORY) {
            historyRef.current.shift()
        } else {
            historyIndexRef.current++
        }
        
        updateHistoryState()
    }, [])

    // 更新历史记录状态
    const updateHistoryState = useCallback(() => {
        setCanUndo(historyIndexRef.current > 0)
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }, [])

    // 撤销
    const handleUndo = useCallback(() => {
        if (historyIndexRef.current <= 0) return
        
        isUndoRedoRef.current = true
        historyIndexRef.current--
        
        const state = historyRef.current[historyIndexRef.current]
        fabricRef.current.loadFromJSON(state, () => {
            // 恢复遮罩层引用
            const objects = fabricRef.current.getObjects()
            overlayRef.current = objects.find(obj => !obj.selectable && !obj.evented)
            
            fabricRef.current.renderAll()
            isUndoRedoRef.current = false
            updateHistoryState()
            updateLayerCount()
        })
    }, [updateHistoryState])

    // 重做
    const handleRedo = useCallback(() => {
        if (historyIndexRef.current >= historyRef.current.length - 1) return
        
        isUndoRedoRef.current = true
        historyIndexRef.current++
        
        const state = historyRef.current[historyIndexRef.current]
        fabricRef.current.loadFromJSON(state, () => {
            const objects = fabricRef.current.getObjects()
            overlayRef.current = objects.find(obj => !obj.selectable && !obj.evented)
            
            fabricRef.current.renderAll()
            isUndoRedoRef.current = false
            updateHistoryState()
            updateLayerCount()
        })
    }, [updateHistoryState])

    // 初始化 Fabric Canvas
    useEffect(() => {
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
            setScaleX(100)
            setScaleY(100)
            setOpacity(100)
            
            // 退出裁切模式
            if (isCropMode) {
                exitCropMode()
            }
        })

        // 监听对象修改 - 保存历史
        canvas.on('object:modified', (e) => {
            handleObjectModified(e)
            saveToHistory()
        })
        
        // 监听对象添加
        canvas.on('object:added', () => {
            if (!isUndoRedoRef.current) {
                saveToHistory()
            }
            updateLayerCount()
        })
        
        // 监听对象移除
        canvas.on('object:removed', () => {
            if (!isUndoRedoRef.current) {
                saveToHistory()
            }
            updateLayerCount()
        })

        // 键盘快捷键
        const handleKeyDown = (e) => {
            // 如果正在输入文本，不处理快捷键
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
            
            const activeObject = canvas.getActiveObject()
            
            // Ctrl+Z 撤销
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                handleUndo()
                return
            }
            
            // Ctrl+Shift+Z 或 Ctrl+Y 重做
            if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
                e.preventDefault()
                handleRedo()
                return
            }
            
            // Delete 删除选中
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (activeObject && activeObject !== overlayRef.current) {
                    e.preventDefault()
                    canvas.remove(activeObject)
                    canvas.renderAll()
                    setSelectedObject(null)
                }
                return
            }
            
            // Ctrl+D 复制
            if (e.ctrlKey && e.key === 'd') {
                if (activeObject && activeObject !== overlayRef.current) {
                    e.preventDefault()
                    activeObject.clone((cloned) => {
                        cloned.set({
                            left: activeObject.left + 20,
                            top: activeObject.top + 20,
                        })
                        canvas.add(cloned)
                        if (overlayRef.current) {
                            canvas.bringToFront(overlayRef.current)
                        }
                        canvas.setActiveObject(cloned)
                        canvas.renderAll()
                    })
                }
                return
            }
            
            // 方向键微调
            if (activeObject && activeObject !== overlayRef.current) {
                const step = e.shiftKey ? 10 : 1
                
                switch (e.key) {
                    case 'ArrowUp':
                        e.preventDefault()
                        activeObject.set('top', activeObject.top - step)
                        canvas.renderAll()
                        saveToHistory()
                        break
                    case 'ArrowDown':
                        e.preventDefault()
                        activeObject.set('top', activeObject.top + step)
                        canvas.renderAll()
                        saveToHistory()
                        break
                    case 'ArrowLeft':
                        e.preventDefault()
                        activeObject.set('left', activeObject.left - step)
                        canvas.renderAll()
                        saveToHistory()
                        break
                    case 'ArrowRight':
                        e.preventDefault()
                        activeObject.set('left', activeObject.left + step)
                        canvas.renderAll()
                        saveToHistory()
                        break
                }
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)

        setIsCanvasReady(true)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            canvas.dispose()
        }
    }, [])

    // 处理选择事件
    const handleSelection = useCallback((e) => {
        const obj = e.selected?.[0]
        if (obj && obj !== overlayRef.current) {
            setSelectedObject(obj)
            setRotation(Math.round(obj.angle || 0))
            setScaleX(Math.round((obj.scaleX || 1) * 100))
            setScaleY(Math.round((obj.scaleY || 1) * 100))
            setScale(Math.round((obj.scaleX || 1) * 100))
            setOpacity(Math.round((obj.opacity || 1) * 100))
        }
    }, [])

    // 处理对象修改
    const handleObjectModified = useCallback((e) => {
        const obj = e.target
        if (obj) {
            setRotation(Math.round(obj.angle || 0))
            setScaleX(Math.round((obj.scaleX || 1) * 100))
            setScaleY(Math.round((obj.scaleY || 1) * 100))
            setScale(Math.round((obj.scaleX || 1) * 100))
            setOpacity(Math.round((obj.opacity || 1) * 100))
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
            const imagePath = `/assets/${filename}`
            const { maskedImage, maskData, width, height } = await processTemplateMask(imagePath, CANVAS_BG)

            maskDataRef.current = maskData

            canvas.setDimensions({ width, height })

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
                canvas.bringToFront(img)
                canvas.renderAll()
                
                // 重置历史记录
                historyRef.current = []
                historyIndexRef.current = -1
                saveToHistory()
            })

        } catch (error) {
            console.error('加载车型失败:', error)
        }
    }

    // 切换车型
    useEffect(() => {
        if (isCanvasReady && fabricRef.current) {
            loadCarModel(selectedModel)
        }
    }, [selectedModel, isCanvasReady])

    // 生成图案缩略图
    useEffect(() => {
        const generateThumbnails = async () => {
            const thumbnails = {}
            for (const pattern of PRESET_PATTERNS) {
                try {
                    thumbnails[pattern.id] = pattern.generate()
                } catch (error) {
                    console.error(`生成缩略图失败: ${pattern.id}`, error)
                }
            }
            setPatternThumbnails(thumbnails)
        }
        generateThumbnails()
    }, [])

    // 导入贴图
    const handleImportTexture = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            addImageToCanvas(event.target.result)
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    // 添加图片到画布
    const addImageToCanvas = (dataUrl) => {
        fabric.Image.fromURL(dataUrl, (img) => {
            const canvas = fabricRef.current

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

            if (overlayRef.current) {
                canvas.bringToFront(overlayRef.current)
            }

            canvas.setActiveObject(img)
            canvas.renderAll()
        })
    }

    // 添加预设图案
    const handleAddPattern = (pattern) => {
        try {
            const dataUrl = pattern.generate()
            addImageToCanvas(dataUrl)
            setShowPatterns(false)
        } catch (error) {
            console.error('添加图案失败:', error)
        }
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
        }
    }

    // 复制选中层
    const handleDuplicate = () => {
        const canvas = fabricRef.current
        const activeObject = canvas.getActiveObject()

        if (activeObject && activeObject !== overlayRef.current) {
            activeObject.clone((cloned) => {
                cloned.set({
                    left: activeObject.left + 20,
                    top: activeObject.top + 20,
                })
                canvas.add(cloned)
                if (overlayRef.current) {
                    canvas.bringToFront(overlayRef.current)
                }
                canvas.setActiveObject(cloned)
                canvas.renderAll()
            })
        }
    }

    // 翻转功能
    const handleFlipHorizontal = () => {
        if (!selectedObject || selectedObject === overlayRef.current) return
        selectedObject.set('flipX', !selectedObject.flipX)
        fabricRef.current?.renderAll()
        saveToHistory()
    }

    const handleFlipVertical = () => {
        if (!selectedObject || selectedObject === overlayRef.current) return
        selectedObject.set('flipY', !selectedObject.flipY)
        fabricRef.current?.renderAll()
        saveToHistory()
    }

    // 裁切模式
    const enterCropMode = () => {
        if (!selectedObject || selectedObject === overlayRef.current) return
        if (selectedObject.type !== 'image') {
            alert('只能裁切图片图层')
            return
        }
        
        setIsCropMode(true)
        
        const obj = selectedObject
        const canvas = fabricRef.current
        
        // 创建裁切框
        const rect = new fabric.Rect({
            left: obj.left - (obj.width * obj.scaleX) / 2,
            top: obj.top - (obj.height * obj.scaleY) / 2,
            width: obj.width * obj.scaleX,
            height: obj.height * obj.scaleY,
            fill: 'rgba(0,0,0,0.5)',
            stroke: '#e31937',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            originX: 'left',
            originY: 'top',
            hasRotatingPoint: false,
            lockRotation: true,
            transparentCorners: false,
            cornerColor: '#e31937',
            cornerSize: 10,
        })
        
        setCropRect(rect)
        canvas.add(rect)
        canvas.bringToFront(rect)
        if (overlayRef.current) {
            canvas.bringToFront(overlayRef.current)
        }
        canvas.setActiveObject(rect)
        canvas.renderAll()
    }

    const exitCropMode = () => {
        setIsCropMode(false)
        if (cropRect) {
            fabricRef.current?.remove(cropRect)
            setCropRect(null)
        }
    }

    const applyCrop = () => {
        if (!cropRect || !selectedObject) return
        
        const canvas = fabricRef.current
        const obj = selectedObject
        
        // 计算裁切区域（相对于原图）
        const cropX = (cropRect.left - (obj.left - (obj.width * obj.scaleX) / 2)) / obj.scaleX
        const cropY = (cropRect.top - (obj.top - (obj.height * obj.scaleY) / 2)) / obj.scaleY
        const cropW = (cropRect.width * cropRect.scaleX) / obj.scaleX
        const cropH = (cropRect.height * cropRect.scaleY) / obj.scaleY
        
        // 创建裁切后的图片
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = cropW
        tempCanvas.height = cropH
        const tempCtx = tempCanvas.getContext('2d')
        
        // 获取原始图片
        const originalElement = obj.getElement()
        tempCtx.drawImage(
            originalElement,
            cropX, cropY, cropW, cropH,
            0, 0, cropW, cropH
        )
        
        // 创建新图片对象
        fabric.Image.fromURL(tempCanvas.toDataURL(), (newImg) => {
            newImg.set({
                left: cropRect.left + (cropRect.width * cropRect.scaleX) / 2,
                top: cropRect.top + (cropRect.height * cropRect.scaleY) / 2,
                originX: 'center',
                originY: 'center',
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
            })
            
            // 移除旧图片和裁切框
            canvas.remove(obj)
            canvas.remove(cropRect)
            
            // 添加新图片
            canvas.add(newImg)
            if (overlayRef.current) {
                canvas.bringToFront(overlayRef.current)
            }
            canvas.setActiveObject(newImg)
            canvas.renderAll()
            
            setIsCropMode(false)
            setCropRect(null)
            setSelectedObject(newImg)
        })
    }

    // 清除所有贴图
    const handleClearAll = () => {
        const canvas = fabricRef.current
        const objects = canvas.getObjects().filter(obj => obj !== overlayRef.current)

        objects.forEach(obj => canvas.remove(obj))
        setTextFillLayer(null)
        canvas.renderAll()
        setSelectedObject(null)
    }

    // 置于顶层
    const handleBringToTop = () => {
        const canvas = fabricRef.current
        const activeObject = canvas.getActiveObject()

        if (activeObject && activeObject !== overlayRef.current) {
            canvas.bringToFront(activeObject)
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
            if (uniformScale) {
                const s = scale / 100
                selectedObject.set({ scaleX: s, scaleY: s })
                setScaleX(scale)
                setScaleY(scale)
            } else {
                selectedObject.set({ 
                    scaleX: scaleX / 100, 
                    scaleY: scaleY / 100 
                })
            }
            fabricRef.current?.renderAll()
        }
    }, [scale, scaleX, scaleY, uniformScale, selectedObject])

    // 更新透明度
    useEffect(() => {
        if (selectedObject && selectedObject !== overlayRef.current) {
            selectedObject.set('opacity', opacity / 100)
            fabricRef.current?.renderAll()
        }
    }, [opacity, selectedObject])

    // 生成文字填充
    const handleGenerateTextFill = async () => {
        if (!textContent.trim()) return
        if (!maskDataRef.current) return

        const canvas = fabricRef.current

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

                if (overlayRef.current) {
                    canvas.bringToFront(overlayRef.current)
                }

                setTextFillLayer(img)
                canvas.renderAll()
            })
        } catch (error) {
            console.error('生成文字填充失败:', error)
        }
    }

    // 实时更新文字填充
    useEffect(() => {
        if (textFillLayer && textContent.trim()) {
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

        // 退出裁切模式
        if (isCropMode) {
            exitCropMode()
        }

        canvas.discardActiveObject()
        
        const originalBg = canvas.backgroundColor
        canvas.backgroundColor = null
        canvas.renderAll()

        const dataUrl = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 1,
        })

        canvas.backgroundColor = originalBg
        canvas.renderAll()

        if (maskData) {
            const img = new Image()
            img.src = dataUrl
            await new Promise(resolve => { img.onload = resolve })

            const width = canvas.width
            const height = canvas.height

            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = width
            tempCanvas.height = height
            const tempCtx = tempCanvas.getContext('2d')
            tempCtx.drawImage(img, 0, 0)

            const imageData = tempCtx.getImageData(0, 0, width, height)
            const pixels = imageData.data

            for (let i = 0; i < width * height; i++) {
                if (maskData[i] === 0) {
                    pixels[i * 4 + 3] = 0
                }
            }

            tempCtx.putImageData(imageData, 0, 0)

            tempCanvas.toBlob(blob => {
                saveAs(blob, `tesla-wrap-design-${Date.now()}.png`)
            }, 'image/png')
        } else {
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
                {/* 顶部工具栏 */}
                <div className="flex items-center gap-2 px-4 py-2 bg-panel border-b border-border">
                    {/* 撤销/重做 */}
                    <div className="flex items-center gap-1 pr-3 border-r border-border">
                        <button
                            onClick={handleUndo}
                            disabled={!canUndo}
                            className="p-2 rounded-lg hover:bg-panel-light text-gray-400 hover:text-white 
                                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="撤销 (Ctrl+Z)"
                        >
                            <Undo2 size={18} />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={!canRedo}
                            className="p-2 rounded-lg hover:bg-panel-light text-gray-400 hover:text-white 
                                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="重做 (Ctrl+Shift+Z)"
                        >
                            <Redo2 size={18} />
                        </button>
                    </div>

                    {/* 变换工具 */}
                    <div className="flex items-center gap-1 pr-3 border-r border-border">
                        <button
                            onClick={handleFlipHorizontal}
                            disabled={!selectedObject}
                            className="p-2 rounded-lg hover:bg-panel-light text-gray-400 hover:text-white 
                                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="水平翻转"
                        >
                            <FlipHorizontal size={18} />
                        </button>
                        <button
                            onClick={handleFlipVertical}
                            disabled={!selectedObject}
                            className="p-2 rounded-lg hover:bg-panel-light text-gray-400 hover:text-white 
                                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="垂直翻转"
                        >
                            <FlipVertical size={18} />
                        </button>
                        <button
                            onClick={handleDuplicate}
                            disabled={!selectedObject}
                            className="p-2 rounded-lg hover:bg-panel-light text-gray-400 hover:text-white 
                                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="复制 (Ctrl+D)"
                        >
                            <Copy size={18} />
                        </button>
                    </div>

                    {/* 裁切工具 */}
                    <div className="flex items-center gap-1 pr-3 border-r border-border">
                        {!isCropMode ? (
                            <button
                                onClick={enterCropMode}
                                disabled={!selectedObject || selectedObject?.type !== 'image'}
                                className="p-2 rounded-lg hover:bg-panel-light text-gray-400 hover:text-white 
                                           transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="裁切"
                            >
                                <Crop size={18} />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={applyCrop}
                                    className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white 
                                               text-sm font-medium transition-colors"
                                >
                                    应用裁切
                                </button>
                                <button
                                    onClick={exitCropMode}
                                    className="px-3 py-1.5 rounded-lg bg-panel-light hover:bg-gray-600 text-gray-300 
                                               text-sm transition-colors"
                                >
                                    取消
                                </button>
                            </>
                        )}
                    </div>

                    {/* 快捷键提示 */}
                    <div className="ml-auto text-xs text-gray-500">
                        <span className="mr-4">Delete 删除</span>
                        <span className="mr-4">Ctrl+D 复制</span>
                        <span>方向键 微调位置</span>
                    </div>
                </div>

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

                {/* 面板切换标签 */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActivePanel('layers')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activePanel === 'layers' 
                                ? 'text-accent border-b-2 border-accent' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Layers size={14} className="inline mr-1" /> 图层
                    </button>
                    <button
                        onClick={() => setActivePanel('patterns')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activePanel === 'patterns' 
                                ? 'text-accent border-b-2 border-accent' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Palette size={14} className="inline mr-1" /> 预设图案
                    </button>
                    <button
                        onClick={() => setActivePanel('text')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activePanel === 'text' 
                                ? 'text-accent border-b-2 border-accent' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Type size={14} className="inline mr-1" /> 文字
                    </button>
                </div>

                {/* 图层管理面板 */}
                {activePanel === 'layers' && (
                    <>
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
                                {/* 透明度 */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            <Eye size={14} /> 透明度
                                        </span>
                                        <span className="text-white font-mono">{opacity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={opacity}
                                        onChange={(e) => setOpacity(Number(e.target.value))}
                                        disabled={!selectedObject}
                                        className="disabled:opacity-40"
                                    />
                                </div>

                                {/* 旋转 */}
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

                                {/* 缩放模式切换 */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">等比缩放</span>
                                    <button
                                        onClick={() => setUniformScale(!uniformScale)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            uniformScale 
                                                ? 'bg-accent/20 text-accent' 
                                                : 'bg-panel-light text-gray-400'
                                        }`}
                                    >
                                        {uniformScale ? <Lock size={14} /> : <Unlock size={14} />}
                                    </button>
                                </div>

                                {/* 缩放 */}
                                {uniformScale ? (
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
                                ) : (
                                    <>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-400">宽度缩放</span>
                                                <span className="text-white font-mono">{scaleX}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="300"
                                                value={scaleX}
                                                onChange={(e) => setScaleX(Number(e.target.value))}
                                                disabled={!selectedObject}
                                                className="disabled:opacity-40"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-400">高度缩放</span>
                                                <span className="text-white font-mono">{scaleY}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="300"
                                                value={scaleY}
                                                onChange={(e) => setScaleY(Number(e.target.value))}
                                                disabled={!selectedObject}
                                                className="disabled:opacity-40"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* 预设图案面板 */}
                {activePanel === 'patterns' && (
                    <div className="p-5 border-b border-border panel-section">
                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                            <Palette size={16} />
                            <span className="text-sm font-medium uppercase tracking-wide">预设图案</span>
                        </div>
                        
                        {/* 分类选择 */}
                        <div className="flex flex-wrap gap-1 mb-4">
                            {getCategories().map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setPatternCategory(cat.id)}
                                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                                        patternCategory === cat.id
                                            ? 'bg-accent text-white'
                                            : 'bg-panel-light text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                        
                        {/* 图案网格 */}
                        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                            {getPatternsByCategory(patternCategory).map(pattern => (
                                <button
                                    key={pattern.id}
                                    onClick={() => handleAddPattern(pattern)}
                                    className="group relative aspect-video rounded-lg overflow-hidden 
                                               border border-border hover:border-accent transition-colors"
                                >
                                    {patternThumbnails[pattern.id] && (
                                        <img 
                                            src={patternThumbnails[pattern.id]} 
                                            alt={pattern.name}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 
                                                    transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs text-center px-2">
                                            {pattern.name}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 文字填充面板 */}
                {activePanel === 'text' && (
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
                )}

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
