'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'

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

type ReportData = {
  totalItems: number
  totalValue: number
  items: InventoryItem[]
}

const InventoryLowStockReportPage = () => {
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('/api/reports/inventory-low-stock')

        if (!response.ok) {
          throw new Error('Failed to fetch report')
        }

        const data = await response.json()

        setReport(data)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
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

  const getStockLevel = (item: InventoryItem) => {
    const percentage = (item.quantity / item.reorderLevel) * 100

    if (percentage === 0) return { label: 'Out of Stock', color: 'error' as const }
    if (percentage <= 50) return { label: 'Critical', color: 'error' as const }
    if (percentage <= 100) return { label: 'Low', color: 'warning' as const }

    return { label: 'Normal', color: 'success' as const }
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant='h4'>Inventory Low Stock Report</Typography>
              <Typography variant='body2' color='text.secondary'>
                Items at or below reorder level
              </Typography>
            </Box>
            <Button variant='outlined' onClick={() => router.push('/reports')}>
              Back to Reports
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity='error' sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant='body2' color='text.secondary'>
                    Low Stock Items
                  </Typography>
                  <Typography variant='h3' color='error.main'>
                    {report.totalItems}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant='body2' color='text.secondary'>
                    Total Value at Risk
                  </Typography>
                  <Typography variant='h3' color='warning.main'>
                    {formatCurrency(report.totalValue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Low Stock Items Table */}
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Low Stock Items
              </Typography>

              {report.items.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant='h6' color='text.secondary'>
                    No low stock items
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                    All inventory items are above their reorder levels
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item Name</TableCell>
                        <TableCell align='right'>Current Stock</TableCell>
                        <TableCell align='right'>Reorder Level</TableCell>
                        <TableCell align='right'>Unit Price</TableCell>
                        <TableCell align='right'>Stock Value</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.items
                        .sort((a, b) => {
                          const aPercentage = (a.quantity / a.reorderLevel) * 100
                          const bPercentage = (b.quantity / b.reorderLevel) * 100

                          return aPercentage - bPercentage
                        })
                        .map(item => {
                          const stockLevel = getStockLevel(item)
                          const stockValue = item.quantity * parseFloat(item.unitPrice)

                          return (
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
                                  color={item.quantity === 0 ? 'error.main' : 'text.primary'}
                                >
                                  {item.quantity}
                                </Typography>
                              </TableCell>
                              <TableCell align='right'>{item.reorderLevel}</TableCell>
                              <TableCell align='right'>{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell align='right'>{formatCurrency(stockValue)}</TableCell>
                              <TableCell>
                                <Chip label={stockLevel.label} color={stockLevel.color} size='small' />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {report.items.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity='warning'>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Action Required
                    </Typography>
                    <Typography variant='body2'>
                      {report.items.length} item(s) need restocking. Review and place orders to maintain adequate
                      inventory levels.
                    </Typography>
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </Box>
  )
}

export default InventoryLowStockReportPage
