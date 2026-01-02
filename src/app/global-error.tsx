'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang='ar' dir='rtl'>
      <body>
        <div className='flex flex-col gap-4 p-6'>
          <h2 className='text-lg font-semibold'>خطأ في التطبيق</h2>
          <pre className='whitespace-pre-wrap text-sm opacity-80'>{error.message}</pre>
          <div>
            <button type='button' onClick={() => reset()} className='rounded-md bg-black px-4 py-2 text-white'>
              حاول مرة أخرى
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
