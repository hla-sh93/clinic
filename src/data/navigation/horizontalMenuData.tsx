// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

const horizontalMenuData = (): HorizontalMenuDataType[] => [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'tabler-home'
  },
  {
    label: 'Patients',
    icon: 'tabler-users',
    children: [
      {
        label: 'All Patients',
        href: '/patients',
        icon: 'tabler-list'
      },
      {
        label: 'Add Patient',
        href: '/patients/new',
        icon: 'tabler-user-plus'
      }
    ]
  },
  {
    label: 'Medical Cases',
    icon: 'tabler-medical-cross',
    children: [
      {
        label: 'All Cases',
        href: '/medical-cases',
        icon: 'tabler-list'
      },
      {
        label: 'Add Case',
        href: '/medical-cases/new',
        icon: 'tabler-plus'
      }
    ]
  },
  {
    label: 'Appointments',
    icon: 'tabler-calendar',
    children: [
      {
        label: 'All Appointments',
        href: '/appointments',
        icon: 'tabler-calendar-event'
      },
      {
        label: 'New Appointment',
        href: '/appointments/new',
        icon: 'tabler-calendar-plus'
      }
    ]
  },
  {
    label: 'Financial',
    icon: 'tabler-currency-dollar',
    children: [
      {
        label: 'Invoices',
        href: '/invoices',
        icon: 'tabler-file-invoice'
      }
    ]
  },
  {
    label: 'Inventory',
    icon: 'tabler-package',
    children: [
      {
        label: 'All Items',
        href: '/inventory',
        icon: 'tabler-list'
      }
    ]
  },
  {
    label: 'Reports',
    icon: 'tabler-chart-bar',
    children: [
      {
        label: 'All Reports',
        href: '/reports',
        icon: 'tabler-report'
      },
      {
        label: 'Appointments',
        href: '/reports/appointments',
        icon: 'tabler-calendar-stats'
      },
      {
        label: 'Revenue',
        href: '/reports/revenue',
        icon: 'tabler-chart-line'
      },
      {
        label: 'Outstanding',
        href: '/reports/outstanding',
        icon: 'tabler-alert-circle'
      },
      {
        label: 'Doctor Earnings',
        href: '/reports/doctor-earnings',
        icon: 'tabler-coin'
      },
      {
        label: 'Low Stock',
        href: '/reports/inventory-low-stock',
        icon: 'tabler-package'
      }
    ]
  },
  {
    label: 'Profit Shares',
    href: '/profit-shares',
    icon: 'tabler-percentage'
  },
  {
    label: 'My Earnings',
    href: '/earnings',
    icon: 'tabler-wallet'
  },
  {
    label: 'Audit Logs',
    href: '/audit-logs',
    icon: 'tabler-file-text'
  }
]

export default horizontalMenuData
