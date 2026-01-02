'use client'

import { useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import { useLanguage } from '@/contexts/LanguageContext'

const ReportsPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useLanguage()

  const isManager = session?.user?.role === 'MANAGER'

  const reports = [
    {
      title: t('reports.appointmentsReport'),
      description: t('reports.appointmentsDesc'),
      icon: 'tabler-calendar-stats',
      color: 'primary.main',
      path: '/reports/appointments',
      managerOnly: false
    },
    {
      title: t('reports.revenueReport'),
      description: t('reports.revenueDesc'),
      icon: 'tabler-chart-line',
      color: 'success.main',
      path: '/reports/revenue',
      managerOnly: true
    },
    {
      title: t('reports.outstandingReport'),
      description: t('reports.outstandingDesc'),
      icon: 'tabler-alert-circle',
      color: 'error.main',
      path: '/reports/outstanding',
      managerOnly: true
    },
    {
      title: t('reports.doctorEarningsReport'),
      description: t('reports.doctorEarningsDesc'),
      icon: 'tabler-coin',
      color: 'warning.main',
      path: '/reports/doctor-earnings',
      managerOnly: false
    },
    {
      title: t('reports.inventoryReport'),
      description: t('reports.inventoryDesc'),
      icon: 'tabler-package',
      color: 'info.main',
      path: '/reports/inventory-low-stock',
      managerOnly: false
    }
  ]

  const availableReports = reports.filter(report => isManager || !report.managerOnly)

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='h4' sx={{ mb: 1 }}>
            {t('reports.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {isManager ? t('reports.subtitle') : t('reports.subtitleUser')}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        {availableReports.map(report => (
          <Grid item xs={12} sm={6} md={4} key={report.path}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)'
                }
              }}
              onClick={() => router.push(report.path)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: report.color,
                      color: 'white',
                      mr: 2
                    }}
                  >
                    <i className={report.icon} style={{ fontSize: '2rem' }} />
                  </Box>
                  <Box>
                    <Typography variant='h6'>{report.title}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {report.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default ReportsPage
