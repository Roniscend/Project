import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { signInWithGoogle, error } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 55%), #080c14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background grid lines */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(99,179,237,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Floating orbs */}
      {[
        { top:'10%', left:'5%',   size:300, color:'rgba(59,130,246,0.06)',  blur:80  },
        { top:'60%', right:'5%',  size:250, color:'rgba(139,92,246,0.07)', blur:70  },
        { top:'40%', left:'40%',  size:200, color:'rgba(16,185,129,0.04)', blur:60  },
      ].map((o, i) => (
        <div key={i} style={{
          position:'absolute', borderRadius:'50%', pointerEvents:'none',
          width: o.size, height: o.size,
          background: o.color, filter: `blur(${o.blur}px)`,
          top: o.top, left: o.left, right: o.right,
        }} />
      ))}

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 440,
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99,179,237,0.15)',
        borderRadius: 20,
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 68, height: 68, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
            border: '1px solid rgba(99,179,237,0.25)',
            fontSize: '2rem', marginBottom: '1rem',
            boxShadow: '0 0 30px rgba(59,130,246,0.2)',
          }}>⚡</div>
          <div style={{ fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em', color: '#f1f5f9' }}>
            Packet<span style={{ color: '#3b82f6' }}>Path</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4, fontWeight: 500 }}>
            Grid Fault Management System
          </div>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem',
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.1)' }} />
          <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>
            SIGN IN TO CONTINUE
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.1)' }} />
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            background: loading
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(99,179,237,0.2)',
            borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
            color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 0 0 0 rgba(59,130,246,0)',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={e => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(99,179,237,0.5)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(59,130,246,0.15)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(99,179,237,0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 20, height: 20, border: '2px solid rgba(255,255,255,0.15)',
                borderTopColor: '#3b82f6', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              Signing in…
            </>
          ) : (
            <>
              {/* Google SVG logo */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '1rem', padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, fontSize: '0.78rem', color: '#fca5a5',
          }}>
            ❌ {error}
          </div>
        )}

        {/* Features preview */}
        <div style={{
          marginTop: '2rem', padding: '1rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(99,179,237,0.08)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
            WHAT'S INSIDE
          </div>
          {[
            { icon:'🗺️', text:'Real Bangalore OpenStreetMap grid' },
            { icon:'🔵', text:'BFS shortest path + brute force compare' },
            { icon:'⚙️', text:'Priority Round-Robin crew dispatch' },
            { icon:'🚀', text:'Live 3-fault simultaneous demo' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '5px 0',
              borderBottom: i < 3 ? '1px solid rgba(99,179,237,0.05)' : 'none',
            }}>
              <span style={{ fontSize: '0.85rem' }}>{f.icon}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{f.text}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.68rem', color: '#334155' }}>
          Protected by Google Authentication · PacketPath v2
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
