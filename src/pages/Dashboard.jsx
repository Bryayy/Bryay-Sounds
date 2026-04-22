import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { theme, btnPrimary, btnOutline } from '../lib/theme'

export default function Dashboard({ onNavigate }) {
  const { user, profile, signOut } = useAuth()
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchDownloads()
  }, [user])

  const fetchDownloads = async () => {
    const { data } = await supabase
      .from('downloads')
      .select('*, beats(title, genre, bpm, key)')
      .eq('user_id', user.id)
      .order('downloaded_at', { ascending: false })
      .limit(20)
    setDownloads(data || [])
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    onNavigate('home')
  }

  const planColors = {
    free: '#6A5A6A',
    basic: '#FF2D8A',
    premium: '#FFD700',
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, position: 'relative' }}>
      {/* Scanlines */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,45,138,0.008) 2px, rgba(255,45,138,0.008) 4px)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Nav */}
      <nav style={{
        background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,45,138,0.08)', position: 'relative', zIndex: 10,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onNavigate('home')}>
            <div style={{
              width: 32, height: 32, border: '1px solid #FF2D8A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FF2D8A', fontFamily: theme.fontHeading, fontWeight: 800, fontSize: 13,
              boxShadow: '0 0 10px rgba(255,45,138,0.3)', borderRadius: 2,
            }}>B</div>
            <span style={{ fontFamily: theme.fontHeading, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: theme.text }}>
              BRYAY<span style={{ color: theme.pink }}>SOUNDS</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span onClick={() => onNavigate('home')} style={{
              color: theme.textDark, fontSize: 12, cursor: 'pointer',
              fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase',
            }}>Beats</span>
            {profile?.is_admin && (
              <span onClick={() => onNavigate('admin')} style={{
                color: theme.pink, fontSize: 12, cursor: 'pointer',
                fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase',
              }}>Admin</span>
            )}
            <span onClick={handleSignOut} style={{
              color: theme.textDark, fontSize: 12, cursor: 'pointer',
              fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase',
            }}>Sign Out</span>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.pink, letterSpacing: 3, textTransform: 'uppercase', fontFamily: theme.fontMono, marginBottom: 8 }}>
            // Dashboard
          </div>
          <h1 style={{ fontFamily: theme.fontHeading, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
            Welcome, {profile?.display_name || 'Artist'}
          </h1>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {/* Plan */}
          <div style={{
            background: theme.bgCard, borderRadius: 4, padding: 28,
            border: `1px solid ${theme.pinkBorder}`, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${planColors[profile?.plan || 'free']}, transparent)` }} />
            <div style={{ fontSize: 10, color: theme.textDark, fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Current Plan</div>
            <div style={{
              fontFamily: theme.fontHeading, fontSize: 24, fontWeight: 800,
              color: planColors[profile?.plan || 'free'],
              textTransform: 'uppercase',
              textShadow: profile?.plan !== 'free' ? `0 0 20px ${planColors[profile?.plan]}40` : 'none',
            }}>
              {profile?.plan || 'Free'}
            </div>
            {profile?.billing_cycle && (
              <div style={{ fontSize: 11, color: theme.textDark, fontFamily: theme.fontMono, marginTop: 4 }}>
                {profile.billing_cycle}
              </div>
            )}
          </div>

          {/* Credits */}
          <div style={{
            background: theme.bgCard, borderRadius: 4, padding: 28,
            border: `1px solid ${theme.pinkBorder}`, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #FF2D8A, transparent)' }} />
            <div style={{ fontSize: 10, color: theme.textDark, fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Credits Remaining</div>
            <div style={{
              fontFamily: theme.fontHeading, fontSize: 36, fontWeight: 800,
              color: theme.pink,
              textShadow: '0 0 20px rgba(255,45,138,0.4)',
            }}>
              {profile?.credits_remaining || 0}
            </div>
            {profile?.credits_reset_date && (
              <div style={{ fontSize: 11, color: theme.textDark, fontFamily: theme.fontMono, marginTop: 4 }}>
                Resets {new Date(profile.credits_reset_date).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Downloads */}
          <div style={{
            background: theme.bgCard, borderRadius: 4, padding: 28,
            border: `1px solid ${theme.pinkBorder}`, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #00FFFF, transparent)' }} />
            <div style={{ fontSize: 10, color: theme.textDark, fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Total Downloads</div>
            <div style={{
              fontFamily: theme.fontHeading, fontSize: 36, fontWeight: 800,
              color: '#00FFFF',
              textShadow: '0 0 20px rgba(0,255,255,0.3)',
            }}>
              {downloads.length}
            </div>
          </div>
        </div>

        {/* Upgrade CTA (if free or basic) */}
        {(!profile?.plan || profile?.plan === 'free') && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,45,138,0.08) 0%, rgba(5,5,8,1) 100%)',
            border: '1px solid rgba(255,45,138,0.2)', borderRadius: 4,
            padding: 32, marginBottom: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 20,
          }}>
            <div>
              <div style={{ fontFamily: theme.fontHeading, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Unlock Beat Downloads
              </div>
              <div style={{ color: theme.textDark, fontSize: 13, fontFamily: theme.fontMono }}>
                Subscribe to start downloading beats with commercial licenses
              </div>
            </div>
            <button onClick={() => onNavigate('home')} style={{ ...btnPrimary, width: 'auto', padding: '12px 28px' }}>
              View Plans →
            </button>
          </div>
        )}

        {profile?.plan === 'basic' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(5,5,8,1) 100%)',
            border: '1px solid rgba(255,215,0,0.15)', borderRadius: 4,
            padding: 32, marginBottom: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 20,
          }}>
            <div>
              <div style={{ fontFamily: theme.fontHeading, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Upgrade to Premium
              </div>
              <div style={{ color: theme.textDark, fontSize: 13, fontFamily: theme.fontMono }}>
                Get 8 credits/month, 2M stream caps, tag-free downloads & stems
              </div>
            </div>
            <button style={{ ...btnPrimary, width: 'auto', padding: '12px 28px', background: '#FFD700', color: '#050508' }}>
              Upgrade →
            </button>
          </div>
        )}

        {/* Download History */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.pink, letterSpacing: 3, textTransform: 'uppercase', fontFamily: theme.fontMono, marginBottom: 16 }}>
            // Download History
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.textDark, fontFamily: theme.fontMono }}>
              Loading...
            </div>
          ) : downloads.length === 0 ? (
            <div style={{
              background: theme.bgCard, borderRadius: 4, padding: 48,
              border: `1px solid ${theme.pinkBorder}`, textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎵</div>
              <div style={{ fontFamily: theme.fontHeading, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                No downloads yet
              </div>
              <div style={{ color: theme.textDark, fontSize: 13, fontFamily: theme.fontMono, marginBottom: 24 }}>
                Browse the catalog and use your credits to download beats
              </div>
              <button onClick={() => onNavigate('home')} style={{ ...btnOutline, width: 'auto', padding: '10px 24px' }}>
                Browse Beats →
              </button>
            </div>
          ) : (
            <div style={{
              background: theme.bgCard, borderRadius: 4,
              border: `1px solid ${theme.pinkBorder}`, overflow: 'hidden',
            }}>
              {downloads.map((dl, i) => (
                <div key={dl.id} style={{
                  padding: '16px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: i < downloads.length - 1 ? `1px solid ${theme.border}` : 'none',
                  flexWrap: 'wrap', gap: 12,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                      {dl.beats?.title || 'Beat'}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textDark, fontFamily: theme.fontMono, display: 'flex', gap: 12 }}>
                      <span>{dl.beats?.genre}</span>
                      <span>{dl.beats?.bpm} BPM</span>
                      <span>{dl.beats?.key}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      padding: '3px 10px', borderRadius: 2, fontSize: 10,
                      fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase',
                      background: dl.license_tier === 'premium' ? 'rgba(255,215,0,0.15)' : theme.pinkSoft,
                      color: dl.license_tier === 'premium' ? '#FFD700' : theme.pink,
                      border: `1px solid ${dl.license_tier === 'premium' ? 'rgba(255,215,0,0.3)' : 'rgba(255,45,138,0.3)'}`,
                    }}>
                      {dl.license_tier}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textDark, fontFamily: theme.fontMono }}>
                      {new Date(dl.downloaded_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.pink, letterSpacing: 3, textTransform: 'uppercase', fontFamily: theme.fontMono, marginBottom: 16 }}>
            // Account
          </div>
          <div style={{
            background: theme.bgCard, borderRadius: 4, padding: 28,
            border: `1px solid ${theme.pinkBorder}`,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div>
                <div style={{ fontSize: 10, color: theme.textDark, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Email</div>
                <div style={{ fontSize: 14, color: theme.text }}>{profile?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: theme.textDark, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Artist Name</div>
                <div style={{ fontSize: 14, color: theme.text }}>{profile?.display_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: theme.textDark, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Member Since</div>
                <div style={{ fontSize: 14, color: theme.text }}>
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
