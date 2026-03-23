import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import BottomNav from '../components/BottomNav'

// Mission 類型設定
const MISSION_TYPES = [
  {
    type:    'physical',
    emoji:   '🤗',
    label:   '肢體需求',
    subtypes: ['擁抱', '牽手', '靠肩'],
  },
  {
    type:    'errand',
    emoji:   '🛒',
    label:   '跑腿需求',
    subtypes: ['買東西', '買外賣', '取件'],
  },
  {
    type:    'company',
    emoji:   '💬',
    label:   '陪伴需求',
    subtypes: ['聊天', '陪坐', '散步'],
  },
  {
    type:    'chore',
    emoji:   '🍳',
    label:   '家務需求',
    subtypes: ['煮飯', '洗碗', '收拾'],
  },
  {
    type:    'fun',
    emoji:   '🎮',
    label:   '娛樂需求',
    subtypes: ['看劇', '玩遊戲', '出門'],
  },
  {
    type:    'emotional',
    emoji:   '💌',
    label:   '情感需求',
    subtypes: ['鼓勵', '傾聽', '安慰'],
  },
]

function SendMissionPage() {
  const navigate = useNavigate()

  const [step, setStep]           = useState(1) // 1=選類型 2=選子類型 3=填詳情
  const [selectedType, setSelectedType] = useState(null)
  const [subtype, setSubtype]     = useState('')
  const [note, setNote]           = useState('')
  const [points, setPoints]       = useState(5)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const selectedConfig = MISSION_TYPES.find(t => t.type === selectedType)

  // 發送任務
  const handleSend = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/mission', {
        type:    selectedType,
        subtype,
        note,
        points,
      })
      navigate('/', { state: { success: true } })
    } catch (err) {
      setError(err.response?.data?.message || '發送失敗，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container" style={{ paddingBottom: '100px' }}>

      {/* 頂部 Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        padding:        '16px 0',
        borderBottom:   '2px solid var(--border)',
        marginBottom:   '24px',
        gap:            '12px',
      }}>
        <button
          onClick={() => step === 1 ? navigate('/') : setStep(step - 1)}
          style={{
            background:  'none',
            border:      'none',
            fontSize:    '1.5rem',
            cursor:      'pointer',
            padding:     '0',
            color:       'var(--text)',
          }}
        >
          ←
        </button>
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
          {step === 1 ? '選擇任務類型' : step === 2 ? '選擇細項' : '任務詳情'}
        </h2>
      </div>

      {/* 步驟指示器 */}
      <div style={{
        display:        'flex',
        justifyContent: 'center',
        gap:            '8px',
        marginBottom:   '24px',
      }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            width:        s === step ? '24px' : '8px',
            height:       '8px',
            borderRadius: '4px',
            background:   s === step ? 'var(--primary)' : 'var(--border)',
            transition:   'all 0.3s',
          }}/>
        ))}
      </div>

      {/* Step 1：選類型 */}
      {step === 1 && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 '12px',
        }}>
          {MISSION_TYPES.map(t => (
            <button
              key={t.type}
              onClick={() => { setSelectedType(t.type); setStep(2) }}
              style={{
                background:    'var(--surface)',
                border:        `2px solid ${selectedType === t.type ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius:  'var(--radius-lg)',
                padding:       '20px 12px',
                cursor:        'pointer',
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                gap:           '8px',
                boxShadow:     'var(--shadow)',
                transition:    'all 0.2s',
              }}
            >
              <span style={{ fontSize: '36px' }}>{t.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2：選子類型 */}
      {step === 2 && selectedConfig && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '48px' }}>{selectedConfig.emoji}</span>
            <p style={{ fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>
              {selectedConfig.label}
            </p>
          </div>
          {selectedConfig.subtypes.map(s => (
            <button
              key={s}
              onClick={() => { setSubtype(s); setStep(3) }}
              style={{
                background:    'var(--surface)',
                border:        '2px solid var(--border)',
                borderRadius:  'var(--radius-md)',
                padding:       '16px',
                cursor:        'pointer',
                fontFamily:    'var(--font)',
                fontWeight:    700,
                fontSize:      '1rem',
                color:         'var(--text)',
                textAlign:     'left',
                boxShadow:     'var(--shadow)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Step 3：填詳情 */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 任務摘要 */}
          <div style={{
            background:    'var(--primary-light)',
            borderRadius:  'var(--radius-md)',
            padding:       '14px 16px',
            display:       'flex',
            alignItems:    'center',
            gap:           '12px',
          }}>
            <span style={{ fontSize: '28px' }}>{selectedConfig?.emoji}</span>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{subtype}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {selectedConfig?.label}
              </div>
            </div>
          </div>

          {/* 備註 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              備註 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(選填)</span>
            </label>
            <textarea
              className="input"
              placeholder="說說你現在的感受..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              maxLength={300}
              style={{ resize: 'none', lineHeight: '1.6' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {note.length}/300
            </div>
          </div>

          {/* 分數設定 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              這個任務對你有多重要？
            </label>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              gap:            '12px',
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>1</span>
              <input
                type="range"
                min={1}
                max={10}
                value={points}
                onChange={e => setPoints(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>10</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontWeight:    800,
                fontSize:      '1.5rem',
                color:         'var(--primary)',
              }}>
                {points} 分
              </span>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* 發送按鈕 */}
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading}
            style={{ fontSize: '1.1rem' }}
          >
            {loading ? '發送中...' : `⚡ 發送任務 (${points} 分)`}
          </button>

        </div>
      )}

      <BottomNav />
    </div>
  )
}

export default SendMissionPage