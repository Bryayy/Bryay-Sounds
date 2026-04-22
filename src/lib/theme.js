export const theme = {
  bg: '#050508',
  bgCard: 'rgba(15,10,20,0.8)',
  bgHover: 'rgba(255,45,138,0.04)',
  pink: '#FF2D8A',
  pinkGlow: 'rgba(255,45,138,0.3)',
  pinkSoft: 'rgba(255,45,138,0.15)',
  pinkBorder: 'rgba(255,45,138,0.15)',
  text: '#F0E6F0',
  textMuted: '#8A7A8A',
  textDark: '#6A5A6A',
  textDarker: '#3A2A3A',
  border: 'rgba(255,45,138,0.08)',
  fontHeading: "'Orbitron', sans-serif",
  fontMono: "'Share Tech Mono', monospace",
  fontBody: "'Chakra Petch', sans-serif",
}

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Chakra Petch', sans-serif; background: #050508; color: #F0E6F0; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0A0A0F; }
  ::-webkit-scrollbar-thumb { background: #FF2D8A; border-radius: 3px; }
  a { color: #FF2D8A; text-decoration: none; }
  a:hover { text-shadow: 0 0 10px rgba(255,45,138,0.5); }

  @keyframes wave { 0% { height: 4px; } 100% { height: 24px; } }
  @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.3} 94%{opacity:1} 96%{opacity:0.7} 97%{opacity:1} }
  @keyframes glitch1 { 0%,100%{clip-path:inset(0);transform:translate(0)} 20%{clip-path:inset(20% 0 60% 0);transform:translate(-3px)} 40%{clip-path:inset(40% 0 30% 0);transform:translate(3px)} 60%{clip-path:inset(60% 0 10% 0);transform:translate(-2px)} 80%{clip-path:inset(10% 0 70% 0);transform:translate(2px)} }
  @keyframes glitch2 { 0%,100%{clip-path:inset(0);transform:translate(0)} 20%{clip-path:inset(60% 0 10% 0);transform:translate(3px)} 40%{clip-path:inset(10% 0 70% 0);transform:translate(-3px)} 60%{clip-path:inset(30% 0 40% 0);transform:translate(2px)} 80%{clip-path:inset(50% 0 20% 0);transform:translate(-2px)} }
  @keyframes borderGlow { 0%,100%{border-color:rgba(255,45,138,0.4);box-shadow:0 0 15px rgba(255,45,138,0.1)} 50%{border-color:rgba(255,45,138,0.8);box-shadow:0 0 25px rgba(255,45,138,0.2)} }
  @keyframes spin { to { transform: rotate(360deg); } }

  .glitch-text { position: relative; font-family: 'Orbitron', sans-serif; animation: flicker 4s infinite; }
  .glitch-text::before, .glitch-text::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
  .glitch-text::before { color: #00FFFF; animation: glitch1 3s infinite; z-index: -1; }
  .glitch-text::after { color: #FF2D8A; animation: glitch2 3s infinite reverse; z-index: -1; }
`

export const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(255,45,138,0.04)',
  border: '1px solid rgba(255,45,138,0.15)',
  borderRadius: 2,
  color: '#F0E6F0',
  fontSize: 14,
  fontFamily: "'Chakra Petch', sans-serif",
  outline: 'none',
  transition: 'border-color 0.2s',
}

export const inputFocusStyle = {
  borderColor: '#FF2D8A',
  boxShadow: '0 0 10px rgba(255,45,138,0.1)',
}

export const btnPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '14px 32px',
  borderRadius: 2,
  fontWeight: 600,
  fontSize: 13,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s',
  fontFamily: "'Chakra Petch', sans-serif",
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  background: '#FF2D8A',
  color: '#050508',
  boxShadow: '0 0 20px rgba(255,45,138,0.3)',
  width: '100%',
}

export const btnOutline = {
  ...btnPrimary,
  background: 'transparent',
  color: '#FF2D8A',
  border: '1px solid rgba(255,45,138,0.5)',
  boxShadow: 'none',
}
