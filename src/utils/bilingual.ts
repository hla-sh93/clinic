import type { Language } from '@/i18n/messages'

/**
 * Get the appropriate field value based on the current language
 * Falls back to English if Arabic translation is not available
 */
export function getBilingualField(
  englishValue: string,
  arabicValue: string | null | undefined,
  language: Language
): string {
  if (language === 'ar' && arabicValue) {
    return arabicValue
  }

  return englishValue
}

/**
 * Create a bilingual object for database operations
 */
export function createBilingualData(englishValue: string, arabicValue?: string) {
  return {
    name: englishValue,
    nameAr: arabicValue || null
  }
}

/**
 * Create a bilingual reason object for inventory movements
 */
export function createBilingualReason(englishReason: string, arabicReason?: string) {
  return {
    reason: englishReason,
    reasonAr: arabicReason || null
  }
}
