'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { signIn } from 'next-auth/react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

const LoginPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      dir='rtl'
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.paper',
        padding: 4
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: theme => `${theme.spacing(8)} !important` }}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant='h4' sx={{ mb: 1.5, fontWeight: 600 }}>
              نظام عيادة الأسنان
            </Typography>
            <Typography variant='body2'>سجل الدخول إلى حسابك</Typography>
          </Box>

          {error && (
            <Alert severity='error' sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label='البريد الإلكتروني'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              sx={{ mb: 4 }}
              required
              autoFocus
            />
            <TextField
              fullWidth
              label='كلمة المرور'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              sx={{ mb: 4 }}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      edge='end'
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={e => e.preventDefault()}
                    >
                      <i className={showPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button fullWidth size='large' type='submit' variant='contained' disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              حسابات تجريبية:
            </Typography>
            <Typography variant='caption' display='block' sx={{ mt: 1 }}>
              المدير: manager@dental.com / password123
            </Typography>
            <Typography variant='caption' display='block'>
              الطبيب: dentist1@dental.com / password123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginPage
