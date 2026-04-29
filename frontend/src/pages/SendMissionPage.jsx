import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import BottomNav from '../components/BottomNav'

const MISSION_TYPES = [
  {
    type:     'physical',
    emoji:    '🤗',
    label:    'Physical',
    subtypes: ['Hug', 'Hold Hands', 'Lean On Me'],
  },
  {
    type:     'errand',
    emoji:    '🛒',
    label:    'Errand',
    subtypes: ['Buy Something', 'Pick Up Food', 'Pick Up Package'],
  },
  {
    type:     'company',
    emoji:    '💬',
    label:    'Company',
    subtypes: ['Chat', 'Sit With Me', 'Go For A Walk'],
  },
  {
    type:     'chore',
    emoji:    '🍳',
    label:    'Chore',
    subtypes: ['Cook', 'Wash Dishes', 'Tidy Up'],
  },
  {
    type:     'fun',
    emoji:    '🎮',
    label:    'Fun',
    subtypes: ['Watch Something', 'Play Games', 'Go Out'],
  },
  {
    type:     'emotional',
    emoji:    '💌',
    label:    'Emotional',
    subtypes: ['Encourage Me', 'Listen To Me', 'Comfort Me'],
  },
]

function SendMissionPage() {
  const navigate = useNavigate()

  const [step, setStep]                   = useState(1)
  const [selectedType, setSelectedType]   = useState(null)
  const [subtype, setSubtype]             = useState('')
  const [note, setNote]                   = useState('')
  const [points, setPoints]               = useState(5)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')

  const selectedConfig = MISSION_TYPES.find(t => t.type === selectedType)

  const handleSend = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/mission', { type: selectedType, subtype, note, points })
      navigate('/', { state: { success: true } })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container" style={{ paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '16px 0', borderBottom: '2px solid var(--border)',
        marginBottom: '24px', gap: '12px',
      }}>
        <button
          onClick={() => step === 1 ? navigate('/') : setStep(step - 1)}
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0', color: 'var(--text)' }}
        >
          ←
        </button>
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
          {step === 1 ? 'Choose Mission Type' : step === 2 ? 'Choose Option' : 'Mission Details'}
        </h2>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
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

      {/* Step 1: Choose type */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

      {/* Step 2: Choose subtype */}
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
                background:   'var(--surface)',
                border:       '2px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding:      '16px',
                cursor:       'pointer',
                fontFamily:   'var(--font)',
                fontWeight:   700,
                fontSize:     '1rem',
                color:        'var(--text)',
                textAlign:    'left',
                boxShadow:    'var(--shadow)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Mission summary */}
          <div style={{
            background:   'var(--primary-light)',
            borderRadius: 'var(--radius-md)',
            padding:      '14px 16px',
            display:      'flex',
            alignItems:   'center',
            gap:          '12px',
          }}>
            <span style={{ fontSize: '28px' }}>{selectedConfig?.emoji}</span>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{subtype}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedConfig?.label}</div>
            </div>
          </div>

          {/* Note */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Note <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              className="input"
              placeholder="How are you feeling right now..."
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

          {/* Points slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              How important is this mission to you?
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
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
              <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>
                {points} pts
              </span>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* Send button */}
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading}
            style={{ fontSize: '1.1rem' }}
          >
            {loading ? 'Sending...' : `⚡ Send Mission (${points} pts)`}
          </button>

        </div>
      )}

      <BottomNav />
    </div>
  )
}

export default SendMissionPage