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
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

import { useLanguage } from '@/contexts/LanguageContext'
import { getBilingualField } from '@/utils/bilingual'

type Appointment = {
  id: string
  startTime: string
  endTime: string
  status: string
  basePriceSyp: string
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
    nameAr: string | null
  }
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  SCHEDULED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'error'
}

const AppointmentsPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t, language } = useLanguage()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  })

  const isManager = session?.user?.role === 'MANAGER'

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.status) params.append('status', filters.status)
      if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString())
      if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString())

      const url = `/api/appointments${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(t('appointments.fetchError'))
      }

      const data = await response.json()

      setAppointments(data)
      setError('')
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SY', {
      weekday: 'long',
      month: 'long',
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

  const clearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '' })
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='h4'>{t('appointments.title')}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {isManager ? t('appointments.allAppointments') : t('appointments.yourAppointments')}
              </Typography>
            </Box>
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => router.push('/appointments/new')}
            >
              {t('appointments.newAppointment')}
            </Button>
          </Box>

          <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)} sx={{ mb: 3 }}>
            <Tab
              label={t('appointments.listView')}
              value='list'
              icon={<i className='tabler-list' />}
              iconPosition='start'
            />
            <Tab
              label={t('appointments.calendarView')}
              value='calendar'
              icon={<i className='tabler-calendar' />}
              iconPosition='start'
            />
          </Tabs>

          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                select
                fullWidth
                label={t('common.status')}
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
                size='small'
              >
                <MenuItem value=''>{t('appointments.allStatuses')}</MenuItem>
                <MenuItem value='SCHEDULED'>{t('appointments.scheduled')}</MenuItem>
                <MenuItem value='COMPLETED'>{t('appointments.completed')}</MenuItem>
                <MenuItem value='CANCELLED'>{t('appointments.cancelled')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
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
            <Grid item xs={12} sm={4} md={3}>
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
            <Grid item xs={12} sm={12} md={3}>
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

      {viewMode === 'list' ? (
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : appointments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant='h6' color='text.secondary'>
                  {t('appointments.noAppointments')}
                </Typography>
                <Button variant='contained' sx={{ mt: 2 }} onClick={() => router.push('/appointments/new')}>
                  {t('appointments.createFirst')}
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('appointments.dateTime')}</TableCell>
                      <TableCell>{t('appointments.patient')}</TableCell>
                      {isManager && <TableCell>{t('appointments.dentist')}</TableCell>}
                      <TableCell>{t('appointments.treatment')}</TableCell>
                      <TableCell>{t('common.status')}</TableCell>
                      <TableCell align='right'>{t('appointments.price')}</TableCell>
                      <TableCell align='right'>{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.map(appointment => (
                      <TableRow key={appointment.id} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight={500}>
                            {formatDateTime(appointment.startTime)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{appointment.patient.fullName}</Typography>
                          {appointment.patient.phone && (
                            <Typography variant='caption' color='text.secondary'>
                              {appointment.patient.phone}
                            </Typography>
                          )}
                        </TableCell>
                        {isManager && <TableCell>{appointment.dentist.fullName}</TableCell>}
                        <TableCell>
                          {getBilingualField(appointment.medicalCase.name, appointment.medicalCase.nameAr, language)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t(`appointments.status_${appointment.status.toLowerCase()}`)}
                            color={statusColors[appointment.status] || 'default'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='right'>{formatCurrency(appointment.basePriceSyp)}</TableCell>
                        <TableCell align='right'>
                          <IconButton size='small' onClick={() => router.push(`/appointments/${appointment.id}`)}>
                            <i className='tabler-eye' />
                          </IconButton>
                          {!['COMPLETED', 'CANCELLED'].includes(appointment.status) && (
                            <IconButton
                              size='small'
                              onClick={() => router.push(`/appointments/${appointment.id}/edit`)}
                            >
                              <i className='tabler-edit' />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <CalendarView appointments={appointments} onAppointmentClick={id => router.push(`/appointments/${id}`)} />
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

// Simple Calendar View Component
const CalendarView = ({
  appointments,
  onAppointmentClick
}: {
  appointments: Appointment[]
  onAppointmentClick: (id: string) => void
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []

    // Add padding for days before the first day of month
    const startPadding = firstDay.getDay()

    for (let i = startPadding - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i))
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime)

      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleString('ar-SY', { month: 'long', year: 'numeric' })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
          <i className='tabler-chevron-left' />
        </IconButton>
        <Typography variant='h5'>{monthName}</Typography>
        <IconButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
          <i className='tabler-chevron-right' />
        </IconButton>
      </Box>

      <Grid container spacing={1}>
        {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
          <Grid item xs={12 / 7} key={day}>
            <Typography variant='caption' fontWeight={600} textAlign='center' display='block'>
              {day}
            </Typography>
          </Grid>
        ))}

        {days.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <Grid item xs={12 / 7} key={index}>
              <Box
                sx={{
                  minHeight: 80,
                  p: 0.5,
                  border: '1px solid',
                  borderColor: isToday ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  bgcolor: isCurrentMonth ? 'background.paper' : 'action.hover',
                  opacity: isCurrentMonth ? 1 : 0.5
                }}
              >
                <Typography variant='caption' fontWeight={isToday ? 600 : 400}>
                  {day.getDate()}
                </Typography>
                {dayAppointments.slice(0, 2).map(apt => (
                  <Box
                    key={apt.id}
                    onClick={() => onAppointmentClick(apt.id)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: statusColors[apt.status] === 'success' ? 'success.light' : 'primary.light',
                      color: 'primary.contrastText',
                      borderRadius: 0.5,
                      px: 0.5,
                      py: 0.25,
                      mb: 0.25,
                      fontSize: '0.65rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      '&:hover': { opacity: 0.8 }
                    }}
                  >
                    {new Date(apt.startTime).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {apt.patient.fullName.split(' ')[0]}
                  </Box>
                ))}
                {dayAppointments.length > 2 && (
                  <Typography variant='caption' color='text.secondary'>
                    +{dayAppointments.length - 2} المزيد
                  </Typography>
                )}
              </Box>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

export default AppointmentsPage
