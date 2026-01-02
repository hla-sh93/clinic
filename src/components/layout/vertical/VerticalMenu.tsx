'use client'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useSession } from 'next-auth/react'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useLanguage } from '@/contexts/LanguageContext'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { t } = useLanguage()
  const { data: session } = useSession()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const isManager = session?.user?.role === 'MANAGER'

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuItem href='/dashboard' icon={<i className='tabler-dashboard' />}>
          {t('nav.dashboard')}
        </MenuItem>
        <MenuItem href='/patients' icon={<i className='tabler-users' />}>
          {t('nav.patients')}
        </MenuItem>
        <MenuItem href='/appointments' icon={<i className='tabler-calendar' />}>
          {t('nav.appointments')}
        </MenuItem>
        <MenuItem href='/medical-cases' icon={<i className='tabler-medical-cross' />}>
          {t('nav.medicalCases')}
        </MenuItem>
        <MenuItem href='/payments' icon={<i className='tabler-cash' />}>
          {t('nav.payments')}
        </MenuItem>
        <MenuItem href='/invoices' icon={<i className='tabler-file-invoice' />}>
          {t('nav.invoices')}
        </MenuItem>
        <MenuItem href='/inventory' icon={<i className='tabler-package' />}>
          {t('nav.inventory')}
        </MenuItem>
        {isManager && (
          <MenuItem href='/profit-shares' icon={<i className='tabler-chart-pie' />}>
            {t('nav.profitShares')}
          </MenuItem>
        )}
        <MenuItem href='/earnings' icon={<i className='tabler-coin' />}>
          {t('nav.earnings')}
        </MenuItem>
        {isManager && (
          <MenuItem href='/reports' icon={<i className='tabler-chart-bar' />}>
            {t('nav.reports')}
          </MenuItem>
        )}
        {isManager && (
          <MenuItem href='/users' icon={<i className='tabler-user-cog' />}>
            {t('nav.users')}
          </MenuItem>
        )}
        <MenuItem href='/audit-logs' icon={<i className='tabler-history' />}>
          {t('nav.auditLogs')}
        </MenuItem>
      </Menu>
      {/* <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <GenerateVerticalMenu menuData={menuData(dictionary)} />
      </Menu> */}
    </ScrollWrapper>
  )
}

export default VerticalMenu
