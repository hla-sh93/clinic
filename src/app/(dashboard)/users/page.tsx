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
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'

import { useLanguage } from '@/contexts/LanguageContext'

type User = {
  id: string
  fullName: string
  email: string
  role: 'MANAGER' | 'DENTIST'
  isActive: boolean
  createdAt: string
}

const UsersPage = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { t } = useLanguage()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'DENTIST' as 'MANAGER' | 'DENTIST',
    isActive: true
  })

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isManager = session?.user?.role === 'MANAGER'

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')

      if (!response.ok) {
        if (response.status === 403) {
          setError(t('common.accessDenied'))

          return
        }

        throw new Error('Failed to fetch users')
      }

      const data = await response.json()

      setUsers(data)
      setError('')
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (!isManager) {
        setError(t('common.accessDenied'))
        setLoading(false)
      } else {
        fetchUsers()
      }
    }
  }, [status, router, isManager, fetchUsers, t])

  const handleCreateClick = () => {
    setEditingUser(null)
    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: 'DENTIST',
      isActive: true
    })
    setSaveError('')
    setDialogOpen(true)
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive
    })
    setSaveError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.fullName || !formData.email) {
      setSaveError('Name and email are required')

      return
    }

    if (!editingUser && !formData.password) {
      setSaveError('Password is required for new users')

      return
    }

    setSaving(true)
    setSaveError('')

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PATCH' : 'POST'

      const body: any = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive
      }

      if (formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const data = await response.json()

        throw new Error(data.error || 'Failed to save user')
      }

      setDialogOpen(false)
      fetchUsers()
    } catch (err: any) {
      setSaveError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isManager) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>{t('common.accessDenied')}</Alert>
          <Button variant='outlined' onClick={() => router.push('/dashboard')} sx={{ mt: 2 }}>
            {t('common.back')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant='h4'>{t('nav.users')}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage system users and their roles
            </Typography>
          </Box>
          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleCreateClick}>
            Add User
          </Button>
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align='right'>{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    <Typography color='text.secondary' sx={{ py: 4 }}>
                      {t('common.noData')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography variant='body1' fontWeight={500}>
                        {user.fullName}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role === 'MANAGER' ? 'Manager' : 'Dentist'}
                        color={user.role === 'MANAGER' ? 'primary' : 'default'}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? t('common.active') : t('common.inactive')}
                        color={user.isActive ? 'success' : 'error'}
                        size='small'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell align='right'>
                      <IconButton size='small' onClick={() => handleEditClick(user)}>
                        <i className='tabler-edit' />
                      </IconButton>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => {
                          setUserToDelete(user)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <i className='tabler-trash' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity='error' sx={{ mb: 3 }}>
              {saveError}
            </Alert>
          )}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('common.name')}
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('common.email')}
                type='email'
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                type='password'
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label='Role'
                  onChange={e => setFormData({ ...formData, role: e.target.value as 'MANAGER' | 'DENTIST' })}
                >
                  <MenuItem value='DENTIST'>Dentist</MenuItem>
                  <MenuItem value='MANAGER'>Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('common.status')}</InputLabel>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  label={t('common.status')}
                  onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                >
                  <MenuItem value='active'>{t('common.active')}</MenuItem>
                  <MenuItem value='inactive'>{t('common.inactive')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('common.confirm')}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user <strong>{userToDelete?.fullName}</strong>?
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            This action cannot be undone. If the user has appointments or visits, you should deactivate them instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant='contained'
            color='error'
            onClick={async () => {
              if (!userToDelete) return
              setDeleting(true)

              try {
                const response = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' })

                if (!response.ok) {
                  const data = await response.json()

                  throw new Error(data.error || 'Failed to delete user')
                }

                setDeleteDialogOpen(false)
                setUserToDelete(null)
                fetchUsers()
              } catch (err: any) {
                setError(err.message)
              } finally {
                setDeleting(false)
              }
            }}
            disabled={deleting}
          >
            {deleting ? t('common.loading') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default UsersPage
