'use client'

import { useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import MenuItem from '@mui/material/MenuItem'

type DentistProfit = {
  dentistId: string
  dentistName: string
  percentage: number
  revenue: number
  netProfit: number
  doctorProfit: number
}

type ReportData = {
  totalRevenue?: number
  inventoryExpenses?: number
  netProfit?: number
  deferredReceivables?: number
  dentistProfits: DentistProfit[]
  ownDeferredReceivables?: number
}

const DoctorEarningsReportPage = () => {
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [preset, setPreset] = useState('')

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (startDate) params.append('startDate', new Date(startDate).toISOString())
      if (endDate) params.append('endDate', new Date(endDate).toISOString())

      const response = await fetch(`/api/reports/doctor-profit?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch report')
      }

      const data = await response.json()

      setReport(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handlePresetChange = (value: string) => {
    setPreset(value)
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (value) {
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last-month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      default:
        return
    }

    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const totalDoctorPayouts = report?.dentistProfits.reduce((sum, d) => sum + d.doctorProfit, 0) || 0
  const clinicProfit = (report?.netProfit || 0) - totalDoctorPayouts

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='h4'>Doctor Earnings Report</Typography>
              <Typography variant='body2' color='text.secondary'>
                View doctor profit share and earnings
              </Typography>
            </Box>
            <Button variant='outlined' onClick={() => router.push('/reports')}>
              Back to Reports
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label='Quick Preset'
                value={preset}
                onChange={e => handlePresetChange(e.target.value)}
              >
                <MenuItem value=''>Custom Range</MenuItem>
                <MenuItem value='this-month'>This Month</MenuItem>
                <MenuItem value='last-month'>Last Month</MenuItem>
                <MenuItem value='this-year'>This Year</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Start Date'
                type='date'
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  setPreset('')
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='End Date'
                type='date'
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value)
                  setPreset('')
                }}
                InputLabelProps={{ shrink: true }}
              />
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
          {/* Summary Cards - Manager sees clinic-wide, Dentist sees own */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {report.totalRevenue !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                      Total Collected Revenue
                    </Typography>
                    <Typography variant='h4'>{formatCurrency(report.totalRevenue)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {report.inventoryExpenses !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                      Inventory Expenses
                    </Typography>
                    <Typography variant='h4' color='error.main'>
                      {formatCurrency(report.inventoryExpenses)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {report.netProfit !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                      Net Profit
                    </Typography>
                    <Typography variant='h4' color='success.main'>
                      {formatCurrency(report.netProfit)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {report.deferredReceivables !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                      Deferred Receivables (دفعات مؤجلة)
                    </Typography>
                    <Typography variant='h4' color='warning.main'>
                      {formatCurrency(report.deferredReceivables)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {report.ownDeferredReceivables !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                      Your Deferred Receivables
                    </Typography>
                    <Typography variant='h4' color='warning.main'>
                      {formatCurrency(report.ownDeferredReceivables)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='body2' color='text.secondary'>
                    Doctor Payouts
                  </Typography>
                  <Typography variant='h4' color='info.main'>
                    {formatCurrency(totalDoctorPayouts)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {report.netProfit !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                      Clinic Profit (After Payouts)
                    </Typography>
                    <Typography variant='h4' color='primary.main'>
                      {formatCurrency(clinicProfit)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Dentist Earnings Table */}
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Dentist Earnings Breakdown
              </Typography>

              {report.dentistProfits.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant='h6' color='text.secondary'>
                    No earnings data available
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Dentist</TableCell>
                        <TableCell align='right'>Profit Share %</TableCell>
                        <TableCell align='right'>Revenue</TableCell>
                        <TableCell align='right'>Net Profit</TableCell>
                        <TableCell align='right'>Doctor Earnings</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.dentistProfits.map(dentist => (
                        <TableRow key={dentist.dentistId} hover>
                          <TableCell>
                            <Typography variant='body1' fontWeight={500}>
                              {dentist.dentistName}
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>{dentist.percentage}%</TableCell>
                          <TableCell align='right'>{formatCurrency(dentist.revenue)}</TableCell>
                          <TableCell align='right'>{formatCurrency(dentist.netProfit)}</TableCell>
                          <TableCell align='right'>
                            <Typography variant='body1' fontWeight={600} color='success.main'>
                              {formatCurrency(dentist.doctorProfit)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </Box>
  )
}

export default DoctorEarningsReportPage
