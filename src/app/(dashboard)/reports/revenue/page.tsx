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

type Payment = {
  id: string
  amount: string
  paymentDate: string
  invoice: {
    id: string
    visit: {
      dentist: {
        fullName: string
      }
      medicalCase: {
        name: string
      }
    }
    patient: {
      fullName: string
    }
  }
}

type RevenueByDentist = {
  dentistId: string
  dentistName: string
  revenue: number
}

type ReportData = {
  totalRevenue: number
  paymentCount: number
  payments: Payment[]
  revenueByDentist: RevenueByDentist[]
}

const RevenueReportPage = () => {
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (startDate) params.append('startDate', new Date(startDate).toISOString())
      if (endDate) params.append('endDate', new Date(endDate).toISOString())

      const response = await fetch(`/api/reports/revenue?${params.toString()}`)

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

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount

    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='h4'>Revenue Report</Typography>
              <Typography variant='body2' color='text.secondary'>
                Track revenue and payments over time
              </Typography>
            </Box>
            <Button variant='outlined' onClick={() => router.push('/reports')}>
              Back to Reports
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Start Date'
                type='date'
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='End Date'
                type='date'
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
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
          {/* Summary Cards */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant='body2' color='text.secondary'>
                    Total Revenue
                  </Typography>
                  <Typography variant='h3' color='success.main'>
                    {formatCurrency(report.totalRevenue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant='body2' color='text.secondary'>
                    Total Payments
                  </Typography>
                  <Typography variant='h3'>{report.paymentCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Revenue by Dentist */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Revenue by Dentist
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Dentist</TableCell>
                      <TableCell align='right'>Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.revenueByDentist.map(item => (
                      <TableRow key={item.dentistId}>
                        <TableCell>{item.dentistName}</TableCell>
                        <TableCell align='right'>
                          <Typography variant='body1' fontWeight={600} color='success.main'>
                            {formatCurrency(item.revenue)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Payment Details
              </Typography>

              {report.payments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant='h6' color='text.secondary'>
                    No payments found
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Dentist</TableCell>
                        <TableCell>Treatment</TableCell>
                        <TableCell align='right'>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.payments.map(payment => (
                        <TableRow key={payment.id} hover>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell>{payment.invoice.patient.fullName}</TableCell>
                          <TableCell>{payment.invoice.visit.dentist.fullName}</TableCell>
                          <TableCell>{payment.invoice.visit.medicalCase.name}</TableCell>
                          <TableCell align='right'>
                            <Typography fontWeight={600} color='success.main'>
                              {formatCurrency(payment.amount)}
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

export default RevenueReportPage
