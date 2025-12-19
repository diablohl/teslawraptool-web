import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../locales/translations'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  // 从 localStorage 读取保存的语言设置，默认为中文
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language')
    return saved || 'zh'
  })

  // 当语言改变时，保存到 localStorage
  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  // 切换语言
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh')
  }

  // 获取翻译文本
  const t = (key) => {
    const keys = key.split('.')
    let value = translations[language]
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key // 如果找不到翻译，返回 key
      }
    }
    
    return value || key
  }

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isEnglish: language === 'en',
    isChinese: language === 'zh',
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

