'use client'

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'

type MedicalCase = {
  id: string
  name: string
  defaultPrice: string
  isActive: boolean
}

const EditMedicalCasePage = () => {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const medicalCaseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    defaultPrice: '',
    isActive: true
  })

  const isManager = session?.user?.role === 'MANAGER'

  useEffect(() => {
    const fetchMedicalCase = async () => {
      try {
        const response = await fetch(`/api/medical-cases/${medicalCaseId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch medical case')
        }

        const medicalCase: MedicalCase = await response.json()

        setFormData({
          name: medicalCase.name,
          defaultPrice: medicalCase.defaultPrice,
          isActive: medicalCase.isActive
        })
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMedicalCase()
  }, [medicalCaseId])

  // Redirect non-managers
  if (!isManager) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>فقط المدراء يمكنهم تعديل الحالات الطبية.</Alert>
          <Button variant='outlined' sx={{ mt: 2 }} onClick={() => router.push('/medical-cases')}>
            العودة للحالات الطبية
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/medical-cases/${medicalCaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          defaultPrice: parseFloat(formData.defaultPrice),
          isActive: formData.isActive
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          const messages = data.details.map((d: any) => d.message).join(', ')

          throw new Error(messages)
        }

        throw new Error(data.error || 'Failed to update medical case')
      }

      router.push('/medical-cases')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الحالة الطبية؟')) {
      return
    }

    setError('')
    setDeleting(true)

    try {
      const response = await fetch(`/api/medical-cases/${medicalCaseId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const text = await response.text()
        const data = text ? JSON.parse(text) : {}

        throw new Error(data.error || 'فشل حذف الحالة الطبية')
      }

      router.push('/medical-cases')
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setDeleting(false)
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
    <Card>
      <CardHeader title='تعديل الحالة الطبية' />
      <CardContent>
        {error && (
          <Alert severity='error' sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='الاسم'
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                disabled={saving}
                helperText='يجب أن يكون فريداً'
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='السعر الافتراضي'
                type='number'
                required
                value={formData.defaultPrice}
                onChange={e => setFormData({ ...formData, defaultPrice: e.target.value })}
                disabled={saving}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>ل.س</InputAdornment>
                }}
                inputProps={{ min: 0, step: '1' }}
                helperText='السعر يجب أن يكون 0 أو أكثر'
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
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                <Button
                  variant='outlined'
                  color='error'
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  startIcon={deleting && <CircularProgress size={20} />}
                >
                  {deleting ? 'جاري الحذف...' : 'حذف'}
                </Button>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant='outlined' onClick={() => router.back()} disabled={saving || deleting}>
                    إلغاء
                  </Button>
                  <Button
                    type='submit'
                    variant='contained'
                    disabled={saving || deleting}
                    startIcon={saving && <CircularProgress size={20} />}
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default EditMedicalCasePage
