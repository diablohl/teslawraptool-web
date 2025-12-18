/**
 * 预设图案生成器
 * 程序化生成各种拉花图案，无版权问题
 */

/**
 * 创建画布并返回 context
 */
function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  return { canvas, ctx }
}

/**
 * 赛车条纹 - 经典双条纹
 */
export function generateRacingStripes(options = {}) {
  const {
    width = 800,
    height = 600,
    stripeColor = '#e31937',
    stripeWidth = 40,
    gap = 20,
    offset = 0,
  } = options

  const { canvas, ctx } = createCanvas(width, height)
  
  ctx.fillStyle = stripeColor
  
  // 中心双条纹
  const centerX = width / 2 + offset
  const stripe1X = centerX - gap / 2 - stripeWidth
  const stripe2X = centerX + gap / 2
  
  ctx.fillRect(stripe1X, 0, stripeWidth, height)
  ctx.fillRect(stripe2X, 0, stripeWidth, height)
  
  return canvas.toDataURL('image/png')
}

/**
 * 渐变条纹 - 多色渐变
 */
export function generateGradientStripes(options = {}) {
  const {
    width = 800,
    height = 600,
    colors = ['#e31937', '#ff6b6b', '#feca57'],
    angle = 0,
  } = options

  const { canvas, ctx } = createCanvas(width, height)
  
  // 计算渐变方向
  const radians = (angle * Math.PI) / 180
  const gradientLength = Math.sqrt(width * width + height * height)
  const centerX = width / 2
  const centerY = height / 2
  
  const x1 = centerX - Math.cos(radians) * gradientLength / 2
  const y1 = centerY - Math.sin(radians) * gradientLength / 2
  const x2 = centerX + Math.cos(radians) * gradientLength / 2
  const y2 = centerY + Math.sin(radians) * gradientLength / 2
  
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
  
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color)
  })
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  return canvas.toDataURL('image/png')
}

/**
 * 几何三角形图案
 */
export function generateTrianglePattern(options = {}) {
  const {
    width = 800,
    height = 600,
    colors = ['#2d3436', '#636e72', '#b2bec3'],
    triangleSize = 60,
  } = options

  const { canvas, ctx } = createCanvas(width, height)
  
  const rows = Math.ceil(height / (triangleSize * 0.866)) + 1
  const cols = Math.ceil(width / triangleSize) + 1
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * triangleSize + (row % 2 ? triangleSize / 2 : 0)
      const y = row * triangleSize * 0.866
      
      // 上三角
      ctx.beginPath()
      ctx.moveTo(x, y + triangleSize * 0.866)
      ctx.lineTo(x + triangleSize / 2, y)
      ctx.lineTo(x + triangleSize, y + triangleSize * 0.866)
      ctx.closePath()
      ctx.fillStyle = colors[(row + col) % colors.length]
      ctx.fill()
      
      // 下三角
      ctx.beginPath()
      ctx.moveTo(x + triangleSize / 2, y)
      ctx.lineTo(x + triangleSize, y + triangleSize * 0.866)
      ctx.lineTo(x + triangleSize * 1.5, y)
      ctx.closePath()
      ctx.fillStyle = colors[(row + col + 1) % colors.length]
      ctx.fill()
    }
  }
  
  return canvas.toDataURL('image/png')
}

/**
 * 六边形蜂窝图案
 */
export function generateHexagonPattern(options = {}) {
  const {
    width = 800,
    height = 600,
    hexSize = 30,
    fillColor = '#1a1a1a',
    strokeColor = '#e31937',
    strokeWidth = 2,
  } = options

  const { canvas, ctx } = createCanvas(width, height)
  
  ctx.fillStyle = fillColor
  ctx.fillRect(0, 0, width, height)
  
  const hexHeight = hexSize * 2
  const hexWidth = Math.sqrt(3) * hexSize
  const vertDist = hexHeight * 0.75
  
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = strokeWidth
  
  function drawHexagon(cx, cy, size) {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const x = cx + size * Math.cos(angle)
      const y = cy + size * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }
  
  const rows = Math.ceil(height / vertDist) + 1
  const cols = Math.ceil(width / hexWidth) + 1
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * hexWidth + (row % 2 ? hexWidth / 2 : 0)
      const y = row * vertDist
      drawHexagon(x, y, hexSize)
    }
  }
  
  return canvas.toDataURL('image/png')
}

/**
 * 碳纤维纹理
 */
