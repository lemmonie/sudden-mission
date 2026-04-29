import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useState } from 'react'
import api from '../api/axios'

function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [pairCode, setPairCode] = useState('')
  const [pairMsg, setPairMsg] = useState('')
  const [pairing, setPairing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const handlePair = async () => {
    if (!pairCode.trim()) return
    setPairing(true)
    setPairMsg('')
    try {
      await api.post('/pair/connect', { pairCode: pairCode.trim().toUpperCase() })
      setPairMsg('Paired successfully! 🎉')
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setPairMsg(err.response?.data?.message || 'Pairing failed, please check the code')
    } finally {
      setPairing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect?')) return
    setDisconnecting(true)
    try {
      await api.delete('/pair/disconnect')
      window.location.reload()
    } catch (err) {
      alert(err.response?.data?.message || 'Disconnect failed')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Streak multiplier
  const getMultiplier = (streak) => {
    if (streak >= 30) return 'x2.0 🔥🔥🔥'
    if (streak >= 7)  return 'x1.5 🔥🔥'
    if (streak >= 3)  return 'x1.3 🔥'
    return 'x1.0'
  }

  // Points needed for next title
  const TITLES = [
    { points: 50,   title: 'Rookie Partners' },
    { points: 200,  title: 'Reliable Duo'    },
    { points: 500,  title: 'Mission Experts' },
    { points: 1000, title: 'Ultimate Backup' },
  ]

  const nextTitle = TITLES.find(t => t.points > user.totalPoints)
  const progress  = nextTitle
    ? Math.round((user.totalPoints / nextTitle.points) * 100)
    : 100

  return (
    <div className="app-container" style={{ paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ padding: '16px 0', borderBottom: '2px solid var(--border)', marginBottom: '24px' }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
          👤 Profile
        </h2>
      </div>

      {/* Avatar and name */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '72px', marginBottom: '8px' }}>🐱</div>
        <h2 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text)' }}>
          {user.username}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          {user.email}
        </p>
        {user.activeTitle && (
          <div style={{
            display: 'inline-block', marginTop: '8px',
            background: 'var(--primary-light)', color: 'var(--primary)',
            padding: '4px 14px', borderRadius: 'var(--radius-full)',
            fontWeight: 700, fontSize: '0.85rem',
          }}>
            🏆 {user.activeTitle}
          </div>
        )}
      </div>

      {/* Points + Streak cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          padding: '20px', textAlign: 'center',
          border: '2px solid var(--border)', boxShadow: 'var(--shadow)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>⭐</div>
          <div style={{ fontWeight: 900, fontSize: '1.8rem', color: 'var(--primary)' }}>
            {user.totalPoints}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Total Points
          </div>
        </div>

        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          padding: '20px', textAlign: 'center',
          border: '2px solid var(--border)', boxShadow: 'var(--shadow)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>🔥</div>
          <div style={{ fontWeight: 900, fontSize: '1.8rem', color: 'var(--primary)' }}>
            {user.currentStreak}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {getMultiplier(user.currentStreak)}
          </div>
        </div>
      </div>

      {/* Progress bar to next title */}
      {nextTitle && (
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          padding: '16px', marginBottom: '16px',
          border: '2px solid var(--border)', boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Next Title: {nextTitle.title}
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
              {user.totalPoints} / {nextTitle.points}
            </span>
          </div>
          <div style={{ background: 'var(--border)', borderRadius: 'var(--radius-full)', height: '12px', overflow: 'hidden' }}>
            <div style={{
              background: 'var(--primary)', borderRadius: 'var(--radius-full)',
              height: '100%', width: `${progress}%`, transition: 'width 0.5s',
            }} />
          </div>
        </div>
      )}

      {/* Unlocked titles */}
      {user.titles.length > 0 && (
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          padding: '16px', marginBottom: '16px',
          border: '2px solid var(--border)', boxShadow: 'var(--shadow)',
        }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '12px' }}>
            🏆 Unlocked Titles
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {user.titles.map(title => (
              <div key={title} style={{
                background: 'var(--primary-light)', color: 'var(--primary)',
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                fontWeight: 700, fontSize: '0.85rem',
              }}>
                {title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pair code */}
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        padding: '16px', marginBottom: '16px',
        border: '2px solid var(--border)', boxShadow: 'var(--shadow)',
        textAlign: 'center',
      }}>
        <h3 style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '8px' }}>
          🔗 My Pair Code
        </h3>
        <div style={{
          fontSize: '2rem', fontWeight: 900, color: 'var(--primary)',
          letterSpacing: '0.2em', marginBottom: '8px',
        }}>
          {user.pairCode}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {user.pairId ? (
            <div>
              <p style={{ fontSize: '0.8rem', color: '#58CC02', fontWeight: 700 }}>
                Paired! 🎉
              </p>
              <button
                className="btn btn-outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
                style={{ fontSize: '0.85rem', color: '#ff4b4b', borderColor: '#ff4b4b' }}
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px' }}>
                Share this code with your partner, or enter theirs:
              </p>
              <input
                className="input"
                placeholder="Enter partner's pair code"
                value={pairCode}
                onChange={e => setPairCode(e.target.value)}
                style={{ marginBottom: '8px', textAlign: 'center', letterSpacing: '0.2em', fontWeight: 700 }}
              />
              {pairMsg && (
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: pairMsg.includes('successfully') ? '#58CC02' : '#ff4b4b', marginBottom: '8px' }}>
                  {pairMsg}
                </p>
              )}
              <button
                className="btn btn-primary"
                onClick={handlePair}
                disabled={pairing}
                style={{ padding: '12px' }}
              >
                {pairing ? 'Pairing...' : 'Connect'}
              </button>
            </div>
          )}
        </p>
      </div>

      {/* Sign out */}
      <button
        className="btn btn-outline"
        onClick={handleLogout}
        style={{ marginTop: '8px' }}
      >
        Sign Out
      </button>

      <BottomNav />
    </div>
  )
}

export default ProfilePage