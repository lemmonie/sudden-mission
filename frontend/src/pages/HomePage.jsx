import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import api from '../api/axios'

function HomePage() {
    const { user } = useAuth()
    const [pair, setPair] = useState(null)
    const [missions, setMissions] = useState([])
    const [pendingConfirm, setPendingConfirm] = useState([])
    const [loading, setLoading] = useState(true)
    const [ratingMap, setRatingMap] = useState({}) // { missionId: 1-5 }
    const navigate = useNavigate()

    const fetchData = async () => {
        try {
            const [pairRes, missionRes, pendingRes] = await Promise.all([
                api.get('/pair/info'),
                api.get('/mission?role=sent&status=completed'), // awaiting confirmation
                api.get('/mission?role=received'),              // received missions
            ])
            setPair(pairRes.data.pair)
            setPendingConfirm(missionRes.data.missions)
            setMissions(
                pendingRes.data.missions.filter(m =>
                    m.status === 'pending' || m.status === 'accepted' || m.status === 'completed'
                )
            )
        } catch (err) {
            // pair is null if not paired yet
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const partner = pair
        ? (pair.user1._id === user.id ? pair.user2 : pair.user1)
        : null

    const totalPoints   = pair ? (pair.user1.totalPoints + pair.user2.totalPoints) : 0
    const totalMissions = missions.length

    const typeEmoji = {
        physical: '🤗', errand: '🛒', company: '💬',
        chore: '🍳', fun: '🎮', emotional: '💌',
    }

    const statusText = {
        pending:   '⏳ Pending',
        accepted:  '🔄 In Progress',
        completed: '🙋 Awaiting Confirmation',
        confirmed: '✅ Completed',
        declined:  '❌ Declined',
    }

    // Sender confirms completion
    const handleConfirm = async (id) => {
        const rating = ratingMap[id]
        if (!rating) return alert('Please give a star rating first!')
        try {
            await api.patch(`/mission/${id}/confirm`, { rating })
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed')
        }
    }

    const handleAcceptInbox = async (id) => {
        try {
            await api.patch(`/mission/${id}/accept`)
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed')
        }
    }

    const handleCompleteInbox = async (id) => {
        try {
            await api.patch(`/mission/${id}/complete`)
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed')
        }
    }

    if (loading) {
        return (
            <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '2rem' }}>🐱</span>
            </div>
        )
    }

    return (
        <div className="app-container" style={{ paddingBottom: '100px' }}>

            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0', borderBottom: '2px solid var(--border)', marginBottom: '24px',
            }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                    🐱 Sudden Mission
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>🔥 {user.currentStreak}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>⭐ {user.totalPoints}</span>
                </div>
            </div>

            {/* Pair area */}
            {partner ? (
                <div style={{
                    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                    padding: '24px', boxShadow: 'var(--shadow)',
                    marginBottom: '16px', border: '2px solid var(--border)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px' }}>🐱</div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>{user.username}</div>
                        </div>
                        <div style={{ fontSize: '28px' }}>🔗</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px' }}>🐱</div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>{partner.username}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', paddingTop: '12px', borderTop: '2px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>⭐ {totalPoints} pts total</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>✅ {totalMissions} missions</span>
                    </div>
                </div>
            ) : (
                <div style={{
                    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                    padding: '24px', textAlign: 'center',
                    border: '2px dashed var(--border)', marginBottom: '16px',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔗</div>
                    <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>No partner yet</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Go to Profile and enter a pair code to get started!</p>
                </div>
            )}

            {/* Send mission button */}
            <button
                className="btn btn-primary"
                style={{ marginBottom: '24px', fontSize: '1.1rem', gap: '10px' }}
                disabled={!partner}
                onClick={() => navigate('/send')}
            >
                <span style={{ fontSize: '1.3rem', filter: 'brightness(10)' }}>⚡</span>
                <span>Send a Sudden Mission</span>
            </button>

            {/* Awaiting confirmation */}
            {pendingConfirm.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '12px', color: 'var(--text)' }}>
                        🙋 Awaiting Your Confirmation
                    </h3>
                    {pendingConfirm.map(mission => (
                        <div key={mission._id} style={{
                            background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                            padding: '16px', marginBottom: '12px',
                            border: '2px solid #f5a623', boxShadow: 'var(--shadow)',
elijken}}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '32px' }}>{typeEmoji[mission.type]}</span>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{mission.subtype}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {mission.receiverId?.username} completed it! ⭐ {mission.points} pts
                                    </div>
                                </div>
                            </div>

                            {/* Star rating */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setRatingMap(prev => ({ ...prev, [mission._id]: star }))}
                                        style={{
                                            fontSize: '1.5rem',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            opacity: (ratingMap[mission._id] || 0) >= star ? 1 : 0.3,
                                            transition: 'opacity 0.15s',
                                        }}
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={() => handleConfirm(mission._id)}
                                style={{ padding: '12px', fontSize: '0.95rem' }}
                            >
                                ✅ Confirm Complete
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Pending missions */}
            <div>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '12px', color: 'var(--text)' }}>
                    📭 Pending Missions
                </h3>
                {missions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontWeight: 600, fontSize: '0.9rem' }}>
                        No missions yet — send your first one!
                    </div>
                ) : (
                    missions.map(mission => (
                        <div key={mission._id} style={{
                            background: 'var(--surface)', borderRadius: 'var(--radius-md)',
                            padding: '14px 16px', marginBottom: '10px',
                            border: '2px solid var(--border)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mission.status === 'pending' || mission.status === 'accepted' ? '12px' : '0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '24px' }}>{typeEmoji[mission.type]}</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{mission.subtype}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {mission.points} pts · 📅 {new Date(mission.createdAt).toLocaleDateString('en-US')}
                                        </div>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '0.8rem', fontWeight: 700,
                                    color: mission.status === 'confirmed' ? '#58CC02' : 'var(--text-muted)',
                                }}>
                                    {statusText[mission.status]}
                                </span>
                            </div>
                            {mission.status === 'pending' && (
                                <button className="btn btn-primary" onClick={() => handleAcceptInbox(mission._id)} style={{ padding: '10px', fontSize: '0.9rem' }}>
                                    Accept Mission
                                </button>
                            )}
                            {mission.status === 'accepted' && (
                                <button className="btn btn-primary" onClick={() => handleCompleteInbox(mission._id)} style={{ padding: '10px', fontSize: '0.9rem' }}>
                                    Mark Complete
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <BottomNav />
        </div>
    )
}

export default HomePage