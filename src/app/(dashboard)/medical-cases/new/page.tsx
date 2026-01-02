'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

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

import { useLanguage } from '@/contexts/LanguageContext'

const NewMedicalCasePage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    defaultPrice: '',
    isActive: true
  })

  const isManager = session?.user?.role === 'MANAGER'

  // Redirect non-managers
  if (!isManager) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>فقط المدراء يمكنهم إنشاء حالات طبية.</Alert>
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
    setLoading(true)

    try {
      const response = await fetch('/api/medical-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          nameAr: formData.nameAr || null,
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

        throw new Error(data.error || 'Failed to create medical case')
      }

      router.push('/medical-cases')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title={t('medicalCases.addCase')} />
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
                label={t('medicalCases.nameEn')}
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                helperText={t('medicalCases.uniqueName')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('medicalCases.nameAr')}
                value={formData.nameAr}
                onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                disabled={loading}
                helperText={t('medicalCases.arabicOptional')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('medicalCases.defaultPrice')}
                type='number'
                required
                value={formData.defaultPrice}
                onChange={e => setFormData({ ...formData, defaultPrice: e.target.value })}
                disabled={loading}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>ل.س</InputAdornment>
                }}
                inputProps={{ min: 0, step: '1' }}
                helperText={t('medicalCases.priceHelper')}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    disabled={loading}
                  />
                }
                label={t('common.active')}
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
                  {loading ? t('medicalCases.creating') : t('medicalCases.createCase')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default NewMedicalCasePage
