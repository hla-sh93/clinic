'use client'

import { useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import { useLanguage } from '@/contexts/LanguageContext'

type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId: string
  beforeData: any
  afterData: any
  createdAt: string
  actor: {
    id: string
    fullName: string
    email: string
    role: string
  }
}

const AuditLogsPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [entityType, setEntityType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [limit, setLimit] = useState('100')

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const isManager = session?.user?.role === 'MANAGER'

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (entityType) params.append('entityType', entityType)
      if (startDate) params.append('startDate', new Date(startDate).toISOString())
      if (endDate) params.append('endDate', new Date(endDate).toISOString())
      if (limit) params.append('limit', limit)

      const response = await fetch(`/api/audit-logs?${params.toString()}`)

      if (!response.ok) {
        throw new Error(t('auditLogs.fetchError'))
      }

      const data = await response.json()

      setLogs(data)
      setError('')
    } catch (err: any) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [entityType, startDate, endDate, limit])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success'
      case 'UPDATE':
        return 'info'
      case 'DELETE':
        return 'error'
      case 'STATUS_CHANGE':
        return 'warning'
      case 'PAYMENT_CREATE':
        return 'primary'
      default:
        return 'default'
    }
  }

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  const entityTypes = [
    'Patient',
    'MedicalCase',
    'Appointment',
    'Visit',
    'Invoice',
    'Payment',
    'DentistProfitShare',
    'InventoryItem',
    'InventoryMovement'
  ]

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='h4'>{t('auditLogs.title')}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {isManager ? t('auditLogs.subtitle') : t('auditLogs.subtitleUser')}
              </Typography>
            </Box>
            <Button variant='outlined' onClick={() => router.push('/dashboard')}>
              {t('common.back')}
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label={t('auditLogs.entityType')}
                value={entityType}
                onChange={e => setEntityType(e.target.value)}
              >
                <MenuItem value=''>{t('auditLogs.allTypes')}</MenuItem>
                {entityTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('auditLogs.startDate')}
                type='date'
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('auditLogs.endDate')}
                type='date'
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label={t('auditLogs.limit')}
                value={limit}
                onChange={e => setLimit(e.target.value)}
              >
                <MenuItem value='50'>50 {t('auditLogs.records')}</MenuItem>
                <MenuItem value='100'>100 {t('auditLogs.records')}</MenuItem>
                <MenuItem value='200'>200 {t('auditLogs.records')}</MenuItem>
                <MenuItem value='500'>500 {t('auditLogs.records')}</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity='error' sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 3 }}>
            {t('auditLogs.activityLog')} ({logs.length} {t('auditLogs.records')})
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' color='text.secondary'>
                {t('auditLogs.noLogs')}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('auditLogs.timestamp')}</TableCell>
                    <TableCell>{t('auditLogs.action')}</TableCell>
                    <TableCell>{t('auditLogs.entityType')}</TableCell>
                    <TableCell>{t('auditLogs.actor')}</TableCell>
                    <TableCell>{t('auditLogs.role')}</TableCell>
                    <TableCell align='right'>{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant='body2'>{formatDateTime(log.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.action} color={getActionColor(log.action) as any} size='small' />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' fontWeight={500}>
                          {log.entityType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{log.actor.fullName}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {log.actor.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.actor.role} size='small' variant='outlined' />
                      </TableCell>
                      <TableCell align='right'>
                        <Button size='small' onClick={() => handleViewDetails(log)}>
                          {t('auditLogs.viewDetails')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>{t('auditLogs.logDetails')}</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    {t('auditLogs.action')}
                  </Typography>
                  <Chip label={selectedLog.action} color={getActionColor(selectedLog.action) as any} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    {t('auditLogs.entityType')}
                  </Typography>
                  <Typography variant='body1'>{selectedLog.entityType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    {t('auditLogs.entityId')}
                  </Typography>
                  <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.entityId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    {t('auditLogs.timestamp')}
                  </Typography>
                  <Typography variant='body1'>{formatDateTime(selectedLog.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    {t('auditLogs.actor')}
                  </Typography>
                  <Typography variant='body1'>
                    {selectedLog.actor.fullName} ({selectedLog.actor.email})
                  </Typography>
                  <Chip label={selectedLog.actor.role} size='small' variant='outlined' sx={{ mt: 0.5 }} />
                </Grid>

                {selectedLog.beforeData && (
                  <Grid item xs={12}>
                    <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                      {t('auditLogs.before')}
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        overflow: 'auto',
                        maxHeight: 200
                      }}
                    >
                      <pre style={{ margin: 0 }}>{JSON.stringify(selectedLog.beforeData, null, 2)}</pre>
                    </Box>
                  </Grid>
                )}

                {selectedLog.afterData && (
                  <Grid item xs={12}>
                    <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                      {t('auditLogs.after')}
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        overflow: 'auto',
                        maxHeight: 200
                      }}
                    >
                      <pre style={{ margin: 0 }}>{JSON.stringify(selectedLog.afterData, null, 2)}</pre>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AuditLogsPage
