'use client'

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'

import { useLanguage } from '@/contexts/LanguageContext'
import { getBilingualField } from '@/utils/bilingual'

type Appointment = {
  id: string
  startTime: string
  endTime: string
  status: string
  basePriceSyp: string
  notes: string | null
  cancellationReason: string | null
  patient: {
    id: string
    fullName: string
    phone: string | null
    email: string | null
  }
  dentist: {
    id: string
    fullName: string
    email: string
  }
  medicalCase: {
    id: string
    name: string
    nameAr: string | null
    defaultPrice: string
  }
  visit: {
    id: string
    notes: string | null
    invoice: {
      id: string
      status: string
      totalAmountSyp: string
      paidAmountSyp: string
    } | null
  } | null
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  SCHEDULED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'error'
}

// حسب المواصفات: SCHEDULED → COMPLETED أو CANCELLED فقط
const statusTransitions: Record<string, string[]> = {
  SCHEDULED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
}

const AppointmentDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string
  const { t, language } = useLanguage()

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [notes, setNotes] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(t('appointments.notFound'))
          }

          if (response.status === 403) {
            throw new Error(t('common.accessDenied'))
          }

          throw new Error(t('appointments.fetchError'))
        }

        const data = await response.json()

        setAppointment(data)
      } catch (err: any) {
        setError(err.message || t('common.error'))
      } finally {
        setLoading(false)
      }
    }

    fetchAppointment()
  }, [appointmentId])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined) return '0 ل.س'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount

    if (isNaN(num)) return '0 ل.س'

    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const handleStatusChange = async () => {
    if (!newStatus) return

    // إذا كانت الحالة CANCELLED، يجب اختيار سبب الإلغاء
    if (newStatus === 'CANCELLED' && !cancellationReason) {
      setError(t('appointments.selectCancellationReason'))

      return
    }

    setUpdating(true)
    setError('')

    try {
      const body: {
        status: string
        cancellationReason?: string
        notes?: string
        paidAmountSyp?: number
      } = { status: newStatus }

      if (newStatus === 'CANCELLED') {
        body.cancellationReason = cancellationReason
      }

      if (newStatus === 'COMPLETED') {
        if (notes.trim()) {
          body.notes = notes.trim()
        }

        if (paidAmount && parseFloat(paidAmount) > 0) {
          body.paidAmountSyp = parseFloat(paidAmount)
        }
      }

      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('appointments.statusUpdateError'))
      }

      // Refresh appointment data
      const refreshResponse = await fetch(`/api/appointments/${appointmentId}`)

      if (refreshResponse.ok) {
        setAppointment(await refreshResponse.json())
      }

      setStatusDialogOpen(false)
      setNewStatus('')
      setCancellationReason('')
      setNotes('')
      setPaidAmount('')
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setUpdating(false)
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
        <Button sx={{ ml: 2 }} onClick={() => router.push('/appointments')}>
          {t('appointments.backToList')}
        </Button>
      </Alert>
    )
  }

  if (!appointment) {
    return null
  }

  const availableTransitions = statusTransitions[appointment.status] || []
  const isTerminal = availableTransitions.length === 0

  return (
    <Box dir='rtl'>
      {/* Header Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ py: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant='h5' sx={{ color: 'white', fontWeight: 'bold' }}>
                  {t('appointments.appointmentDetails')}
                </Typography>
                <Chip
                  label={t(`appointments.status_${appointment.status.toLowerCase()}`)}
                  color={statusColors[appointment.status] || 'default'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                📅 {formatDateTime(appointment.startTime)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant='contained'
                onClick={() => router.push('/appointments')}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                {t('appointments.backToList')}
              </Button>
              {!isTerminal && (
                <>
                  <Button
                    variant='contained'
                    onClick={() => router.push(`/appointments/${appointmentId}/edit`)}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant='contained'
                    onClick={() => setStatusDialogOpen(true)}
                    sx={{ bgcolor: 'white', color: '#667eea', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                  >
                    {t('appointments.changeStatus')}
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Main Content - Two Column Layout */}
        {/* Right Column - Appointment & Treatment Info */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
                <Typography variant='h6' fontWeight='bold'>
                  {t('appointments.appointmentInfo')}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      ⏰ {t('appointments.dateTime')}
                    </Typography>
                    <Typography variant='body1' fontWeight='medium'>
                      {formatDateTime(appointment.startTime)}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {t('appointments.to')}{' '}
                      {new Date(appointment.endTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      🦷 {t('appointments.treatment')}
                    </Typography>
                    <Typography variant='body1' fontWeight='medium'>
                      {getBilingualField(appointment.medicalCase.name, appointment.medicalCase.nameAr, language)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
                    <Typography variant='caption' sx={{ opacity: 0.9 }} display='block'>
                      💰 {t('appointments.price')}
                    </Typography>
                    <Typography variant='h5' fontWeight='bold'>
                      {formatCurrency(appointment.basePriceSyp)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      👨‍⚕️ {t('appointments.dentist')}
                    </Typography>
                    <Typography variant='body1' fontWeight='medium'>
                      {appointment.dentist.fullName}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {appointment.dentist.email}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Notes Section */}
              {(appointment.notes ||
                appointment.visit?.notes ||
                (appointment.status === 'CANCELLED' && appointment.cancellationReason)) && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />

                  {(appointment.notes || appointment.visit?.notes) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                        📝 {t('appointments.notes')}
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ whiteSpace: 'pre-wrap', bgcolor: 'action.hover', p: 2, borderRadius: 1 }}
                      >
                        {appointment.visit?.notes || appointment.notes}
                      </Typography>
                    </Box>
                  )}

                  {appointment.status === 'CANCELLED' && appointment.cancellationReason && (
                    <Box>
                      <Typography variant='subtitle2' color='error' gutterBottom>
                        ❌ {t('appointments.cancellationReason')}
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ bgcolor: 'error.lighter', p: 2, borderRadius: 1, color: 'error.main' }}
                      >
                        {t(`appointments.reason_${appointment.cancellationReason.toLowerCase()}`)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Invoice Card (if completed) */}
          {appointment.visit?.invoice && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 4, height: 24, bgcolor: 'success.main', borderRadius: 1 }} />
                    <Typography variant='h6' fontWeight='bold'>
                      {t('appointments.visitInvoice')}
                    </Typography>
                  </Box>
                  <Chip
                    label={t(`invoices.${appointment.visit.invoice.status.toLowerCase()}`)}
                    color={
                      appointment.visit.invoice.status === 'PAID'
                        ? 'success'
                        : appointment.visit.invoice.status === 'UNPAID'
                          ? 'error'
                          : 'warning'
                    }
                    size='small'
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant='caption' color='text.secondary' display='block'>
                        {t('invoices.totalAmount')}
                      </Typography>
                      <Typography variant='h6' fontWeight='bold'>
                        {formatCurrency(appointment.visit.invoice.totalAmountSyp)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                      <Typography variant='caption' color='text.secondary' display='block'>
                        {t('invoices.paidAmount')}
                      </Typography>
                      <Typography variant='h6' fontWeight='bold' color='success.main'>
                        {formatCurrency(appointment.visit.invoice.paidAmountSyp)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        bgcolor:
                          parseFloat(appointment.visit.invoice.totalAmountSyp) -
                            parseFloat(appointment.visit.invoice.paidAmountSyp) >
                          0
                            ? 'error.lighter'
                            : 'success.lighter',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant='caption' color='text.secondary' display='block'>
                        {t('invoices.balance')}
                      </Typography>
                      <Typography
                        variant='h6'
                        fontWeight='bold'
                        color={
                          parseFloat(appointment.visit.invoice.totalAmountSyp) -
                            parseFloat(appointment.visit.invoice.paidAmountSyp) >
                          0
                            ? 'error.main'
                            : 'success.main'
                        }
                      >
                        {formatCurrency(
                          parseFloat(appointment.visit.invoice.totalAmountSyp) -
                            parseFloat(appointment.visit.invoice.paidAmountSyp)
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Left Column - Patient Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Box sx={{ width: 4, height: 24, bgcolor: 'info.main', borderRadius: 1 }} />
                <Typography variant='h6' fontWeight='bold'>
                  {t('appointments.patientInfo')}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  {appointment.patient.fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </Box>
                <Typography
                  variant='h6'
                  sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                  onClick={() => router.push(`/patients/${appointment.patient.id}`)}
                >
                  {appointment.patient.fullName}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    📞
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      {t('common.phone')}
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {appointment.patient.phone || t('appointments.notProvided')}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✉️
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      {t('common.email')}
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {appointment.patient.email || t('appointments.notProvided')}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Button
                fullWidth
                variant='outlined'
                sx={{ mt: 3 }}
                onClick={() => router.push(`/patients/${appointment.patient.id}`)}
              >
                {t('patients.viewProfile')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>{t('appointments.changeStatus')}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {t('appointments.currentStatus')}:{' '}
            <strong>{t(`appointments.status_${appointment.status.toLowerCase()}`)}</strong>
          </Typography>
          <TextField
            select
            fullWidth
            label={t('appointments.newStatus')}
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            sx={{ mt: 1 }}
          >
            {availableTransitions.map(status => (
              <MenuItem key={status} value={status}>
                {t(`appointments.status_${status.toLowerCase()}`)}
              </MenuItem>
            ))}
          </TextField>
          {newStatus === 'COMPLETED' && (
            <>
              <Alert severity='info' sx={{ mt: 2 }}>
                {t('appointments.completeWarning')}
              </Alert>
              <TextField
                fullWidth
                label={t('appointments.notes')}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                sx={{ mt: 2 }}
                multiline
                rows={3}
                placeholder={t('appointments.notesPlaceholder')}
              />
              <TextField
                fullWidth
                label={t('appointments.paidAmount')}
                type='number'
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>ل.س</InputAdornment>
                }}
                inputProps={{ min: 0, step: '1' }}
                helperText={t('appointments.paidAmountHelper')}
              />
            </>
          )}
          {newStatus === 'CANCELLED' && (
            <TextField
              select
              fullWidth
              label={t('appointments.cancellationReason')}
              value={cancellationReason}
              onChange={e => setCancellationReason(e.target.value)}
              sx={{ mt: 2 }}
              required
            >
              <MenuItem value='NO_SHOW'>{t('appointments.reason_no_show')}</MenuItem>
              <MenuItem value='PATIENT_CANCELLED'>{t('appointments.reason_patient_cancelled')}</MenuItem>
              <MenuItem value='CLINIC_CANCELLED'>{t('appointments.reason_clinic_cancelled')}</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} disabled={updating}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleStatusChange} variant='contained' disabled={updating || !newStatus}>
            {updating ? t('appointments.updating') : t('appointments.updateStatus')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AppointmentDetailPage
