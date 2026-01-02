'use client'

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'

type Payment = {
  id: string
  amount: string
  paymentDate: string
  creator: {
    id: string
    fullName: string
  }
}

type Invoice = {
  id: string
  totalAmount: string
  paidAmount: string
  status: string
  createdAt: string
  patient: {
    id: string
    fullName: string
    phone: string | null
    email: string | null
  }
  visit: {
    id: string
    appointment: {
      id: string
      startTime: string
    }
    dentist: {
      id: string
      fullName: string
      email: string
    }
    medicalCase: {
      id: string
      name: string
      defaultPrice: string
    }
  }
  payments: Payment[]
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  DRAFT: 'default',
  ISSUED: 'warning',
  PARTIALLY_PAID: 'info',
  PAID: 'success',
  VOID: 'error'
}

const InvoiceDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentError, setPaymentError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isManager = session?.user?.role === 'MANAGER'

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invoice not found')
        }

        if (response.status === 403) {
          throw new Error('Access denied')
        }

        throw new Error('Failed to fetch invoice')
      }

      const data = await response.json()

      setInvoice(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isManager) {
      fetchInvoice()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, isManager])

  // Redirect non-managers
  if (!isManager) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>Only managers can access the financial module.</Alert>
          <Button variant='outlined' sx={{ mt: 2 }} onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePaymentClick = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setPaymentError('Please enter a valid payment amount')

      return
    }

    setPaymentError('')
    setConfirmDialogOpen(true)
  }

  const handleConfirmPayment = async () => {
    setSubmitting(true)
    setConfirmDialogOpen(false)

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount: parseFloat(paymentAmount),
          paymentDate: new Date(paymentDate).toISOString()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add payment')
      }

      // Refresh invoice data
      await fetchInvoice()
      setPaymentDialogOpen(false)
      setPaymentAmount('')
      setPaymentDate(new Date().toISOString().split('T')[0])
    } catch (err: any) {
      setPaymentError(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 4 }}>
        {error}
        <Button sx={{ ml: 2 }} onClick={() => router.push('/invoices')}>
          Back to Invoices
        </Button>
      </Alert>
    )
  }

  if (!invoice) {
    return null
  }

  const balance = parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount)
  const paymentProgress = (parseFloat(invoice.paidAmount) / parseFloat(invoice.totalAmount)) * 100
  const canAddPayment = ['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status)

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant='h4'>Invoice Details</Typography>
                <Chip label={invoice.status.replace('_', ' ')} color={statusColors[invoice.status] || 'default'} />
              </Box>
              <Typography variant='body2' color='text.secondary'>
                Created on {formatDate(invoice.createdAt)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant='outlined' onClick={() => router.push('/invoices')}>
                Back to Invoices
              </Button>
              {canAddPayment && (
                <Button variant='contained' onClick={() => setPaymentDialogOpen(true)}>
                  Add Payment
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        {/* Financial Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Financial Summary
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Payment Progress
                  </Typography>
                  <Typography variant='body2'>{Math.round(paymentProgress)}%</Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={paymentProgress}
                  color={paymentProgress >= 100 ? 'success' : 'primary'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body1'>Total Amount</Typography>
                  <Typography variant='h6'>{formatCurrency(invoice.totalAmount)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body1' color='success.main'>
                    Paid Amount
                  </Typography>
                  <Typography variant='h6' color='success.main'>
                    {formatCurrency(invoice.paidAmount)}
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body1' fontWeight={600}>
                    Balance Due
                  </Typography>
                  <Typography variant='h5' color={balance > 0 ? 'error.main' : 'success.main'}>
                    {formatCurrency(balance)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Patient & Visit Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Patient & Visit Information
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Patient
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{ cursor: 'pointer', color: 'primary.main' }}
                    onClick={() => router.push(`/patients/${invoice.patient.id}`)}
                  >
                    {invoice.patient.fullName}
                  </Typography>
                  {invoice.patient.phone && (
                    <Typography variant='body2' color='text.secondary'>
                      {invoice.patient.phone}
                    </Typography>
                  )}
                </Box>

                <Divider />

                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Treatment
                  </Typography>
                  <Typography variant='body1'>{invoice.visit.medicalCase.name}</Typography>
                </Box>

                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Dentist
                  </Typography>
                  <Typography variant='body1'>{invoice.visit.dentist.fullName}</Typography>
                </Box>

                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Appointment Date
                  </Typography>
                  <Typography variant='body1'>{formatDateTime(invoice.visit.appointment.startTime)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Payment History
              </Typography>

              {invoice.payments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color='text.secondary'>No payments recorded yet</Typography>
                  {canAddPayment && (
                    <Button variant='contained' sx={{ mt: 2 }} onClick={() => setPaymentDialogOpen(true)}>
                      Add First Payment
                    </Button>
                  )}
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Recorded By</TableCell>
                        <TableCell align='right'>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.payments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell>{payment.creator.fullName}</TableCell>
                          <TableCell align='right' sx={{ color: 'success.main', fontWeight: 600 }}>
                            {formatCurrency(payment.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography fontWeight={600}>Total Paid</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography fontWeight={600} color='success.main'>
                            {formatCurrency(invoice.paidAmount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity='info' sx={{ mb: 3 }}>
              Outstanding balance: <strong>{formatCurrency(balance)}</strong>
            </Alert>

            {paymentError && (
              <Alert severity='error' sx={{ mb: 3 }}>
                {paymentError}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Payment Amount'
                  type='number'
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                  inputProps={{ min: 0.01, max: balance, step: '0.01' }}
                  disabled={submitting}
                  helperText={`Maximum: ${formatCurrency(balance)}`}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Payment Date'
                  type='date'
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={submitting}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handlePaymentClick}
            variant='contained'
            disabled={submitting || !paymentAmount}
            startIcon={submitting && <CircularProgress size={20} />}
          >
            {submitting ? 'Processing...' : 'Add Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => !submitting && setConfirmDialogOpen(false)} maxWidth='sm'>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              You are about to record a payment
            </Typography>
            <Typography variant='body2'>
              <strong>Amount:</strong> {formatCurrency(parseFloat(paymentAmount || '0'))}
              <br />
              <strong>Date:</strong> {formatDate(paymentDate)}
            </Typography>
          </Alert>
          <Typography variant='body2' color='text.secondary'>
            This action will update the invoice status and cannot be undone. Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPayment}
            variant='contained'
            color='primary'
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={20} />}
          >
            {submitting ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default InvoiceDetailPage