export function generateCarbonFiber(options = {}) {
  const {
    width = 800,
    height = 600,
    cellSize = 10,
    color1 = '#1a1a1a',
    color2 = '#2d2d2d',
    highlightColor = '#3a3a3a',
  } = options

  const { canvas, ctx } = createCanvas(width, height)
  
  // 基础色
  ctx.fillStyle = color1
  ctx.fillRect(0, 0, width, height)
  
  // 编织图案
  const cols = Math.ceil(width / cellSize)
  const rows = Math.ceil(height / cellSize)
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellSize
      const y = row * cellSize
      
      // 交替颜色创建编织效果
      const isOdd = (row + col) % 2 === 0
      
      ctx.fillStyle = isOdd ? color2 : color1
      ctx.fillRect(x, y, cellSize, cellSize)
      
      // 高光效果
      if (isOdd) {
        ctx.fillStyle = highlightColor
        ctx.fillRect(x, y, cellSize * 0.3, cellSize * 0.3)
      }
    }
  }
  
  return canvas.toDataURL('image/png')
}

/**
 * 波浪纹图案
 */
export function generateWavePattern(options = {}) {
  const {
    width = 800,
    height = 600,
    waveColor = '#e31937',
    bgColor = 'transparent',
    waveHeight = 30,
    waveLength = 100,
    waveCount = 5,
    lineWidth = 4,
  } = options

  const { canvas, ctx } = createCanvas(width, height)
  
  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)
  }
  
  ctx.strokeStyle = waveColor
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  
  const spacing = height / (waveCount + 1)
  
  for (let i = 1; i <= waveCount; i++) {
    const baseY = spacing * i
    
    ctx.beginPath()
    ctx.moveTo(0, baseY)
    
    for (let x = 0; x <= width; x += 5) {
      const y = baseY + Math.sin((x / waveLength) * Math.PI * 2) * waveHeight
      ctx.lineTo(x, y)
    }
    
    ctx.stroke()
  }
  
  return canvas.toDataURL('image/png')
}

/**
 * 斜条纹图案
 */
export function generateDiagonalStripes(options = {}) {
  const {
    width = 800,
    height = 600,
    stripeColor = '#e31937',
    bgColor = '#1a1a1a',
    stripeWidth = 20,
    gap = 40,
    angle = 45,
  } = options

  const { canvas, ctx } = createCanvas(width, height)
  
  // 背景
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)
  
  // 旋转画布
  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.rotate((angle * Math.PI) / 180)
  
  // 计算需要覆盖的范围
  const diagonal = Math.sqrt(width * width + height * height)
  const stripeSpacing = stripeWidth + gap
  const stripeCount = Math.ceil(diagonal / stripeSpacing) * 2
  
  ctx.fillStyle = stripeColor
  
  for (let i = -stripeCount / 2; i < stripeCount / 2; i++) {
    const x = i * stripeSpacing
    ctx.fillRect(x, -diagonal, stripeWidth, diagonal * 2)
  }
  
  ctx.restore()
  
  return canvas.toDataURL('image/png')
}

/**
 * 迷彩图案
 */
export function generateCamouflage(options = {}) {
  const {
    width = 800,
    height = 600,
    colors = ['#4a5d23', '#6b7c3f', '#8b9a5b', '#2d3a1a'],
    blobCount = 50,
  } = options

  const { canvas, ctx } = createCanvas(width, height)
  
  // 基础色
  ctx.fillStyle = colors[0]
  ctx.fillRect(0, 0, width, height)
  
  // 随机斑块
  for (let i = 0; i < blobCount; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const size = 30 + Math.random() * 100
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    ctx.fillStyle = color
    ctx.beginPath()
    
    // 不规则形状
    const points = 6 + Math.floor(Math.random() * 4)
    for (let j = 0; j < points; j++) {
      const angle = (j / points) * Math.PI * 2
      const radius = size * (0.5 + Math.random() * 0.5)
      const px = x + Math.cos(angle) * radius
      const py = y + Math.sin(angle) * radius
      
      if (j === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    
    ctx.closePath()
    ctx.fill()
  }
  
  return canvas.toDataURL('image/png')
}

/**
 * 点阵渐变图案
 */
export function generateDotGradient(options = {}) {
  const {
    width = 800,
    height = 600,
    dotColor = '#e31937',
    bgColor = '#1a1a1a',
    maxDotSize = 15,
    minDotSize = 2,
    spacing = 20,
    direction = 'horizontal', // horizontal, vertical, radial
  } = options

  const { canvas, ctx } = createCanvas(width, height)
  
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)
  
  ctx.fillStyle = dotColor
  
  const cols = Math.ceil(width / spacing)
  const rows = Math.ceil(height / spacing)
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * spacing + spacing / 2
      const y = row * spacing + spacing / 2
      
      let progress
      if (direction === 'horizontal') {
        progress = col / cols
      } else if (direction === 'vertical') {
        progress = row / rows
      } else {
        // radial
        const cx = width / 2
        const cy = height / 2
        const maxDist = Math.sqrt(cx * cx + cy * cy)
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        progress = 1 - dist / maxDist
      }
      
      const dotSize = minDotSize + (maxDotSize - minDotSize) * progress
      
      ctx.beginPath()
      ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  return canvas.toDataURL('image/png')
}

/**
 * 闪电/锯齿图案
 */
export function generateLightningPattern(options = {}) {
  const {
    width = 800,
    height = 600,
    color = '#e31937',
    bgColor = '#1a1a1a',
    zigzagWidth = 100,
    zigzagHeight = 40,
  } = options

  const { canvas, ctx } = createCanvas(width, height)
  
  // 背景
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)
  
  // 锯齿条纹
  ctx.fillStyle = color
  
  const centerY = height / 2
  const stripeHeight = zigzagHeight * 3
  
  ctx.beginPath()
  ctx.moveTo(0, centerY - stripeHeight / 2)
  
  // 上边缘锯齿
  for (let x = 0; x <= width; x += zigzagWidth) {
    ctx.lineTo(x + zigzagWidth / 2, centerY - stripeHeight / 2 - zigzagHeight)
    ctx.lineTo(x + zigzagWidth, centerY - stripeHeight / 2)
  }
  
  ctx.lineTo(width, centerY + stripeHeight / 2)
  
  // 下边缘锯齿
  for (let x = width; x >= 0; x -= zigzagWidth) {
    ctx.lineTo(x - zigzagWidth / 2, centerY + stripeHeight / 2 + zigzagHeight)
    ctx.lineTo(x - zigzagWidth, centerY + stripeHeight / 2)
  }
  
  ctx.closePath()
  ctx.fill()
  
  return canvas.toDataURL('image/png')
}

