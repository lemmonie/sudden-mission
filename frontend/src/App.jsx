import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import HomePage        from './pages/HomePage'
import SendMissionPage from './pages/SendMissionPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', fontSize: '2rem' }}>🐱</div>
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', fontSize: '2rem' }}>🐱</div>

  return (
    <Routes>
      <Route path="/login"    element={!user ? <LoginPage />    : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/send" element={<PrivateRoute><SendMissionPage /></PrivateRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App