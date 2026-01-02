'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export const useTranslation = () => {
  const { t, language } = useLanguage()

  const formatDate = (dateString: string) => {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US'

    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US'

    return new Date(dateString).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount

    if (language === 'ar') {
      return `${num.toLocaleString('ar-SY')} ل.س`
    }

    return `${num.toLocaleString('en-US')} SYP`
  }

  return {
    t,
    language,
    formatDate,
    formatDateTime,
    formatCurrency
  }
}
