'use client'

import { useState, useEffect } from 'react'

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

import { useLanguage } from '@/contexts/LanguageContext'

type MedicalCase = {
  id: string
  name: string
  nameAr: string | null
  defaultPrice: string
  isActive: boolean
  createdAt: string
}

const MedicalCasesPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t, language } = useLanguage()
  const [medicalCases, setMedicalCases] = useState<MedicalCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isManager = session?.user?.role === 'MANAGER'

  const getDisplayName = (medicalCase: MedicalCase) => {
    if (language === 'ar' && medicalCase.nameAr) {
      return medicalCase.nameAr
    }

    return medicalCase.name
  }

  useEffect(() => {
    const fetchMedicalCases = async () => {
      try {
        const response = await fetch('/api/medical-cases')

        if (!response.ok) {
          throw new Error(t('medicalCases.fetchError'))
        }

        const data = await response.json()

        setMedicalCases(data)
      } catch (err: any) {
        setError(err.message || t('common.error'))
      } finally {
        setLoading(false)
      }
    }

    fetchMedicalCases()
  }, [])

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount

    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant='h4'>{t('medicalCases.title')}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {t('medicalCases.subtitle')}
            </Typography>
          </Box>
          {isManager && (
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => router.push('/medical-cases/new')}
            >
              {t('medicalCases.addCase')}
            </Button>
          )}
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
        ) : medicalCases.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant='h6' color='text.secondary'>
              {t('medicalCases.noCases')}
            </Typography>
            {isManager && (
              <Button variant='contained' sx={{ mt: 2 }} onClick={() => router.push('/medical-cases/new')}>
                {t('medicalCases.addFirstCase')}
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('common.name')}</TableCell>
                  <TableCell align='right'>{t('medicalCases.defaultPrice')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  {isManager && <TableCell align='right'>{t('common.actions')}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {medicalCases.map(medicalCase => (
                  <TableRow key={medicalCase.id} hover>
                    <TableCell>
                      <Typography variant='body1' fontWeight={500}>
                        {getDisplayName(medicalCase)}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>{formatCurrency(medicalCase.defaultPrice)}</TableCell>
                    <TableCell>
                      <Chip
                        label={medicalCase.isActive ? t('common.active') : t('common.inactive')}
                        color={medicalCase.isActive ? 'success' : 'default'}
                        size='small'
                      />
                    </TableCell>
                    {isManager && (
                      <TableCell align='right'>
                        <IconButton size='small' onClick={() => router.push(`/medical-cases/${medicalCase.id}/edit`)}>
                          <i className='tabler-edit' />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!isManager && (
          <Alert severity='info' sx={{ mt: 4 }}>
            {t('medicalCases.managerOnly')}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default MedicalCasesPage
