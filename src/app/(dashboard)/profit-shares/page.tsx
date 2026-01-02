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
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'

import { useLanguage } from '@/contexts/LanguageContext'

type ProfitShare = {
  id: string
  dentistId: string
  percentage: string
  dentist: {
    id: string
    fullName: string
    email: string
    isActive: boolean
  }
}

const ProfitSharesPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [profitShares, setProfitShares] = useState<ProfitShare[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedDentist, setSelectedDentist] = useState<{ id: string; name: string; percentage: string } | null>(null)
  const [newPercentage, setNewPercentage] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Add dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [availableDentists, setAvailableDentists] = useState<{ id: string; fullName: string; email: string }[]>([])
  const [loadingDentists, setLoadingDentists] = useState(false)
  const [newShareForm, setNewShareForm] = useState({ dentistId: '', percentage: '' })

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [dentistToDelete, setDentistToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isManager = session?.user?.role === 'MANAGER'

  const fetchProfitShares = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profit-shares')

      if (!response.ok) {
        throw new Error(t('profitShares.fetchError'))
      }

      const data = await response.json()

      setProfitShares(data)
      setError('')
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfitShares()
  }, [])

  const handleEditClick = (dentist: { id: string; name: string; percentage: string }) => {
    setSelectedDentist(dentist)
    setNewPercentage(dentist.percentage)
    setSaveError('')
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedDentist) return

    const percentage = parseFloat(newPercentage)

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setSaveError(t('profitShares.percentageError'))

      return
    }

    setSaving(true)
    setSaveError('')

    try {
      const response = await fetch('/api/profit-shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dentistId: selectedDentist.id,
          percentage
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profit share')
      }

      await fetchProfitShares()
      setEditDialogOpen(false)
      setSelectedDentist(null)
    } catch (err: any) {
      setSaveError(err.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const fetchAvailableDentists = async () => {
    try {
      setLoadingDentists(true)
      const response = await fetch('/api/dentists/available')

      if (response.ok) {
        const data = await response.json()

        setAvailableDentists(data)
      }
    } catch (err) {
      console.error('Failed to fetch dentists', err)
    } finally {
      setLoadingDentists(false)
    }
  }

  const openAddDialog = () => {
    fetchAvailableDentists()
    setNewShareForm({ dentistId: '', percentage: '' })
    setSaveError('')
    setAddDialogOpen(true)
  }

  const handleAddShare = async () => {
    if (!newShareForm.dentistId || !newShareForm.percentage) {
      setSaveError(t('profitShares.fillAllFields'))

      return
    }

    const percentage = parseFloat(newShareForm.percentage)

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setSaveError(t('profitShares.percentageError'))

      return
    }

    setSaving(true)
    setSaveError('')

    try {
      const response = await fetch('/api/profit-shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dentistId: newShareForm.dentistId,
          percentage
        })
      })

      if (!response.ok) {
        const data = await response.json()

        throw new Error(data.error || 'Failed to add profit share')
      }

      await fetchProfitShares()
      setAddDialogOpen(false)
    } catch (err: any) {
      setSaveError(err.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteShare = async () => {
    if (!dentistToDelete) return

    setDeleting(true)

    try {
      const response = await fetch(`/api/profit-shares?dentistId=${dentistToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()

        throw new Error(data.error || 'Failed to delete profit share')
      }

      await fetchProfitShares()
      setDeleteDialogOpen(false)
      setDentistToDelete(null)
    } catch (err: any) {
      setError(err.message || t('common.error'))
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
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='h4'>{t('profitShares.title')}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {isManager ? t('profitShares.subtitle') : t('profitShares.yourShare')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {isManager && (
                <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openAddDialog}>
                  {t('profitShares.addShare')}
                </Button>
              )}
              <Button variant='outlined' onClick={() => router.push('/earnings')}>
                {t('profitShares.viewEarnings')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity='error' sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {profitShares.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' color='text.secondary'>
                {t('profitShares.noShares')}
              </Typography>
              {isManager && (
                <Typography variant='body2' color='text.secondary'>
                  {t('profitShares.noSharesHint')}
                </Typography>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('profitShares.dentist')}</TableCell>
                    <TableCell>{t('common.email')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell align='right'>{t('profitShares.percentage')}</TableCell>
                    {isManager && <TableCell align='right'>{t('common.actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profitShares.map(share => (
                    <TableRow key={share.id}>
                      <TableCell>
                        <Typography variant='body1' fontWeight={500}>
                          {share.dentist.fullName}
                        </Typography>
                      </TableCell>
                      <TableCell>{share.dentist.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={share.dentist.isActive ? t('common.active') : t('common.inactive')}
                          color={share.dentist.isActive ? 'success' : 'default'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='h6' color='primary'>
                          {parseFloat(share.percentage).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      {isManager && (
                        <TableCell align='right'>
                          <IconButton
                            size='small'
                            onClick={() =>
                              handleEditClick({
                                id: share.dentistId,
                                name: share.dentist.fullName,
                                percentage: share.percentage
                              })
                            }
                          >
                            <i className='tabler-edit' />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => {
                              setDentistToDelete({ id: share.dentistId, name: share.dentist.fullName })
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <i className='tabler-trash' />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('profitShares.editPercentage')}</DialogTitle>
        <DialogContent>
          {selectedDentist && (
            <Box sx={{ pt: 1 }}>
              <Typography variant='body1' sx={{ mb: 3 }}>
                {t('profitShares.settingFor')} <strong>{selectedDentist.name}</strong>
              </Typography>

              {saveError && (
                <Alert severity='error' sx={{ mb: 3 }}>
                  {saveError}
                </Alert>
              )}

              <TextField
                fullWidth
                label={t('profitShares.percentage')}
                type='number'
                value={newPercentage}
                onChange={e => setNewPercentage(e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position='end'>%</InputAdornment>
                }}
                inputProps={{ min: 0, max: 100, step: '0.1' }}
                disabled={saving}
                helperText={t('profitShares.percentageHint')}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            variant='contained'
            disabled={saving}
            startIcon={saving && <CircularProgress size={20} />}
          >
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('profitShares.addShare')}</DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity='error' sx={{ mb: 3 }}>
              {saveError}
            </Alert>
          )}
          {loadingDentists ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : availableDentists.length === 0 ? (
            <Alert severity='info'>{t('profitShares.allDentistsHaveShares')}</Alert>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('profitShares.selectDentist')}</InputLabel>
                  <Select
                    value={newShareForm.dentistId}
                    label={t('profitShares.selectDentist')}
                    onChange={e => setNewShareForm({ ...newShareForm, dentistId: e.target.value })}
                  >
                    {availableDentists.map(dentist => (
                      <MenuItem key={dentist.id} value={dentist.id}>
                        {dentist.fullName} ({dentist.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('profitShares.percentage')}
                  type='number'
                  value={newShareForm.percentage}
                  onChange={e => setNewShareForm({ ...newShareForm, percentage: e.target.value })}
                  InputProps={{
                    endAdornment: <InputAdornment position='end'>%</InputAdornment>
                  }}
                  inputProps={{ min: 0, max: 100, step: '0.1' }}
                  helperText={t('profitShares.percentageHint')}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant='contained'
            onClick={handleAddShare}
            disabled={saving || !newShareForm.dentistId || availableDentists.length === 0}
          >
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('common.confirm')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('profitShares.confirmDelete')} <strong>{dentistToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant='contained' color='error' onClick={handleDeleteShare} disabled={deleting}>
            {deleting ? t('common.loading') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProfitSharesPage
