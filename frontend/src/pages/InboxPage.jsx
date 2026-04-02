import { useState, useEffect } from 'react'
import api from '../api/axios'
import BottomNav from '../components/BottomNav'

function InboxPage() {
  const [sentMissions, setSentMissions] = useState([])
  const [completedMissions, setCompletedMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('sent') // pending | done

  const typeEmoji = {
    physical: '🤗',
    errand: '🛒',
    company: '💬',
    chore: '🍳',
    fun: '🎮',
    emotional: '💌',
  }

  // 取得收到的任務
  const fetchMissions = async () => {
    try {
      const [sentRes, completedRes] = await Promise.all([
        api.get('/mission?role=sent'),
        api.get('/mission?role=received'),
      ])
      setSentMissions(sentRes.data.missions)
      setCompletedMissions(
        completedRes.data.missions
          .filter(m => m.status === 'confirmed')
          .slice(0, 10)
      )
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMissions()
  }, [])

  // 接受任務
  const handleAccept = async (id) => {
    try {
      await api.patch(`/mission/${id}/accept`)
      fetchMissions() // 重新載入
    } catch (err) {
      alert(err.response?.data?.message || '操作失敗')
    }
  }

  // 完成任務
  const handleComplete = async (id) => {
    try {
      await api.patch(`/mission/${id}/complete`)
      fetchMissions()
    } catch (err) {
      alert(err.response?.data?.message || '操作失敗')
    }
  }

  // 根據 tab 篩選
  const filtered = tab === 'sent' ? sentMissions : completedMissions

  return (
    <div className="app-container" style={{ paddingBottom: '100px' }}>

      {/* 頂部 Header */}
      <div style={{
        padding: '16px 0',
        borderBottom: '2px solid var(--border)',
        marginBottom: '16px',
      }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
          📬 收件匣
        </h2>
      </div>

      {/* Tab 切換 */}
      <div style={{
        display: 'flex',
        background: 'var(--border)',
        borderRadius: 'var(--radius-full)',
        padding: '4px',
        marginBottom: '20px',
      }}>
        {[
          { key: 'sent', label: '任務記錄' },
          { key: 'done', label: '已完成' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontFamily: 'var(--font)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: tab === t.key ? 'var(--surface)' : 'transparent',
              color: tab === t.key ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: tab === t.key ? 'var(--shadow)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 任務列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '2rem' }}>🐱</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 0',
          color: 'var(--text-muted)',
          fontWeight: 600,
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>
            {tab === 'pending' ? '📭' : '✅'}
          </div>
          {tab === 'pending' ? '目前沒有待處理的任務' : '還沒有完成的任務'}
        </div>
      ) : (
        filtered.map(mission => (
          <div key={mission._id} style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '12px',
            border: '2px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}>
            {/* 任務資訊 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: mission.status !== 'done' ? '14px' : '0',
            }}>
              <span style={{ fontSize: '36px' }}>
                {typeEmoji[mission.type]}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
                  {mission.subtype}
                </div>
                {mission.note && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                  }}>
                    {mission.note}
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '4px',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    background: 'var(--primary-light)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    ⭐ {mission.points} 分
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}>
                   {tab === 'sent' ? `給 ${mission.receiverId?.username}` : `來自 ${mission.senderId?.username}`}
                  </span>

                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                  }}>
                    {tab === 'sent'
                      ? `📅 ${new Date(mission.createdAt).toLocaleDateString('zh-TW')}`
                      : `✅ ${new Date(mission.confirmedAt).toLocaleDateString('zh-TW')}`
                    }
                  </span>

                </div>
              </div>
            </div>

            {/* 操作按鈕 */}
            {tab !== 'sent' && mission.status === 'pending' && (
              <button
                className="btn btn-primary"
                onClick={() => handleAccept(mission._id)}
                style={{ padding: '12px', fontSize: '0.95rem' }}
              >
                接受任務
              </button>
            )}

            {mission.status === 'accepted' && (
              <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', marginTop: '8px' }}>
                🔄 任務進行中，等待對方確認...
              </div>
            )}

            {mission.status === 'completed' && (
              <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', marginTop: '8px' }}>
                ⏳ 等待對方確認中...
              </div>
            )}

            {mission.status === 'confirmed' && (
              <div style={{ color: '#58CC02', fontWeight: 700, fontSize: '0.9rem', marginTop: '8px' }}>
                ✅ 已完成並獲得積分！
              </div>
            )}
          </div>
        ))
      )}

      <BottomNav />
    </div>
  )
}

export default InboxPage