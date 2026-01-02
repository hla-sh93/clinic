'use client'

import { useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
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

import { useLanguage } from '@/contexts/LanguageContext'

type Patient = {
  id: string
  fullName: string
  phone: string
  gender: string
  maritalStatus: string
  notes: string | null
  isActive: boolean
  createdAt: string
}

const PatientsPage = () => {
  const router = useRouter()
  const { t } = useLanguage()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      const url = debouncedSearch ? `/api/patients?search=${encodeURIComponent(debouncedSearch)}` : '/api/patients'

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch patients')
      }

      const data = await response.json()

      setPatients(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h4'>{t('patients.title')}</Typography>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => router.push('/patients/new')}
          >
            {t('patients.addPatient')}
          </Button>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder={t('patients.searchPatients')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='tabler-search' />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : patients.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant='h6' color='text.secondary'>
              {t('patients.noPatients')}
            </Typography>
            {!debouncedSearch && (
              <Button variant='contained' sx={{ mt: 2 }} onClick={() => router.push('/patients/new')}>
                {t('patients.addPatient')}
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('common.name')}</TableCell>
                  <TableCell>{t('common.phone')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell>{t('common.date')}</TableCell>
                  <TableCell align='right'>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map(patient => (
                  <TableRow
                    key={patient.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    <TableCell>
                      <Typography variant='body1' fontWeight={500}>
                        {patient.fullName}
                      </Typography>
                    </TableCell>
                    <TableCell>{patient.phone || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={patient.isActive ? t('common.active') : t('common.inactive')}
                        color={patient.isActive ? 'success' : 'default'}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>{formatDate(patient.createdAt)}</TableCell>
                    <TableCell align='right'>
                      <IconButton
                        size='small'
                        onClick={e => {
                          e.stopPropagation()
                          router.push(`/patients/${patient.id}`)
                        }}
                      >
                        <i className='tabler-eye' />
                      </IconButton>
                      <IconButton
                        size='small'
                        onClick={e => {
                          e.stopPropagation()
                          router.push(`/patients/${patient.id}/edit`)
                        }}
                      >
                        <i className='tabler-edit' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default PatientsPage
