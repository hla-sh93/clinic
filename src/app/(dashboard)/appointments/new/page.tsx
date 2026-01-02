'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

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

import { useLanguage } from '@/contexts/LanguageContext'

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

const NewAppointmentPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [patients, setPatients] = useState<Patient[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [medicalCases, setMedicalCases] = useState<MedicalCase[]>([])
  const [dataLoading, setDataLoading] = useState(true)

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
        const [patientsRes, dentistsRes, casesRes] = await Promise.all([
          fetch('/api/patients'),
          fetch('/api/users?role=DENTIST'),
          fetch('/api/medical-cases?activeOnly=true')
        ])

        if (patientsRes.ok) {
          setPatients(await patientsRes.json())
        }

        if (dentistsRes.ok) {
          setDentists(await dentistsRes.json())
        }

        if (casesRes.ok) {
          setMedicalCases(await casesRes.json())
        }

        // Set default dentist for dentist users
        if (!isManager && session?.user?.id) {
          setFormData(prev => ({ ...prev, dentistId: session.user.id }))
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setDataLoading(false)
      }
    }

    if (session) {
      fetchData()
    }
  }, [session, isManager])

  // Auto-fill price when medical case is selected
  useEffect(() => {
    if (formData.medicalCaseId) {
      const selectedCase = medicalCases.find(c => c.id === formData.medicalCaseId)

      if (selectedCase) {
        setFormData(prev => ({ ...prev, price: selectedCase.defaultPrice }))
      }
    }
  }, [formData.medicalCaseId, medicalCases])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Combine date and time
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`)

      if (endDateTime <= startDateTime) {
        throw new Error(t('appointments.endTimeError'))
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
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
        throw new Error(data.error || t('appointments.createError'))
      }

      router.push('/appointments')
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const selectedPatient = patients.find(p => p.id === formData.patientId)

  return (
    <Card>
      <CardHeader
        title={t('appointments.newAppointment')}
        action={
          <Button variant='outlined' onClick={() => router.back()}>
            {t('common.cancel')}
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
                renderInput={params => <TextField {...params} label={t('appointments.patient')} required />}
                disabled={loading}
              />
            </Grid>

            {/* Dentist Selection */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label={t('appointments.dentist')}
                required
                value={formData.dentistId}
                onChange={e => setFormData({ ...formData, dentistId: e.target.value })}
                disabled={loading || !isManager}
                helperText={!isManager ? t('appointments.assignedToYou') : ''}
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
                label={t('appointments.treatment')}
                required
                value={formData.medicalCaseId}
                onChange={e => setFormData({ ...formData, medicalCaseId: e.target.value })}
                disabled={loading}
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
                label={t('appointments.price')}
                type='number'
                required
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                disabled={loading}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>ل.س</InputAdornment>
                }}
                inputProps={{ min: 0, step: '0.01' }}
                helperText={t('appointments.priceHelper')}
              />
            </Grid>

            {/* Date */}
            <Grid item xs={12} md={4}>
              <TextField
                type='date'
                fullWidth
                label={t('common.date')}
                required
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                helperText={t('appointments.dateHelper')}
              />
            </Grid>

            {/* Start Time */}
            <Grid item xs={12} md={4}>
              <TextField
                type='time'
                fullWidth
                label={t('appointments.startTime')}
                required
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* End Time */}
            <Grid item xs={12} md={4}>
              <TextField
                type='time'
                fullWidth
                label={t('appointments.endTime')}
                required
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant='outlined' onClick={() => router.back()} disabled={loading}>
                  {t('common.cancel')}
                </Button>
                <Button
                  type='submit'
                  variant='contained'
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? t('appointments.creating') : t('appointments.createAppointment')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default NewAppointmentPage
