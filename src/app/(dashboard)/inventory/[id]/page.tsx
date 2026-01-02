'use client'

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

type Movement = {
  id: string
  type: 'IN' | 'OUT'
  quantity: number
  reason: string
  createdAt: string
  creator: {
    id: string
    fullName: string
  }
}

type InventoryItem = {
  id: string
  name: string
  quantity: number
  reorderLevel: number
  unitPrice: string
  createdAt: string
  movements: Movement[]
}

const InventoryDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/inventory/${itemId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Item not found')
          }

          throw new Error('Failed to fetch item')
        }

        const data = await response.json()

        setItem(data)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [itemId])

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount

    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 4 }}>
        {error}
        <Button sx={{ ml: 2 }} onClick={() => router.push('/inventory')}>
          Back to Inventory
        </Button>
      </Alert>
    )
  }

  if (!item) {
    return null
  }

  const isLowStock = item.quantity <= item.reorderLevel
  const totalValue = item.quantity * parseFloat(item.unitPrice)

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant='h4'>{item.name}</Typography>
                {isLowStock ? <Chip label='Low Stock' color='error' /> : <Chip label='In Stock' color='success' />}
              </Box>
              <Typography variant='body2' color='text.secondary'>
                Added on {formatDateTime(item.createdAt)}
              </Typography>
            </Box>
            <Button variant='outlined' onClick={() => router.push('/inventory')}>
              Back to Inventory
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        {/* Stock Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Stock Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: isLowStock ? 'error.light' : 'success.light', borderRadius: 1 }}>
                    <Typography variant='body2' color={isLowStock ? 'error.dark' : 'success.dark'}>
                      Current Stock
                    </Typography>
                    <Typography variant='h3' color={isLowStock ? 'error.dark' : 'success.dark'}>
                      {item.quantity}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Reorder Level
                    </Typography>
                    <Typography variant='h3'>{item.reorderLevel}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body1'>Unit Price</Typography>
                  <Typography variant='body1' fontWeight={600}>
                    {formatCurrency(item.unitPrice)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body1'>Total Stock Value</Typography>
                  <Typography variant='h6' color='primary'>
                    {formatCurrency(totalValue)}
                  </Typography>
                </Box>
              </Box>

              {isLowStock && (
                <Alert severity='warning' sx={{ mt: 3 }}>
                  Stock is at or below reorder level. Consider restocking soon.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Movement History */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Recent Movements
              </Typography>

              {item.movements.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color='text.secondary'>No movements recorded</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align='right'>Qty</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {item.movements.map(movement => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <Typography variant='caption'>{formatDateTime(movement.createdAt)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={movement.type}
                              color={movement.type === 'IN' ? 'success' : 'error'}
                              size='small'
                            />
                          </TableCell>
                          <TableCell align='right'>
                            <Typography fontWeight={600} color={movement.type === 'IN' ? 'success.main' : 'error.main'}>
                              {movement.type === 'IN' ? '+' : '-'}
                              {movement.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' noWrap sx={{ maxWidth: 150 }}>
                              {movement.reason}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default InventoryDetailPage
