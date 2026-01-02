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
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'

import { useLanguage } from '@/contexts/LanguageContext'

type InventoryItem = {
  id: string
  name: string
  quantity: number
  reorderLevel: number
  unitPrice: string
  _count: {
    movements: number
  }
}

const InventoryPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    reorderLevel: '',
    unitPrice: ''
  })

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Movement dialog
  const [movementDialogOpen, setMovementDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  const [movementData, setMovementData] = useState({
    type: 'IN',
    quantity: '',
    unitCost: '',
    reason: ''
  })

  const [movementError, setMovementError] = useState('')

  const isManager = session?.user?.role === 'MANAGER'

  const fetchItems = async () => {
    try {
      setLoading(true)
      const url = `/api/inventory${lowStockOnly ? '?lowStock=true' : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(t('inventory.fetchError'))
      }

      const data = await response.json()

      setItems(data)
      setError('')
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly])

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount

    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const isLowStock = (item: InventoryItem) => item.quantity <= item.reorderLevel

  const handleCreateClick = () => {
    setEditingItem(null)
    setFormData({ name: '', quantity: '', reorderLevel: '', unitPrice: '' })
    setSaveError('')
    setDialogOpen(true)
  }

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      reorderLevel: item.reorderLevel.toString(),
      unitPrice: item.unitPrice
    })
    setSaveError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')

    try {
      const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory'
      const method = editingItem ? 'PATCH' : 'POST'

      const body: any = {
        name: formData.name,
        reorderLevel: parseInt(formData.reorderLevel),
        unitPrice: parseFloat(formData.unitPrice)
      }

      if (!editingItem) {
        body.quantity = parseInt(formData.quantity)
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save item')
      }

      await fetchItems()
      setDialogOpen(false)
    } catch (err: any) {
      setSaveError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleMovementClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setMovementData({ type: 'IN', quantity: '', unitCost: '', reason: '' })
    setMovementError('')
    setMovementDialogOpen(true)
  }

  const handleMovementSave = async () => {
    if (!selectedItem) return

    setSaving(true)
    setMovementError('')

    try {
      const payload: any = {
        itemId: selectedItem.id,
        type: movementData.type,
        quantity: parseInt(movementData.quantity),
        reason: movementData.reason
      }

      // Unit cost is required for IN movements
      if (movementData.type === 'IN' && movementData.unitCost) {
        payload.unitCost = parseFloat(movementData.unitCost)
      }

      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('inventory.movementError'))
      }

      await fetchItems()
      setMovementDialogOpen(false)
    } catch (err: any) {
      setMovementError(err.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  // Count low stock items
  const lowStockCount = items.filter(isLowStock).length

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='h4'>{t('inventory.title')}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {isManager ? t('inventory.subtitle') : t('inventory.viewOnly')}
              </Typography>
            </Box>
            {isManager && (
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleCreateClick}>
                {t('inventory.addItem')}
              </Button>
            )}
          </Box>

          {lowStockCount > 0 && (
            <Alert severity='warning' sx={{ mb: 3 }}>
              <strong>
                {lowStockCount} {t('inventory.items')}
              </strong>{' '}
              {t('inventory.lowStockWarning')}
            </Alert>
          )}

          <FormControlLabel
            control={<Switch checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} />}
            label={t('inventory.lowStockOnly')}
          />
        </CardContent>
      </Card>

      {error && (
        <Alert severity='error' sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' color='text.secondary'>
                {t('inventory.noItems')}
              </Typography>
              {isManager && !lowStockOnly && (
                <Button variant='contained' sx={{ mt: 2 }} onClick={handleCreateClick}>
                  {t('inventory.addFirstItem')}
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('inventory.itemName')}</TableCell>
                    <TableCell align='right'>{t('inventory.quantity')}</TableCell>
                    <TableCell align='right'>{t('inventory.reorderLevel')}</TableCell>
                    <TableCell align='right'>{t('inventory.unitPrice')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    {isManager && <TableCell align='right'>{t('common.actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant='body1' fontWeight={500}>
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography
                          variant='body1'
                          fontWeight={600}
                          color={isLowStock(item) ? 'error.main' : 'text.primary'}
                        >
                          {item.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>{item.reorderLevel}</TableCell>
                      <TableCell align='right'>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>
                        {isLowStock(item) ? (
                          <Chip label='Low Stock' color='error' size='small' />
                        ) : (
                          <Chip label='In Stock' color='success' size='small' />
                        )}
                      </TableCell>
                      {isManager && (
                        <TableCell align='right'>
                          <IconButton size='small' onClick={() => router.push(`/inventory/${item.id}`)}>
                            <i className='tabler-eye' />
                          </IconButton>
                          <IconButton size='small' onClick={() => handleMovementClick(item)}>
                            <i className='tabler-arrows-exchange' />
                          </IconButton>
                          <IconButton size='small' onClick={() => handleEditClick(item)}>
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {saveError && (
              <Alert severity='error' sx={{ mb: 3 }}>
                {saveError}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Item Name'
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  disabled={saving}
                  required
                />
              </Grid>
              {!editingItem && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Initial Quantity'
                    type='number'
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    disabled={saving}
                    inputProps={{ min: 0 }}
                    required
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={editingItem ? 6 : 6}>
                <TextField
                  fullWidth
                  label='Reorder Level'
                  type='number'
                  value={formData.reorderLevel}
                  onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })}
                  disabled={saving}
                  inputProps={{ min: 0 }}
                  helperText='Alert when stock falls to this level'
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Unit Price'
                  type='number'
                  value={formData.unitPrice}
                  onChange={e => setFormData({ ...formData, unitPrice: e.target.value })}
                  disabled={saving}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                  inputProps={{ min: 0, step: '0.01' }}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant='contained'
            disabled={saving || !formData.name || !formData.reorderLevel || !formData.unitPrice}
            startIcon={saving && <CircularProgress size={20} />}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={movementDialogOpen} onClose={() => setMovementDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Record Stock Movement</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 1 }}>
              <Alert severity='info' sx={{ mb: 3 }}>
                <strong>{selectedItem.name}</strong> - Current stock: {selectedItem.quantity}
              </Alert>

              {movementError && (
                <Alert severity='error' sx={{ mb: 3 }}>
                  {movementError}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label='Movement Type'
                    value={movementData.type}
                    onChange={e => setMovementData({ ...movementData, type: e.target.value })}
                    disabled={saving}
                  >
                    <MenuItem value='IN'>Stock In (Purchase)</MenuItem>
                    <MenuItem value='OUT'>Stock Out (Usage)</MenuItem>
                    <MenuItem value='ADJUST'>Adjustment</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Quantity'
                    type='number'
                    value={movementData.quantity}
                    onChange={e => setMovementData({ ...movementData, quantity: e.target.value })}
                    disabled={saving}
                    inputProps={{ min: 1 }}
                    helperText={movementData.type === 'OUT' ? `Max: ${selectedItem.quantity}` : ''}
                    required
                  />
                </Grid>
                {movementData.type === 'IN' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Unit Cost (SYP)'
                      type='number'
                      value={movementData.unitCost}
                      onChange={e => setMovementData({ ...movementData, unitCost: e.target.value })}
                      disabled={saving}
                      InputProps={{
                        endAdornment: <InputAdornment position='end'>SYP</InputAdornment>
                      }}
                      inputProps={{ min: 0, step: '0.01' }}
                      helperText='Cost per unit for this purchase'
                      required
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Reason'
                    value={movementData.reason}
                    onChange={e => setMovementData({ ...movementData, reason: e.target.value })}
                    disabled={saving}
                    placeholder='e.g., Restocked from supplier, Used for patient treatment'
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovementDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleMovementSave}
            variant='contained'
            disabled={
              saving ||
              !movementData.quantity ||
              !movementData.reason ||
              (movementData.type === 'IN' && !movementData.unitCost)
            }
            startIcon={saving && <CircularProgress size={20} />}
          >
            {saving ? 'Recording...' : 'Record Movement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default InventoryPage
