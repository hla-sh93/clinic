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
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

import { useLanguage } from '@/contexts/LanguageContext'

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
    dentist: {
      id: string
      fullName: string
    }
    medicalCase: {
      id: string
      name: string
    }
  }
  _count?: {
    payments: number
  }
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

const InvoicesPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    outstandingOnly: false
  })

  const isManager = session?.user?.role === 'MANAGER'

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.outstandingOnly) {
        params.append('outstanding', 'true')
      } else {
        if (filters.status) params.append('status', filters.status)
        if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString())
        if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString())
      }

      const url = `/api/invoices${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(t('invoices.fetchError'))
      }

      const data = await response.json()

      setInvoices(data)
      setError('')
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (isManager) {
      fetchInvoices()
    }
  }, [fetchInvoices, isManager])

  // Redirect non-managers
  if (!isManager) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>{t('invoices.managerOnly')}</Alert>
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getBalance = (invoice: Invoice) => {
    return parseFloat(invoice.totalAmountSyp) - parseFloat(invoice.paidAmountSyp)
  }

  const clearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '', outstandingOnly: false })
  }

  // Calculate totals
  const totals = invoices.reduce(
    (acc, inv) => ({
      total: acc.total + parseFloat(inv.totalAmountSyp),
      paid: acc.paid + parseFloat(inv.paidAmountSyp),
      outstanding: acc.outstanding + getBalance(inv)
    }),
    { total: 0, paid: 0, outstanding: 0 }
  )

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='h4'>{t('invoices.title')}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('invoices.subtitle')}
              </Typography>
            </Box>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(115, 103, 240, 0.15)',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'rgba(115, 103, 240, 0.3)'
                }}
              >
                <Typography variant='body2' sx={{ color: 'rgb(115, 103, 240)', opacity: 0.85 }}>
                  {t('invoices.totalInvoiced')}
                </Typography>
                <Typography variant='h5' sx={{ color: 'rgb(115, 103, 240)' }}>
                  {formatCurrency(totals.total)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(40, 199, 111, 0.15)',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'rgba(40, 199, 111, 0.3)'
                }}
              >
                <Typography variant='body2' sx={{ color: 'rgb(40, 199, 111)', opacity: 0.85 }}>
                  {t('invoices.totalCollected')}
                </Typography>
                <Typography variant='h5' sx={{ color: 'rgb(40, 199, 111)' }}>
                  {formatCurrency(totals.paid)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(234, 84, 85, 0.15)',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'rgba(234, 84, 85, 0.3)'
                }}
              >
                <Typography variant='body2' sx={{ color: 'rgb(234, 84, 85)', opacity: 0.85 }}>
                  {t('reports.outstanding')}
                </Typography>
                <Typography variant='h5' sx={{ color: 'rgb(234, 84, 85)' }}>
                  {formatCurrency(totals.outstanding)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Filters */}
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.outstandingOnly}
                    onChange={e => setFilters({ ...filters, outstandingOnly: e.target.checked })}
                  />
                }
                label={t('invoices.outstandingOnly')}
              />
            </Grid>
            {!filters.outstandingOnly && (
              <>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label={t('common.status')}
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                    size='small'
                  >
                    <MenuItem value=''>{t('invoices.allStatuses')}</MenuItem>
                    <MenuItem value='UNPAID'>{t('invoices.unpaid')}</MenuItem>
                    <MenuItem value='PARTIALLY_PAID'>{t('invoices.partiallyPaid')}</MenuItem>
                    <MenuItem value='PAID'>{t('invoices.paid')}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={2}>
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
                <Grid item xs={12} sm={2}>
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
              </>
            )}
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
          ) : invoices.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' color='text.secondary'>
                {t('invoices.noInvoices')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('invoices.autoCreated')}
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
                    <TableCell>{t('appointments.dentist')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell align='right'>{t('common.total')}</TableCell>
                    <TableCell align='right'>{t('invoices.paid')}</TableCell>
                    <TableCell align='right'>{t('invoices.balance')}</TableCell>
                    <TableCell align='right'>{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map(invoice => {
                    const balance = getBalance(invoice)

                    return (
                      <TableRow key={invoice.id} hover>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell>
                          <Typography variant='body2'>{invoice.patient.fullName}</Typography>
                          {invoice.patient.phone && (
                            <Typography variant='caption' color='text.secondary'>
                              {invoice.patient.phone}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{invoice.visit.medicalCase.name}</TableCell>
                        <TableCell>{invoice.visit.dentist.fullName}</TableCell>
                        <TableCell>
                          <Chip
                            label={statusLabels[invoice.status] || invoice.status}
                            color={statusColors[invoice.status] || 'default'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='right'>{formatCurrency(invoice.totalAmountSyp)}</TableCell>
                        <TableCell align='right' sx={{ color: 'success.main' }}>
                          {formatCurrency(invoice.paidAmountSyp)}
                        </TableCell>
                        <TableCell align='right' sx={{ color: balance > 0 ? 'error.main' : 'text.primary' }}>
                          {formatCurrency(balance)}
                        </TableCell>
                        <TableCell align='right'>
                          <IconButton size='small' onClick={() => router.push(`/invoices/${invoice.id}`)}>
                            <i className='tabler-eye' />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default InvoicesPage
