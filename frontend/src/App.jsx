import { useState, useEffect } from 'react';
import { api } from './api.js';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import LoginPage    from './components/LoginPage.jsx';
import BuildGraphTab from './tabs/BuildGraphTab.jsx';
import BFSTab        from './tabs/BFSTab.jsx';
import DFSTab        from './tabs/DFSTab.jsx';
import SchedulerTab  from './tabs/SchedulerTab.jsx';
import DemoTab       from './tabs/DemoTab.jsx';
import OverviewTab   from './tabs/OverviewTab.jsx';
import ProfileTab    from './tabs/ProfileTab.jsx';
import { useHistory } from './hooks/useHistory.js';

const TABS = [
  { id: 'overview',  label: 'Overview',       icon: '🏙️' },
  { id: 'build',     label: 'Build Graph',     icon: '🏗️' },
  { id: 'bfs',       label: 'BFS Pathfinder',  icon: '🔵' },
  { id: 'dfs',       label: 'DFS Zone Mapper', icon: '🌊' },
  { id: 'scheduler', label: 'RR Scheduler',    icon: '⚙️' },
  { id: 'demo',      label: 'Live Demo',       icon: '🚀' },
  { id: 'profile',   label: 'Profile',         icon: '👤' },
];

// ── Inner shell (rendered only when authenticated) ───────────────────────────
function AppShell() {
  const { user, logout } = useAuth();
  const { history, addEntry, clearHistory } = useHistory();

  const [tab,       setTab]       = useState('overview');
  const [graphData, setGraphData] = useState({ nodes: {}, edges: [] });
  const [loading,   setLoading]   = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [customGraph, setCustomGraph] = useState({ nodes: {}, edges: [] });

  useEffect(() => {
    api.getGraph()
      .then(d => { setGraphData(d); setApiOnline(true); })
      .catch(() => setApiOnline(false))
      .finally(() => setLoading(false));
  }, []);

  const hasCustom   = Object.keys(customGraph.nodes).length > 0;
  const activeGraph = hasCustom
    ? {
        nodes: { ...graphData.nodes, ...customGraph.nodes },
        edges: [...graphData.edges, ...customGraph.edges],
      }
    : graphData;

  const avatarChar = (user?.displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">Packet<span>Path</span></span>
        </div>
        <span className="header-divider">|</span>
        <span className="header-subtitle">Grid Fault Management · BFS · DFS · Round-Robin</span>

        {hasCustom && (
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.35)',
            borderRadius:20, padding:'4px 14px', fontSize:'0.73rem',
            color:'#a78bfa', fontWeight:700, letterSpacing:'0.02em',
            boxShadow:'0 0 12px rgba(139,92,246,0.2)',
          }}>
            🏗️ Custom +{Object.keys(customGraph.nodes).length}
          </div>
        )}

        <div className="header-status">
          <div className="status-dot" style={{
            background: apiOnline ? 'var(--green)' : 'var(--red)',
            boxShadow: apiOnline ? '0 0 10px var(--green)' : '0 0 10px var(--red)',
          }} />
          <span style={{ fontSize:'0.75rem', fontFamily:'var(--font-mono)', color: apiOnline ? 'var(--green)' : 'var(--red)' }}>
            {apiOnline ? 'API Online' : 'API Offline'}
          </span>
        </div>

        {/* ── User avatar + dropdown ── */}
        <div style={{ position:'relative', marginLeft:'0.5rem' }}>
          <button
            onClick={() => setShowUserMenu(m => !m)}
            style={{
              display:'flex', alignItems:'center', gap:'0.5rem',
              background: showUserMenu ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.05)',
              border:`1px solid ${showUserMenu ? 'rgba(99,179,237,0.5)' : 'rgba(99,179,237,0.2)'}`,
              borderRadius:24, padding:'4px 12px 4px 4px', cursor:'pointer',
              transition:'all .2s',
            }}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar"
                style={{ width:28, height:28, borderRadius:'50%', border:'2px solid rgba(59,130,246,0.5)' }} />
            ) : (
              <div style={{
                width:28, height:28, borderRadius:'50%',
                background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.85rem', fontWeight:700, color:'#fff',
              }}>
                {avatarChar}
              </div>
            )}
            <span style={{ fontSize:'0.75rem', color:'#94a3b8', fontWeight:600, maxWidth:100,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
            </span>
            <span style={{ color:'#475569', fontSize:'0.65rem' }}>{showUserMenu ? '▴' : '▾'}</span>
          </button>

          {/* Close menu on outside click */}
          {showUserMenu && (
            <div style={{ position:'fixed', inset:0, zIndex:98 }}
              onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); }} />
          )}

          {/* Dropdown */}
          {showUserMenu && (
            <div style={{
              position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:99999,
              background:'rgba(10,15,30,0.98)', backdropFilter:'blur(20px)',
              border:'1px solid rgba(99,179,237,0.22)', borderRadius:16,
              padding:'0.6rem', minWidth:230,
              boxShadow:'0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
              animation:'menuSlideIn .15s ease',
            }}>
              {/* User info */}
              <div style={{ padding:'10px 14px 12px', borderBottom:'1px solid rgba(99,179,237,0.1)', marginBottom:'0.4rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="avatar"
                      style={{ width:38, height:38, borderRadius:'50%', border:'2px solid rgba(59,130,246,0.4)' }} />
                  ) : (
                    <div style={{
                      width:38, height:38, borderRadius:'50%',
                      background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'1.1rem', fontWeight:700, color:'#fff',
                    }}>{avatarChar}</div>
                  )}
                  <div>
                    <div style={{ fontSize:'0.85rem', color:'#f1f5f9', fontWeight:700 }}>
                      {user?.displayName || 'User'}
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'#475569', marginTop:1 }}>
                      {user?.email}
                    </div>
                  </div>
                </div>
                {/* History summary */}
                <div style={{ display:'flex', gap:6 }}>
                  <span style={{
                    background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)',
                    color:'#60a5fa', borderRadius:12, padding:'2px 8px', fontSize:'0.65rem', fontWeight:700,
                  }}>🔵 {history.filter(h=>h.type==='bfs').length} BFS</span>
                  <span style={{
                    background:'rgba(6,182,212,0.1)', border:'1px solid rgba(6,182,212,0.25)',
                    color:'#22d3ee', borderRadius:12, padding:'2px 8px', fontSize:'0.65rem', fontWeight:700,
                  }}>🌊 {history.filter(h=>h.type==='dfs').length} DFS</span>
                  <span style={{
                    background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.25)',
                    color:'#a78bfa', borderRadius:12, padding:'2px 8px', fontSize:'0.65rem', fontWeight:700,
                  }}>⚙️ {history.filter(h=>h.type==='scheduler').length} RR</span>
                </div>
              </div>

              {/* View Profile */}
              <button
                onClick={() => { setShowUserMenu(false); setTab('profile'); }}
                style={{
                  width:'100%',
                  display:'flex', alignItems:'center', gap:'0.6rem',
                  background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)',
                  borderRadius:10, padding:'9px 14px', cursor:'pointer',
                  color:'#93c5fd', fontSize:'0.82rem', fontWeight:600,
                  transition:'all .15s', marginBottom:'0.35rem',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
              >
                👤 View Profile & History
              </button>

              {/* Sign out */}
              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                style={{
                  width:'100%',
                  display:'flex', alignItems:'center', gap:'0.6rem',
                  background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
                  borderRadius:10, padding:'9px 14px', cursor:'pointer',
                  color:'#fca5a5', fontSize:'0.82rem', fontWeight:700,
                  transition:'all .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Removed old overlay from here, moved to the dropdown container */}

      <nav className="nav-tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={`nav-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>
            <span>{t.icon}</span> {t.label}
            {t.id === 'build' && hasCustom && (
              <span style={{
                marginLeft:5, background:'rgba(139,92,246,0.2)',
                color:'#a78bfa', borderRadius:10, padding:'1px 6px', fontSize:'0.65rem',
              }}>●</span>
            )}
            {t.id === 'profile' && history.length > 0 && (
              <span style={{
                marginLeft:5, background:'rgba(59,130,246,0.2)',
                color:'#60a5fa', borderRadius:10, padding:'1px 6px', fontSize:'0.65rem', fontWeight:700,
              }}>{history.length}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {!apiOnline && !loading && (
          <div className="alert alert-error">
            ⚠️ Backend not reachable at localhost:8000. Run:{' '}
            <code style={{ marginLeft:6, fontFamily:'monospace' }}>uvicorn main:app --reload</code>
          </div>
        )}

        {tab === 'overview'  && <OverviewTab  graphData={graphData} />}
        {tab === 'build'     && (
          <BuildGraphTab
            customGraph={customGraph}
            setCustomGraph={setCustomGraph}
          />
        )}
        {tab === 'bfs'       && (
          <BFSTab
            graphData={activeGraph}
            isCustom={hasCustom}
            onClearCustom={() => setCustomGraph({ nodes:{}, edges:[] })}
            onAddHistory={addEntry}
          />
        )}
        {tab === 'dfs'       && (
          <DFSTab
            graphData={activeGraph}
            isCustom={hasCustom}
            onClearCustom={() => setCustomGraph({ nodes:{}, edges:[] })}
            onAddHistory={addEntry}
          />
        )}
        {tab === 'scheduler' && (
          <SchedulerTab
            graphData={activeGraph}
            onAddHistory={addEntry}
          />
        )}
        {tab === 'demo'      && <DemoTab      graphData={graphData} />}
        {tab === 'profile'   && (
          <ProfileTab
            history={history}
            clearHistory={clearHistory}
          />
        )}
      </main>

      <style>{`
        @keyframes menuSlideIn {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

// ── Root: show LoginPage until authenticated ─────────────────────────────────
function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight:'100vh', background:'#080c14',
        display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1rem',
      }}>
        <div style={{
          width:40, height:40, border:'3px solid rgba(99,179,237,0.2)',
          borderTopColor:'#3b82f6', borderRadius:'50%',
          animation:'spin 0.7s linear infinite',
        }} />
        <div style={{ color:'#475569', fontSize:'0.85rem' }}>Checking authentication…</div>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  return user ? <AppShell /> : <LoginPage />;
}

// ── Export: wrap everything in AuthProvider ──────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
