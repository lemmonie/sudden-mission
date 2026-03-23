import { Link, useLocation } from 'react-router-dom'

function BottomNav() {
  const location = useLocation()
  const current  = location.pathname

  const tabs = [
    { path: '/',        icon: '🏠', label: '主頁'   },
    { path: '/inbox',   icon: '📬', label: '收件匣' },
    { path: '/profile', icon: '👤', label: '我的'   },
  ]

  return (
    <nav style={{
      position:        'fixed',
      bottom:          0,
      left:            '50%',
      transform:       'translateX(-50%)',
      width:           '100%',
      maxWidth:        '480px',
      background:      'var(--surface)',
      borderTop:       '2px solid var(--border)',
      display:         'flex',
      justifyContent:  'space-around',
      padding:         '10px 0 20px',
      zIndex:          100,
    }}>
      {tabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            '4px',
            textDecoration: 'none',
            color:          current === tab.path ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight:     current === tab.path ? 800 : 600,
            fontSize:       '0.75rem',
            transition:     'color 0.2s',
          }}
        >
          <span style={{ fontSize: '22px' }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default BottomNav