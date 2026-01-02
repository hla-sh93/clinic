'use client'

// Type Imports
import { SessionProvider } from 'next-auth/react'

import type { ChildrenType, Direction, Mode, SystemMode } from '@core/types'
import type { Settings } from '@core/contexts/settingsContext'

// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import { LanguageProvider } from '@/contexts/LanguageContext'

type Props = ChildrenType & {
  direction: Direction
  mode?: Mode
  systemMode?: SystemMode
  settingsCookie?: Settings | null
}

const Providers = (props: Props) => {
  // Props
  const { children, direction, mode, systemMode, settingsCookie } = props

  return (
    <SessionProvider>
      <LanguageProvider>
        <VerticalNavProvider>
          <SettingsProvider settingsCookie={settingsCookie ?? null} mode={mode}>
            <ThemeProvider direction={direction} systemMode={systemMode || 'light'}>
              {children}
            </ThemeProvider>
          </SettingsProvider>
        </VerticalNavProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}

export default Providers
