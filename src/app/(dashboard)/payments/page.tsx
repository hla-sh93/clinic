'use client'

import { useState, useEffect } from 'react'

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
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import InputAdornment from '@mui/material/InputAdornment'

import { useLanguage } from '@/contexts/LanguageContext'

type Payment = {
  id: string
  amount: string
  method: string
  createdAt: string
  invoice: {
    id: string
    patient: {
      fullName: string
      phone: string | null
    }
    visit: {
      medicalCase: {
        name: string
      }
    }
  }
  createdBy: {
    fullName: string
  }
}

const PaymentsPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({
    method: '',
    startDate: '',
    endDate: ''
  })

  const isManager = session?.user?.role === 'MANAGER'

  // Add payment dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    method: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0]
  })

  const fetchUnpaidInvoices = async () => {
    try {
      setLoadingInvoices(true)
      const response = await fetch('/api/invoices?status=ISSUED,PARTIALLY_PAID')

      if (response.ok) {
        const data = await response.json()

        setUnpaidInvoices(data)
      }
    } catch (err) {
      console.error('Failed to fetch invoices', err)
    } finally {
      setLoadingInvoices(false)
    }
  }

  const handleAddPayment = async () => {
    if (!paymentForm.invoiceId || !paymentForm.amount) {
      setSaveError('Please select an invoice and enter an amount')

      return
    }

    setSaving(true)
    setSaveError('')

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: paymentForm.invoiceId,
          amount: parseFloat(paymentForm.amount),
          method: paymentForm.method,
          paymentDate: paymentForm.paymentDate
        })
      })

      if (!response.ok) {
        const data = await response.json()

        throw new Error(data.error || 'Failed to add payment')
      }

      setAddDialogOpen(false)
      setPaymentForm({ invoiceId: '', amount: '', method: 'CASH', paymentDate: new Date().toISOString().split('T')[0] })
      fetchPayments()
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openAddDialog = () => {
    fetchUnpaidInvoices()
    setSaveError('')
    setAddDialogOpen(true)
  }

  const selectedInvoice = unpaidInvoices.find(inv => inv.id === paymentForm.invoiceId)

  const remainingBalance = selectedInvoice
    ? parseFloat(selectedInvoice.totalAmount) - parseFloat(selectedInvoice.paidAmount)
    : 0

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.method) params.append('method', filters.method)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/payments?${params.toString()}`)

      if (!response.ok) {
        throw new Error(t('payments.fetchError'))
      }

      const data = await response.json()

      setPayments(data)
      setError('')
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const clearFilters = () => {
    setFilters({ method: '', startDate: '', endDate: '' })
  }

  const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)

  if (!isManager) {
    return (
      <Box>
        <Alert severity='error' sx={{ mb: 4 }}>
          {t('payments.managerOnly')}
        </Alert>
        <Button variant='outlined' onClick={() => router.push('/dashboard')}>
          {t('common.back')}
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='h4'>{t('payments.title')}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('payments.subtitle')}
              </Typography>
            </Box>
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openAddDialog}>
              {t('payments.addPayment')}
            </Button>
          </Box>

          <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant='h6' color='primary.contrastText'>
              {t('payments.totalCollected')}: {formatCurrency(totalPayments)}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label={t('payments.paymentMethod')}
                value={filters.method}
                onChange={e => setFilters({ ...filters, method: e.target.value })}
                size='small'
              >
                <MenuItem value=''>{t('payments.allMethods')}</MenuItem>
                <MenuItem value='CASH'>{t('payments.cash')}</MenuItem>
                <MenuItem value='INSTALLMENTS'>{t('payments.installments')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                type='date'
                fullWidth
                label={t('appointments.fromDate')}
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
                label={t('appointments.toDate')}
                value={filters.endDate}
                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                size='small'
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button variant='outlined' onClick={clearFilters} fullWidth sx={{ height: '40px' }}>
                {t('common.clearFilters')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity='error' sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : payments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' color='text.secondary'>
                {t('payments.noPayments')}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('common.date')}</TableCell>
                    <TableCell>{t('appointments.patient')}</TableCell>
                    <TableCell>{t('appointments.treatment')}</TableCell>
                    <TableCell>{t('payments.paymentMethod')}</TableCell>
                    <TableCell align='right'>{t('common.amount')}</TableCell>
                    <TableCell>{t('payments.receivedBy')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map(payment => (
                    <TableRow key={payment.id} hover>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      <TableCell>
                        <Typography variant='body2'>{payment.invoice.patient.fullName}</Typography>
                        {payment.invoice.patient.phone && (
                          <Typography variant='caption' color='text.secondary'>
                            {payment.invoice.patient.phone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{payment.invoice.visit.medicalCase.name}</TableCell>
                      <TableCell>
                        <Chip label={t(`payments.${payment.method.toLowerCase()}`)} size='small' />
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body1' fontWeight={600} color='success.main'>
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>{payment.createdBy.fullName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('payments.addPayment')}</DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity='error' sx={{ mb: 3 }}>
              {saveError}
            </Alert>
          )}
          {loadingInvoices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('payments.selectInvoice')}</InputLabel>
                  <Select
                    value={paymentForm.invoiceId}
                    label={t('payments.selectInvoice')}
                    onChange={e => setPaymentForm({ ...paymentForm, invoiceId: e.target.value, amount: '' })}
                  >
                    {unpaidInvoices.map(invoice => (
                      <MenuItem key={invoice.id} value={invoice.id}>
                        {invoice.patient.fullName} - {t('payments.remaining')}:{' '}
                        {formatCurrency(parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount))}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {selectedInvoice && (
                <Grid item xs={12}>
                  <Alert severity='info'>
                    {t('payments.invoiceTotal')}: {formatCurrency(selectedInvoice.totalAmount)} | {t('payments.paid')}:{' '}
                    {formatCurrency(selectedInvoice.paidAmount)} | {t('payments.remaining')}:{' '}
                    {formatCurrency(remainingBalance)}
                  </Alert>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('common.amount')}
                  type='number'
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  InputProps={{
                    endAdornment: <InputAdornment position='end'>SYP</InputAdornment>
                  }}
                  helperText={selectedInvoice ? `Max: ${remainingBalance.toLocaleString()} SYP` : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label={t('payments.paymentMethod')}
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                >
                  <MenuItem value='CASH'>{t('payments.cash')}</MenuItem>
                  <MenuItem value='INSTALLMENTS'>{t('payments.installments')}</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type='date'
                  label={t('payments.paymentDate')}
                  value={paymentForm.paymentDate}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant='contained' onClick={handleAddPayment} disabled={saving || !paymentForm.invoiceId}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PaymentsPage
