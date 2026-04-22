import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { theme, btnPrimary, btnOutline, inputStyle } from '../lib/theme'

const GENRES = ['Dembow', 'Reggaeton', 'Trap Latino', 'Latin Urban', 'R&B / Latin', 'Bachata', 'Dancehall', 'Other']
const KEYS = ['C', 'Cm', 'D', 'Dm', 'E', 'Em', 'F', 'Fm', 'G', 'Gm', 'A', 'Am', 'Bb', 'Bbm', 'B', 'Bm', 'Db', 'Eb', 'Ab']

export default function AdminPage({ onNavigate }) {
  const { user, profile } = useAuth()
  const [beats, setBeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ subscribers: 0, downloads: 0, beats: 0 })

  // Upload form state
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('Reggaeton')
  const [bpm, setBpm] = useState('')
  const [beatKey, setBeatKey] = useState('Cm')
  const [duration, setDuration] = useState('')
  const [isHot, setIsHot] = useState(false)
  const [taggedFile, setTaggedFile] = useState(null)
  const [cleanFile, setCleanFile] = useState(null)
  const [stemsFile, setStemsFile] = useState(null)

  const taggedRef = useRef(null)
  const cleanRef = useRef(null)
  const stemsRef = useRef(null)

  useEffect(() => {
    fetchBeats()
    fetchStats()
  }, [])

  const fetchBeats = async () => {
    const { data } = await supabase
      .from('beats')
      .select('*')
      .order('created_at', { ascending: false })
    setBeats(data || [])
    setLoading(false)
  }

  const fetchStats = async () => {
    const { count: subCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('plan', 'free')

    const { count: dlCount } = await supabase
      .from('downloads')
      .select('*', { count: 'exact', head: true })

    const { count: beatCount } = await supabase
      .from('beats')
      .select('*', { count: 'exact', head: true })

    setStats({
      subscribers: subCount || 0,
      downloads: dlCount || 0,
      beats: beatCount || 0,
    })
  }

  const uploadFile = async (file, bucket, filename) => {
    const ext = file.name.split('.').pop()
    const path = `${filename}.${ext}`
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
    return urlData.publicUrl
  }

  const handleUpload = async () => {
    if (!title || !bpm || !duration) {
      setError('Fill in title, BPM, and duration')
      return
    }

    setUploading(true)
    setError('')
    setMessage('')

    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const timestamp = Date.now()
      const filename = `${slug}-${timestamp}`

      let taggedUrl = null
      let cleanUrl = null
      let stemsUrl = null

      if (taggedFile) {
        taggedUrl = await uploadFile(taggedFile, 'beats-tagged', filename + '-tagged')
      }
      if (cleanFile) {
        cleanUrl = await uploadFile(cleanFile, 'beats-clean', filename + '-clean')
      }
      if (stemsFile) {
        stemsUrl = await uploadFile(stemsFile, 'beats-stems', filename + '-stems')
      }

      const { error: insertError } = await supabase.from('beats').insert({
        title,
        genre,
        bpm: parseInt(bpm),
        key: beatKey,
        duration,
        is_hot: isHot,
        tagged_file_url: taggedUrl,
        clean_file_url: cleanUrl,
        stems_file_url: stemsUrl,
      })

      if (insertError) throw insertError

      setMessage(`"${title}" uploaded successfully!`)
      setTitle('')
      setBpm('')
      setDuration('')
      setIsHot(false)
      setTaggedFile(null)
      setCleanFile(null)
      setStemsFile(null)
      if (taggedRef.current) taggedRef.current.value = ''
      if (cleanRef.current) cleanRef.current.value = ''
      if (stemsRef.current) stemsRef.current.value = ''
      setShowUpload(false)
      fetchBeats()
      fetchStats()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload beat')
    }
    setUploading(false)
  }

  const toggleHot = async (beatId, currentHot) => {
    await supabase.from('beats').update({ is_hot: !currentHot }).eq('id', beatId)
    fetchBeats()
  }

  const deleteBeat = async (beatId, beatTitle) => {
    if (!confirm(`Delete "${beatTitle}"? This cannot be undone.`)) return
    await supabase.from('beats').delete().eq('id', beatId)
    fetchBeats()
    fetchStats()
  }

  if (!profile?.is_admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontFamily: theme.fontHeading, fontSize: 20, marginBottom: 8 }}>Admin Access Required</div>
          <div style={{ color: theme.textDark, fontSize: 13, fontFamily: theme.fontMono, marginBottom: 24 }}>
            This page is only accessible to administrators.
          </div>
          <button onClick={() => onNavigate('home')} style={{ ...btnOutline, width: 'auto', padding: '10px 24px' }}>
            ← Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,45,138,0.008) 2px, rgba(255,45,138,0.008) 4px)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Nav */}
      <nav style={{ background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,45,138,0.08)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onNavigate('home')}>
            <div style={{ width: 32, height: 32, border: '1px solid #FF2D8A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF2D8A', fontFamily: theme.fontHeading, fontWeight: 800, fontSize: 13, boxShadow: '0 0 10px rgba(255,45,138,0.3)', borderRadius: 2 }}>B</div>
            <span style={{ fontFamily: theme.fontHeading, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: theme.text }}>
              BRYAY<span style={{ color: theme.pink }}>SOUNDS</span>
            </span>
            <span style={{ fontSize: 10, color: theme.textDark, fontFamily: theme.fontMono, background: 'rgba(255,45,138,0.1)', padding: '2px 8px', borderRadius: 2, border: '1px solid rgba(255,45,138,0.2)', marginLeft: 8 }}>ADMIN</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span onClick={() => onNavigate('dashboard')} style={{ color: theme.textDark, fontSize: 12, cursor: 'pointer', fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase' }}>Dashboard</span>
            <span onClick={() => onNavigate('home')} style={{ color: theme.textDark, fontSize: 12, cursor: 'pointer', fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase' }}>Site</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="section-label" style={{ fontSize: 11, fontWeight: 600, color: theme.pink, letterSpacing: 3, textTransform: 'uppercase', fontFamily: theme.fontMono, marginBottom: 8 }}>// Admin Panel</div>
          <h1 style={{ fontFamily: theme.fontHeading, fontSize: 28, fontWeight: 700 }}>Manage Catalog</h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Beats', value: stats.beats, color: theme.pink },
            { label: 'Subscribers', value: stats.subscribers, color: '#2DFF8A' },
            { label: 'Downloads', value: stats.downloads, color: '#00FFFF' },
          ].map((s, i) => (
            <div key={i} style={{ background: theme.bgCard, borderRadius: 4, padding: 24, border: `1px solid ${theme.pinkBorder}` }}>
              <div style={{ fontSize: 10, color: theme.textDark, fontFamily: theme.fontMono, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: theme.fontHeading, fontSize: 28, fontWeight: 800, color: s.color, textShadow: `0 0 15px ${s.color}40` }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Upload Button */}
        <button onClick={() => setShowUpload(!showUpload)} style={{ ...btnPrimary, width: 'auto', padding: '12px 28px', marginBottom: 24 }}>
          {showUpload ? '✕ Cancel' : '+ Upload New Beat'}
        </button>

        {message && (
          <div style={{ padding: '12px 16px', marginBottom: 20, borderRadius: 2, background: 'rgba(45,255,138,0.1)', border: '1px solid rgba(45,255,138,0.3)', color: '#2DFF8A', fontSize: 13, fontFamily: theme.fontMono }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', marginBottom: 20, borderRadius: 2, background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', color: '#FF6B6B', fontSize: 13, fontFamily: theme.fontMono }}>
            {error}
          </div>
        )}

        {/* Upload Form */}
        {showUpload && (
          <div style={{ background: theme.bgCard, borderRadius: 4, padding: 32, border: `1px solid ${theme.pinkBorder}`, marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #FF2D8A, transparent)' }} />
            
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.pink, letterSpacing: 3, textTransform: 'uppercase', fontFamily: theme.fontMono, marginBottom: 20 }}>// New Beat</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Beat title" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Genre</label>
                <select value={genre} onChange={(e) => setGenre(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>BPM *</label>
                <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="120" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Key</label>
                <select value={beatKey} onChange={(e) => setBeatKey(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Duration *</label>
                <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="3:24" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'end', paddingBottom: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: theme.text }}>
                  <input type="checkbox" checked={isHot} onChange={(e) => setIsHot(e.target.checked)} style={{ accentColor: '#FF2D8A' }} />
                  Mark as HOT 🔥
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Tagged Preview (MP3)</label>
                <input ref={taggedRef} type="file" accept="audio/*" onChange={(e) => setTaggedFile(e.target.files[0])} style={{ ...inputStyle, padding: '10px 16px', fontSize: 12 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Clean File (WAV/MP3)</label>
                <input ref={cleanRef} type="file" accept="audio/*" onChange={(e) => setCleanFile(e.target.files[0])} style={{ ...inputStyle, padding: '10px 16px', fontSize: 12 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: theme.pink, fontFamily: theme.fontMono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Stems (ZIP)</label>
                <input ref={stemsRef} type="file" accept=".zip,.rar" onChange={(e) => setStemsFile(e.target.files[0])} style={{ ...inputStyle, padding: '10px 16px', fontSize: 12 }} />
              </div>
            </div>

            <button onClick={handleUpload} disabled={uploading} style={{ ...btnPrimary, width: 'auto', padding: '12px 32px', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Uploading...' : 'Upload Beat →'}
            </button>
          </div>
        )}

        {/* Beat List */}
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.pink, letterSpacing: 3, textTransform: 'uppercase', fontFamily: theme.fontMono, marginBottom: 16 }}>// All Beats ({beats.length})</div>
        
        <div style={{ background: theme.bgCard, borderRadius: 4, border: `1px solid ${theme.pinkBorder}`, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: theme.textDark, fontFamily: theme.fontMono }}>Loading...</div>
          ) : beats.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: theme.textDark, fontFamily: theme.fontMono }}>No beats yet. Upload your first beat above.</div>
          ) : beats.map((beat, i) => (
            <div key={beat.id} style={{
              padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: i < beats.length - 1 ? `1px solid ${theme.border}` : 'none',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {beat.title}
                  {beat.is_hot && <span style={{ background: 'rgba(255,45,138,0.15)', color: theme.pink, padding: '2px 6px', borderRadius: 2, fontSize: 9, fontWeight: 700, fontFamily: theme.fontMono }}>HOT</span>}
                  {beat.tagged_file_url && <span style={{ background: 'rgba(45,255,138,0.15)', color: '#2DFF8A', padding: '2px 6px', borderRadius: 2, fontSize: 9, fontWeight: 700, fontFamily: theme.fontMono }}>AUDIO</span>}
                </div>
                <div style={{ fontSize: 11, color: theme.textDark, fontFamily: theme.fontMono, display: 'flex', gap: 12, marginTop: 4 }}>
                  <span>{beat.genre}</span>
                  <span>{beat.bpm} BPM</span>
                  <span>{beat.key}</span>
                  <span>{beat.duration}</span>
                  <span>{beat.download_count || 0} downloads</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleHot(beat.id, beat.is_hot)} style={{
                  ...btnOutline, width: 'auto', padding: '6px 12px', fontSize: 10,
                  color: beat.is_hot ? '#FFD700' : theme.pink,
                  borderColor: beat.is_hot ? 'rgba(255,215,0,0.4)' : undefined,
                }}>
                  {beat.is_hot ? '★ Unmark' : '☆ Hot'}
                </button>
                <button onClick={() => deleteBeat(beat.id, beat.title)} style={{
                  ...btnOutline, width: 'auto', padding: '6px 12px', fontSize: 10,
                  color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.3)',
                }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
