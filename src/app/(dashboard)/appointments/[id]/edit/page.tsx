'use client'

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import Autocomplete from '@mui/material/Autocomplete'

type Patient = {
  id: string
  fullName: string
  phone: string | null
}

type Dentist = {
  id: string
  fullName: string
}

type MedicalCase = {
  id: string
  name: string
  defaultPrice: string
}

type Appointment = {
  id: string
  startTime: string
  endTime: string
  status: string
  basePriceSyp: string
  patientId: string
  dentistId: string
  medicalCaseId: string
}

const EditAppointmentPage = () => {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const appointmentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [patients, setPatients] = useState<Patient[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [medicalCases, setMedicalCases] = useState<MedicalCase[]>([])

  const isManager = session?.user?.role === 'MANAGER'

  const [formData, setFormData] = useState({
    patientId: '',
    dentistId: '',
    medicalCaseId: '',
    startDate: '',
    startTime: '',
    endTime: '',
    price: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentRes, patientsRes, dentistsRes, casesRes] = await Promise.all([
          fetch(`/api/appointments/${appointmentId}`),
          fetch('/api/patients'),
          fetch('/api/users?role=DENTIST'),
          fetch('/api/medical-cases?activeOnly=true')
        ])

        if (!appointmentRes.ok) {
          if (appointmentRes.status === 403) {
            throw new Error('Access denied')
          }

          throw new Error('Failed to fetch appointment')
        }

        const appointment: Appointment = await appointmentRes.json()

        // Check if appointment can be edited
        if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
          throw new Error('Cannot edit a completed or cancelled appointment')
        }

        const startDateTime = new Date(appointment.startTime)
        const endDateTime = new Date(appointment.endTime)

        setFormData({
          patientId: appointment.patientId,
          dentistId: appointment.dentistId,
          medicalCaseId: appointment.medicalCaseId,
          startDate: startDateTime.toISOString().split('T')[0],
          startTime: startDateTime.toTimeString().slice(0, 5),
          endTime: endDateTime.toTimeString().slice(0, 5),
          price: appointment.basePriceSyp
        })

        if (patientsRes.ok) setPatients(await patientsRes.json())
        if (dentistsRes.ok) setDentists(await dentistsRes.json())
        if (casesRes.ok) setMedicalCases(await casesRes.json())
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [appointmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`)

      if (endDateTime <= startDateTime) {
        throw new Error('وقت الانتهاء يجب أن يكون بعد وقت البدء')
      }

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          dentistId: formData.dentistId,
          medicalCaseId: formData.medicalCaseId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          basePriceSyp: parseFloat(formData.price)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update appointment')
      }

      router.push(`/appointments/${appointmentId}`)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !formData.patientId) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>{error}</Alert>
          <Button variant='outlined' sx={{ mt: 2 }} onClick={() => router.push('/appointments')}>
            العودة للمواعيد
          </Button>
        </CardContent>
      </Card>
    )
  }

  const selectedPatient = patients.find(p => p.id === formData.patientId)

  return (
    <Card>
      <CardHeader
        title='تعديل الموعد'
        action={
          <Button variant='outlined' onClick={() => router.back()}>
            إلغاء
          </Button>
        }
      />
      <CardContent>
        {error && (
          <Alert severity='error' sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Patient Selection */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={patients}
                getOptionLabel={option => `${option.fullName}${option.phone ? ` (${option.phone})` : ''}`}
                value={selectedPatient || null}
                onChange={(_, newValue) => setFormData({ ...formData, patientId: newValue?.id || '' })}
                renderInput={params => <TextField {...params} label='المريض' required />}
                disabled={saving}
              />
            </Grid>

            {/* Dentist Selection */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label='الطبيب'
                required
                value={formData.dentistId}
                onChange={e => setFormData({ ...formData, dentistId: e.target.value })}
                disabled={saving || !isManager}
                helperText={!isManager ? 'المواعيد مخصصة لك' : ''}
              >
                {dentists.map(dentist => (
                  <MenuItem key={dentist.id} value={dentist.id}>
                    {dentist.fullName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Medical Case Selection */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label='العلاج'
                required
                value={formData.medicalCaseId}
                onChange={e => setFormData({ ...formData, medicalCaseId: e.target.value })}
                disabled={saving}
              >
                {medicalCases.map(medicalCase => (
                  <MenuItem key={medicalCase.id} value={medicalCase.id}>
                    {medicalCase.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Price */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='السعر'
                type='number'
                required
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                disabled={saving}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>ل.س</InputAdornment>
                }}
                inputProps={{ min: 0, step: '1' }}
              />
            </Grid>

            {/* Date */}
            <Grid item xs={12} md={4}>
              <TextField
                type='date'
                fullWidth
                label='التاريخ'
                required
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Start Time */}
            <Grid item xs={12} md={4}>
              <TextField
                type='time'
                fullWidth
                label='وقت البدء'
                required
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* End Time */}
            <Grid item xs={12} md={4}>
              <TextField
                type='time'
                fullWidth
                label='وقت الانتهاء'
                required
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant='outlined' onClick={() => router.back()} disabled={saving}>
                  إلغاء
                </Button>
                <Button
                  type='submit'
                  variant='contained'
                  disabled={saving}
                  startIcon={saving && <CircularProgress size={20} />}
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default EditAppointmentPage
