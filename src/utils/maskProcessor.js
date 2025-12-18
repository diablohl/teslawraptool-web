/**
 * 遮罩处理器 - 智能识别车身区域
 * 
 * 算法流程：
 * 1. 加载原始图像
 * 2. 提取亮度信息，识别线条和白色区域
 * 3. 使用泛洪填充（Flood Fill）从角落开始，标记车身外部区域
 * 4. 生成三层遮罩：
 *    - 线条区域 -> 浅白色（显示车身轮廓）
 *    - 外部区域 -> 背景色（遮盖车身外部）
 *    - 内部区域 -> 透明（显示贴图）
 */

/**
 * 处理车型模板，生成遮罩图像
 * @param {string} imagePath - 图像路径
 * @param {string} bgColor - 背景颜色（十六进制）
 * @returns {Promise<{maskedImage: string, maskData: Uint8Array, width: number, height: number}>}
 */
export async function processTemplateMask(imagePath, bgColor = '#1a1a1a') {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const { width, height } = img
        
        // 创建工作画布
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        
        // 绘制原始图像
        ctx.drawImage(img, 0, 0)
        
        // 获取像素数据
        const imageData = ctx.getImageData(0, 0, width, height)
        const pixels = imageData.data
        
        // 提取亮度信息
        const brightness = new Float32Array(width * height)
        for (let i = 0; i < width * height; i++) {
          const r = pixels[i * 4]
          const g = pixels[i * 4 + 1]
          const b = pixels[i * 4 + 2]
          brightness[i] = (r + g + b) / 3
        }
        
        // 二值化（区分线条和白色区域）
        const threshold = 200
        const binary = new Uint8Array(width * height)
        for (let i = 0; i < width * height; i++) {
          binary[i] = brightness[i] > threshold ? 255 : 0
        }
        
        // 泛洪填充 - 从四个角落标记外部区域
        const mask = new Uint8Array(binary)
        const OUTSIDE = 127
        
        // 从四个角落开始填充
        floodFill(mask, width, height, 0, 0, OUTSIDE)
        floodFill(mask, width, height, width - 1, 0, OUTSIDE)
        floodFill(mask, width, height, 0, height - 1, OUTSIDE)
        floodFill(mask, width, height, width - 1, height - 1, OUTSIDE)
        
        // 解析背景色
        const bgRgb = hexToRgb(bgColor)
        
        // 创建输出图像
        const outputData = ctx.createImageData(width, height)
        const output = outputData.data
        
        // 创建内部区域遮罩数据（用于文字填充）
        const innerMask = new Uint8Array(width * height)
        
        for (let i = 0; i < width * height; i++) {
          const idx = i * 4
          
          if (mask[i] === OUTSIDE) {
            // 外部区域 - 背景色
            output[idx] = bgRgb.r
            output[idx + 1] = bgRgb.g
            output[idx + 2] = bgRgb.b
            output[idx + 3] = 255
            innerMask[i] = 0
          } else if (binary[i] === 0) {
            // 线条区域 - 根据原始亮度生成平滑的白线
            const intensity = Math.min(255, Math.max(180, 255 - brightness[i]))
            output[idx] = intensity
            output[idx + 1] = intensity
            output[idx + 2] = intensity
            output[idx + 3] = 255
            innerMask[i] = 0
          } else {
            // 内部区域 - 透明
            output[idx] = 0
            output[idx + 1] = 0
            output[idx + 2] = 0
            output[idx + 3] = 0
            innerMask[i] = 255
          }
        }
        
        // 应用轻微抗锯齿（边缘平滑）
        applyEdgeSmoothing(output, width, height)
        
        ctx.putImageData(outputData, 0, 0)
        
        resolve({
          maskedImage: canvas.toDataURL('image/png'),
          maskData: innerMask,
          width,
          height
        })
        
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error(`无法加载图像: ${imagePath}`))
    img.src = imagePath
  })
}

/**
 * 泛洪填充算法（扫描线优化版）
 * @param {Uint8Array} data - 图像数据
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 * @param {number} startX - 起始X坐标
 * @param {number} startY - 起始Y坐标
 * @param {number} fillValue - 填充值
 */
function floodFill(data, width, height, startX, startY, fillValue) {
  const startIdx = startY * width + startX
  const targetValue = data[startIdx]
  
  if (targetValue === fillValue) return
  if (targetValue !== 255) return // 只填充白色区域
  
  const stack = [[startX, startY]]
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()
    
    if (x < 0 || x >= width || y < 0 || y >= height) continue
    
    const idx = y * width + x
    if (data[idx] !== targetValue) continue
    
    // 向左扩展
    let leftX = x
    while (leftX >= 0 && data[y * width + leftX] === targetValue) {
      leftX--
    }
    leftX++
    
    // 向右扩展
    let rightX = x
    while (rightX < width && data[y * width + rightX] === targetValue) {
      rightX++
    }
    rightX--
    
    // 填充整行
    for (let px = leftX; px <= rightX; px++) {
      data[y * width + px] = fillValue
    }
    
    // 检查上下行
    for (let px = leftX; px <= rightX; px++) {
      if (y > 0 && data[(y - 1) * width + px] === targetValue) {
        stack.push([px, y - 1])
      }
      if (y < height - 1 && data[(y + 1) * width + px] === targetValue) {
        stack.push([px, y + 1])
      }
    }
  }
}

/**
 * 应用边缘平滑（抗锯齿）
 * @param {Uint8ClampedArray} data - RGBA像素数据
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 */
function applyEdgeSmoothing(data, width, height) {
  // 创建副本用于读取
  const original = new Uint8ClampedArray(data)
  
  // 3x3 高斯核
  const kernel = [
    1, 2, 1,
    2, 4, 2,
    1, 2, 1
  ]
  const kernelSum = 16
  
  // 只处理边缘像素（Alpha值变化的位置）
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      
      // 检查是否是边缘（周围有不同alpha的像素）
      const centerAlpha = original[idx + 3]
      let isEdge = false
      
      for (let dy = -1; dy <= 1 && !isEdge; dy++) {
        for (let dx = -1; dx <= 1 && !isEdge; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4
          if (Math.abs(original[nIdx + 3] - centerAlpha) > 50) {
            isEdge = true
          }
        }
      }
      
      if (isEdge) {
        // 应用高斯模糊
        let r = 0, g = 0, b = 0, a = 0
        let ki = 0
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4
            const weight = kernel[ki++]
            r += original[nIdx] * weight
            g += original[nIdx + 1] * weight
            b += original[nIdx + 2] * weight
            a += original[nIdx + 3] * weight
          }
        }
        
        data[idx] = r / kernelSum
        data[idx + 1] = g / kernelSum
        data[idx + 2] = b / kernelSum
        data[idx + 3] = a / kernelSum
      }
    }
  }
}

/**
 * 十六进制颜色转RGB
 * @param {string} hex - 十六进制颜色
 * @returns {{r: number, g: number, b: number}}
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 26, g: 26, b: 26 }
}

