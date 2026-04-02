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
                api.get('/mission?role=sent&status=completed'), // 待確認
                api.get('/mission?role=received'),              // 收到的
            ])
            setPair(pairRes.data.pair)
            setPendingConfirm(missionRes.data.missions)
            setMissions(
                pendingRes.data.missions.filter(m =>
                    m.status === 'pending' || m.status === 'accepted' || m.status === 'completed'
                )
            )
        } catch (err) {
            // 還沒配對的話 pair 就是 null
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const partner = pair
        ? (pair.user1._id === user.id ? pair.user2 : pair.user1)
        : null

    const totalPoints = pair ? (pair.user1.totalPoints + pair.user2.totalPoints) : 0
    const totalMissions = missions.length

    const typeEmoji = {
        physical: '🤗', errand: '🛒', company: '💬',
        chore: '🍳', fun: '🎮', emotional: '💌',
    }

    const statusText = {
        pending: '⏳ 等待中',
        accepted: '🔄 進行中',
        completed: '🙋 待確認',
        confirmed: '✅ 已完成',
        declined: '❌ 已拒絕',
    }

    // A 確認完成
    const handleConfirm = async (id) => {
        const rating = ratingMap[id]
        if (!rating) return alert('請先給星星評分！')
        try {
            await api.patch(`/mission/${id}/confirm`, { rating })
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || '操作失敗')
        }
    }

    const handleAcceptInbox = async (id) => {
        try {
            await api.patch(`/mission/${id}/accept`)
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || '操作失敗')
        }
    }

    const handleCompleteInbox = async (id) => {
        try {
            await api.patch(`/mission/${id}/complete`)
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || '操作失敗')
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

            {/* 頂部 Header */}
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

            {/* 配對區域 */}
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
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>⭐ 合計 {totalPoints} 分</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>✅ {totalMissions} 個任務</span>
                    </div>
                </div>
            ) : (
                <div style={{
                    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                    padding: '24px', textAlign: 'center',
                    border: '2px dashed var(--border)', marginBottom: '16px',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔗</div>
                    <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>還沒有配對對象</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>去個人頁輸入配對碼開始吧！</p>
                </div>
            )}

            {/* 發送任務按鈕 */}
            <button
                className="btn btn-primary"
                style={{ marginBottom: '24px', fontSize: '1.1rem', gap: '10px' }}
                disabled={!partner}
                onClick={() => navigate('/send')}
            >
                <span style={{ fontSize: '1.3rem', filter: 'brightness(10)' }}>⚡</span>
                <span>傳送突發任務</span>
            </button>

            {/* 待確認任務 */}
            {pendingConfirm.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '12px', color: 'var(--text)' }}>
                        🙋 待確認任務
                    </h3>
                    {pendingConfirm.map(mission => (
                        <div key={mission._id} style={{
                            background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                            padding: '16px', marginBottom: '12px',
                            border: '2px solid #f5a623', boxShadow: 'var(--shadow)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '32px' }}>{typeEmoji[mission.type]}</span>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{mission.subtype}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {mission.receiverId?.username} 做完了！⭐ {mission.points} 分
                                    </div>
                                </div>
                            </div>

                            {/* 星星評分 */}
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
                                ✅ 確認完成
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 最近任務 */}
            <div>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '12px', color: 'var(--text)' }}>
                    📭 待處理任務
                </h3>
                {missions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontWeight: 600, fontSize: '0.9rem' }}>
                        還沒有任務紀錄 — 傳送第一個任務吧！
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
                                            {mission.points} 分 · 📅 {new Date(mission.createdAt).toLocaleDateString('zh-TW')}
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
                                    接受任務
                                </button>
                            )}
                            {mission.status === 'accepted' && (
                                <button className="btn btn-primary" onClick={() => handleCompleteInbox(mission._id)} style={{ padding: '10px', fontSize: '0.9rem' }}>
                                    標記完成
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