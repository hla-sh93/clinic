// Load messages dynamically to avoid Turbopack HMR issues
export type Language = 'en' | 'ar'

// Force fresh load on each access to avoid Turbopack HMR caching issues
export function getMessages(): Record<Language, Record<string, any>> {
  // Clear require cache in development
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
    delete require.cache[require.resolve('../../messages/en.json')]
    delete require.cache[require.resolve('../../messages/ar.json')]
  }

  return {
    en: require('../../messages/en.json'),
    ar: require('../../messages/ar.json')
  }
}

export const messages = getMessages()

export function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return path
    }
  }

  return typeof result === 'string' ? result : path
}
