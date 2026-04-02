import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useState } from 'react'
import api from '../api/axios'
import { disconnect } from 'node:cluster'

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
      setPairMsg('配對成功！🎉')
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setPairMsg(err.response?.data?.message || '配對失敗，請檢查配對碼')
    } finally {
      setPairing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('確定要取消配對嗎？')) return
    setDisconnecting(true)
    try {
      await api.delete('/pair/disconnect')
      window.location.reload()
    } catch (err) {
      alert(err.response?.data?.message || '取消配對失敗')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Streak 乘數
  const getMultiplier = (streak) => {
    if (streak >= 30) return 'x2.0 🔥🔥🔥'
    if (streak >= 7) return 'x1.5 🔥🔥'
    if (streak >= 3) return 'x1.3 🔥'
    return 'x1.0'
  }

  // 下一個稱號需要多少分
  const TITLES = [
    { points: 50, title: '新手搭檔' },
    { points: 200, title: '可靠夥伴' },
    { points: 500, title: '任務達人' },
    { points: 1000, title: '最強後盾' },
  ]

  const nextTitle = TITLES.find(t => t.points > user.totalPoints)
  const progress = nextTitle
    ? Math.round((user.totalPoints / nextTitle.points) * 100)
    : 100

  return (
    <div className="app-container" style={{ paddingBottom: '100px' }}>

      {/* 頂部 Header */}
      <div style={{
        padding: '16px 0',
        borderBottom: '2px solid var(--border)',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
          👤 我的
        </h2>
      </div>

      {/* 用戶頭像和名字 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '24px',
      }}>
        <div style={{ fontSize: '72px', marginBottom: '8px' }}>🐱</div>
        <h2 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text)' }}>
          {user.username}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          {user.email}
        </p>
        {user.activeTitle && (
          <div style={{
            display: 'inline-block',
            marginTop: '8px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}>
            🏆 {user.activeTitle}
          </div>
        )}
      </div>

      {/* 積分 + Streak 卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          textAlign: 'center',
          border: '2px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>⭐</div>
          <div style={{ fontWeight: 900, fontSize: '1.8rem', color: 'var(--primary)' }}>
            {user.totalPoints}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            累積積分
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          textAlign: 'center',
          border: '2px solid var(--border)',
          boxShadow: 'var(--shadow)',
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

      {/* 進度條（到下一個稱號） */}
      {nextTitle && (
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: '16px',
          border: '2px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              下一個稱號：{nextTitle.title}
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
              {user.totalPoints} / {nextTitle.points}
            </span>
          </div>
          <div style={{
            background: 'var(--border)',
            borderRadius: 'var(--radius-full)',
            height: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              background: 'var(--primary)',
              borderRadius: 'var(--radius-full)',
              height: '100%',
              width: `${progress}%`,
              transition: 'width 0.5s',
            }} />
          </div>
        </div>
      )}

      {/* 已解鎖稱號 */}
      {user.titles.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: '16px',
          border: '2px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '12px' }}>
            🏆 已解鎖稱號
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {user.titles.map(title => (
              <div key={title} style={{
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}>
                {title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 配對碼 */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        marginBottom: '16px',
        border: '2px solid var(--border)',
        boxShadow: 'var(--shadow)',
        textAlign: 'center',
      }}>
        <h3 style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '8px' }}>
          🔗 我的配對碼
        </h3>
        <div style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: 'var(--primary)',
          letterSpacing: '0.2em',
          marginBottom: '8px',
        }}>
          {user.pairCode}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {user.pairId ? (
            <div>
              <p style={{ fontSize: '0.8rem', color: '#58CC02', fontWeight: 700 }}>
                已配對 🎉
              </p>
              <button
                className="btn btn-outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
                style={{ fontSize: '0.85rem', color: '#ff4b4b', borderColor: '#ff4b4b' }}
              >
                {disconnecting ? '取消中...' : '取消配對'}
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px' }}>
                把這個碼給對方輸入，或輸入對方的配對碼：
              </p>
              <input
                className="input"
                placeholder="輸入對方的配對碼"
                value={pairCode}
                onChange={e => setPairCode(e.target.value)}
                style={{ marginBottom: '8px', textAlign: 'center', letterSpacing: '0.2em', fontWeight: 700 }}
              />
              {pairMsg && (
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: pairMsg.includes('成功') ? '#58CC02' : '#ff4b4b', marginBottom: '8px' }}>
                  {pairMsg}
                </p>
              )}
              <button
                className="btn btn-primary"
                onClick={handlePair}
                disabled={pairing}
                style={{ padding: '12px' }}
              >
                {pairing ? '配對中...' : '開始配對'}
              </button>
            </div>
          )}
        </p>
      </div >

      {/* 登出按鈕 */}
      < button
        className="btn btn-outline"
        onClick={handleLogout}
        style={{ marginTop: '8px' }
        }
      >
        登出
      </button >

      <BottomNav />
    </div >
  )
}

export default ProfilePage