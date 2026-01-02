'use client'

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Avatar from '@mui/material/Avatar'

type Appointment = {
  id: string
  startTime: string
  endTime: string
  status: string
  basePriceSyp: string
  notes: string | null
  dentist: {
    id: string
    fullName: string
  }
  medicalCase: {
    id: string
    name: string
  }
}

type Invoice = {
  id: string
  totalAmountSyp: string
  paidAmountSyp: string
  status: string
  createdAt: string
  visit: {
    medicalCase: {
      name: string
    }
    notes: string | null
  } | null
}

type Patient = {
  id: string
  fullName: string
  phone: string
  gender: string
  maritalStatus: string
  dateOfBirth: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  appointments: Appointment[]
  invoices: Invoice[]
}

const statusLabels: Record<string, string> = {
  SCHEDULED: 'مجدول',
  CONFIRMED: 'مؤكد',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
  NO_SHOW: 'لم يحضر',
  ISSUED: 'صادرة',
  PARTIAL: 'مدفوع جزئياً',
  PAID: 'مدفوعة',
  VOID: 'ملغاة'
}

const PatientProfilePage = () => {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [deactivateError, setDeactivateError] = useState('')

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${patientId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('المريض غير موجود')
          }

          throw new Error('فشل في جلب بيانات المريض')
        }

        const data = await response.json()

        setPatient(data)
      } catch (err: any) {
        setError(err.message || 'حدث خطأ')
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [patientId])

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      SCHEDULED: 'info',
      CONFIRMED: 'primary',
      IN_PROGRESS: 'warning',
      COMPLETED: 'success',
      CANCELLED: 'error',
      NO_SHOW: 'default',
      ISSUED: 'info',
      PARTIAL: 'warning',
      PAID: 'success',
      VOID: 'error'
    }

    return colors[status] || 'default'
  }

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status
  }

  const calculateFinancialSummary = () => {
    if (!patient || !patient.invoices) return { total: 0, paid: 0, outstanding: 0 }

    const total = patient.invoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmountSyp) || 0), 0)
    const paid = patient.invoices.reduce((sum, inv) => sum + (parseFloat(inv.paidAmountSyp) || 0), 0)

    return {
      total,
      paid,
      outstanding: total - paid
    }
  }

  const handleDeactivate = async () => {
    setDeactivating(true)
    setDeactivateError('')

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false })
      })

      if (!response.ok) {
        const data = await response.json()

        throw new Error(data.error || 'فشل في تعطيل المريض')
      }

      const updatedPatient = await response.json()

      setPatient(updatedPatient)
      setDeactivateDialogOpen(false)
    } catch (err: any) {
      setDeactivateError(err.message || 'حدث خطأ')
    } finally {
      setDeactivating(false)
    }
  }

  const handleReactivate = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      })

      if (!response.ok) {
        throw new Error('فشل في تفعيل المريض')
      }

      const updatedPatient = await response.json()

      setPatient(updatedPatient)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
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
      </Alert>
    )
  }

  if (!patient) {
    return null
  }

  const financialSummary = calculateFinancialSummary()

  return (
    <Box dir='rtl'>
      {/* Header Card */}
      <Card sx={{ mb: 4, overflow: 'visible' }}>
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 3
            }}
          >
            {/* Patient Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: '1.75rem',
                  bgcolor: patient.isActive ? 'primary.main' : 'grey.400',
                  fontWeight: 'bold'
                }}
              >
                {getInitials(patient.fullName)}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant='h4' fontWeight='bold'>
                    {patient.fullName}
                  </Typography>
                  <Chip
                    label={patient.isActive ? 'نشط' : 'غير نشط'}
                    color={patient.isActive ? 'success' : 'default'}
                    size='small'
                    sx={{ fontWeight: 'medium' }}
                  />
                </Box>
                <Typography variant='body1' color='text.secondary'>
                  مريض منذ {formatDate(patient.createdAt)}
                </Typography>
                {patient.phone && (
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                    <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                      📞 {patient.phone}
                    </Box>
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant='outlined' onClick={() => router.push('/patients')} size='large'>
                العودة للقائمة
              </Button>
              <Button variant='contained' onClick={() => router.push(`/patients/${patientId}/edit`)} size='large'>
                تعديل البيانات
              </Button>
              {patient.isActive ? (
                <Button variant='outlined' color='error' onClick={() => setDeactivateDialogOpen(true)} size='large'>
                  تعطيل المريض
                </Button>
              ) : (
                <Button variant='outlined' color='success' onClick={handleReactivate} size='large'>
                  تفعيل المريض
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deactivateDialogOpen} onClose={() => setDeactivateDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>تعطيل المريض</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من تعطيل المريض {patient.fullName}؟ لن يتمكن من حجز مواعيد جديدة.
          </DialogContentText>
          {deactivateError && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {deactivateError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeactivateDialogOpen(false)} disabled={deactivating} variant='outlined'>
            إلغاء
          </Button>
          <Button onClick={handleDeactivate} color='error' variant='contained' disabled={deactivating}>
            {deactivating ? 'جاري التعطيل...' : 'تعطيل'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant='h3' color='primary.main' fontWeight='bold'>
                {patient.appointments.length}
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
                المواعيد
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant='h3' color='info.main' fontWeight='bold'>
                {patient.invoices.length}
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
                الفواتير
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant='h3' color='success.main' fontWeight='bold'>
                {formatCurrency(financialSummary.paid)}
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
                المدفوع
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography
                variant='h3'
                color={financialSummary.outstanding > 0 ? 'error.main' : 'text.primary'}
                fontWeight='bold'
              >
                {formatCurrency(financialSummary.outstanding)}
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
                المتبقي
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <TabContext value={activeTab}>
          <TabList onChange={(_, value) => setActiveTab(value)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tab label='نظرة عامة' value='overview' sx={{ fontWeight: 'medium', fontSize: '1rem' }} />
            <Tab label='المواعيد' value='visits' sx={{ fontWeight: 'medium', fontSize: '1rem' }} />
            <Tab label='الفواتير والمدفوعات' value='financial' sx={{ fontWeight: 'medium', fontSize: '1rem' }} />
          </TabList>

          {/* Overview Tab */}
          <TabPanel value='overview' sx={{ p: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ mb: 3, fontWeight: 'bold' }}>
                  معلومات التواصل
                </Typography>
                <Card variant='outlined'>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body1' color='text.secondary'>
                          رقم الهاتف
                        </Typography>
                        <Typography variant='body1' fontWeight='medium'>
                          {patient.phone || 'غير متوفر'}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body1' color='text.secondary'>
                          الجنس
                        </Typography>
                        <Typography variant='body1' fontWeight='medium'>
                          {patient.gender === 'MALE' ? 'ذكر' : patient.gender === 'FEMALE' ? 'أنثى' : 'غير محدد'}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body1' color='text.secondary'>
                          الحالة الاجتماعية
                        </Typography>
                        <Typography variant='body1' fontWeight='medium'>
                          {patient.maritalStatus === 'SINGLE'
                            ? 'أعزب/عزباء'
                            : patient.maritalStatus === 'MARRIED'
                              ? 'متزوج/ة'
                              : patient.maritalStatus === 'DIVORCED'
                                ? 'مطلق/ة'
                                : patient.maritalStatus === 'WIDOWED'
                                  ? 'أرمل/ة'
                                  : 'غير محدد'}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body1' color='text.secondary'>
                          العمر
                        </Typography>
                        <Typography variant='body1' fontWeight='medium'>
                          {patient.dateOfBirth
                            ? `${Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} سنة`
                            : 'غير محدد'}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body1' color='text.secondary'>
                          تاريخ التسجيل
                        </Typography>
                        <Typography variant='body1' fontWeight='medium'>
                          {formatDate(patient.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ mb: 3, fontWeight: 'bold' }}>
                  ملخص مالي
                </Typography>
                <Card variant='outlined'>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body1' color='text.secondary'>
                          إجمالي الفواتير
                        </Typography>
                        <Typography variant='body1' fontWeight='bold'>
                          {formatCurrency(financialSummary.total)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body1' color='text.secondary'>
                          المبلغ المدفوع
                        </Typography>
                        <Typography variant='body1' fontWeight='bold' color='success.main'>
                          {formatCurrency(financialSummary.paid)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body1' color='text.secondary'>
                          المبلغ المتبقي
                        </Typography>
                        <Typography
                          variant='body1'
                          fontWeight='bold'
                          color={financialSummary.outstanding > 0 ? 'error.main' : 'text.primary'}
                        >
                          {formatCurrency(financialSummary.outstanding)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {patient.notes && (
                <Grid item xs={12}>
                  <Typography variant='h6' sx={{ mb: 3, fontWeight: 'bold' }}>
                    ملاحظات
                  </Typography>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                        {patient.notes}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          {/* Visits Tab */}
          <TabPanel value='visits' sx={{ p: 4 }}>
            <Typography variant='h6' sx={{ mb: 3, fontWeight: 'bold' }}>
              سجل المواعيد
            </Typography>
            {patient.appointments.length === 0 ? (
              <Card variant='outlined'>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant='h6' color='text.secondary'>
                    لا توجد مواعيد حتى الآن
                  </Typography>
                  <Button
                    variant='contained'
                    sx={{ mt: 2 }}
                    onClick={() => router.push(`/appointments/new?patientId=${patientId}`)}
                  >
                    حجز موعد جديد
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <TableContainer component={Card} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>التاريخ والوقت</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>العلاج</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>الطبيب</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                      <TableCell align='left' sx={{ fontWeight: 'bold' }}>
                        السعر
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patient.appointments.map(appointment => (
                      <TableRow
                        key={appointment.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/appointments/${appointment.id}`)}
                      >
                        <TableCell>{formatDateTime(appointment.startTime)}</TableCell>
                        <TableCell>{appointment.medicalCase.name}</TableCell>
                        <TableCell>{appointment.dentist.fullName}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(appointment.status)}
                            color={getStatusColor(appointment.status)}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='left'>{formatCurrency(appointment.basePriceSyp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Financial Tab */}
          <TabPanel value='financial' sx={{ p: 4 }}>
            <Typography variant='h6' sx={{ mb: 3, fontWeight: 'bold' }}>
              سجل الفواتير
            </Typography>
            {patient.invoices.length === 0 ? (
              <Card variant='outlined'>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant='h6' color='text.secondary'>
                    لا توجد فواتير حتى الآن
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <TableContainer component={Card} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>التاريخ</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>العلاج</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                      <TableCell align='left' sx={{ fontWeight: 'bold' }}>
                        الإجمالي
                      </TableCell>
                      <TableCell align='left' sx={{ fontWeight: 'bold' }}>
                        المدفوع
                      </TableCell>
                      <TableCell align='left' sx={{ fontWeight: 'bold' }}>
                        المتبقي
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patient.invoices.map(invoice => (
                      <TableRow
                        key={invoice.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                      >
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell>{invoice.visit?.medicalCase?.name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(invoice.status)}
                            color={getStatusColor(invoice.status)}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='left'>{formatCurrency(invoice.totalAmountSyp)}</TableCell>
                        <TableCell align='left' sx={{ color: 'success.main' }}>
                          {formatCurrency(invoice.paidAmountSyp)}
                        </TableCell>
                        <TableCell
                          align='left'
                          sx={{
                            color:
                              (parseFloat(invoice.totalAmountSyp) || 0) - (parseFloat(invoice.paidAmountSyp) || 0) > 0
                                ? 'error.main'
                                : 'text.primary',
                            fontWeight: 'medium'
                          }}
                        >
                          {formatCurrency(
                            (parseFloat(invoice.totalAmountSyp) || 0) - (parseFloat(invoice.paidAmountSyp) || 0)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </TabContext>
      </Card>
    </Box>
  )
}

export default PatientProfilePage
