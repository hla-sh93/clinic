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

import { useLanguage } from '@/contexts/LanguageContext'

type Payment = {
  id: string
  amountSyp: string
  paymentDate: string
  status: string
  creator: {
    id: string
    fullName: string
  }
}

type Invoice = {
  id: string
  totalAmountSyp: string
  paidAmountSyp: string
  status: string
  createdAt: string
  patient: {
    id: string
    fullName: string
    phone: string | null
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
  UNPAID: 'error',
  PARTIALLY_PAID: 'warning',
  PAID: 'success'
}

const statusLabels: Record<string, string> = {
  UNPAID: 'غير مدفوعة',
  PARTIALLY_PAID: 'مدفوعة جزئياً',
  PAID: 'مدفوعة بالكامل'
}

const InvoiceDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const { t } = useLanguage()
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
          <Alert severity='error'>فقط المدراء يمكنهم الوصول للوحدة المالية</Alert>
          <Button variant='outlined' sx={{ mt: 2 }} onClick={() => router.push('/dashboard')}>
            {t('common.back')}
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
    return new Date(dateString).toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePaymentClick = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setPaymentError('الرجاء إدخال مبلغ صحيح')

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
          amountSyp: parseFloat(paymentAmount),
          method: 'CASH',
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
          العودة للفواتير
        </Button>
      </Alert>
    )
  }

  if (!invoice) {
    return null
  }

  const balance = parseFloat(invoice.totalAmountSyp) - parseFloat(invoice.paidAmountSyp)
  const paymentProgress = (parseFloat(invoice.paidAmountSyp) / parseFloat(invoice.totalAmountSyp)) * 100
  const canAddPayment = ['UNPAID', 'PARTIALLY_PAID'].includes(invoice.status)

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 1 }}>
            تفاصيل الفاتورة
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            تاريخ الإنشاء: {formatDate(invoice.createdAt)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant='outlined' onClick={() => router.push('/invoices')}>
            العودة للفواتير
          </Button>
          {canAddPayment && (
            <Button variant='contained' color='success' onClick={() => setPaymentDialogOpen(true)}>
              إضافة دفعة
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{ bgcolor: 'rgba(115, 103, 240, 0.15)', border: '1px solid', borderColor: 'rgba(115, 103, 240, 0.3)' }}
          >
            <CardContent>
              <Typography variant='body2' sx={{ color: 'rgb(115, 103, 240)', opacity: 0.85, mb: 1 }}>
                إجمالي الفاتورة
              </Typography>
              <Typography variant='h4' sx={{ color: 'rgb(115, 103, 240)' }}>
                {formatCurrency(invoice.totalAmountSyp)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{ bgcolor: 'rgba(40, 199, 111, 0.15)', border: '1px solid', borderColor: 'rgba(40, 199, 111, 0.3)' }}
          >
            <CardContent>
              <Typography variant='body2' sx={{ color: 'rgb(40, 199, 111)', opacity: 0.85, mb: 1 }}>
                المبلغ المدفوع
              </Typography>
              <Typography variant='h4' sx={{ color: 'rgb(40, 199, 111)' }}>
                {formatCurrency(invoice.paidAmountSyp)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              bgcolor: balance > 0 ? 'rgba(234, 84, 85, 0.15)' : 'rgba(40, 199, 111, 0.15)',
              border: '1px solid',
              borderColor: balance > 0 ? 'rgba(234, 84, 85, 0.3)' : 'rgba(40, 199, 111, 0.3)'
            }}
          >
            <CardContent>
              <Typography
                variant='body2'
                sx={{ color: balance > 0 ? 'rgb(234, 84, 85)' : 'rgb(40, 199, 111)', opacity: 0.85, mb: 1 }}
              >
                المبلغ المتبقي
              </Typography>
              <Typography variant='h4' sx={{ color: balance > 0 ? 'rgb(234, 84, 85)' : 'rgb(40, 199, 111)' }}>
                {formatCurrency(balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Bar */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='h6'>حالة الدفع</Typography>
              <Chip
                label={statusLabels[invoice.status] || invoice.status}
                color={statusColors[invoice.status] || 'default'}
                size='small'
              />
            </Box>
            <Typography variant='h6' color='primary.main'>
              {Math.round(paymentProgress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={paymentProgress}
            color={paymentProgress >= 100 ? 'success' : 'primary'}
            sx={{ height: 12, borderRadius: 6 }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Patient & Visit Info */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                معلومات المريض والزيارة
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    المريض
                  </Typography>
                  <Typography
                    variant='body1'
                    fontWeight={500}
                    sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => router.push(`/patients/${invoice.patient.id}`)}
                  >
                    {invoice.patient.fullName}
                  </Typography>
                  {invoice.patient.phone && (
                    <Typography variant='caption' color='text.secondary' display='block'>
                      {invoice.patient.phone}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={6}>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    الطبيب
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {invoice.visit.dentist.fullName}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    العلاج
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {invoice.visit.medicalCase.name}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    تاريخ الموعد
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {formatDateTime(invoice.visit.appointment.startTime)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment History */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                سجل الدفعات
              </Typography>

              {invoice.payments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color='text.secondary' sx={{ mb: 2 }}>
                    لا توجد دفعات مسجلة بعد
                  </Typography>
                  {canAddPayment && (
                    <Button variant='contained' color='success' onClick={() => setPaymentDialogOpen(true)}>
                      إضافة أول دفعة
                    </Button>
                  )}
                </Box>
              ) : (
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>التاريخ</TableCell>
                        <TableCell>المستلم</TableCell>
                        <TableCell align='right'>المبلغ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.payments.map(payment => (
                        <TableRow key={payment.id} hover>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell>{payment.creator.fullName}</TableCell>
                          <TableCell align='right' sx={{ color: 'success.main', fontWeight: 600 }}>
                            {formatCurrency(payment.amountSyp)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={2}>
                          <Typography fontWeight={600}>إجمالي المدفوع</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography fontWeight={600} color='success.main'>
                            {formatCurrency(invoice.paidAmountSyp)}
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
        <DialogTitle>إضافة دفعة جديدة</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity='info' sx={{ mb: 3 }}>
              المبلغ المتبقي: <strong>{formatCurrency(balance)}</strong>
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
                  label='مبلغ الدفعة'
                  type='number'
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>ل.س</InputAdornment>
                  }}
                  inputProps={{ min: 1, max: balance, step: '1' }}
                  disabled={submitting}
                  helperText={`الحد الأقصى: ${formatCurrency(balance)}`}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='تاريخ الدفع'
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
            إلغاء
          </Button>
          <Button
            onClick={handlePaymentClick}
            variant='contained'
            color='success'
            disabled={submitting || !paymentAmount}
            startIcon={submitting && <CircularProgress size={20} />}
          >
            {submitting ? 'جاري المعالجة...' : 'إضافة الدفعة'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => !submitting && setConfirmDialogOpen(false)} maxWidth='sm'>
        <DialogTitle>تأكيد الدفعة</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              أنت على وشك تسجيل دفعة جديدة
            </Typography>
            <Typography variant='body2'>
              <strong>المبلغ:</strong> {formatCurrency(parseFloat(paymentAmount || '0'))}
              <br />
              <strong>التاريخ:</strong> {formatDate(paymentDate)}
            </Typography>
          </Alert>
          <Typography variant='body2' color='text.secondary'>
            هذا الإجراء سيحدث حالة الفاتورة ولا يمكن التراجع عنه. هل أنت متأكد من المتابعة؟
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            onClick={handleConfirmPayment}
            variant='contained'
            color='success'
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={20} />}
          >
            {submitting ? 'جاري المعالجة...' : 'تأكيد الدفعة'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default InvoiceDetailPage
