/**
 * 颜色调整工具
 * 提供色相、饱和度、亮度调整功能
 */

/**
 * RGB 转 HSL
 */
function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return [h * 360, s * 100, l * 100]
}

/**
 * HSL 转 RGB
 */
function hslToRgb(h, s, l) {
  h /= 360
  s /= 100
  l /= 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/**
 * 调整图片颜色
 * @param {HTMLImageElement|HTMLCanvasElement} source - 源图像
 * @param {object} adjustments - 调整参数
 * @param {number} adjustments.hue - 色相偏移 (-180 到 180)
 * @param {number} adjustments.saturation - 饱和度 (-100 到 100)
 * @param {number} adjustments.brightness - 亮度 (-100 到 100)
 * @param {number} adjustments.contrast - 对比度 (-100 到 100)
 * @returns {string} 调整后的图片 DataURL
 */
export function adjustImageColors(source, adjustments = {}) {
  const {
    hue = 0,
    saturation = 0,
    brightness = 0,
    contrast = 0,
  } = adjustments

  // 创建画布
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  canvas.width = source.width || source.naturalWidth
  canvas.height = source.height || source.naturalHeight
  
  // 绘制源图像
  ctx.drawImage(source, 0, 0)
  
  // 获取像素数据
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  // 预计算对比度因子
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

  // 处理每个像素
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i]
    let g = pixels[i + 1]
    let b = pixels[i + 2]
    const a = pixels[i + 3]

    // 跳过透明像素
    if (a === 0) continue

    // 转换为 HSL
    let [h, s, l] = rgbToHsl(r, g, b)

    // 应用色相偏移
    h = (h + hue + 360) % 360

    // 应用饱和度调整
    s = Math.max(0, Math.min(100, s + saturation))

    // 应用亮度调整
    l = Math.max(0, Math.min(100, l + brightness / 2))

    // 转回 RGB
    ;[r, g, b] = hslToRgb(h, s, l)

    // 应用对比度
    if (contrast !== 0) {
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128))
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128))
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128))
    }

    pixels[i] = r
    pixels[i + 1] = g
    pixels[i + 2] = b
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * 创建颜色调整滤镜（用于 Fabric.js）
 * 这个函数返回一个可以应用到 Fabric.js 对象的滤镜配置
 */
export function createColorFilters(adjustments = {}) {
  const {
    hue = 0,
    saturation = 0,
    brightness = 0,
    contrast = 0,
  } = adjustments

  const filters = []

  // 色相/饱和度滤镜
  if (hue !== 0 || saturation !== 0) {
    filters.push(new fabric.Image.filters.HueRotation({
      rotation: hue / 360,
    }))
    
    if (saturation !== 0) {
      filters.push(new fabric.Image.filters.Saturation({
        saturation: saturation / 100,
      }))
    }
  }

  // 亮度滤镜
  if (brightness !== 0) {
    filters.push(new fabric.Image.filters.Brightness({
      brightness: brightness / 100,
    }))
  }

  // 对比度滤镜
  if (contrast !== 0) {
    filters.push(new fabric.Image.filters.Contrast({
      contrast: contrast / 100,
    }))
  }

  return filters
}

/**
 * 应用颜色调整到 Fabric.js 图像对象
 * @param {fabric.Image} imageObject - Fabric.js 图像对象
 * @param {object} adjustments - 调整参数
 */
export function applyColorAdjustments(imageObject, adjustments = {}) {
  if (!imageObject || imageObject.type !== 'image') {
    console.warn('Object is not an image')
    return
  }

  const {
    hue = 0,
    saturation = 0,
    brightness = 0,
    contrast = 0,
  } = adjustments

  // 清除现有滤镜
  imageObject.filters = []

  // 添加色相旋转滤镜
  if (hue !== 0) {
    imageObject.filters.push(new fabric.Image.filters.HueRotation({
      rotation: hue / 360,
    }))
  }

  // 添加饱和度滤镜
  if (saturation !== 0) {
    imageObject.filters.push(new fabric.Image.filters.Saturation({
      saturation: saturation / 100,
    }))
  }

  // 添加亮度滤镜
  if (brightness !== 0) {
    imageObject.filters.push(new fabric.Image.filters.Brightness({
      brightness: brightness / 100,
    }))
  }

  // 添加对比度滤镜
  if (contrast !== 0) {
    imageObject.filters.push(new fabric.Image.filters.Contrast({
      contrast: contrast / 100,
    }))
  }

  // 应用滤镜
  imageObject.applyFilters()
}

/**
 * 颜色叠加
 * @param {fabric.Image} imageObject - Fabric.js 图像对象
 * @param {string} color - 叠加颜色 (hex)
 * @param {number} opacity - 叠加透明度 (0-1)
 */
export function applyColorOverlay(imageObject, color, opacity = 0.5) {
  if (!imageObject || imageObject.type !== 'image') {
    return
  }

  // 添加颜色叠加滤镜
  const overlayFilter = new fabric.Image.filters.BlendColor({
    color: color,
    mode: 'tint',
    alpha: opacity,
  })

  imageObject.filters.push(overlayFilter)
  imageObject.applyFilters()
}

/**
 * 重置颜色调整
 * @param {fabric.Image} imageObject - Fabric.js 图像对象
 */
export function resetColorAdjustments(imageObject) {
  if (!imageObject || imageObject.type !== 'image') {
    return
  }

  imageObject.filters = []
  imageObject.applyFilters()
}

