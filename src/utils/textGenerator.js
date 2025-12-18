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
 * @param {number} options.rotation - 每个元素的旋转角度
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
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    // 测量文字宽度
    const textWidth = ctx.measureText(text).width
    const textHeight = fontSize

    // 每个元素的旋转弧度
    const rotationRad = rotation * Math.PI / 180

    // 绘制文字网格（单独旋转每个元素）
    let count = 0
    for (let y = 0; y < height + spacingY; y += spacingY) {
      // 奇数行偏移（交错排列）
      const rowIndex = Math.floor(y / spacingY)
      const offsetX = rowIndex % 2 === 0 ? 0 : spacingX / 2

      for (let x = offsetX; x < width + spacingX; x += spacingX) {
        // 文字中心点坐标
        const centerX = x
        const centerY = y

        // 检查中心点是否在遮罩范围内
        const checkX = Math.round(centerX)
        const checkY = Math.round(centerY)

        if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
          const maskIdx = checkY * width + checkX
          if (maskData[maskIdx] === 255) {
            // 保存状态
            ctx.save()
            // 移动到文字中心点
            ctx.translate(centerX, centerY)
            // 旋转单个元素
            ctx.rotate(rotationRad)
            // 在原点绘制文字（因为已经translate到中心）
            ctx.fillText(text, 0, 0)
            // 恢复状态
            ctx.restore()
            count++
          }
        }
      }
    }

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
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    const rotationRad = rotation * Math.PI / 180

    // 绘制文字网格（单独旋转每个元素）
    for (let y = 0; y < height + spacingY; y += spacingY) {
      const rowIndex = Math.floor(y / spacingY)
      const offsetX = rowIndex % 2 === 0 ? 0 : spacingX / 2

      for (let x = offsetX; x < width + spacingX; x += spacingX) {
        const centerX = x
        const centerY = y

        const checkX = Math.round(centerX)
        const checkY = Math.round(centerY)

        if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
          const maskIdx = checkY * width + checkX
          if (maskData[maskIdx] === 255) {
            ctx.save()
            ctx.translate(centerX, centerY)
            ctx.rotate(rotationRad)
            ctx.fillText(text, 0, 0)
            ctx.restore()
          }
        }
      }
    }

    resolve(canvas.toDataURL('image/png'))
  })
}

