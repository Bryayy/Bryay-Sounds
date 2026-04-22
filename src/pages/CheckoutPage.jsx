import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { STRIPE_PUBLISHABLE_KEY, PRICE_IDS, PLAN_DETAILS } from '../lib/stripe'
import { theme, btnPrimary, btnOutline } from '../lib/theme'

export default function CheckoutPage({ onNavigate, selectedPlan, selectedCycle }) {
  const { user, profile, fetchProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const plan = selectedPlan || 'basic'
  const cycle = selectedCycle || 'monthly'
  const details = PLAN_DETAILS[plan]
  const priceId = PRICE_IDS[`${plan}_${cycle}`]
  const price = cycle === 'monthly' ? details.monthly : details.annual

  // Check if returning from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      handlePaymentSuccess()
    }
  }, [])

  const handlePaymentSuccess = async () => {
    if (!user) return
    setLoading(true)
    
    try {
      // Try the RPC function first
      const { error: rpcError } = await supabase.rpc('activate_subscription', {
        p_user_id: user.id,
        p_plan: plan,
        p_billing_cycle: cycle,
      })

      if (rpcError) {
        console.error('RPC error, trying direct update:', rpcError)
        
        // Fallback: update profile directly
        const credits = plan === 'premium' ? 8 : 5
        const resetDate = new Date()
        resetDate.setDate(resetDate.getDate() + 30)

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan: plan,
            billing_cycle: cycle,
            credits_remaining: credits,
            credits_reset_date: resetDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Direct update error:', updateError)
          setError('There was an issue activating your subscription. Please contact support.')
          setLoading(false)
          return
        }
      }

      await fetchProfile(user.id)
      setSuccess(true)
    } catch (err) {
      console.error('Error:', err)
      setError('Something went wrong. Please contact support.')
    }
    setLoading(false)
  }

  const handleCheckout = async () => {
    if (!user) {
      onNavigate('auth')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Store the checkout intent
      const { error: insertError } = await supabase
        .from('checkout_sessions')
        .insert({
          user_id: user.id,
          plan: plan,
          billing_cycle: cycle,
          price_id: priceId,
        })

      if (insertError) {
        console.error('Session insert error:', insertError)
      }

      // Activate subscription directly (test mode)
      // TODO: Replace with Stripe Checkout redirect in production
      await handlePaymentSuccess()
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, background: theme.bg, position: 'relative',
      }}>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,45,138,0.008) 2px, rgba(255,45,138,0.008) 4px)', pointerEvents: 'none', zIndex: 1 }} />
        
        <div style={{
          maxWidth: 480, width: '100%', textAlign: 'center', position: 'relative', zIndex: 2,
          background: theme.bgCard, borderRadius: 4, padding: '48px 32px',
          border: `1px solid rgba(45,255,138,0.3)`,
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #2DFF8A, transparent)' }} />
          
          <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
          <h1 style={{
            fontFamily: theme.fontHeading, fontSize: 24, fontWeight: 700,
            color: '#2DFF8A', marginBottom: 12,
            textShadow: '0 0 20px rgba(45,255,138,0.4)',
          }}>
            You're In!
          </h1>
          <p style={{ color: theme.textMuted, fontSize: 14, marginBottom: 8, fontFamily: theme.fontMono }}>
            {details.name} Plan activated · {details.credits} credits loaded
          </p>
          <p style={{ color: theme.textDark, fontSize: 12, marginBottom: 32, fontFamily: theme.fontMono }}>
            Your credits reset in 30 days
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('dashboard')} style={{ ...btnPrimary, width: 'auto', padding: '12px 28px', background: '#2DFF8A', color: '#050508' }}>
              Go to Dashboard →
            </button>
            <button onClick={() => onNavigate('home')} style={{ ...btnOutline, width: 'auto', padding: '12px 28px' }}>
              Browse Beats
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: theme.bg, position: 'relative',
    }}>
      {/* Background effects */}
      <div style={{ position: 'absolute', top: '20%', right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,138,0.1) 0%, transparent 60%)', filter: 'blur(60px)' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,45,138,0.008) 2px, rgba(255,45,138,0.008) 4px)', pointerEvents: 'none', zIndex: 1 }} />

      <div style={{ maxWidth: 480, width: '100%', position: 'relative', zIndex: 2 }}>
        {/* Back button */}
        <div style={{ marginBottom: 24 }}>
          <span onClick={() => onNavigate('home')} style={{
            color: theme.textDark, fontSize: 12, cursor: 'pointer',
            fontFamily: theme.fontMono, letterSpacing: 1,
          }}>
            ← BACK TO PLANS
          </span>
        </div>

        {/* Checkout Card */}
        <div style={{
          background: theme.bgCard, borderRadius: 4, padding: '40px 32px',
          border: `1px solid ${theme.pinkBorder}`, backdropFilter: 'blur(10px)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #FF2D8A, transparent)' }} />

          <div style={{ fontSize: 11, fontWeight: 600, color: theme.pink, letterSpacing: 3, textTransform: 'uppercase', fontFamily: theme.fontMono, marginBottom: 8 }}>
            // Checkout
          </div>
          <h1 style={{
            fontFamily: theme.fontHeading, fontSize: 22, fontWeight: 700,
            marginBottom: 32,
          }}>
            Confirm Your Plan
          </h1>

          {/* Plan Summary */}
          <div style={{
            background: 'rgba(255,45,138,0.04)', border: '1px solid rgba(255,45,138,0.1)',
            borderRadius: 4, padding: 24, marginBottom: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{
                  fontFamily: theme.fontHeading, fontSize: 18, fontWeight: 700,
                  color: plan === 'premium' ? '#FFD700' : theme.pink,
                }}>
                  {details.name} Plan
                </div>
                <div style={{ fontSize: 12, color: theme.textDark, fontFamily: theme.fontMono, marginTop: 2 }}>
                  {cycle === 'monthly' ? 'Monthly billing' : 'Annual billing'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: theme.fontHeading, fontSize: 28, fontWeight: 800,
                  color: theme.text,
                }}>
                  ${price}
                </div>
                <div style={{ fontSize: 11, color: theme.textDark, fontFamily: theme.fontMono }}>
                  /{cycle === 'monthly' ? 'mo' : 'yr'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,45,138,0.08)', paddingTop: 16 }}>
              {[
                `${details.credits} credits per month`,
                `${plan === 'basic' ? '500K' : '2M'} audio streams per track`,
                `${plan === 'basic' ? '500K' : '2M'} video streams per track`,
                'Non-exclusive perpetual license',
                'Credit: Prod. by Bryay',
                ...(plan === 'premium' ? ['Tag-free downloads', '2 stem packs/month'] : []),
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#2DFF8A', fontSize: 12 }}>✓</span>
                  <span style={{ fontSize: 12, color: theme.textMuted, fontFamily: theme.fontMono }}>{item}</span>
                </div>
              ))}
            </div>

            {cycle === 'annual' && (
              <div style={{
                marginTop: 12, padding: '8px 12px', borderRadius: 2,
                background: 'rgba(45,255,138,0.08)', border: '1px solid rgba(45,255,138,0.2)',
                fontSize: 12, color: '#2DFF8A', fontFamily: theme.fontMono, textAlign: 'center',
              }}>
                Saving ${((details.monthly * 12) - details.annual).toFixed(0)} vs monthly billing
              </div>
            )}
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

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              ...btnPrimary,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              padding: '16px 32px',
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(5,5,8,0.3)', borderTopColor: '#050508', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                Processing...
              </span>
            ) : (
              `Subscribe — $${price}/${cycle === 'monthly' ? 'mo' : 'yr'} →`
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: theme.textDark, fontFamily: theme.fontMono }}>
            Secure payment via Stripe · Cancel anytime
          </div>
        </div>

        {/* Switch plan link */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: theme.textDark }}>
          Wrong plan?{' '}
          <span onClick={() => onNavigate('home')} style={{ color: theme.pink, cursor: 'pointer', fontWeight: 600 }}>
            Go back to compare plans
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
