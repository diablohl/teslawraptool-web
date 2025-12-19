import React, { useState, useRef, useEffect, useCallback } from 'react'
import { fabric } from 'fabric'
import { saveAs } from 'file-saver'
import {
    Car, Upload, Trash2, Layers, RotateCcw, ZoomIn, ZoomOut,
    Type, Download, ChevronUp, Sparkles, Settings2, Maximize2,
    Undo2, Redo2, FlipHorizontal, FlipVertical, Crop, Eye,
    Palette, Grid3X3, Lock, Unlock, Move, Copy, Scissors,
    SunMedium, Droplets, Contrast, Square, Circle, Triangle, 
    Pentagon, Hexagon, Star, Pencil, Eraser, MousePointer,
    FolderOpen, Layout, PaintBucket, Mail,
    Sliders, ArrowUpRight, Languages
} from 'lucide-react'
import { processTemplateMask } from './utils/maskProcessor'
import { generateTextPattern } from './utils/textGenerator'
import { PRESET_PATTERNS, getCategories, getPatternsByCategory } from './utils/patternGenerator'
import { applyColorAdjustments, resetColorAdjustments } from './utils/colorAdjustment'
import { getTemplatesByCarModel } from './utils/templateManager'
import { useLanguage } from './contexts/LanguageContext'

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
    // 语言管理
    const { t, toggleLanguage, language } = useLanguage()
    
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
    const [activePanel, setActivePanel] = useState('layers') // layers, text, patterns, shapes, brush, templates, colors

    // 颜色调整状态
    const [colorHue, setColorHue] = useState(0)
    const [colorSaturation, setColorSaturation] = useState(0)
    const [colorBrightness, setColorBrightness] = useState(0)
    const [colorContrast, setColorContrast] = useState(0)

    // 形状工具状态
    const [shapeType, setShapeType] = useState('rect') // rect, circle, triangle, pentagon, hexagon, star, line
    const [shapeFillColor, setShapeFillColor] = useState('#e31937')
    const [shapeStrokeColor, setShapeStrokeColor] = useState('#ffffff')
    const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2)

    // 画笔工具状态
    const [isDrawingMode, setIsDrawingMode] = useState(false)
    const [brushColor, setBrushColor] = useState('#e31937')
    const [brushWidth, setBrushWidth] = useState(5)

    // 填充工具状态
    const [isFillMode, setIsFillMode] = useState(false)
    const [fillColor, setFillColor] = useState('#e31937')
    const [fillTolerance, setFillTolerance] = useState(30)

    // 透视变形状态
    const [isPerspectiveMode, setIsPerspectiveMode] = useState(false)
    const perspectivePointsRef = useRef([])

    // 设计模板（同步获取）
    const carTemplates = getTemplatesByCarModel(selectedModel)

    // 当前绘图工具 
    const [currentTool, setCurrentTool] = useState('select') // select, shape, brush, fill, perspective

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
                    // 生成小尺寸缩略图预览 (400x225 = 16:9)
                    const tempCanvas = document.createElement('canvas')
                    tempCanvas.width = 400
                    tempCanvas.height = 225
                    const tempCtx = tempCanvas.getContext('2d')
                    
                    // 生成完整图案
                    const fullPattern = pattern.generate()
                    
                    // 加载并缩小到缩略图尺寸
                    const img = new Image()
                    await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = reject
                        img.src = fullPattern
                    })
                    
                    // 绘制到缩略图画布
                    tempCtx.drawImage(img, 0, 0, 400, 225)
                    thumbnails[pattern.id] = tempCanvas.toDataURL('image/png')
                } catch (error) {
                    console.error(`生成缩略图失败: ${pattern.id}`, error)
                }
            }
            setPatternThumbnails(thumbnails)
        }
        generateThumbnails()
    }, [])

    // 填充模式事件监听
    useEffect(() => {
        const canvas = fabricRef.current
        if (!canvas) return

        const handleMouseDown = (e) => {
            if (isFillMode) {
                handleFillClick(e)
            }
        }

        canvas.on('mouse:down', handleMouseDown)

        return () => {
            canvas.off('mouse:down', handleMouseDown)
        }
    }, [isFillMode, fillColor, fillTolerance])

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
            alert(t('layersPanel.cropTip'))
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

    // ============== 颜色调整功能 ==============
    const handleColorAdjustment = useCallback(() => {
        if (!selectedObject || selectedObject === overlayRef.current) return
        if (selectedObject.type !== 'image') return

        applyColorAdjustments(selectedObject, {
            hue: colorHue,
            saturation: colorSaturation,
            brightness: colorBrightness,
            contrast: colorContrast,
        })
        fabricRef.current?.renderAll()
    }, [selectedObject, colorHue, colorSaturation, colorBrightness, colorContrast])

    // 实时更新颜色调整
    useEffect(() => {
        if (selectedObject && selectedObject.type === 'image') {
            handleColorAdjustment()
        }
    }, [colorHue, colorSaturation, colorBrightness, colorContrast])

    // 重置颜色调整
    const handleResetColors = () => {
        setColorHue(0)
        setColorSaturation(0)
        setColorBrightness(0)
        setColorContrast(0)
        if (selectedObject && selectedObject.type === 'image') {
            resetColorAdjustments(selectedObject)
            fabricRef.current?.renderAll()
        }
    }

    // ============== 形状工具功能 ==============
    const addShape = (type) => {
        const canvas = fabricRef.current
        if (!canvas) return

        let shape
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const size = 100

        switch(type) {
            case 'rect':
                shape = new fabric.Rect({
                    width: size * 1.5,
                    height: size,
                    fill: shapeFillColor,
                    stroke: shapeStrokeColor,
                    strokeWidth: shapeStrokeWidth,
                    left: centerX,
                    top: centerY,
                    originX: 'center',
                    originY: 'center',
                })
                break
            case 'circle':
                shape = new fabric.Circle({
                    radius: size / 2,
                    fill: shapeFillColor,
                    stroke: shapeStrokeColor,
                    strokeWidth: shapeStrokeWidth,
                    left: centerX,
                    top: centerY,
                    originX: 'center',
                    originY: 'center',
                })
                break
            case 'triangle':
                shape = new fabric.Triangle({
                    width: size,
                    height: size,
                    fill: shapeFillColor,
                    stroke: shapeStrokeColor,
                    strokeWidth: shapeStrokeWidth,
                    left: centerX,
                    top: centerY,
                    originX: 'center',
                    originY: 'center',
                })
                break
            case 'pentagon':
                shape = new fabric.Polygon(
                    createPolygonPoints(5, size / 2),
                    {
                        fill: shapeFillColor,
                        stroke: shapeStrokeColor,
                        strokeWidth: shapeStrokeWidth,
                        left: centerX,
                        top: centerY,
                        originX: 'center',
                        originY: 'center',
                    }
                )
                break
            case 'hexagon':
                shape = new fabric.Polygon(
                    createPolygonPoints(6, size / 2),
                    {
                        fill: shapeFillColor,
                        stroke: shapeStrokeColor,
                        strokeWidth: shapeStrokeWidth,
                        left: centerX,
                        top: centerY,
                        originX: 'center',
                        originY: 'center',
                    }
                )
                break
            case 'star':
                shape = new fabric.Polygon(
                    createStarPoints(5, size / 2, size / 4),
                    {
                        fill: shapeFillColor,
                        stroke: shapeStrokeColor,
                        strokeWidth: shapeStrokeWidth,
                        left: centerX,
                        top: centerY,
                        originX: 'center',
                        originY: 'center',
                    }
                )
                break
            case 'line':
                shape = new fabric.Line([0, 0, size * 2, 0], {
                    stroke: shapeStrokeColor,
                    strokeWidth: shapeStrokeWidth * 2,
                    left: centerX,
                    top: centerY,
                    originX: 'center',
                    originY: 'center',
                })
                break
            case 'arrow':
                // 箭头使用路径
                const arrowPath = `M 0 0 L ${size} 0 L ${size - 15} -15 M ${size} 0 L ${size - 15} 15`
                shape = new fabric.Path(arrowPath, {
                    stroke: shapeStrokeColor,
                    strokeWidth: shapeStrokeWidth * 2,
                    fill: '',
                    left: centerX,
                    top: centerY,
                    originX: 'center',
                    originY: 'center',
                })
                break
        }

        if (shape) {
            canvas.add(shape)
            if (overlayRef.current) {
                canvas.bringToFront(overlayRef.current)
            }
            canvas.setActiveObject(shape)
            canvas.renderAll()
        }
    }

    // 创建正多边形的点
    function createPolygonPoints(sides, radius) {
        const points = []
        const angle = (2 * Math.PI) / sides
        for (let i = 0; i < sides; i++) {
            points.push({
                x: radius * Math.cos(angle * i - Math.PI / 2),
                y: radius * Math.sin(angle * i - Math.PI / 2),
            })
        }
        return points
    }

    // 创建星形的点
    function createStarPoints(points, outerRadius, innerRadius) {
        const result = []
        const angle = Math.PI / points
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius
            result.push({
                x: radius * Math.cos(angle * i - Math.PI / 2),
                y: radius * Math.sin(angle * i - Math.PI / 2),
            })
        }
        return result
    }

    // ============== 填充工具功能 ==============
    const enableFillMode = () => {
        const canvas = fabricRef.current
        if (!canvas) return

        // 禁用其他模式
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        setIsPerspectiveMode(false)
        
        // 设置填充模式
        setIsFillMode(true)
        setCurrentTool('fill')
        
        // 取消所有对象的选择
        canvas.discardActiveObject()
        
        // 禁用对象选择
        canvas.selection = false
        canvas.getObjects().forEach(obj => {
            obj.selectable = false
            obj.evented = false
        })
        
        canvas.renderAll()
        
        // 改变鼠标样式
        canvas.defaultCursor = 'crosshair'
        canvas.hoverCursor = 'crosshair'
    }

    const disableFillMode = () => {
        const canvas = fabricRef.current
        if (!canvas) return
        
        setIsFillMode(false)
        setCurrentTool('select')
        
        // 恢复对象选择
        canvas.selection = true
        canvas.getObjects().forEach(obj => {
            if (obj !== overlayRef.current) {
                obj.selectable = true
                obj.evented = true
            }
        })
        
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'move'
        canvas.renderAll()
    }

    // 泛洪填充算法
    const floodFill = (imageData, x, y, fillColorRgb, tolerance) => {
        const { width, height, data } = imageData
        const targetColor = getPixelColor(data, x, y, width)
        
        // 如果目标颜色和填充颜色相同，不需要填充
        if (colorsMatch(targetColor, fillColorRgb, 0)) {
            return imageData
        }
        
        const stack = [[x, y]]
        const visited = new Set()
        
        while (stack.length > 0) {
            const [cx, cy] = stack.pop()
            const key = `${cx},${cy}`
            
            if (visited.has(key)) continue
            if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue
            
            visited.add(key)
            
            const currentColor = getPixelColor(data, cx, cy, width)
            
            if (!colorsMatch(currentColor, targetColor, tolerance)) continue
            
            // 填充当前像素
            setPixelColor(data, cx, cy, width, fillColorRgb)
            
            // 添加相邻像素到栈
            stack.push([cx + 1, cy])
            stack.push([cx - 1, cy])
            stack.push([cx, cy + 1])
            stack.push([cx, cy - 1])
        }
        
        return imageData
    }

    // 获取像素颜色
    const getPixelColor = (data, x, y, width) => {
        const index = (y * width + x) * 4
        return {
            r: data[index],
            g: data[index + 1],
            b: data[index + 2],
            a: data[index + 3]
        }
    }

    // 设置像素颜色
    const setPixelColor = (data, x, y, width, color) => {
        const index = (y * width + x) * 4
        data[index] = color.r
        data[index + 1] = color.g
        data[index + 2] = color.b
        data[index + 3] = 255 // 完全不透明
    }

    // 判断颜色是否匹配
    const colorsMatch = (color1, color2, tolerance) => {
        return Math.abs(color1.r - color2.r) <= tolerance &&
               Math.abs(color1.g - color2.g) <= tolerance &&
               Math.abs(color1.b - color2.b) <= tolerance
    }

    // 处理填充点击
    const handleFillClick = (e) => {
        if (!isFillMode) return
        
        const canvas = fabricRef.current
        if (!canvas) return

        console.log('填充工具点击')

        // 获取点击位置
        const pointer = canvas.getPointer(e.e)
        const x = Math.floor(pointer.x)
        const y = Math.floor(pointer.y)

        console.log('点击位置:', x, y)

        // 创建临时画布，获取当前画布的像素数据
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const tempCtx = tempCanvas.getContext('2d')

        // 使用 toDataURL 将整个画布导出为图像
        const canvasDataURL = canvas.toDataURL()
        const img = new Image()
        
        img.onload = () => {
            // 绘制到临时画布
            tempCtx.drawImage(img, 0, 0)
            
            // 获取图像数据
            const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)

            // 将填充颜色转换为RGB
            const fillColorRgb = hexToRgb(fillColor)

            console.log('开始填充，颜色:', fillColorRgb, '容差:', fillTolerance)

            // 执行泛洪填充
            const filledImageData = floodFill(imageData, x, y, fillColorRgb, fillTolerance)

            // 将填充结果绘制回临时画布
            tempCtx.putImageData(filledImageData, 0, 0)

            // 创建新的图像对象添加到画布
            fabric.Image.fromURL(tempCanvas.toDataURL(), (fillImg) => {
                fillImg.set({
                    left: 0,
                    top: 0,
                    selectable: true,
                    evented: true,
                    name: 'fill-layer'
                })
                
                canvas.add(fillImg)
                
                // 确保overlay在最上层
                if (overlayRef.current) {
                    canvas.bringToFront(overlayRef.current)
                }
                
                canvas.renderAll()
                saveToHistory()
                
                console.log('填充完成')
            })
        }
        
        img.src = canvasDataURL
    }

    // 十六进制颜色转RGB
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 227, g: 25, b: 55 } // 默认红色
    }

    // ============== 画笔工具功能 ==============
    const toggleDrawingMode = (enabled) => {
        const canvas = fabricRef.current
        if (!canvas) return

        setIsDrawingMode(enabled)
        canvas.isDrawingMode = enabled
        
        if (enabled) {
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
            canvas.freeDrawingBrush.color = brushColor
            canvas.freeDrawingBrush.width = brushWidth
            setCurrentTool('brush')
        } else {
            setCurrentTool('select')
        }
    }

    // 更新画笔属性
    useEffect(() => {
        const canvas = fabricRef.current
        if (canvas && canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = brushColor
            canvas.freeDrawingBrush.width = brushWidth
        }
    }, [brushColor, brushWidth])

    // 监听绘图完成，将路径移到遮罩层下方
    useEffect(() => {
        const canvas = fabricRef.current
        if (!canvas) return

        const handlePathCreated = (e) => {
            if (overlayRef.current) {
                canvas.bringToFront(overlayRef.current)
            }
        }

        canvas.on('path:created', handlePathCreated)
        return () => canvas.off('path:created', handlePathCreated)
    }, [])

    // ============== 透视变形功能 ==============
    const enterPerspectiveMode = () => {
        if (!selectedObject || selectedObject === overlayRef.current) return
        if (selectedObject.type !== 'image') {
            alert(t('layersPanel.cropTip'))
            return
        }

        setIsPerspectiveMode(true)
        setCurrentTool('perspective')

        const canvas = fabricRef.current
        const obj = selectedObject
        
        // 获取图片的四个角
        const bounds = obj.getBoundingRect()
        const corners = [
            { x: bounds.left, y: bounds.top },
            { x: bounds.left + bounds.width, y: bounds.top },
            { x: bounds.left + bounds.width, y: bounds.top + bounds.height },
            { x: bounds.left, y: bounds.top + bounds.height },
        ]

        // 创建四个控制点
        const controlPoints = corners.map((corner, index) => {
            const point = new fabric.Circle({
                radius: 8,
                fill: '#e31937',
                stroke: '#fff',
                strokeWidth: 2,
                left: corner.x,
                top: corner.y,
                originX: 'center',
                originY: 'center',
                hasBorders: false,
                hasControls: false,
                data: { type: 'perspectivePoint', index },
            })
            return point
        })

        perspectivePointsRef.current = controlPoints
        controlPoints.forEach(p => canvas.add(p))
        canvas.bringToFront(overlayRef.current)
        canvas.renderAll()
    }

    const applyPerspective = async () => {
        if (!selectedObject || perspectivePointsRef.current.length !== 4) return

        const canvas = fabricRef.current
        const obj = selectedObject
        const points = perspectivePointsRef.current.map(p => ({ x: p.left, y: p.top }))

        // 使用 Canvas 2D 进行透视变换（简化版本）
        // 完整的透视变换需要使用矩阵变换库如 perspective.js
        const tempCanvas = document.createElement('canvas')
        const bounds = obj.getBoundingRect()
        tempCanvas.width = bounds.width
        tempCanvas.height = bounds.height
        const tempCtx = tempCanvas.getContext('2d')

        // 绘制原图到临时画布
        const originalElement = obj.getElement()
        tempCtx.drawImage(originalElement, 0, 0, bounds.width, bounds.height)

        // 创建变形后的图片（简化：使用 skewX/skewY 近似）
        const dx1 = points[1].x - points[0].x - bounds.width
        const dy1 = points[3].y - points[0].y - bounds.height
        
        fabric.Image.fromURL(tempCanvas.toDataURL(), (newImg) => {
            newImg.set({
                left: points[0].x + bounds.width / 2,
                top: points[0].y + bounds.height / 2,
                originX: 'center',
                originY: 'center',
                scaleX: obj.scaleX * (1 + dx1 / bounds.width * 0.5),
                scaleY: obj.scaleY * (1 + dy1 / bounds.height * 0.5),
                skewX: (points[1].y - points[0].y) * 0.5,
                skewY: (points[3].x - points[0].x) * 0.5,
            })

            // 移除旧图片和控制点
            canvas.remove(obj)
            perspectivePointsRef.current.forEach(p => canvas.remove(p))
            perspectivePointsRef.current = []

            // 添加新图片
            canvas.add(newImg)
            if (overlayRef.current) {
                canvas.bringToFront(overlayRef.current)
            }
            canvas.setActiveObject(newImg)
            canvas.renderAll()

            setIsPerspectiveMode(false)
            setCurrentTool('select')
            setSelectedObject(newImg)
            saveToHistory()
        })
    }

    const cancelPerspective = () => {
        const canvas = fabricRef.current
        perspectivePointsRef.current.forEach(p => canvas.remove(p))
        perspectivePointsRef.current = []
        canvas.renderAll()
        setIsPerspectiveMode(false)
        setCurrentTool('select')
    }

    // ============== 添加模板图片到画布 ==============
    const handleAddTemplateImage = (template) => {
        if (!template.image) return
        
        const canvas = fabricRef.current
        if (!canvas) return

        fabric.Image.fromURL(template.image, (img) => {
            // 缩放图片以适应画布
            const maxSize = Math.min(canvas.width, canvas.height) * 0.6
            const scale = Math.min(maxSize / img.width, maxSize / img.height)
            
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                evented: true,
            })

            canvas.add(img)
            
            // 确保在遮罩层下方
            if (overlayRef.current) {
                canvas.bringToFront(overlayRef.current)
            }
            
            canvas.setActiveObject(img)
            canvas.renderAll()
            updateLayerCount()
            saveToHistory()
        }, { crossOrigin: 'anonymous' })
    }

    // ============== 应用模板图片替换底图 ==============
    const handleApplyTemplate = (template) => {
        if (!template.image) return
        
        const canvas = fabricRef.current
        if (!canvas) return

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

        fabric.Image.fromURL(template.image, (img) => {
            // 调整画布大小以适应模板图片
            canvas.setDimensions({ 
                width: img.width, 
                height: img.height 
            })
            
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
            
            // 重置遮罩数据（模板图片不使用遮罩）
            maskDataRef.current = null
            
            // 重置历史记录
            historyRef.current = []
            historyIndexRef.current = -1
            saveToHistory()
        }, { crossOrigin: 'anonymous' })
    }

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
                            title={`${t('toolbar.undo')} (Ctrl+Z)`}
                        >
                            <Undo2 size={18} />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={!canRedo}
                            className="p-2 rounded-lg hover:bg-panel-light text-gray-400 hover:text-white 
                                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={`${t('toolbar.redo')} (Ctrl+Shift+Z)`}
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
                            title={t('layersPanel.flipH')}
                        >
                            <FlipHorizontal size={18} />
                        </button>
                        <button
                            onClick={handleFlipVertical}
                            disabled={!selectedObject}
                            className="p-2 rounded-lg hover:bg-panel-light text-gray-400 hover:text-white 
                                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={t('layersPanel.flipV')}
                        >
                            <FlipVertical size={18} />
                        </button>
                        <button
                            onClick={handleDuplicate}
                            disabled={!selectedObject}
                            className="p-2 rounded-lg hover:bg-panel-light text-gray-400 hover:text-white 
                                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={`${t('layersPanel.duplicate')} (Ctrl+D)`}
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
                                title={t('layersPanel.crop')}
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
                                    {t('layersPanel.applyCrop')}
                                </button>
                                <button
                                    onClick={exitCropMode}
                                    className="px-3 py-1.5 rounded-lg bg-panel-light hover:bg-gray-600 text-gray-300 
                                               text-sm transition-colors"
                                >
                                    {t('layersPanel.cancelCrop')}
                                </button>
                            </>
                        )}
                    </div>

                    {/* 快捷键提示 */}
                    <div className="ml-auto text-xs text-gray-500">
                        <span className="mr-4">Delete {t('shortcuts.delete')}</span>
                        <span className="mr-4">Ctrl+D {t('shortcuts.duplicate')}</span>
                        <span>{t('shortcuts.move')}</span>
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
                        title={t('toolbar.zoomOut')}
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
                        title={t('toolbar.zoomIn')}
                    >
                        <ZoomIn size={18} />
                    </button>
                    
                    <button
                        onClick={handleZoomReset}
                        className="p-2 rounded-lg bg-panel-light hover:bg-gray-700 text-gray-400 
                                   hover:text-white transition-colors ml-2"
                        title="100%"
                    >
                        <Maximize2 size={18} />
                    </button>
                    
                    <span className="text-gray-600 text-xs ml-2">
                        {t('toolbar.viewScale')}
                    </span>
                </div>
            </div>

            {/* 右侧控制面板 */}
            <div className="w-80 bg-panel border-l border-border overflow-y-auto">
                {/* 标题 */}
                <div className="p-6 border-b border-border bg-gradient-to-r from-panel to-transparent">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h1 className="font-display text-2xl font-bold tracking-wider text-white">
                                WRAP<span className="text-accent">STUDIO</span>
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
                        </div>
                        <button
                            onClick={toggleLanguage}
                            className="ml-2 p-2 rounded-lg bg-panel-light hover:bg-accent/20 text-gray-400 
                                       hover:text-white transition-colors flex items-center gap-1.5"
                            title={t('toolbar.language')}
                        >
                            <Languages size={18} />
                            <span className="text-xs font-medium">{language === 'zh' ? 'EN' : '中'}</span>
                        </button>
                    </div>
                    
                    {/* 联系反馈按钮 */}
                    <a
                        href="https://tally.so/r/D4KVxR"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg 
                                   bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50
                                   text-gray-300 hover:text-white transition-all duration-200 group"
                    >
                        <Mail size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">{language === 'zh' ? '反馈意见 / 分享作品' : 'Feedback / Share'}</span>
                    </a>
                </div>

                {/* 车型选择 */}
                <div className="p-5 border-b border-border panel-section">
                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                        <Car size={16} />
                        <span className="text-sm font-medium uppercase tracking-wide">{t('toolbar.selectModel')}</span>
                    </div>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-panel-light border border-border rounded-lg px-4 py-3 text-white
                       focus:outline-none focus:border-accent transition-colors cursor-pointer
                       appearance-none"
                    >
                        {Object.keys(CAR_MODELS).map(model => (
                            <option key={model} value={model}>{t(`carModels.${model}`)}</option>
                        ))}
                    </select>
                </div>

                {/* 面板切换标签 - 第一行 */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActivePanel('layers')}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                            activePanel === 'layers' 
                                ? 'text-accent border-b-2 border-accent bg-accent/10' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Layers size={12} className="inline mr-1" /> {t('panels.layers')}
                    </button>
                    <button
                        onClick={() => setActivePanel('patterns')}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                            activePanel === 'patterns' 
                                ? 'text-accent border-b-2 border-accent bg-accent/10' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Palette size={12} className="inline mr-1" /> {t('panels.patterns')}
                    </button>
                    <button
                        onClick={() => setActivePanel('shapes')}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                            activePanel === 'shapes' 
                                ? 'text-accent border-b-2 border-accent bg-accent/10' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Square size={12} className="inline mr-1" /> {t('panels.shapes')}
                    </button>
                    <button
                        onClick={() => setActivePanel('fill')}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                            activePanel === 'fill' 
                                ? 'text-accent border-b-2 border-accent bg-accent/10' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <PaintBucket size={12} className="inline mr-1" /> {language === 'zh' ? '填充' : 'Fill'}
                    </button>
                    <button
                        onClick={() => setActivePanel('brush')}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                            activePanel === 'brush' 
                                ? 'text-accent border-b-2 border-accent bg-accent/10' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Pencil size={12} className="inline mr-1" /> {t('panels.brush')}
                    </button>
                </div>
                {/* 面板切换标签 - 第二行 */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActivePanel('colors')}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                            activePanel === 'colors' 
                                ? 'text-accent border-b-2 border-accent bg-accent/10' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Sliders size={12} className="inline mr-1" /> {t('panels.colors')}
                    </button>
                    <button
                        onClick={() => setActivePanel('text')}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                            activePanel === 'text' 
                                ? 'text-accent border-b-2 border-accent bg-accent/10' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Type size={12} className="inline mr-1" /> {t('panels.text')}
                    </button>
                    <button
                        onClick={() => setActivePanel('templates')}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                            activePanel === 'templates' 
                                ? 'text-accent border-b-2 border-accent bg-accent/10' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Layout size={12} className="inline mr-1" /> {t('panels.templates')}
                    </button>
                </div>

                {/* 图层管理面板 */}
                {activePanel === 'layers' && (
                    <>
                <div className="p-5 border-b border-border panel-section">
                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                        <Layers size={16} />
                        <span className="text-sm font-medium uppercase tracking-wide">{t('layersPanel.title')}</span>
                        {layerCount > 0 && (
                            <span className="ml-auto bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full">
                {layerCount} {language === 'zh' ? '层' : 'layers'}
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
                        {t('toolbar.importTexture')}
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
                            {t('layersPanel.delete')}
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
                            {t('layersPanel.bringToTop')}
                        </button>
                    </div>

                    <button
                        onClick={handleClearAll}
                        className="w-full mt-2 bg-panel-light hover:bg-red-500/10 text-gray-400 hover:text-red-400
                       py-2 px-3 rounded-lg transition-all duration-200 text-sm
                       border border-transparent hover:border-red-500/20"
                    >
                        {t('toolbar.clearAll')}
                    </button>
                </div>

                {/* 变换参数 */}
                <div className="p-5 border-b border-border panel-section">
                    <div className="flex items-center gap-2 text-gray-400 mb-4">
                        <Settings2 size={16} />
                        <span className="text-sm font-medium uppercase tracking-wide">{t('layersPanel.properties')}</span>
                    </div>

                    <div className="space-y-4">
                                {/* 透明度 */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            <Eye size={14} /> {t('layersPanel.opacity')}
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
                  <RotateCcw size={14} /> {t('layersPanel.rotation')}
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
                                    <span className="text-gray-400 text-sm">{t('layersPanel.uniformScale')}</span>
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
                  <ZoomIn size={14} /> {t('layersPanel.scale')}
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
                                                <span className="text-gray-400">{t('layersPanel.width')}</span>
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
                                                <span className="text-gray-400">{t('layersPanel.height')}</span>
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
                            <span className="text-sm font-medium uppercase tracking-wide">{t('patternsPanel.title')}</span>
                        </div>
                        
                        {/* 分类选择 */}
                        <div className="mb-4">
                            <label className="text-xs text-gray-500 mb-2 block">{t('patternsPanel.category')}</label>
                            <div className="flex flex-wrap gap-2">
                                {getCategories().map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setPatternCategory(cat.id)}
                                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                                            patternCategory === cat.id
                                                ? 'bg-accent text-white shadow-lg shadow-accent/30'
                                                : 'bg-panel-light text-gray-400 hover:text-white hover:bg-panel-light/80'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* 图案网格 */}
                        <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                            {getPatternsByCategory(patternCategory).map(pattern => (
                                <div key={pattern.id} className="w-full" style={{ paddingBottom: '56.25%', position: 'relative' }}>
                                    <button
                                        onClick={() => handleAddPattern(pattern)}
                                        className="group absolute inset-0 w-full h-full rounded-lg overflow-hidden 
                                                   border-2 border-border hover:border-accent transition-colors
                                                   bg-panel-light"
                                    >
                                        {patternThumbnails[pattern.id] ? (
                                            <img 
                                                src={patternThumbnails[pattern.id]} 
                                                alt={pattern.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <div className="text-center">
                                                    <Palette size={24} className="mx-auto mb-2 opacity-50" />
                                                    <div className="text-xs">{t('patternsPanel.loading')}</div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent 
                                                        opacity-0 group-hover:opacity-100 transition-opacity 
                                                        flex items-end justify-center pb-2">
                                            <span className="text-white text-xs font-medium text-center px-2">
                                                {pattern.name}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 文字填充面板 */}
                {activePanel === 'text' && (
                <div className="p-5 border-b border-border panel-section">
                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                        <Type size={16} />
                        <span className="text-sm font-medium uppercase tracking-wide">{t('textPanel.title')}</span>
                    </div>

                    <input
                        type="text"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder={t('textPanel.placeholder')}
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
                        {t('textPanel.generate')}
                    </button>

                    <div className="mt-4 space-y-3">
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-gray-500">{t('textPanel.fontSize')}</span>
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
                                <span className="text-gray-500">{t('textPanel.spacingX')}</span>
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
                                <span className="text-gray-500">{t('textPanel.spacingY')}</span>
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
                                <span className="text-gray-500">{t('textPanel.textRotation')}</span>
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

                {/* 形状工具面板 */}
                {activePanel === 'shapes' && (
                    <div className="p-5 border-b border-border panel-section">
                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                            <Square size={16} />
                            <span className="text-sm font-medium uppercase tracking-wide">{t('shapesPanel.title')}</span>
                        </div>

                        {/* 形状选择网格 */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {[
                                { type: 'rect', icon: Square, name: t('shapesPanel.rectangle') },
                                { type: 'circle', icon: Circle, name: t('shapesPanel.circle') },
                                { type: 'triangle', icon: Triangle, name: t('shapesPanel.triangle') },
                                { type: 'pentagon', icon: Pentagon, name: t('shapesPanel.pentagon') },
                                { type: 'hexagon', icon: Hexagon, name: t('shapesPanel.hexagon') },
                                { type: 'star', icon: Star, name: t('shapesPanel.star') },
                                { type: 'line', icon: ArrowUpRight, name: t('shapesPanel.line') },
                                { type: 'arrow', icon: ArrowUpRight, name: t('shapesPanel.arrow') },
                            ].map(shape => (
                                <button
                                    key={shape.type}
                                    onClick={() => addShape(shape.type)}
                                    className="aspect-square flex flex-col items-center justify-center gap-1
                                               bg-panel-light hover:bg-accent/20 rounded-lg transition-colors
                                               border border-transparent hover:border-accent/50"
                                    title={shape.name}
                                >
                                    <shape.icon size={20} className="text-gray-300" />
                                    <span className="text-[10px] text-gray-500">{shape.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* 颜色设置 */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">填充颜色</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={shapeFillColor}
                                        onChange={(e) => setShapeFillColor(e.target.value)}
                                        className="w-12 h-10 rounded cursor-pointer border border-border"
                                    />
                                    <input
                                        type="text"
                                        value={shapeFillColor}
                                        onChange={(e) => setShapeFillColor(e.target.value)}
                                        className="flex-1 bg-panel-light border border-border rounded px-3 text-white text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">{t('shapesPanel.strokeColor')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={shapeStrokeColor}
                                        onChange={(e) => setShapeStrokeColor(e.target.value)}
                                        className="w-12 h-10 rounded cursor-pointer border border-border"
                                    />
                                    <input
                                        type="text"
                                        value={shapeStrokeColor}
                                        onChange={(e) => setShapeStrokeColor(e.target.value)}
                                        className="flex-1 bg-panel-light border border-border rounded px-3 text-white text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-gray-500">{t('shapesPanel.strokeWidth')}</span>
                                    <span className="text-gray-400 font-mono">{shapeStrokeWidth}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    value={shapeStrokeWidth}
                                    onChange={(e) => setShapeStrokeWidth(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 画笔工具面板 */}
                {activePanel === 'brush' && (
                    <div className="p-5 border-b border-border panel-section">
                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                            <Pencil size={16} />
                            <span className="text-sm font-medium uppercase tracking-wide">{t('brushPanel.title')}</span>
                        </div>

                        <button
                            onClick={() => toggleDrawingMode(!isDrawingMode)}
                            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 
                                       flex items-center justify-center gap-2 ${
                                isDrawingMode
                                    ? 'bg-accent text-white'
                                    : 'bg-panel-light text-gray-300 hover:bg-accent/20'
                            }`}
                        >
                            {isDrawingMode ? (
                                <>
                                    <MousePointer size={18} />
                                    {t('brushPanel.disable')}
                                </>
                            ) : (
                                <>
                                    <Pencil size={18} />
                                    {t('brushPanel.enable')}
                                </>
                            )}
                        </button>

                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">{t('brushPanel.color')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={brushColor}
                                        onChange={(e) => setBrushColor(e.target.value)}
                                        className="w-12 h-10 rounded cursor-pointer border border-border"
                                    />
                                    <input
                                        type="text"
                                        value={brushColor}
                                        onChange={(e) => setBrushColor(e.target.value)}
                                        className="flex-1 bg-panel-light border border-border rounded px-3 text-white text-sm"
                                    />
                                </div>
                            </div>

                            {/* 快捷颜色 */}
                            <div className="flex gap-1">
                                {['#e31937', '#ff6b00', '#ffd700', '#00ff00', '#00bfff', '#8b5cf6', '#ffffff', '#000000'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setBrushColor(color)}
                                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                                            brushColor === color ? 'border-white' : 'border-transparent'
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-gray-500">{t('brushPanel.width')}</span>
                                    <span className="text-gray-400 font-mono">{brushWidth}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={brushWidth}
                                    onChange={(e) => setBrushWidth(Number(e.target.value))}
                                />
                            </div>

                            {/* 画笔预览 */}
                            <div className="flex items-center justify-center py-4 bg-panel-light rounded-lg">
                                <div 
                                    className="rounded-full"
                                    style={{
                                        width: brushWidth,
                                        height: brushWidth,
                                        backgroundColor: brushColor,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 填充工具面板 */}
                {activePanel === 'fill' && (
                    <div className="p-5 border-b border-border panel-section">
                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                            <PaintBucket size={16} />
                            <span className="text-sm font-medium uppercase tracking-wide">{t('fillTool.title')}</span>
                        </div>

                        <button
                            onClick={() => isFillMode ? disableFillMode() : enableFillMode()}
                            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 
                                       flex items-center justify-center gap-2 ${
                                isFillMode
                                    ? 'bg-accent text-white'
                                    : 'bg-panel-light text-gray-300 hover:bg-accent/20'
                            }`}
                        >
                            {isFillMode ? (
                                <>
                                    <MousePointer size={18} />
                                    {t('fillTool.disable')}
                                </>
                            ) : (
                                <>
                                    <PaintBucket size={18} />
                                    {t('fillTool.enable')}
                                </>
                            )}
                        </button>

                        {/* 使用提示 */}
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Eye size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-blue-300">
                                    <p className="font-medium mb-1">{language === 'zh' ? '使用说明：' : 'Instructions:'}</p>
                                    <p>{language === 'zh' ? '1. 点击"启用填充工具"按钮' : '1. Click "Enable Fill" button'}</p>
                                    <p>{language === 'zh' ? '2. 在画布上点击需要填充的区域' : '2. Click on the canvas area to fill'}</p>
                                    <p>{language === 'zh' ? '3. 线条围起来的区域会被填充颜色' : '3. Enclosed areas will be filled'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">{t('fillTool.color')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={fillColor}
                                        onChange={(e) => setFillColor(e.target.value)}
                                        className="w-12 h-10 rounded cursor-pointer border border-border"
                                    />
                                    <input
                                        type="text"
                                        value={fillColor}
                                        onChange={(e) => setFillColor(e.target.value)}
                                        className="flex-1 bg-panel-light border border-border rounded px-3 text-white text-sm"
                                    />
                                </div>
                            </div>

                            {/* 快捷颜色 */}
                            <div className="flex gap-1 flex-wrap">
                                {['#e31937', '#ff6b00', '#ffd700', '#00ff00', '#00bfff', '#8b5cf6', '#ffffff', '#000000'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setFillColor(color)}
                                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                                            fillColor === color ? 'border-white' : 'border-transparent'
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-gray-500">{t('fillTool.tolerance')}</span>
                                    <span className="text-gray-400 font-mono">{fillTolerance}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={fillTolerance}
                                    onChange={(e) => setFillTolerance(Number(e.target.value))}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {language === 'zh' ? '容差越大，填充范围越大' : 'Higher tolerance = larger fill area'}
                                </p>
                            </div>

                            {/* 颜色预览 */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">{language === 'zh' ? '颜色预览' : 'Color Preview'}</label>
                                <div 
                                    className="w-full h-16 rounded-lg border border-border"
                                    style={{ backgroundColor: fillColor }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 颜色调整面板 */}
                {activePanel === 'colors' && (
                    <div className="p-5 border-b border-border panel-section">
                        <div className="flex items-center justify-between text-gray-400 mb-3">
                            <div className="flex items-center gap-2">
                                <Sliders size={16} />
                                <span className="text-sm font-medium uppercase tracking-wide">{t('colorsPanel.title')}</span>
                            </div>
                            <button
                                onClick={handleResetColors}
                                className="text-xs text-gray-500 hover:text-accent transition-colors"
                            >
                                {t('colorsPanel.reset')}
                            </button>
                        </div>

                        {selectedObject && selectedObject.type === 'image' ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            <SunMedium size={14} /> {t('colorsPanel.hue')}
                                        </span>
                                        <span className="text-white font-mono">{colorHue}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-180"
                                        max="180"
                                        value={colorHue}
                                        onChange={(e) => setColorHue(Number(e.target.value))}
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            <Droplets size={14} /> {t('colorsPanel.saturation')}
                                        </span>
                                        <span className="text-white font-mono">{colorSaturation}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        value={colorSaturation}
                                        onChange={(e) => setColorSaturation(Number(e.target.value))}
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            <SunMedium size={14} /> {t('colorsPanel.brightness')}
                                        </span>
                                        <span className="text-white font-mono">{colorBrightness}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        value={colorBrightness}
                                        onChange={(e) => setColorBrightness(Number(e.target.value))}
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            <Contrast size={14} /> {t('colorsPanel.contrast')}
                                        </span>
                                        <span className="text-white font-mono">{colorContrast}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        value={colorContrast}
                                        onChange={(e) => setColorContrast(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                {t('colorsPanel.noSelection')}
                            </div>
                        )}
                    </div>
                )}

                {/* 设计模板面板 */}
                {activePanel === 'templates' && (
                    <div className="p-5 border-b border-border panel-section">
                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                            <Layout size={16} />
                            <span className="text-sm font-medium uppercase tracking-wide">{t('templatesPanel.title')}</span>
                        </div>

                        {/* 当前车型提示 */}
                        <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Car size={16} className="text-accent" />
                                <span className="text-white text-sm font-medium">{t(`carModels.${selectedModel}`)}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {t('templatesPanel.clickToApply')}
                            </p>
                        </div>

                        {/* 模板列表 */}
                        {carTemplates.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                                {carTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleApplyTemplate(template)}
                                        className="group flex flex-col rounded-lg overflow-hidden 
                                                   border border-border hover:border-accent transition-colors
                                                   bg-panel-light"
                                    >
                                        <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                                            {template.image ? (
                                                <img 
                                                    src={template.image} 
                                                    alt={template.name}
                                                    className="absolute inset-0 w-full h-full object-contain bg-black/50"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Layout size={24} className="text-gray-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 text-center border-t border-border">
                                            <span className="text-white text-xs font-medium line-clamp-1">
                                                {template.name}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FolderOpen size={32} className="mx-auto text-gray-600 mb-2" />
                                <p className="text-gray-500 text-sm">{t('templatesPanel.noTemplates')}</p>
                                <p className="text-gray-600 text-xs mt-1 px-2">
                                    {language === 'zh' ? '请在 public/templates/ 对应目录下添加模板图片' : 'Add template images to public/templates/ directory'}
                                </p>
                            </div>
                        )}

                        {/* 模板说明 */}
                        <div className="mt-4 p-3 bg-panel-light rounded-lg">
                            <p className="text-xs text-gray-500">
                                💡 {language === 'zh' ? '切换车型后会自动加载对应的预设模板图片' : 'Templates will load automatically when you switch models'}
                            </p>
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
                        {t('toolbar.export')}
                    </button>
                    <p className="text-center text-gray-600 text-xs mt-2">
                        {language === 'zh' ? '原始分辨率 · PNG 格式' : 'Original Resolution · PNG Format'}
                    </p>
                </div>
            </div>
        </div>
    )
}
