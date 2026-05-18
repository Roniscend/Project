import { useState, useEffect } from 'react';
import { api } from './api.js';
import BuildGraphTab from './tabs/BuildGraphTab.jsx';
import BFSTab       from './tabs/BFSTab.jsx';
import DFSTab       from './tabs/DFSTab.jsx';
import SchedulerTab from './tabs/SchedulerTab.jsx';
import DemoTab      from './tabs/DemoTab.jsx';
import OverviewTab  from './tabs/OverviewTab.jsx';

const TABS = [
  { id: 'overview',  label: 'Overview',       icon: '🏙️' },
  { id: 'build',     label: 'Build Graph',     icon: '🏗️' },
  { id: 'bfs',       label: 'BFS Pathfinder',  icon: '🔵' },
  { id: 'dfs',       label: 'DFS Zone Mapper', icon: '🌊' },
  { id: 'scheduler', label: 'RR Scheduler',    icon: '⚙️' },
  { id: 'demo',      label: 'Live Demo',       icon: '🚀' },
];

export default function App() {
  const [tab,       setTab]       = useState('overview');
  const [graphData, setGraphData] = useState({ nodes: {}, edges: [] });
  const [loading,   setLoading]   = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  // User-built custom graph — shared across BFS / DFS tabs
  const [customGraph, setCustomGraph] = useState({ nodes: {}, edges: [] });

  useEffect(() => {
    api.getGraph()
      .then(d => { setGraphData(d); setApiOnline(true); })
      .catch(() => setApiOnline(false))
      .finally(() => setLoading(false));
  }, []);

  // Determine which graph tabs should use:
  // if user has built their own graph (≥1 node), prefer that; else Bangalore default
  const hasCustom   = Object.keys(customGraph.nodes).length > 0;
  // Merge: show ALL nodes on map (Bangalore preset + user's custom), but
  // BFS/DFS run exclusively on the custom subgraph (sent via custom_nodes/custom_edges).
  const activeGraph = hasCustom
    ? {
        nodes: { ...graphData.nodes, ...customGraph.nodes },
        edges: [...graphData.edges, ...customGraph.edges],
      }
    : graphData;

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">Packet<span>Path</span></span>
        </div>
        <span className="header-subtitle">Grid Fault Management · BFS · DFS · Round-Robin</span>

        {/* Custom graph badge */}
        {hasCustom && (
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.4)',
            borderRadius:8, padding:'4px 12px', fontSize:'0.75rem',
            color:'#a78bfa', fontWeight:700,
          }}>
            🏗️ Custom Graph Active ({Object.keys(customGraph.nodes).length} nodes)
          </div>
        )}

        <div className="header-status" style={{ marginLeft:'auto' }}>
          <div className="status-dot" style={{
            background: apiOnline ? 'var(--green)' : 'var(--red)',
            boxShadow: apiOnline ? '0 0 8px var(--green)' : '0 0 8px var(--red)',
          }} />
          {apiOnline ? 'API Online' : 'API Offline'}
        </div>
      </header>

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
          />
        )}
        {tab === 'dfs'       && (
          <DFSTab
            graphData={activeGraph}
            isCustom={hasCustom}
            onClearCustom={() => setCustomGraph({ nodes:{}, edges:[] })}
          />
        )}
        {tab === 'scheduler' && <SchedulerTab graphData={activeGraph} />}
        {tab === 'demo'      && <DemoTab      graphData={graphData} />}
      </main>
    </div>
  );
}
