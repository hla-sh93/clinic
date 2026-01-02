'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className='flex flex-col gap-4 p-6' dir='rtl'>
      <h2 className='text-lg font-semibold'>حدث خطأ</h2>
      <pre className='whitespace-pre-wrap text-sm opacity-80'>{error.message}</pre>
      <div>
        <button type='button' onClick={() => reset()} className='rounded-md bg-black px-4 py-2 text-white'>
          حاول مرة أخرى
        </button>
      </div>
    </div>
  )
}
