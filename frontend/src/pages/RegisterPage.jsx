import { useState } from 'react'
import { Link }     from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'

function RegisterPage() {
  const { register }            = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Check passwords match
    if (password !== confirm) {
      return setError('Passwords do not match, please check again')
    }

    setLoading(true)
    try {
      await register(username, email, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">

      {/* Logo */}
      <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '32px' }}>
        <div style={{ fontSize: '56px', marginBottom: '10px' }}>🐱</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)' }}>
          Create Account
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
          Join Sudden Mission!
        </p>
      </div>

      {/* Register form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {error && <div className="error-box">{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Username</label>
          <input
            className="input"
            type="text"
            placeholder="Your name"
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
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Password</label>
          <input
            className="input"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Confirm Password</label>
          <input
            className="input"
            type="password"
            placeholder="Enter password again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: '8px' }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>

      </form>

      {/* Switch to login */}
      <p style={{ textAlign: 'center', marginTop: '28px', color: 'var(--text-muted)', fontWeight: 600, paddingBottom: '40px' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 800 }}>
          Sign In
        </Link>
      </p>

    </div>
  )
}

export default RegisterPage