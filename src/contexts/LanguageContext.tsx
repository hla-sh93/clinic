'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

import { messages, getNestedValue } from '@/i18n/messages'
import type { Language } from '@/i18n/messages'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // اللغة الافتراضية: العربية
  const [language, setLanguageState] = useState<Language>('ar')

  useEffect(() => {
    // تعيين اللغة العربية دائماً
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'ar'
    localStorage.setItem('language', 'ar')
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setLanguage = (lang: Language) => {
    // النظام يدعم العربية فقط
    setLanguageState('ar')
    localStorage.setItem('language', 'ar')
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'ar'

    // Set cookie for server-side
    document.cookie = `locale=ar;path=/;max-age=31536000`
  }

  const t = (key: string): string => {
    // دائماً استخدم العربية
    return getNestedValue(messages['ar'], key)
  }

  // دائماً RTL
  const dir = 'rtl' as const

  return <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }

  return context
}
