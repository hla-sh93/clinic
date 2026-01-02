'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'

type Invoice = {
  id: string
  totalAmount: string
  paidAmount: string
  status: string
  createdAt: string
  patient: {
    fullName: string
    phone: string | null
    email: string | null
  }
  visit: {
    dentist: {
      fullName: string
    }
    medicalCase: {
      name: string
    }
  }
}

type OutstandingByPatient = {
  patientId: string
  patientName: string
  patientPhone: string | null
  patientEmail: string | null
  totalOutstanding: number
  invoiceCount: number
}

type ReportData = {
  totalOutstanding: number
  invoiceCount: number
  invoices: Invoice[]
  outstandingByPatient: OutstandingByPatient[]
}

const OutstandingReportPage = () => {
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('/api/reports/outstanding')

        if (!response.ok) {
          throw new Error('Failed to fetch report')
        }

        const data = await response.json()

        setReport(data)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [])

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

  const calculateOutstanding = (invoice: Invoice) => {
    return parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount)
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant='h4'>Outstanding Balances</Typography>
              <Typography variant='body2' color='text.secondary'>
                View unpaid invoices and patient balances
              </Typography>
            </Box>
            <Button variant='outlined' onClick={() => router.push('/reports')}>
              Back to Reports
            </Button>
          </Box>
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
                    Total Outstanding
                  </Typography>
                  <Typography variant='h3' color='error.main'>
                    {formatCurrency(report.totalOutstanding)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant='body2' color='text.secondary'>
                    Unpaid Invoices
                  </Typography>
                  <Typography variant='h3'>{report.invoiceCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Outstanding by Patient */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Outstanding by Patient
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell align='right'>Invoices</TableCell>
                      <TableCell align='right'>Total Outstanding</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.outstandingByPatient
                      .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
                      .map(item => (
                        <TableRow key={item.patientId}>
                          <TableCell>
                            <Typography variant='body1' fontWeight={500}>
                              {item.patientName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {item.patientPhone && <Typography variant='body2'>{item.patientPhone}</Typography>}
                            {item.patientEmail && (
                              <Typography variant='caption' color='text.secondary'>
                                {item.patientEmail}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align='right'>{item.invoiceCount}</TableCell>
                          <TableCell align='right'>
                            <Typography variant='body1' fontWeight={600} color='error.main'>
                              {formatCurrency(item.totalOutstanding)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Invoice Details
              </Typography>

              {report.invoices.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant='h6' color='text.secondary'>
                    No outstanding invoices
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Treatment</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align='right'>Total</TableCell>
                        <TableCell align='right'>Paid</TableCell>
                        <TableCell align='right'>Outstanding</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.invoices.map(invoice => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                          <TableCell>{invoice.patient.fullName}</TableCell>
                          <TableCell>{invoice.visit.medicalCase.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.status.replace('_', ' ')}
                              color={invoice.status === 'PARTIALLY_PAID' ? 'warning' : 'default'}
                              size='small'
                            />
                          </TableCell>
                          <TableCell align='right'>{formatCurrency(invoice.totalAmount)}</TableCell>
                          <TableCell align='right'>{formatCurrency(invoice.paidAmount)}</TableCell>
                          <TableCell align='right'>
                            <Typography fontWeight={600} color='error.main'>
                              {formatCurrency(calculateOutstanding(invoice))}
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

export default OutstandingReportPage
