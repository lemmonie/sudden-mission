import { useState } from 'react'
import { Link }     from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'

function RegisterPage() {
  const { register }                = useAuth()
  const [username, setUsername]     = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 檢查兩次密碼是否一樣
    if (password !== confirm) {
      return setError('兩次密碼不一樣，請確認')
    }

    setLoading(true)
    try {
      await register(username, email, password)
    } catch (err) {
      setError(err.response?.data?.message || '註冊失敗，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">

      {/* Logo 區 */}
      <div style={{
        textAlign:     'center',
        paddingTop:    '48px',
        paddingBottom: '32px'
      }}>
        <div style={{ fontSize: '56px', marginBottom: '10px' }}>🐱</div>
        <h1 style={{
          fontSize:   '1.8rem',
          fontWeight: 900,
          color:      'var(--primary)'
        }}>
          建立帳號
        </h1>
        <p style={{
          color:      'var(--text-muted)',
          marginTop:  '6px',
          fontWeight: 600,
          fontSize:   '0.9rem'
        }}>
          加入 Sudden Mission！
        </p>
      </div>

      {/* 註冊表單 */}
      <form onSubmit={handleSubmit} style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '14px'
      }}>

        {error && <div className="error-box">{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>用戶名稱</label>
          <input
            className="input"
            type="text"
            placeholder="你的名字"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Email</label>
          <input
            className="input"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>密碼</label>
          <input
            className="input"
            type="password"
            placeholder="至少 6 個字元"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>確認密碼</label>
          <input
            className="input"
            type="password"
            placeholder="再輸入一次密碼"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: '8px' }}>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? '註冊中...' : '建立帳號'}
          </button>
        </div>

      </form>

      {/* 切換到登入 */}
      <p style={{
        textAlign:  'center',
        marginTop:  '28px',
        color:      'var(--text-muted)',
        fontWeight: 600,
        paddingBottom: '40px'
      }}>
        已經有帳號？{' '}
        <Link
          to="/login"
          style={{
            color:          'var(--primary)',
            textDecoration: 'none',
            fontWeight:     800
          }}
        >
          立即登入
        </Link>
      </p>

    </div>
  )
}

export default RegisterPage