import { useState, useEffect, useRef } from "react";
import { useAuth } from './lib/AuthContext';
import { supabase } from './lib/supabase';

const PLANS = [
  { name: "Basic", monthly: 9.99, annual: 99, credits: 5, streams: "500K", video: "500K", stems: false, tagFree: false, upgrade: 49 },
  { name: "Premium", monthly: 19.99, annual: 179, credits: 8, streams: "2M", video: "2M", stems: true, tagFree: true, upgrade: 99, popular: true },
];

function Waveform({ playing, color = "#FF2D8A" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 24 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: color,
          height: playing ? undefined : 6 + Math.random() * 12,
          animation: playing ? `wave 0.7s ease-in-out ${i * 0.08}s infinite alternate` : "none",
          boxShadow: playing ? `0 0 8px ${color}` : "none",
        }} />
      ))}
    </div>
  );
}

function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function GlitchText({ children }) {
  return (
    <span className="glitch-wrapper" style={{ position: "relative", display: "inline-block" }}>
      <span className="glitch-text" data-text={children}>{children}</span>
    </span>
  );
}

export default function BryayBeats({ onNavigate }) {
  const { user, profile, fetchProfile } = useAuth();
  const [currentBeat, setCurrentBeat] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [genreFilter, setGenreFilter] = useState("All");
  const [heroRef, heroVisible] = useReveal();
  const [catalogRef, catalogVisible] = useReveal();
  const [pricingRef, pricingVisible] = useReveal();
  const [licenseRef, licenseVisible] = useReveal();
  const [beats, setBeats] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [downloadMsg, setDownloadMsg] = useState('');
  const [audioRef] = useState(() => typeof Audio !== 'undefined' ? new Audio() : null);

  useEffect(() => {
    fetchBeats();
  }, []);

  const fetchBeats = async () => {
    const { data } = await supabase
      .from('beats')
      .select('*')
      .eq('exclusive_sold', false)
      .order('created_at', { ascending: false });
    setBeats(data || []);
  };

  const genres = ["All", ...new Set(beats.map((b) => b.genre))];
  const filteredBeats = genreFilter === "All" ? beats : beats.filter((b) => b.genre === genreFilter);
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const togglePlay = (id) => {
    if (currentBeat === id && isPlaying) {
      setIsPlaying(false);
      if (audioRef) audioRef.pause();
    } else {
      setCurrentBeat(id);
      setIsPlaying(true);
      // Play tagged preview if available
      const beat = beats.find(b => b.id === id);
      if (beat?.tagged_file_url && audioRef) {
        audioRef.src = beat.tagged_file_url;
        audioRef.play().catch(() => {});
      }
    }
  };

  const handleDownload = async (beatId) => {
    if (!user) {
      onNavigate && onNavigate('auth');
      return;
    }
    if (!profile || profile.plan === 'free') {
      setDownloadMsg('You need an active subscription to download beats.');
      setTimeout(() => setDownloadMsg(''), 4000);
      return;
    }
    if (profile.credits_remaining <= 0) {
      setDownloadMsg('No credits remaining. Credits reset on your next billing date.');
      setTimeout(() => setDownloadMsg(''), 4000);
      return;
    }

    setDownloading(beatId);
    setDownloadMsg('');

    try {
      const { data, error } = await supabase.rpc('download_beat', {
        p_user_id: user.id,
        p_beat_id: beatId,
      });

      if (error) {
        console.error('Download RPC error:', error);
        setDownloadMsg('Download failed. Please try again.');
      } else if (data?.error === 'already_downloaded') {
        setDownloadMsg('You already downloaded this beat. Check your dashboard.');
      } else if (data?.error) {
        setDownloadMsg(data.error);
      } else if (data?.success) {
        // Refresh profile to update credit count
        await fetchProfile(user.id);
        setDownloadMsg(`✓ "${data.beat_title}" downloaded! License: ${data.license_id} · ${data.credits_remaining} credits left`);
        
        // If clean file exists, trigger download
        if (data.clean_file_url) {
          const link = document.createElement('a');
          link.href = data.clean_file_url;
          link.download = `${data.beat_title} - Prod. by Bryay`;
          link.click();
        }
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadMsg('Something went wrong. Please try again.');
    }

    setDownloading(null);
    setTimeout(() => setDownloadMsg(''), 6000);
  };

  return (
    <div style={{ fontFamily: "'Chakra Petch', sans-serif", background: "#050508", color: "#F0E6F0", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0A0A0F; }
        ::-webkit-scrollbar-thumb { background: #FF2D8A; border-radius: 3px; }

        @keyframes wave { 0% { height: 4px; } 100% { height: 24px; } }
        @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.3} 94%{opacity:1} 96%{opacity:0.7} 97%{opacity:1} }
        @keyframes glitch1 { 0%,100%{clip-path:inset(0);transform:translate(0)} 20%{clip-path:inset(20% 0 60% 0);transform:translate(-3px)} 40%{clip-path:inset(40% 0 30% 0);transform:translate(3px)} 60%{clip-path:inset(60% 0 10% 0);transform:translate(-2px)} 80%{clip-path:inset(10% 0 70% 0);transform:translate(2px)} }
        @keyframes glitch2 { 0%,100%{clip-path:inset(0);transform:translate(0)} 20%{clip-path:inset(60% 0 10% 0);transform:translate(3px)} 40%{clip-path:inset(10% 0 70% 0);transform:translate(-3px)} 60%{clip-path:inset(30% 0 40% 0);transform:translate(2px)} 80%{clip-path:inset(50% 0 20% 0);transform:translate(-2px)} }
        @keyframes borderGlow { 0%,100%{border-color:rgba(255,45,138,0.4);box-shadow:0 0 15px rgba(255,45,138,0.1)} 50%{border-color:rgba(255,45,138,0.8);box-shadow:0 0 25px rgba(255,45,138,0.2)} }

        .reveal { opacity: 0; transform: translateY(40px); transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        .glitch-text { position: relative; font-family: 'Orbitron', sans-serif; animation: flicker 4s infinite; }
        .glitch-text::before, .glitch-text::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .glitch-text::before { color: #00FFFF; animation: glitch1 3s infinite; z-index: -1; }
        .glitch-text::after { color: #FF2D8A; animation: glitch2 3s infinite reverse; z-index: -1; }

        .nav-link { color: #8A7A8A; text-decoration: none; font-size: 12px; font-weight: 600; transition: all 0.3s; letter-spacing: 2px; text-transform: uppercase; font-family: 'Share Tech Mono', monospace; cursor: pointer; }
        .nav-link:hover { color: #FF2D8A; text-shadow: 0 0 10px rgba(255,45,138,0.5); }

        .beat-row { display: grid; grid-template-columns: 44px 2fr 1fr 70px 60px 70px 80px; align-items: center; padding: 14px 20px; border-radius: 2px; transition: all 0.25s; cursor: pointer; gap: 12px; border-bottom: 1px solid rgba(255,45,138,0.06); position: relative; }
        .beat-row:hover { background: rgba(255,45,138,0.04); border-bottom-color: rgba(255,45,138,0.15); }
        .beat-row:hover::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #FF2D8A; box-shadow: 0 0 10px #FF2D8A; }

        .play-btn { width: 38px; height: 38px; border-radius: 2px; border: 1px solid rgba(255,45,138,0.4); background: transparent; color: #FF2D8A; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 12px; }
        .play-btn:hover { background: #FF2D8A; color: #050508; box-shadow: 0 0 20px rgba(255,45,138,0.4); }
        .play-btn.active { background: #FF2D8A; color: #050508; box-shadow: 0 0 20px rgba(255,45,138,0.5); }

        .plan-card { background: rgba(15,10,20,0.8); border-radius: 4px; padding: 40px 32px; border: 1px solid rgba(255,45,138,0.15); transition: all 0.4s; position: relative; overflow: hidden; backdrop-filter: blur(10px); }
        .plan-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, #FF2D8A, transparent); opacity: 0; transition: opacity 0.4s; }
        .plan-card:hover::before { opacity: 1; }
        .plan-card:hover { border-color: rgba(255,45,138,0.4); box-shadow: 0 0 40px rgba(255,45,138,0.08), inset 0 0 40px rgba(255,45,138,0.02); }
        .plan-card.popular { border-color: rgba(255,45,138,0.5); animation: borderGlow 3s infinite; }

        .cta-btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 32px; border-radius: 2px; font-weight: 600; font-size: 13px; border: none; cursor: pointer; transition: all 0.3s; text-decoration: none; font-family: 'Chakra Petch', sans-serif; letter-spacing: 1.5px; text-transform: uppercase; }
        .cta-primary { background: #FF2D8A; color: #050508; box-shadow: 0 0 20px rgba(255,45,138,0.3); }
        .cta-primary:hover { background: #FF5AA5; box-shadow: 0 0 40px rgba(255,45,138,0.5), 0 0 80px rgba(255,45,138,0.2); transform: translateY(-2px); }
        .cta-outline { background: transparent; color: #FF2D8A; border: 1px solid rgba(255,45,138,0.5); }
        .cta-outline:hover { background: rgba(255,45,138,0.1); box-shadow: 0 0 20px rgba(255,45,138,0.15); }

        .genre-pill { padding: 8px 18px; border-radius: 2px; border: 1px solid rgba(255,45,138,0.15); background: transparent; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Share Tech Mono', monospace; color: #6A5A6A; letter-spacing: 1px; text-transform: uppercase; }
        .genre-pill:hover { border-color: rgba(255,45,138,0.4); color: #FF2D8A; }
        .genre-pill.active { background: #FF2D8A; color: #050508; border-color: #FF2D8A; box-shadow: 0 0 15px rgba(255,45,138,0.3); }

        .stat-num { font-family: 'Orbitron', sans-serif; font-size: 32px; font-weight: 800; color: #FF2D8A; line-height: 1; text-shadow: 0 0 20px rgba(255,45,138,0.4); }
        .hot-badge { display: inline-flex; align-items: center; gap: 3px; background: rgba(255,45,138,0.15); color: #FF2D8A; padding: 2px 8px; border-radius: 2px; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; font-family: 'Share Tech Mono', monospace; border: 1px solid rgba(255,45,138,0.2); }

        .toggle-track { width: 260px; height: 44px; background: rgba(255,45,138,0.06); border: 1px solid rgba(255,45,138,0.2); border-radius: 2px; display: flex; position: relative; padding: 3px; cursor: pointer; }
        .toggle-thumb { position: absolute; top: 3px; height: 36px; width: 50%; background: #FF2D8A; border-radius: 1px; transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 0 15px rgba(255,45,138,0.3); }
        .toggle-label { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; z-index: 1; transition: color 0.3s; cursor: pointer; font-family: 'Share Tech Mono', monospace; letter-spacing: 1px; text-transform: uppercase; }

        .section-label { font-size: 11px; font-weight: 600; color: #FF2D8A; letter-spacing: 3px; text-transform: uppercase; font-family: 'Share Tech Mono', monospace; margin-bottom: 12px; }
        .section-title { font-family: 'Orbitron', sans-serif; font-size: clamp(24px, 4vw, 36px); font-weight: 700; letter-spacing: -0.5px; color: #F0E6F0; }

        @media (max-width: 768px) {
          .beat-row { grid-template-columns: 38px 1fr 50px 38px; }
          .beat-row .hide-mobile { display: none; }
          .plan-card { padding: 28px 20px; }
        }
      `}</style>

      {/* NOISE + SCANLINES */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`, pointerEvents: "none", zIndex: 9999, opacity: 0.6 }} />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,45,138,0.008) 2px, rgba(255,45,138,0.008) 4px)", pointerEvents: "none", zIndex: 9998 }} />

      {/* NAVBAR */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(5,5,8,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,45,138,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, border: "1px solid #FF2D8A", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF2D8A", fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 13, boxShadow: "0 0 10px rgba(255,45,138,0.3)", borderRadius: 2 }}>B</div>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 3, color: "#F0E6F0" }}>BRYAY<span style={{ color: "#FF2D8A" }}>SOUNDS</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <a className="nav-link" onClick={() => scrollTo("catalog")}>Beats</a>
            <a className="nav-link" onClick={() => scrollTo("pricing")}>Plans</a>
            <a className="nav-link" onClick={() => scrollTo("license")}>License</a>
            <a className="nav-link" onClick={() => scrollTo("faq")}>FAQ</a>
            {user ? (
              <button className="cta-btn cta-primary" style={{ padding: "10px 24px", fontSize: 11 }} onClick={() => onNavigate && onNavigate('dashboard')}>Dashboard</button>
            ) : (
              <>
                <a className="nav-link" onClick={() => onNavigate && onNavigate('auth')}>Login</a>
                <button className="cta-btn cta-primary" style={{ padding: "10px 24px", fontSize: 11 }} onClick={() => onNavigate && onNavigate('auth')}>Subscribe</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" ref={heroRef} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", right: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,138,0.12) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,0,255,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: 0, left: "-50%", right: "-50%", height: 300, backgroundImage: "linear-gradient(rgba(255,45,138,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,138,0.06) 1px, transparent 1px)", backgroundSize: "50px 50px", transform: "perspective(500px) rotateX(55deg)", transformOrigin: "center bottom", maskImage: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)" }} />

        <div className={`reveal ${heroVisible ? "visible" : ""}`} style={{ textAlign: "center", maxWidth: 780, position: "relative" }}>
          <div style={{ display: "inline-block", padding: "6px 20px", borderRadius: 2, border: "1px solid rgba(255,45,138,0.3)", background: "rgba(255,45,138,0.05)", color: "#FF2D8A", fontSize: 10, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", fontFamily: "'Share Tech Mono', monospace", marginBottom: 32 }}>
            ◆ Latin Urban Beats · Subscription Access ◆
          </div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 28, letterSpacing: -1 }}>
            <GlitchText>YOUR SOUND,</GlitchText><br />
            <span style={{ color: "#FF2D8A", textShadow: "0 0 30px rgba(255,45,138,0.5), 0 0 60px rgba(255,45,138,0.2)" }}>ON DEMAND.</span>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "#8A7A8A", marginBottom: 48, maxWidth: 520, margin: "0 auto 48px", fontWeight: 300 }}>
            Subscribe. Download. Release. Premium Latin urban beats with artist-friendly licensing. No middleman.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="cta-btn cta-primary" onClick={() => scrollTo("catalog")}>Browse Catalog →</button>
            <button className="cta-btn cta-outline" onClick={() => scrollTo("pricing")}>View Plans</button>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 56, marginTop: 72, flexWrap: "wrap" }}>
            {[{ num: "200+", label: "Beats" }, { num: "$9.99", label: "Starting" }, { num: "5", label: "Credits/mo" }].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div className="stat-num">{s.num}</div>
                <div style={{ fontSize: 10, color: "#6A5A6A", marginTop: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" ref={catalogRef} style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div className={`reveal ${catalogVisible ? "visible" : ""}`}>
          <div style={{ marginBottom: 48 }}>
            <div className="section-label">// Catalog</div>
            <div className="section-title">Latest Drops</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
            {genres.map((g) => (<button key={g} className={`genre-pill ${genreFilter === g ? "active" : ""}`} onClick={() => setGenreFilter(g)}>{g}</button>))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "44px 2fr 1fr 70px 60px 70px 44px", padding: "0 20px 12px", borderBottom: "1px solid rgba(255,45,138,0.1)", gap: 12 }}>
            <div />
            {["Track", "Genre", "BPM", "Key", "Time"].map((h, i) => (
              <div key={h} className={i > 0 ? "hide-mobile" : ""} style={{ fontSize: 10, fontWeight: 600, color: "#6A5A6A", textTransform: "uppercase", letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace" }}>{h}</div>
            ))}
            <div />
          </div>
          {filteredBeats.map((beat) => (
            <div key={beat.id} className="beat-row" onClick={() => togglePlay(beat.id)}>
              <button className={`play-btn ${currentBeat === beat.id && isPlaying ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); togglePlay(beat.id); }}>
                {currentBeat === beat.id && isPlaying ? "❚❚" : "▶"}
              </button>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8, color: "#F0E6F0" }}>
                  {beat.title}
                  {beat.is_hot && <span className="hot-badge">◈ HOT</span>}
                </div>
                <div style={{ fontSize: 11, color: "#6A5A6A", fontFamily: "'Share Tech Mono', monospace" }}>Prod. by Bryay</div>
              </div>
              <div className="hide-mobile" style={{ fontSize: 12, color: "#8A7A8A" }}>{beat.genre}</div>
              <div className="hide-mobile" style={{ fontSize: 12, color: "#8A7A8A", fontFamily: "'Share Tech Mono', monospace" }}>{beat.bpm}</div>
              <div className="hide-mobile" style={{ fontSize: 12, color: "#8A7A8A", fontFamily: "'Share Tech Mono', monospace" }}>{beat.key}</div>
              <div className="hide-mobile" style={{ fontSize: 12, color: "#6A5A6A", fontFamily: "'Share Tech Mono', monospace" }}>{beat.duration}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {currentBeat === beat.id && isPlaying && <Waveform playing={true} />}
                <button onClick={(e) => { e.stopPropagation(); handleDownload(beat.id); }} disabled={downloading === beat.id} style={{
                  background: downloading === beat.id ? "rgba(255,45,138,0.2)" : "transparent",
                  border: "1px solid rgba(255,45,138,0.3)", borderRadius: 2,
                  color: "#FF2D8A", cursor: downloading === beat.id ? "not-allowed" : "pointer",
                  padding: "4px 10px", fontSize: 10, fontFamily: "'Share Tech Mono', monospace",
                  letterSpacing: 1, transition: "all 0.2s",
                }}>
                  {downloading === beat.id ? "..." : "↓"}
                </button>
              </div>
            </div>
          ))}

          {/* Download message */}
          {downloadMsg && (
            <div style={{
              padding: "12px 20px", margin: "16px 0", borderRadius: 2,
              background: downloadMsg.startsWith("✓") ? "rgba(45,255,138,0.08)" : "rgba(255,45,138,0.08)",
              border: `1px solid ${downloadMsg.startsWith("✓") ? "rgba(45,255,138,0.3)" : "rgba(255,45,138,0.3)"}`,
              color: downloadMsg.startsWith("✓") ? "#2DFF8A" : "#FF2D8A",
              fontSize: 12, fontFamily: "'Share Tech Mono', monospace", textAlign: "center",
            }}>
              {downloadMsg}
            </div>
          )}

          {currentBeat && (
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,45,138,0.15)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
              <Waveform playing={isPlaying} />
              <div style={{ color: "#F0E6F0", fontWeight: 600, fontSize: 13, fontFamily: "'Orbitron', sans-serif", letterSpacing: 1 }}>{beats.find((b) => b.id === currentBeat)?.title}</div>
              <div style={{ color: "#FF2D8A", fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>Prod. by Bryay</div>
              <button onClick={() => { setIsPlaying(!isPlaying); if (audioRef) { isPlaying ? audioRef.pause() : audioRef.play().catch(() => {}); } }} style={{ background: "#FF2D8A", border: "none", color: "#050508", width: 36, height: 36, borderRadius: 2, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px rgba(255,45,138,0.4)" }}>{isPlaying ? "❚❚" : "▶"}</button>
              <button onClick={() => { setCurrentBeat(null); setIsPlaying(false); if (audioRef) audioRef.pause(); }} style={{ background: "none", border: "none", color: "#6A5A6A", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(180deg, rgba(255,45,138,0.02) 0%, rgba(5,5,8,1) 100%)", borderTop: "1px solid rgba(255,45,138,0.06)", borderBottom: "1px solid rgba(255,45,138,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="section-label">// Process</div>
            <div className="section-title">How It Works</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {[
              { step: "01", title: "Subscribe", desc: "Pick your plan. Monthly or annual. Basic or Premium." },
              { step: "02", title: "Browse", desc: "Preview every beat in the catalog. Find your sound." },
              { step: "03", title: "Download", desc: "Use credits to download beats. License included instantly." },
              { step: "04", title: "Release", desc: "Drop on any platform. Credit 'Prod. by Bryay'. That's it." },
            ].map((item, i) => (
              <div key={i} style={{ background: "rgba(15,10,20,0.5)", borderRadius: 4, padding: 32, border: "1px solid rgba(255,45,138,0.08)", transition: "all 0.3s" }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 40, fontWeight: 800, color: "rgba(255,45,138,0.08)", marginBottom: 20, lineHeight: 1 }}>{item.step}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, fontFamily: "'Orbitron', sans-serif", letterSpacing: 1 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#8A7A8A", lineHeight: 1.7, fontWeight: 300 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" ref={pricingRef} style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div className={`reveal ${pricingVisible ? "visible" : ""}`}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-label">// Plans</div>
            <div className="section-title" style={{ marginBottom: 28 }}>Choose Your Access</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <div className="toggle-track" onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}>
                <div className="toggle-thumb" style={{ left: billingCycle === "monthly" ? 3 : "calc(50% - 3px)" }} />
                <div className="toggle-label" style={{ color: billingCycle === "monthly" ? "#050508" : "#6A5A6A" }}>Monthly</div>
                <div className="toggle-label" style={{ color: billingCycle === "annual" ? "#050508" : "#6A5A6A" }}>Annual</div>
              </div>
            </div>
            {billingCycle === "annual" && <div style={{ fontSize: 11, color: "#FF2D8A", fontWeight: 600, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>▲ SAVE UP TO $61/YEAR</div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, maxWidth: 720, margin: "0 auto" }}>
            {PLANS.map((plan) => (
              <div key={plan.name} className={`plan-card ${plan.popular ? "popular" : ""}`}>
                {plan.popular && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", background: "#FF2D8A", color: "#050508", padding: "4px 20px", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Share Tech Mono', monospace" }}>◈ Most Popular</div>}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#FF2D8A", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, fontFamily: "'Share Tech Mono', monospace" }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 44, fontWeight: 800, color: "#F0E6F0", textShadow: "0 0 20px rgba(255,45,138,0.15)" }}>${billingCycle === "monthly" ? plan.monthly : plan.annual}</span>
                    <span style={{ color: "#6A5A6A", fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                  </div>
                  {billingCycle === "annual" && <div style={{ fontSize: 11, color: "#FF2D8A", marginTop: 6, fontFamily: "'Share Tech Mono', monospace" }}>${((plan.monthly * 12) - plan.annual).toFixed(0)} saved vs monthly</div>}
                </div>
                <div style={{ fontSize: 13, color: "#F0E6F0", fontWeight: 700, marginBottom: 20, fontFamily: "'Orbitron', sans-serif", letterSpacing: 0.5 }}>{plan.credits} credits / month</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
                  {[
                    { text: `${plan.streams} audio streams / track`, on: true },
                    { text: `${plan.video} video streams / track`, on: true },
                    { text: "Non-exclusive license", on: true },
                    { text: "Perpetual for releases", on: true },
                    { text: `Upgrade available ($${plan.upgrade})`, on: true },
                    { text: "Stem packs included", on: plan.stems },
                    { text: "Tag-free downloads", on: plan.tagFree },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 2, border: `1px solid ${f.on ? "rgba(255,45,138,0.4)" : "rgba(106,90,106,0.2)"}`, background: f.on ? "rgba(255,45,138,0.1)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: f.on ? "#FF2D8A" : "#3A2A3A", flexShrink: 0 }}>{f.on ? "✓" : "—"}</div>
                      <span style={{ fontSize: 12, color: f.on ? "#B0A0B0" : "#3A2A3A", fontFamily: "'Share Tech Mono', monospace" }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <button className={`cta-btn ${plan.popular ? "cta-primary" : "cta-outline"}`} style={{ width: "100%" }} onClick={() => onNavigate && onNavigate('checkout', { plan: plan.name.toLowerCase(), cycle: billingCycle })}>Get {plan.name}</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, padding: 32, maxWidth: 720, margin: "40px auto 0", background: "linear-gradient(135deg, rgba(255,45,138,0.06) 0%, rgba(5,5,8,1) 100%)", border: "1px solid rgba(255,45,138,0.15)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ color: "#FF2D8A", fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, fontFamily: "'Share Tech Mono', monospace" }}>◆ Full ownership</div>
              <div style={{ color: "#F0E6F0", fontSize: 18, fontWeight: 700, fontFamily: "'Orbitron', sans-serif", letterSpacing: 1 }}>Exclusives from $250</div>
              <div style={{ color: "#6A5A6A", fontSize: 12, marginTop: 4, fontFamily: "'Share Tech Mono', monospace" }}>Beat removed. Full rights. One owner.</div>
            </div>
            <button className="cta-btn cta-outline">Inquire →</button>
          </div>
        </div>
      </section>

      {/* LICENSE */}
      <section id="license" ref={licenseRef} style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,45,138,0.06)", background: "linear-gradient(180deg, rgba(255,45,138,0.02) 0%, rgba(5,5,8,1) 100%)" }}>
        <div className={`reveal ${licenseVisible ? "visible" : ""}`} style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-label">// Legal</div>
            <div className="section-title">License Terms</div>
          </div>
          <div style={{ background: "rgba(15,10,20,0.6)", borderRadius: 4, padding: 40, border: "1px solid rgba(255,45,138,0.08)", backdropFilter: "blur(10px)" }}>
            {[
              { q: "Usage Rights", a: "Record, mix, master, and release on any streaming platform, social media, or digital store worldwide." },
              { q: "Credit Requirement", a: "All releases must include 'Prod. by Bryay' in the title, description, or credits. All tiers." },
              { q: "Stream Limits", a: "Basic: 500K audio + 500K video per track. Premium: 2M each. Exceed the cap? Purchase a one-time upgrade." },
              { q: "License Duration", a: "Perpetual for released music. Your song stays up forever. Stream cap still applies." },
              { q: "Non-Exclusive", a: "Multiple artists can license the same beat with independent licenses and stream caps." },
              { q: "Exclusives", a: "$250+ removes the beat permanently. Existing license holders are grandfathered in." },
              { q: "Cancellation", a: "Keep all licenses for downloaded beats. You just lose access to new downloads." },
              { q: "Restrictions", a: "No reselling the beat. No registering the composition as yours. No hate speech or illegal use." },
            ].map((item, i) => (
              <div key={i} style={{ padding: "20px 0", borderBottom: i < 7 ? "1px solid rgba(255,45,138,0.06)" : "none" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "#FF2D8A", fontFamily: "'Orbitron', sans-serif", letterSpacing: 0.5 }}>{item.q}</div>
                <div style={{ fontSize: 13, color: "#8A7A8A", lineHeight: 1.8, fontWeight: 300 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: "80px 24px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="section-label">// FAQ</div>
          <div className="section-title">Questions</div>
        </div>
        {[
          { q: "Do unused credits roll over?", a: "No. Credits reset each billing cycle. This keeps things clean and keeps you releasing." },
          { q: "Can two artists use the same beat?", a: "Yes. All subscription licenses are non-exclusive. Each artist gets their own license and independent stream cap." },
          { q: "What if my song goes viral?", a: "Purchase a one-time license upgrade — $49 (Basic) or $99 (Premium) — for unlimited streams on that track." },
          { q: "Do I get stems?", a: "Premium includes 2 stem packs/month. Basic subscribers can purchase stems separately." },
          { q: "Can I try before subscribing?", a: "Every beat has a free tagged preview. Record to it, and when you're ready to release, subscribe and grab the clean file." },
          { q: "How do exclusives work?", a: "Separate from subscriptions. $250+ removes the beat from the catalog permanently. One owner, full rights." },
        ].map((item, i) => {
          const [open, setOpen] = useState(false);
          return (
            <div key={i} style={{ borderBottom: "1px solid rgba(255,45,138,0.08)" }}>
              <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", fontFamily: "'Chakra Petch', sans-serif", textAlign: "left" }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#F0E6F0" }}>{item.q}</span>
                <span style={{ color: "#FF2D8A", fontSize: 18, transition: "transform 0.3s", transform: open ? "rotate(45deg)" : "rotate(0)", fontFamily: "'Share Tech Mono', monospace" }}>+</span>
              </button>
              <div style={{ maxHeight: open ? 200 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
                <div style={{ paddingBottom: 20, fontSize: 13, color: "#8A7A8A", lineHeight: 1.8, fontWeight: 300 }}>{item.a}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 24px", textAlign: "center", position: "relative", overflow: "hidden", borderTop: "1px solid rgba(255,45,138,0.06)" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,138,0.08) 0%, transparent 60%)", filter: "blur(80px)" }} />
        <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#F0E6F0", letterSpacing: -0.5, marginBottom: 16 }}>Ready to create?</div>
          <p style={{ color: "#6A5A6A", fontSize: 14, marginBottom: 36, fontFamily: "'Share Tech Mono', monospace" }}>Start with 1 free credit. No card required.</p>
          <button className="cta-btn cta-primary" style={{ fontSize: 14, padding: "16px 48px" }} onClick={() => onNavigate && onNavigate('auth')}>Start Free →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "40px 24px", borderTop: "1px solid rgba(255,45,138,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, border: "1px solid rgba(255,45,138,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF2D8A", fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 9, borderRadius: 2 }}>B</div>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, color: "#6A5A6A", letterSpacing: 2 }}>BRYAYSOUNDS</span>
          </div>
          <div style={{ fontSize: 11, color: "#3A2A3A", fontFamily: "'Share Tech Mono', monospace" }}>© 2026 BRYAYSOUNDS. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>

      {currentBeat && <div style={{ height: 70 }} />}
    </div>
  );
}
