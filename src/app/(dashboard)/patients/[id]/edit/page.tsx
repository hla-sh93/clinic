'use client'

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'

type Patient = {
  id: string
  fullName: string
  phone: string
  gender: string
  maritalStatus: string
  dateOfBirth: string | null
  notes: string | null
  isActive: boolean
}

const EditPatientPage = () => {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    gender: 'UNSPECIFIED',
    maritalStatus: 'UNSPECIFIED',
    dateOfBirth: '',
    notes: '',
    isActive: true
  })

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${patientId}`)

        if (!response.ok) {
          throw new Error('فشل في جلب بيانات المريض')
        }

        const patient: Patient = await response.json()

        setFormData({
          fullName: patient.fullName,
          phone: patient.phone || '',
          gender: patient.gender || 'UNSPECIFIED',
          maritalStatus: patient.maritalStatus || 'UNSPECIFIED',
          dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
          notes: patient.notes || '',
          isActive: patient.isActive
        })
      } catch (err: any) {
        setError(err.message || 'حدث خطأ')
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [patientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          gender: formData.gender,
          maritalStatus: formData.maritalStatus,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
          notes: formData.notes || null,
          isActive: formData.isActive
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          const messages = data.details.map((d: any) => d.message).join(', ')

          throw new Error(messages)
        }

        throw new Error(data.error || 'فشل في تحديث بيانات المريض')
      }

      router.push(`/patients/${patientId}`)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
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

  return (
    <Card dir='rtl'>
      <CardHeader
        title='تعديل بيانات المريض'
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
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='الاسم الكامل'
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='رقم الهاتف'
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='الجنس'
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                disabled={saving}
              >
                <MenuItem value='UNSPECIFIED'>غير محدد</MenuItem>
                <MenuItem value='MALE'>ذكر</MenuItem>
                <MenuItem value='FEMALE'>أنثى</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='الحالة الاجتماعية'
                value={formData.maritalStatus}
                onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}
                disabled={saving}
              >
                <MenuItem value='UNSPECIFIED'>غير محدد</MenuItem>
                <MenuItem value='SINGLE'>أعزب/عزباء</MenuItem>
                <MenuItem value='MARRIED'>متزوج/ة</MenuItem>
                <MenuItem value='DIVORCED'>مطلق/ة</MenuItem>
                <MenuItem value='WIDOWED'>أرمل/ة</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                type='date'
                fullWidth
                label='تاريخ الميلاد'
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='ملاحظات'
                multiline
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    disabled={saving}
                  />
                }
                label='نشط'
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                <Button
                  type='submit'
                  variant='contained'
                  disabled={saving}
                  startIcon={saving && <CircularProgress size={20} />}
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
                <Button variant='outlined' onClick={() => router.back()} disabled={saving}>
                  إلغاء
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default EditPatientPage
