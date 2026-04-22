import { useState, useEffect } from 'react'
import { useAuth } from './lib/AuthContext'
import HomePage from './App'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import CheckoutPage from './pages/CheckoutPage'
import AdminPage from './pages/AdminPage'

export default function AppRouter() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('home')
  const [checkoutPlan, setCheckoutPlan] = useState('basic')
  const [checkoutCycle, setCheckoutCycle] = useState('monthly')

  // Handle URL params (returning from Stripe)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      setCheckoutPlan(params.get('plan') || 'basic')
      setCheckoutCycle(params.get('cycle') || 'monthly')
      setPage('checkout')
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050508', color: '#FF2D8A',
        fontFamily: "'Orbitron', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '2px solid rgba(255,45,138,0.2)',
            borderTopColor: '#FF2D8A', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <div style={{ fontSize: 12, letterSpacing: 3 }}>LOADING</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const navigate = (target, options = {}) => {
    if (target === 'checkout') {
      if (!user) {
        setPage('auth')
        return
      }
      setCheckoutPlan(options.plan || 'basic')
      setCheckoutCycle(options.cycle || 'monthly')
      setPage('checkout')
    } else if (target === 'auth' && user) {
      setPage('dashboard')
    } else if (target === 'dashboard' && !user) {
      setPage('auth')
    } else {
      setPage(target)
    }
    window.scrollTo(0, 0)
  }

  switch (page) {
    case 'auth':
      return <AuthPage onNavigate={navigate} />
    case 'dashboard':
      if (!user) return <AuthPage onNavigate={navigate} />
      return <Dashboard onNavigate={navigate} />
    case 'checkout':
      return <CheckoutPage onNavigate={navigate} selectedPlan={checkoutPlan} selectedCycle={checkoutCycle} />
    case 'admin':
      if (!user) return <AuthPage onNavigate={navigate} />
      return <AdminPage onNavigate={navigate} />
    default:
      return <HomePage onNavigate={navigate} />
  }
}
