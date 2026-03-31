import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { setUser }    = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      navigate('/login?error=oauth_failed')
      return
    }

    if (token) {
      localStorage.setItem('token', token)
      api.get('/auth/me').then(res => {
        setUser(res.data.user)
        navigate('/')
      })
    }
  }, [])

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '100dvh',
      flexDirection:  'column',
      gap:            '16px',
    }}>
      <div style={{ fontSize: '48px' }}>🐱</div>
      <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
        登入中...
      </p>
    </div>
  )
}

export default OAuthCallbackPage