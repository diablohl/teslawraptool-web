/**
 * 设计模板管理器
 * 自动扫描 public/templates/{车型}/ 目录下的图片文件
 * 使用图片文件名作为模板名称
 */

// 模板存放路径
export const TEMPLATES_PATH = '/templates'

/**
 * 支持的车型列表及其对应的目录名
 * key: 显示名称（与 App.jsx 中的 MODELS 一致）
 * value: 目录名称（用于文件路径，避免中文和空格）
 */
export const CAR_MODEL_DIRS = {
  'Cybertruck': 'Cybertruck',
  '焕新款 Model 3': 'Model3-New',
  '焕新款 Model 3 高性能版': 'Model3-New-Performance',
  'Model 3': 'Model3',
  '焕新款 Model Y': 'ModelY-New',
  '焕新款 Model Y 高性能版': 'ModelY-New-Performance',
  '焕新款 Model Y 长续航版': 'ModelY-New-LongRange',
  'Model Y L': 'ModelY-L',
  'Model Y': 'ModelY',
}

/**
 * 使用 Vite 的 import.meta.glob 扫描所有模板图片
 * 这会在构建时自动扫描 public/templates 目录下的所有图片
 */
const templateImages = import.meta.glob('/public/templates/**/*.{png,jpg,jpeg,webp}', { 
  eager: true,
  query: '?url',
  import: 'default'
})

/**
 * 解析扫描到的模板图片
 * @returns {Object} 按车型目录分组的模板列表
 */
function parseTemplateImages() {
  const templatesByDir = {}
  
  for (const [path, url] of Object.entries(templateImages)) {
    // 路径格式: /public/templates/Cybertruck/template1.png
    const match = path.match(/\/public\/templates\/([^/]+)\/([^/]+)\.(png|jpg|jpeg|webp)$/i)
    if (match) {
      const [, dirName, fileName] = match
      
      if (!templatesByDir[dirName]) {
        templatesByDir[dirName] = []
      }
      
      templatesByDir[dirName].push({
        id: `${dirName}-${fileName}`,
        name: fileName, // 使用文件名作为模板名（不含扩展名）
        image: url,
      })
    }
  }
  
  return templatesByDir
}

// 解析并缓存模板列表
const parsedTemplates = parseTemplateImages()

/**
 * 获取车型对应的目录名
 * @param {string} carModel - 车型名称
 * @returns {string} 目录名称
 */
export function getTemplateDirName(carModel) {
  return CAR_MODEL_DIRS[carModel] || carModel
}

/**
 * 获取车型的模板列表
 * @param {string} carModel - 车型名称
 * @returns {Array} 该车型的模板列表
 */
export function getTemplatesByCarModel(carModel) {
  if (!carModel) {
    return []
  }
  
  const dirName = getTemplateDirName(carModel)
  return parsedTemplates[dirName] || []
}
