// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

type TranslationFunction = (key: string) => string

const verticalMenuData = (t: TranslationFunction): VerticalMenuDataType[] => [
  {
    label: t('nav.dashboard'),
    href: '/dashboard',
    icon: 'tabler-home'
  },
  {
    label: t('nav.patients'),
    icon: 'tabler-users',
    children: [
      {
        label: t('patients.title'),
        href: '/patients',
        icon: 'tabler-list'
      },
      {
        label: t('patients.addPatient'),
        href: '/patients/new',
        icon: 'tabler-user-plus'
      }
    ]
  },
  {
    label: t('nav.medicalCases'),
    icon: 'tabler-medical-cross',
    children: [
      {
        label: t('medicalCases.title'),
        href: '/medical-cases',
        icon: 'tabler-list'
      },
      {
        label: t('medicalCases.addCase'),
        href: '/medical-cases/new',
        icon: 'tabler-plus'
      }
    ]
  },
  {
    label: t('nav.appointments'),
    icon: 'tabler-calendar',
    children: [
      {
        label: t('appointments.title'),
        href: '/appointments',
        icon: 'tabler-calendar-event'
      },
      {
        label: t('appointments.addAppointment'),
        href: '/appointments/new',
        icon: 'tabler-calendar-plus'
      }
    ]
  },
  {
    label: t('nav.invoices'),
    icon: 'tabler-currency-dollar',
    children: [
      {
        label: t('invoices.title'),
        href: '/invoices',
        icon: 'tabler-file-invoice'
      }
    ]
  },
  {
    label: t('nav.inventory'),
    icon: 'tabler-package',
    children: [
      {
        label: t('inventory.title'),
        href: '/inventory',
        icon: 'tabler-list'
      }
    ]
  },
  {
    label: t('nav.reports'),
    icon: 'tabler-chart-bar',
    children: [
      {
        label: t('reports.title'),
        href: '/reports',
        icon: 'tabler-report'
      },
      {
        label: t('reports.appointments'),
        href: '/reports/appointments',
        icon: 'tabler-calendar-stats'
      },
      {
        label: t('reports.revenue'),
        href: '/reports/revenue',
        icon: 'tabler-chart-line'
      },
      {
        label: t('reports.outstanding'),
        href: '/reports/outstanding',
        icon: 'tabler-alert-circle'
      },
      {
        label: t('reports.doctorEarnings'),
        href: '/reports/doctor-earnings',
        icon: 'tabler-coin'
      },
      {
        label: t('reports.inventoryLowStock'),
        href: '/reports/inventory-low-stock',
        icon: 'tabler-package'
      }
    ]
  },
  {
    label: t('nav.profitShares'),
    href: '/profit-shares',
    icon: 'tabler-percentage'
  },
  {
    label: t('nav.earnings'),
    href: '/earnings',
    icon: 'tabler-wallet'
  },
  {
    label: t('nav.auditLogs'),
    href: '/audit-logs',
    icon: 'tabler-file-text'
  }
]

export default verticalMenuData
