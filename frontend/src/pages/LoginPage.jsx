import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await login(email, password)
            // AuthContext will redirect to home on success
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed, please try again')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="app-container">

            {/* Logo */}
            <div style={{
                textAlign:     'center',
                paddingTop:    '60px',
                paddingBottom: '40px',
            }}>
                <div style={{ fontSize: '64px', marginBottom: '12px' }}>🐱</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
                    Sudden Mission
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>
                    Send little missions to the people you love
                </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {error && <div className="error-box">{error}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Password</label>
                    <input
                        className="input"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    {/* Divider */}
                    <div style={{
                        display:    'flex',
                        alignItems: 'center',
                        gap:        '12px',
                        color:      'var(--text-muted)',
                        fontSize:   '0.85rem',
                        fontWeight: 600,
                    }}>
                        <div style={{ flex: 1, height: '2px', background: 'var(--border)' }} />
                        or
                        <div style={{ flex: 1, height: '2px', background: 'var(--border)' }} />
                    </div>

                    {/* Google login */}
                    <a href="https://sudden-mission-backend.onrender.com/api/auth/google"
                        className="btn"
                        style={{
                            background:     '#fff',
                            color:          '#444',
                            boxShadow:      '0 4px 0 #ddd',
                            border:         '2px solid #ddd',
                            textDecoration: 'none',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            gap:            '8px',
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>🔵</span>
                        Continue with Google
                    </a>
                </div>

            </form>

            {/* Switch to register */}
            <p style={{
                textAlign:  'center',
                marginTop:  '32px',
                color:      'var(--text-muted)',
                fontWeight: 600,
            }}>
                Don't have an account?{' '}
                <Link
                    to="/register"
                    style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 800 }}
                >
                    Sign Up
                </Link>
            </p>

        </div>
    )
}

export default LoginPage