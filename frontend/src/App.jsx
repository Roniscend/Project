import { useState, useEffect } from 'react';
import { api } from './api.js';
import PowerGridGraph from './components/PowerGridGraph.jsx';
import GanttChart from './components/GanttChart.jsx';
import BFSTab from './tabs/BFSTab.jsx';
import DFSTab from './tabs/DFSTab.jsx';
import SchedulerTab from './tabs/SchedulerTab.jsx';
import DemoTab from './tabs/DemoTab.jsx';
import OverviewTab from './tabs/OverviewTab.jsx';

const TABS = [
  { id: 'overview',   label: 'Overview',       icon: '🏙️' },
  { id: 'bfs',        label: 'BFS Pathfinder',  icon: '🔵' },
  { id: 'dfs',        label: 'DFS Zone Mapper', icon: '🌊' },
  { id: 'scheduler',  label: 'RR Scheduler',    icon: '⚙️' },
  { id: 'demo',       label: 'Live Demo',       icon: '🚀' },
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const [graphData, setGraphData] = useState({ nodes: {}, edges: [] });
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    api.getGraph()
      .then(d => { setGraphData(d); setApiOnline(true); })
      .catch(() => setApiOnline(false))
      .finally(() => setLoading(false));
  }, []);

  const sharedProps = { graphData };

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">Packet<span>Path</span></span>
        </div>
        <span className="header-subtitle">Network Service Boot Sequencer · Grid Fault Management</span>
        <div className="header-status" style={{ marginLeft: 'auto' }}>
          <div className="status-dot" style={{ background: apiOnline ? 'var(--green)' : 'var(--red)', boxShadow: apiOnline ? '0 0 8px var(--green)' : '0 0 8px var(--red)' }} />
          {apiOnline ? 'API Online' : 'API Offline'}
        </div>
      </header>

      <nav className="nav-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`nav-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {!apiOnline && !loading && (
          <div className="alert alert-error">
            ⚠️ Backend not reachable at localhost:8000. Start the backend with: <code style={{marginLeft:6,fontFamily:'monospace'}}>uvicorn main:app --reload</code>
          </div>
        )}
        {tab === 'overview'  && <OverviewTab  {...sharedProps} />}
        {tab === 'bfs'       && <BFSTab       {...sharedProps} />}
        {tab === 'dfs'       && <DFSTab       {...sharedProps} />}
        {tab === 'scheduler' && <SchedulerTab {...sharedProps} />}
        {tab === 'demo'      && <DemoTab      {...sharedProps} />}
      </main>
    </div>
  );
}
