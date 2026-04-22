import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { theme, inputStyle, btnPrimary, btnOutline } from '../lib/theme'

export default function AuthPage({ onNavigate }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else onNavigate('dashboard')
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }
      const { data, error } = await signUp(email, password, displayName)
      if (error) {
        setError(error.message)
      } else if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists')
      } else {
        setMessage('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: theme.bg, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background effects */}
      <div style={{ position: 'absolute', top: '20%', right: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,138,0.1) 0%, transparent 60%)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,0,255,0.06) 0%, transparent 60%)', filter: 'blur(60px)' }} />

      {/* Scanlines */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,45,138,0.008) 2px, rgba(255,45,138,0.008) 4px)', pointerEvents: 'none', zIndex: 1 }} />

      <div style={{
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 2,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40, cursor: 'pointer' }} onClick={() => onNavigate('home')}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, border: '1px solid #FF2D8A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FF2D8A', fontFamily: theme.fontHeading, fontWeight: 800, fontSize: 15,
              boxShadow: '0 0 10px rgba(255,45,138,0.3)', borderRadius: 2,
            }}>B</div>
            <span style={{ fontFamily: theme.fontHeading, fontWeight: 700, fontSize: 18, letterSpacing: 3, color: theme.text }}>
              BRYAY<span style={{ color: theme.pink }}>SOUNDS</span>
            </span>
          </div>
        </div>

        {/* Auth Card */}
        <div style={{
          background: theme.bgCard, borderRadius: 4, padding: '40px 32px',
          border: `1px solid ${theme.pinkBorder}`, backdropFilter: 'blur(10px)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #FF2D8A, transparent)' }} />

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{
              fontFamily: theme.fontHeading, fontSize: 22, fontWeight: 700,
              letterSpacing: 1, marginBottom: 8,
            }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p style={{ color: theme.textDark, fontSize: 13, fontFamily: theme.fontMono }}>
              {mode === 'login' ? 'Sign in to access your beats' : 'Start downloading beats today'}
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', marginBottom: 20, borderRadius: 2,
              background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)',
              color: '#FF6B6B', fontSize: 13, fontFamily: theme.fontMono,
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              padding: '12px 16px', marginBottom: 20, borderRadius: 2,
              background: 'rgba(45,255,138,0.1)', border: '1px solid rgba(45,255,138,0.3)',
              color: '#2DFF8A', fontSize: 13, fontFamily: theme.fontMono,
            }}>
              {message}
            </div>
          )}

          <div onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                  Artist Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your artist name"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#FF2D8A'; e.target.style.boxShadow = '0 0 10px rgba(255,45,138,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,45,138,0.15)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#FF2D8A'; e.target.style.boxShadow = '0 0 10px rgba(255,45,138,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,45,138,0.15)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#FF2D8A'; e.target.style.boxShadow = '0 0 10px rgba(255,45,138,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,45,138,0.15)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...btnPrimary,
                marginTop: 8,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(5,5,8,0.3)', borderTopColor: '#050508', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  Processing...
                </span>
              ) : (
                mode === 'login' ? 'Sign In →' : 'Create Account →'
              )}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: theme.textDark }}>
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <span onClick={() => { setMode('signup'); setError(''); setMessage(''); }} style={{ color: theme.pink, cursor: 'pointer', fontWeight: 600 }}>
                  Sign up
                </span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={{ color: theme.pink, cursor: 'pointer', fontWeight: 600 }}>
                  Sign in
                </span>
              </>
            )}
          </div>
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span onClick={() => onNavigate('home')} style={{
            color: theme.textDark, fontSize: 12, cursor: 'pointer',
            fontFamily: theme.fontMono, letterSpacing: 1,
          }}>
            ← BACK TO HOME
          </span>
        </div>
      </div>
    </div>
  )
}