/**
 * 所有预设图案
 */
export const PRESET_PATTERNS = [
  {
    id: 'racing-stripes-red',
    name: '赛车条纹 - 红色',
    category: 'stripes',
    generate: () => generateRacingStripes({ stripeColor: '#e31937' }),
    thumbnail: null,
  },
  {
    id: 'racing-stripes-black',
    name: '赛车条纹 - 黑色',
    category: 'stripes',
    generate: () => generateRacingStripes({ stripeColor: '#1a1a1a', stripeWidth: 50, gap: 30 }),
    thumbnail: null,
  },
  {
    id: 'racing-stripes-gold',
    name: '赛车条纹 - 金色',
    category: 'stripes',
    generate: () => generateRacingStripes({ stripeColor: '#f4d03f', stripeWidth: 35, gap: 15 }),
    thumbnail: null,
  },
  {
    id: 'diagonal-red',
    name: '斜条纹 - 红黑',
    category: 'stripes',
    generate: () => generateDiagonalStripes({ stripeColor: '#e31937', bgColor: '#1a1a1a' }),
    thumbnail: null,
  },
  {
    id: 'diagonal-white',
    name: '斜条纹 - 白灰',
    category: 'stripes',
    generate: () => generateDiagonalStripes({ stripeColor: '#ffffff', bgColor: '#4a4a4a', stripeWidth: 15, gap: 30 }),
    thumbnail: null,
  },
  {
    id: 'gradient-sunset',
    name: '渐变 - 日落',
    category: 'gradient',
    generate: () => generateGradientStripes({ colors: ['#e31937', '#ff6b6b', '#feca57', '#ff9f43'] }),
    thumbnail: null,
  },
  {
    id: 'gradient-ocean',
    name: '渐变 - 海洋',
    category: 'gradient',
    generate: () => generateGradientStripes({ colors: ['#0984e3', '#74b9ff', '#81ecec', '#00cec9'] }),
    thumbnail: null,
  },
  {
    id: 'gradient-purple',
    name: '渐变 - 紫霞',
    category: 'gradient',
    generate: () => generateGradientStripes({ colors: ['#6c5ce7', '#a29bfe', '#fd79a8', '#e84393'] }),
    thumbnail: null,
  },
  {
    id: 'gradient-dark',
    name: '渐变 - 暗夜',
    category: 'gradient',
    generate: () => generateGradientStripes({ colors: ['#2d3436', '#636e72', '#b2bec3'] }),
    thumbnail: null,
  },
  {
    id: 'carbon-fiber',
    name: '碳纤维纹理',
    category: 'texture',
    generate: () => generateCarbonFiber(),
    thumbnail: null,
  },
  {
    id: 'carbon-fiber-red',
    name: '碳纤维 - 红色',
    category: 'texture',
    generate: () => generateCarbonFiber({ color1: '#1a0a0a', color2: '#3a1515', highlightColor: '#5a2020' }),
    thumbnail: null,
  },
  {
    id: 'hexagon-red',
    name: '蜂窝 - 红线',
    category: 'geometric',
    generate: () => generateHexagonPattern({ strokeColor: '#e31937' }),
    thumbnail: null,
  },
  {
    id: 'hexagon-blue',
    name: '蜂窝 - 蓝线',
    category: 'geometric',
    generate: () => generateHexagonPattern({ strokeColor: '#0984e3' }),
    thumbnail: null,
  },
  {
    id: 'hexagon-gold',
    name: '蜂窝 - 金线',
    category: 'geometric',
    generate: () => generateHexagonPattern({ strokeColor: '#f4d03f', hexSize: 25 }),
    thumbnail: null,
  },
  {
    id: 'triangles-dark',
    name: '几何三角 - 暗色',
    category: 'geometric',
    generate: () => generateTrianglePattern({ colors: ['#2d3436', '#636e72', '#b2bec3'] }),
    thumbnail: null,
  },
  {
    id: 'triangles-colorful',
    name: '几何三角 - 彩色',
    category: 'geometric',
    generate: () => generateTrianglePattern({ colors: ['#e31937', '#0984e3', '#f4d03f', '#00b894'] }),
    thumbnail: null,
  },
  {
    id: 'wave-red',
    name: '波浪纹 - 红色',
    category: 'pattern',
    generate: () => generateWavePattern({ waveColor: '#e31937' }),
    thumbnail: null,
  },
  {
    id: 'wave-multi',
    name: '波浪纹 - 多彩',
    category: 'pattern',
    generate: () => {
      const { canvas, ctx } = (() => {
        const c = document.createElement('canvas')
        c.width = 800
        c.height = 600
        return { canvas: c, ctx: c.getContext('2d') }
      })()
      
      const colors = ['#e31937', '#0984e3', '#f4d03f']
      const waveHeight = 25
      const waveLength = 80
      const spacing = 150
      
      colors.forEach((color, i) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        
        const baseY = 150 + i * spacing
        ctx.beginPath()
        ctx.moveTo(0, baseY)
        
        for (let x = 0; x <= 800; x += 5) {
          const y = baseY + Math.sin((x / waveLength) * Math.PI * 2 + i) * waveHeight
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      })
      
      return canvas.toDataURL('image/png')
    },
    thumbnail: null,
  },
  {
    id: 'dots-radial',
    name: '点阵 - 中心渐变',
    category: 'pattern',
    generate: () => generateDotGradient({ direction: 'radial', dotColor: '#e31937' }),
    thumbnail: null,
  },
  {
    id: 'dots-horizontal',
    name: '点阵 - 水平渐变',
    category: 'pattern',
    generate: () => generateDotGradient({ direction: 'horizontal', dotColor: '#0984e3' }),
    thumbnail: null,
  },
  {
    id: 'lightning-red',
    name: '闪电条纹 - 红色',
    category: 'stripes',
    generate: () => generateLightningPattern({ color: '#e31937' }),
    thumbnail: null,
  },
  {
    id: 'lightning-gold',
    name: '闪电条纹 - 金色',
    category: 'stripes',
    generate: () => generateLightningPattern({ color: '#f4d03f', bgColor: '#2d3436' }),
    thumbnail: null,
  },
  {
    id: 'camo-military',
    name: '迷彩 - 军绿',
    category: 'camo',
    generate: () => generateCamouflage({ colors: ['#4a5d23', '#6b7c3f', '#8b9a5b', '#2d3a1a'] }),
    thumbnail: null,
  },
  {
    id: 'camo-urban',
    name: '迷彩 - 都市灰',
    category: 'camo',
    generate: () => generateCamouflage({ colors: ['#2d3436', '#636e72', '#b2bec3', '#1a1a1a'] }),
    thumbnail: null,
  },
  {
    id: 'camo-desert',
    name: '迷彩 - 沙漠',
    category: 'camo',
    generate: () => generateCamouflage({ colors: ['#d4a574', '#c4956a', '#b8860b', '#8b7355'] }),
    thumbnail: null,
  },
]

/**
 * 按分类获取图案
 */
export function getPatternsByCategory(category) {
  if (!category || category === 'all') {
    return PRESET_PATTERNS
  }
  return PRESET_PATTERNS.filter(p => p.category === category)
}

/**
 * 获取所有分类
 */
export function getCategories() {
  return [
    { id: 'all', name: '全部' },
    { id: 'stripes', name: '条纹' },
    { id: 'gradient', name: '渐变' },
    { id: 'geometric', name: '几何' },
    { id: 'texture', name: '纹理' },
    { id: 'pattern', name: '图案' },
    { id: 'camo', name: '迷彩' },
  ]
}

