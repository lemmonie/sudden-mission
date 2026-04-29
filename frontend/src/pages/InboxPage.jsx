import { useState, useEffect } from 'react'
import api from '../api/axios'
import BottomNav from '../components/BottomNav'

function InboxPage() {
  const [sentMissions, setSentMissions] = useState([])
  const [completedMissions, setCompletedMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('sent')

  const typeEmoji = {
    physical:  '🤗',
    errand:    '🛒',
    company:   '💬',
    chore:     '🍳',
    fun:       '🎮',
    emotional: '💌',
  }

  // Fetch missions
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

  useEffect(() => { fetchMissions() }, [])

  // Accept mission
  const handleAccept = async (id) => {
    try {
      await api.patch(`/mission/${id}/accept`)
      fetchMissions()
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed')
    }
  }

  // Complete mission
  const handleComplete = async (id) => {
    try {
      await api.patch(`/mission/${id}/complete`)
      fetchMissions()
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed')
    }
  }

  // Filter by tab
  const filtered = tab === 'sent' ? sentMissions : completedMissions

  return (
    <div className="app-container" style={{ paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{
        padding:      '16px 0',
        borderBottom: '2px solid var(--border)',
        marginBottom: '16px',
      }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
          📬 Inbox
        </h2>
      </div>

      {/* Tab switcher */}
      <div style={{
        display:      'flex',
        background:   'var(--border)',
        borderRadius: 'var(--radius-full)',
        padding:      '4px',
        marginBottom: '20px',
      }}>
        {[
          { key: 'sent', label: 'Mission Log' },
          { key: 'done', label: 'Completed'   },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex:         1,
              padding:      '10px',
              borderRadius: 'var(--radius-full)',
              border:       'none',
              fontFamily:   'var(--font)',
              fontWeight:   700,
              fontSize:     '0.9rem',
              cursor:       'pointer',
              background:   tab === t.key ? 'var(--surface)'  : 'transparent',
              color:        tab === t.key ? 'var(--primary)'  : 'var(--text-muted)',
              boxShadow:    tab === t.key ? 'var(--shadow)'   : 'none',
              transition:   'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Mission list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '2rem' }}>🐱</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign:  'center',
          padding:    '48px 0',
          color:      'var(--text-muted)',
          fontWeight: 600,
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>
            {tab === 'pending' ? '📭' : '✅'}
          </div>
          {tab === 'pending' ? 'No pending missions' : 'No completed missions yet'}
        </div>
      ) : (
        filtered.map(mission => (
          <div key={mission._id} style={{
            background:   'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding:      '16px',
            marginBottom: '12px',
            border:       '2px solid var(--border)',
            boxShadow:    'var(--shadow)',
          }}>
            {/* Mission info */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '12px',
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
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {mission.note}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                  <span style={{
                    fontSize:     '0.8rem',
                    fontWeight:   700,
                    color:        'var(--primary)',
                    background:   'var(--primary-light)',
                    padding:      '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    ⭐ {mission.points} pts
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {tab === 'sent' ? `To ${mission.receiverId?.username}` : `From ${mission.senderId?.username}`}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {tab === 'sent'
                      ? `📅 ${new Date(mission.createdAt).toLocaleDateString('en-US')}`
                      : `✅ ${new Date(mission.confirmedAt).toLocaleDateString('en-US')}`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {tab !== 'sent' && mission.status === 'pending' && (
              <button
                className="btn btn-primary"
                onClick={() => handleAccept(mission._id)}
                style={{ padding: '12px', fontSize: '0.95rem' }}
              >
                Accept Mission
              </button>
            )}

            {mission.status === 'accepted' && (
              <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', marginTop: '8px' }}>
                🔄 Mission in progress, waiting for partner to confirm...
              </div>
            )}

            {mission.status === 'completed' && (
              <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', marginTop: '8px' }}>
                ⏳ Waiting for confirmation...
              </div>
            )}

            {mission.status === 'confirmed' && (
              <div style={{ color: '#58CC02', fontWeight: 700, fontSize: '0.9rem', marginTop: '8px' }}>
                ✅ Completed and points awarded!
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