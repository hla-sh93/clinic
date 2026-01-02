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
import Chip from '@mui/material/Chip'

type Appointment = {
  id: string
  startTime: string
  endTime: string
  status: string
  price: string
  patient: {
    id: string
    fullName: string
    phone: string | null
  }
  dentist: {
    id: string
    fullName: string
  }
  medicalCase: {
    id: string
    name: string
  }
}

type ReportData = {
  totalAppointments: number
  appointments: Appointment[]
  statusCounts: Record<string, number>
}

const AppointmentsReportPage = () => {
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

      const response = await fetch(`/api/reports/appointments?${params.toString()}`)

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount

    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'CONFIRMED':
        return 'info'
      case 'SCHEDULED':
        return 'default'
      case 'CANCELLED':
        return 'error'
      case 'NO_SHOW':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='h4'>Appointments Report</Typography>
              <Typography variant='body2' color='text.secondary'>
                View appointment statistics and history
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
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='body2' color='text.secondary'>
                    Total Appointments
                  </Typography>
                  <Typography variant='h3'>{report.totalAppointments}</Typography>
                </CardContent>
              </Card>
            </Grid>
            {Object.entries(report.statusCounts).map(([status, count]) => (
              <Grid item xs={12} sm={6} md={3} key={status}>
                <Card>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                      {status.replace('_', ' ')}
                    </Typography>
                    <Typography variant='h3'>{count}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Appointments Table */}
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Appointment Details
              </Typography>

              {report.appointments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant='h6' color='text.secondary'>
                    No appointments found
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Dentist</TableCell>
                        <TableCell>Treatment</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align='right'>Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.appointments.map(appointment => (
                        <TableRow key={appointment.id} hover>
                          <TableCell>
                            <Typography variant='body2'>{formatDateTime(appointment.startTime)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' fontWeight={500}>
                              {appointment.patient.fullName}
                            </Typography>
                            {appointment.patient.phone && (
                              <Typography variant='caption' color='text.secondary'>
                                {appointment.patient.phone}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{appointment.dentist.fullName}</TableCell>
                          <TableCell>{appointment.medicalCase.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={appointment.status.replace('_', ' ')}
                              color={getStatusColor(appointment.status) as any}
                              size='small'
                            />
                          </TableCell>
                          <TableCell align='right'>{formatCurrency(appointment.price)}</TableCell>
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

export default AppointmentsReportPage
