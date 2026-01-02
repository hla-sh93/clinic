'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'

import { useLanguage } from '@/contexts/LanguageContext'

const formatCurrencyByLang = (amount: number, language: string) => {
  if (language === 'ar') {
    return `${amount.toLocaleString('ar-SY')} ل.س`
  }

  return `${amount.toLocaleString('en-US')} SYP`
}

type LowStockItem = {
  id: string
  name: string
  quantity: number
  reorderLevel: number
}

type DashboardStats = {
  totalPatients: number
  todayAppointments: number
  monthlyRevenue: number
  outstandingBalance: number
}

const DashboardPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])

  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    outstandingBalance: 0
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch patients count
        const patientsRes = await fetch('/api/patients')
        const patients = patientsRes.ok ? await patientsRes.json() : []

        // Fetch today's appointments
        const today = new Date()
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()
        const appointmentsRes = await fetch(`/api/appointments?startDate=${startOfDay}&endDate=${endOfDay}`)
        const appointments = appointmentsRes.ok ? await appointmentsRes.json() : []

        // Fetch monthly revenue
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
        const revenueRes = await fetch(`/api/reports/revenue?startDate=${startOfMonth}&endDate=${endOfMonth}`)
        const revenueData = revenueRes.ok ? await revenueRes.json() : { totalRevenue: 0 }

        // Fetch outstanding balances
        const outstandingRes = await fetch('/api/reports/outstanding')
        const outstandingData = outstandingRes.ok ? await outstandingRes.json() : { totalOutstanding: 0 }

        setStats({
          totalPatients: patients.length || 0,
          todayAppointments: appointments.length || 0,
          monthlyRevenue: revenueData.totalRevenue || 0,
          outstandingBalance: outstandingData.totalOutstanding || 0
        })

        // Fetch low stock items for managers
        if (session?.user?.role === 'MANAGER') {
          const inventoryRes = await fetch('/api/inventory?lowStock=true')

          if (inventoryRes.ok) {
            const items = await inventoryRes.json()

            const lowItems = items.filter((item: LowStockItem) => item.quantity <= item.reorderLevel)

            setLowStockItems(lowItems)
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status, session])

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!session) {
    return null
  }

  const isManager = session.user.role === 'MANAGER'

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h4' sx={{ mb: 2 }}>
              {t('dashboard.welcome')}, {session.user.name}
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              {isManager ? 'مدير' : t('appointments.dentist')}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {isManager ? (
        <>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      mr: 2
                    }}
                  >
                    <i className='tabler-users' style={{ fontSize: '1.75rem' }} />
                  </Box>
                  <Typography variant='h6'>{t('nav.patients')}</Typography>
                </Box>
                <Typography variant='h4'>{loading ? '-' : stats.totalPatients.toLocaleString()}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('dashboard.totalPatients')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'success.main',
                      color: 'success.contrastText',
                      mr: 2
                    }}
                  >
                    <i className='tabler-calendar-check' style={{ fontSize: '1.75rem' }} />
                  </Box>
                  <Typography variant='h6'>{t('nav.appointments')}</Typography>
                </Box>
                <Typography variant='h4'>{loading ? '-' : stats.todayAppointments.toLocaleString()}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('dashboard.todayAppointments')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'warning.main',
                      color: 'warning.contrastText',
                      mr: 2
                    }}
                  >
                    <i className='tabler-file-invoice' style={{ fontSize: '1.75rem' }} />
                  </Box>
                  <Typography variant='h6'>{t('dashboard.monthlyRevenue')}</Typography>
                </Box>
                <Typography variant='h4'>
                  {loading ? '-' : formatCurrencyByLang(stats.monthlyRevenue, language)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('earnings.thisMonth')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'error.main',
                      color: 'error.contrastText',
                      mr: 2
                    }}
                  >
                    <i className='tabler-alert-circle' style={{ fontSize: '1.75rem' }} />
                  </Box>
                  <Typography variant='h6'>{t('reports.outstanding')}</Typography>
                </Box>
                <Typography variant='h4'>
                  {loading ? '-' : formatCurrencyByLang(stats.outstandingBalance, language)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('invoices.unpaid')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Warning Widget */}
          {lowStockItems.length > 0 && (
            <Grid item xs={12}>
              <Alert
                severity='warning'
                action={
                  <Button color='inherit' size='small' onClick={() => router.push('/inventory')}>
                    عرض المخزون
                  </Button>
                }
              >
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  تنبيه مخزون منخفض: {lowStockItems.length} عنصر يحتاج انتباه
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {lowStockItems.slice(0, 5).map(item => (
                    <Chip
                      key={item.id}
                      label={`${item.name} (${item.quantity})`}
                      size='small'
                      color='warning'
                      variant='outlined'
                    />
                  ))}
                  {lowStockItems.length > 5 && (
                    <Chip label={`+${lowStockItems.length - 5} المزيد`} size='small' variant='outlined' />
                  )}
                </Box>
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='h5' sx={{ mb: 3 }}>
                  {t('dashboard.quickActions')}
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                      onClick={() => router.push('/patients')}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <i className='tabler-user-plus' style={{ fontSize: '3rem', color: 'primary.main' }} />
                        <Typography variant='h6' sx={{ mt: 2 }}>
                          {t('patients.addPatient')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                      onClick={() => router.push('/appointments')}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <i className='tabler-calendar-plus' style={{ fontSize: '3rem', color: 'success.main' }} />
                        <Typography variant='h6' sx={{ mt: 2 }}>
                          {t('dashboard.newAppointment')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                      onClick={() => router.push('/payments')}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <i className='tabler-cash' style={{ fontSize: '3rem', color: 'warning.main' }} />
                        <Typography variant='h6' sx={{ mt: 2 }}>
                          {t('payments.addPayment')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                      onClick={() => router.push('/reports')}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <i className='tabler-chart-bar' style={{ fontSize: '3rem', color: 'info.main' }} />
                        <Typography variant='h6' sx={{ mt: 2 }}>
                          {t('nav.reports')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </>
      ) : (
        <>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      mr: 2
                    }}
                  >
                    <i className='tabler-calendar' style={{ fontSize: '1.75rem' }} />
                  </Box>
                  <Typography variant='h6'>مواعيدي</Typography>
                </Box>
                <Typography variant='h4'>-</Typography>
                <Typography variant='body2' color='text.secondary'>
                  جدول اليوم
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'success.main',
                      color: 'success.contrastText',
                      mr: 2
                    }}
                  >
                    <i className='tabler-coin' style={{ fontSize: '1.75rem' }} />
                  </Box>
                  <Typography variant='h6'>أرباحي</Typography>
                </Box>
                <Typography variant='h4'>-</Typography>
                <Typography variant='body2' color='text.secondary'>
                  هذا الشهر
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='h5' sx={{ mb: 3 }}>
                  إجراءات سريعة
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                      onClick={() => router.push('/appointments')}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <i className='tabler-calendar-check' style={{ fontSize: '3rem', color: 'primary.main' }} />
                        <Typography variant='h6' sx={{ mt: 2 }}>
                          مواعيدي
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                      onClick={() => router.push('/patients')}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <i className='tabler-users' style={{ fontSize: '3rem', color: 'success.main' }} />
                        <Typography variant='h6' sx={{ mt: 2 }}>
                          عرض المرضى
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                      onClick={() => router.push('/profit-shares')}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <i className='tabler-chart-pie' style={{ fontSize: '3rem', color: 'info.main' }} />
                        <Typography variant='h6' sx={{ mt: 2 }}>
                          حصتي من الأرباح
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default DashboardPage
