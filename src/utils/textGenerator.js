/**
 * 文字填充生成器
 * 在车身内部区域生成重复的文字图案
 */

/**
 * 生成文字填充图案
 * @param {Object} options - 配置选项
 * @param {string} options.text - 文字内容
 * @param {number} options.fontSize - 字体大小
 * @param {number} options.spacingX - 横向间距
 * @param {number} options.spacingY - 纵向间距
 * @param {number} options.rotation - 旋转角度
 * @param {Uint8Array} options.maskData - 内部区域遮罩数据
 * @param {number} options.width - 画布宽度
 * @param {number} options.height - 画布高度
 * @returns {Promise<string>} - 图案的 DataURL
 */
export async function generateTextPattern(options) {
  const { 
    text, 
    fontSize = 40, 
    spacingX = 100, 
    spacingY = 80, 
    rotation = -15,
    maskData,
    width,
    height
  } = options

  return new Promise((resolve) => {
    // 创建画布
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    // 清空画布（透明背景）
    ctx.clearRect(0, 0, width, height)

    // 设置文字样式
    ctx.font = `600 ${fontSize}px "Inter", "PingFang SC", "Microsoft YaHei", sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.textBaseline = 'top'

    // 测量文字宽度
    const textWidth = ctx.measureText(text).width
    const textHeight = fontSize * 1.2

    // 计算需要多少行列才能覆盖整个画布（考虑旋转后的扩展）
    const diagonal = Math.sqrt(width * width + height * height)
    const rotationRad = rotation * Math.PI / 180

    // 计算旋转后的覆盖范围
    const expandFactor = 1.5 // 扩展系数，确保旋转后仍能覆盖
    const startX = -diagonal * expandFactor / 2
    const startY = -diagonal * expandFactor / 2
    const endX = width + diagonal * expandFactor / 2
    const endY = height + diagonal * expandFactor / 2

    // 保存状态并移动到中心点进行旋转
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.rotate(rotationRad)
    ctx.translate(-width / 2, -height / 2)

    // 绘制文字网格
    let count = 0
    for (let y = startY; y < endY; y += spacingY) {
      // 奇数行偏移（交错排列）
      const rowIndex = Math.floor((y - startY) / spacingY)
      const offsetX = rowIndex % 2 === 0 ? 0 : spacingX / 2

      for (let x = startX + offsetX; x < endX; x += spacingX) {
        // 检查该位置是否在车身内部（需要考虑旋转）
        const screenX = Math.round(x)
        const screenY = Math.round(y)
        
        // 简化判断：检查文字中心点是否在遮罩内
        const centerX = Math.round(x + textWidth / 2)
        const centerY = Math.round(y + textHeight / 2)
        
        // 反向变换到原始坐标系
        const cosR = Math.cos(-rotationRad)
        const sinR = Math.sin(-rotationRad)
        const dx = centerX - width / 2
        const dy = centerY - height / 2
        const origX = Math.round(dx * cosR - dy * sinR + width / 2)
        const origY = Math.round(dx * sinR + dy * cosR + height / 2)

        // 检查是否在遮罩范围内
        if (origX >= 0 && origX < width && origY >= 0 && origY < height) {
          const maskIdx = origY * width + origX
          if (maskData[maskIdx] === 255) {
            ctx.fillText(text, x, y)
            count++
          }
        }
      }
    }

    ctx.restore()

    console.log(`生成了 ${count} 个文字实例`)

    resolve(canvas.toDataURL('image/png'))
  })
}

/**
 * 生成渐变文字填充
 * @param {Object} options - 配置选项
 * @returns {Promise<string>} - 图案的 DataURL
 */
export async function generateGradientTextPattern(options) {
  const { 
    text, 
    fontSize = 40, 
    spacingX = 100, 
    spacingY = 80, 
    rotation = -15,
    maskData,
    width,
    height,
    gradientColors = ['#ffffff', '#888888']
  } = options

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, width, height)

    // 创建渐变
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradientColors.forEach((color, index) => {
      gradient.addColorStop(index / (gradientColors.length - 1), color)
    })

    ctx.font = `600 ${fontSize}px "Inter", "PingFang SC", sans-serif`
    ctx.fillStyle = gradient
    ctx.textBaseline = 'top'

    const rotationRad = rotation * Math.PI / 180

    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.rotate(rotationRad)
    ctx.translate(-width / 2, -height / 2)

    const diagonal = Math.sqrt(width * width + height * height)
    const startX = -diagonal
    const startY = -diagonal
    const endX = width + diagonal
    const endY = height + diagonal

    for (let y = startY; y < endY; y += spacingY) {
      const rowIndex = Math.floor((y - startY) / spacingY)
      const offsetX = rowIndex % 2 === 0 ? 0 : spacingX / 2

      for (let x = startX + offsetX; x < endX; x += spacingX) {
        const centerX = Math.round(x + fontSize / 2)
        const centerY = Math.round(y + fontSize / 2)
        
        const cosR = Math.cos(-rotationRad)
        const sinR = Math.sin(-rotationRad)
        const dx = centerX - width / 2
        const dy = centerY - height / 2
        const origX = Math.round(dx * cosR - dy * sinR + width / 2)
        const origY = Math.round(dx * sinR + dy * cosR + height / 2)

        if (origX >= 0 && origX < width && origY >= 0 && origY < height) {
          const maskIdx = origY * width + origX
          if (maskData[maskIdx] === 255) {
            ctx.fillText(text, x, y)
          }
        }
      }
    }

    ctx.restore()
    resolve(canvas.toDataURL('image/png'))
  })
}

