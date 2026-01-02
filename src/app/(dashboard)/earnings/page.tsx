'use client'

import { useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'

import { useLanguage } from '@/contexts/LanguageContext'

type DentistProfit = {
  dentistId: string
  dentistName: string
  percentage: number
  revenue: number
  netProfit: number
  doctorProfit: number
}

type EarningsReport = {
  totalRevenue?: number
  inventoryExpenses?: number
  netProfit?: number
  deferredReceivables?: number
  dentistProfits: DentistProfit[]
  ownDeferredReceivables?: number
}

const EarningsPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t, language } = useLanguage()
  const [report, setReport] = useState<EarningsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Default to current month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [filters, setFilters] = useState({
    startDate: firstDayOfMonth.toISOString().split('T')[0],
    endDate: lastDayOfMonth.toISOString().split('T')[0]
  })

  const isManager = session?.user?.role === 'MANAGER'

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString())
      if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString())

      const url = `/api/reports/doctor-profit${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, { credentials: 'include' })

      if (!response.ok) {
        const errorData = await response.json()

        throw new Error(errorData.error || t('earnings.fetchError'))
      }

      const data = await response.json()

      setReport(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filters, t])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const formatCurrency = (amount: number) => {
    if (language === 'ar') {
      return `${amount.toLocaleString('ar-SY')} ل.س`
    }

    return `${amount.toLocaleString('en-US')} SYP`
  }

  const formatDateRange = () => {
    const start = new Date(filters.startDate)
    const end = new Date(filters.endDate)

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  // Quick date range presets
  const setThisMonth = () => {
    const now = new Date()

    setFilters({
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    })
  }

  const setLastMonth = () => {
    const now = new Date()

    setFilters({
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
      endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
    })
  }

  const setThisYear = () => {
    const now = new Date()

    setFilters({
      startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
    })
  }

  // Calculate totals for manager view
  const totalDoctorProfits = report?.dentistProfits.reduce((sum, d) => sum + d.doctorProfit, 0) || 0
  const clinicProfit = (report?.netProfit || 0) - totalDoctorProfits

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='h4'>{t('earnings.title')}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {isManager ? t('earnings.managerSubtitle') : t('earnings.dentistSubtitle')}
              </Typography>
            </Box>
            {isManager && (
              <Button variant='outlined' onClick={() => router.push('/profit-shares')}>
                {t('earnings.managePercentages')}
              </Button>
            )}
          </Box>

          {/* Date Filters */}
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} sm={3}>
              <TextField
                type='date'
                fullWidth
                label={t('reports.from')}
                value={filters.startDate}
                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                size='small'
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                type='date'
                fullWidth
                label={t('reports.to')}
                value={filters.endDate}
                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                size='small'
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size='small' variant='outlined' onClick={setThisMonth}>
                  {t('earnings.thisMonth')}
                </Button>
                <Button size='small' variant='outlined' onClick={setLastMonth}>
                  {t('earnings.lastMonth')}
                </Button>
                <Button size='small' variant='outlined' onClick={setThisYear}>
                  {t('earnings.thisYear')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity='error' sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} md={isManager ? 3 : 4}>
              <Card>
                <CardContent>
                  <Typography variant='body2' color='text.secondary'>
                    {t('earnings.totalRevenue')}
                  </Typography>
                  <Typography variant='h4'>{formatCurrency(report.totalRevenue || 0)}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {formatDateRange()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={isManager ? 3 : 4}>
              <Card>
                <CardContent>
                  <Typography variant='body2' color='text.secondary'>
                    {t('earnings.netProfit')}
                  </Typography>
                  <Typography variant='h4'>{formatCurrency(report.netProfit || 0)}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {t('earnings.beforeProfitShares')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {isManager ? (
              <>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant='body2' color='text.secondary'>
                        {t('earnings.doctorPayouts')}
                      </Typography>
                      <Typography variant='h4' color='warning.main'>
                        {formatCurrency(totalDoctorProfits)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {t('earnings.totalToAllDentists')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'success.light' }}>
                    <CardContent>
                      <Typography variant='body2' color='success.dark'>
                        {t('earnings.clinicProfit')}
                      </Typography>
                      <Typography variant='h4' color='success.dark'>
                        {formatCurrency(clinicProfit)}
                      </Typography>
                      <Typography variant='caption' color='success.dark'>
                        {t('earnings.afterDoctorPayouts')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            ) : (
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'success.light' }}>
                  <CardContent>
                    <Typography variant='body2' color='success.dark'>
                      {t('earnings.yourEarnings')}
                    </Typography>
                    <Typography variant='h4' color='success.dark'>
                      {formatCurrency(report.dentistProfits[0]?.doctorProfit || 0)}
                    </Typography>
                    <Typography variant='caption' color='success.dark'>
                      {report.dentistProfits[0]?.percentage || 0}% {t('earnings.ofYourRevenue')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Detailed Breakdown */}
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                {isManager ? t('earnings.dentistEarningsBreakdown') : t('earnings.yourEarningsDetails')}
              </Typography>

              {report.dentistProfits.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color='text.secondary'>{t('earnings.noEarningsData')}</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('earnings.dentist')}</TableCell>
                        <TableCell align='right'>{t('earnings.revenueGenerated')}</TableCell>
                        <TableCell align='right'>{t('earnings.netProfit')}</TableCell>
                        <TableCell align='right'>{t('earnings.sharePercent')}</TableCell>
                        <TableCell align='right'>{t('earnings.doctorEarnings')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.dentistProfits.map(dentist => (
                        <TableRow key={dentist.dentistId}>
                          <TableCell>
                            <Typography variant='body1' fontWeight={500}>
                              {dentist.dentistName}
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>{formatCurrency(dentist.revenue)}</TableCell>
                          <TableCell align='right'>{formatCurrency(dentist.netProfit)}</TableCell>
                          <TableCell align='right'>
                            <Typography color='primary'>{dentist.percentage.toFixed(1)}%</Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='body1' fontWeight={600} color='success.main'>
                              {formatCurrency(dentist.doctorProfit)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {isManager && report.dentistProfits.length > 1 && (
                        <>
                          <TableRow>
                            <TableCell colSpan={5}>
                              <Divider />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Typography fontWeight={600}>{t('common.total')}</Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography fontWeight={600}>{formatCurrency(report.totalRevenue || 0)}</Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography fontWeight={600}>{formatCurrency(report.netProfit || 0)}</Typography>
                            </TableCell>
                            <TableCell align='right'>-</TableCell>
                            <TableCell align='right'>
                              <Typography fontWeight={600} color='success.main'>
                                {formatCurrency(totalDoctorProfits)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Formula Explanation */}
              <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  {t('earnings.calculationFormula')}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  <strong>{t('earnings.doctorEarnings')}</strong> = {t('earnings.netProfit')} × (
                  {t('earnings.sharePercent')} / 100)
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('earnings.formulaExplanation')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </>
      ) : null}
    </Box>
  )
}

export default EarningsPage
