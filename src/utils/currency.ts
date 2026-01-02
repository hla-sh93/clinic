/**
 * Format amount as Syrian Pound currency
 * @param amount - The amount to format
 * @param language - The language to use ('en' or 'ar')
 */
export function formatCurrency(amount: string | number, language: 'en' | 'ar' = 'en'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  if (language === 'ar') {
    return `${num.toLocaleString('ar-SY')} ل.س`
  }

  return `${num.toLocaleString('en-US')} SYP`
}
