import { useState } from 'react';
import { api } from '../api.js';
import MapGraph from '../components/MapGraph.jsx';
import GanttChart from '../components/GanttChart.jsx';

const FAULT_COLORS = ['var(--red)', 'var(--amber)', 'var(--purple)'];
const FAULT_ICONS  = ['🔴', '🟡', '🟣'];

export default function DemoTab({ graphData }) {
  const { nodes, edges } = graphData;
  const [quantum,    setQuantum]    = useState(3);
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [activeView, setActiveView] = useState(0); // which fault BFS view

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.runDemo({ time_quantum: Number(quantum) });
      setResult(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Build combined overlay for the active BFS fault view
  const activeBFS = result?.bfs_results?.[activeView];
  const activeDFS = result?.dfs_results?.[activeView];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Launch card ────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon purple">🚀</div>
          <div>
            <div className="card-title">Full System Demo — 3 Simultaneous Faults</div>
            <div className="card-desc">BFS pathfinding + DFS zone mapping + Round-Robin scheduling — all on the real Bangalore OpenStreetMap</div>
          </div>
        </div>
        <div className="alert alert-warn" style={{ marginBottom: '1rem' }}>
          ⭐ Demo includes a <strong>critical fault at Bowring Hospital (S1)</strong> which gets priority dispatch via Round-Robin priority scheduling.
        </div>

        {/* Demo faults preview */}
        <div style={{
          display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap',
        }}>
          {[
            { id: 'F1', node: 'S1',  label: 'Bowring Hospital', crew: 'Alpha', critical: true },
            { id: 'F2', node: 'S10', label: 'Marathahalli Sub.', crew: 'Bravo', critical: false },
            { id: 'F3', node: 'S19', label: 'Yelahanka Sub.',    crew: 'Charlie', critical: false },
          ].map((f, i) => (
            <div key={f.id} style={{
              flex: '1 1 180px', background: f.critical ? 'rgba(245,158,11,0.06)' : 'rgba(15,23,42,0.6)',
              border: `1px solid ${f.critical ? 'rgba(245,158,11,0.3)' : 'rgba(99,179,237,0.1)'}`,
              borderRadius: 10, padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 800, color: FAULT_COLORS[i], fontFamily: 'monospace' }}>
                  {FAULT_ICONS[i]} {f.id}
                </span>
                {f.critical && <span className="badge badge-amber">★ Critical</span>}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>{f.node} — {f.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 3 }}>Crew-{f.crew}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label className="form-label">Time Quantum (minutes)</label>
            <input type="number" className="form-input" value={quantum} min={1} max={20}
              onChange={e => setQuantum(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={run} disabled={loading}
            style={{ alignSelf: 'flex-end', marginBottom: '1px' }}>
            {loading ? <><div className="spinner" />Running Demo…</> : <>🚀 Launch Full Demo</>}
          </button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>❌ {error}</div>}
      </div>

      {/* ── Results ──────────────────────────────────────────── */}
      {result && (
        <>
          {/* Fault summary cards */}
          <div className="grid-3">
            {result.demo_faults.map((f, i) => {
              const bfs = result.bfs_results[i];
              const dfs = result.dfs_results[i];
              return (
                <div
                  key={f.id}
                  className={`demo-fault-card ${f.critical ? 'critical-fault' : ''} ${activeView === i ? 'active-fault-card' : ''}`}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setActiveView(i)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, color: FAULT_COLORS[i], fontFamily: 'monospace', fontSize: '1.1rem' }}>
                      {FAULT_ICONS[i]} {f.id}
                    </span>
                    {f.critical && <span className="badge badge-amber">★ Critical</span>}
                    {activeView === i && <span style={{ fontSize: '0.68rem', color: '#8b5cf6', fontWeight: 700 }}>● Active</span>}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 4, fontWeight: 600 }}>
                    {f.node} — {nodes[f.node]?.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 8 }}>
                    {nodes[f.node]?.area} · Crew: {f.crew} · Burst: {f.burst} min
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--blue)' }}>
                      🔵 BFS: {bfs?.hops} hops via {bfs?.depot}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cyan)' }}>
                      🌊 DFS: {dfs?.affected_count} zones affected
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* OSM Map — BFS path + DFS zones for active fault */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '1rem 1.5rem' }}>
              <div className="card-icon blue">🗺️</div>
              <div>
                <div className="card-title">
                  Bangalore Map — Fault {activeBFS?.fault_id || ''}: BFS Path + DFS Affected Zones
                </div>
                <div className="card-desc">
                  {FAULT_ICONS[activeView]} Click a fault card above to switch view ·
                  Purple = BFS route · Cyan = DFS affected · Red = fault origin
                </div>
              </div>
            </div>

            {/* Fault switcher buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1.5rem 1rem' }}>
              {result.bfs_results.map((b, i) => (
                <button
                  key={i}
                  className={`btn ${activeView === i ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveView(i)}
                  style={{ borderColor: FAULT_COLORS[i].replace('var(', '').replace(')', '') }}
                >
                  {FAULT_ICONS[i]} {b.fault_id} — {b.fault_node}
                </button>
              ))}
            </div>

            <MapGraph
              nodes={nodes}
              edges={edges}
              highlightPath={activeBFS?.path || []}
              startNode={activeBFS?.depot || null}
              endNode={activeBFS?.fault_node || null}
              faultNode={activeBFS?.fault_node || null}
              affectedZones={activeDFS?.affected_zones || []}
              height={540}
            />

            {/* Path trace below map */}
            {activeBFS && (
              <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border)' }}>
                <div className="path-trace" style={{ flexWrap: 'wrap' }}>
                  {activeBFS.path.map((n, i) => (
                    <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className={`path-node ${n === activeBFS.depot ? 'depot' : n === activeBFS.fault_node ? 'fault' : ''}`}>
                        {n}
                        <span style={{ fontSize: '0.65rem', marginLeft: 3, opacity: 0.6 }}>
                          {nodes[n]?.area}
                        </span>
                      </span>
                      {i < activeBFS.path.length - 1 && <span className="path-arrow">→</span>}
                    </span>
                  ))}
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>
                    {activeBFS.hops} hops
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gantt chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon green">📊</div>
              <div>
                <div className="card-title">Round-Robin Crew Dispatch — Gantt Chart</div>
                <div className="card-desc">3 simultaneous faults · Quantum = {result.time_quantum} min · ★ Critical priority first</div>
              </div>
            </div>
            <GanttChart gantt={result.gantt} results={result.schedule_results} timeQuantum={result.time_quantum} />
          </div>

          {/* Summary stats */}
          <div className="stat-grid">
            <div className="stat-box"><div className="stat-value red">3</div><div className="stat-label">Simultaneous Faults</div></div>
            <div className="stat-box"><div className="stat-value green">{result.time_quantum}</div><div className="stat-label">Time Quantum (min)</div></div>
            <div className="stat-box"><div className="stat-value amber">{result.avg_waiting_time}</div><div className="stat-label">Avg Waiting Time</div></div>
            <div className="stat-box">
              <div className="stat-value blue">
                {result.bfs_results.reduce((s, b) => s + (b.hops || 0), 0)}
              </div>
              <div className="stat-label">Total BFS Hops</div>
            </div>
            <div className="stat-box">
              <div className="stat-value cyan">
                {result.dfs_results.reduce((s, d) => s + (d.affected_count || 0), 0)}
              </div>
              <div className="stat-label">Total Affected Zones</div>
            </div>
          </div>

          <div className="alert alert-success">
            🎯 <strong>Demo Summary:</strong> All 3 faults were handled concurrently on real Bangalore OpenStreetMap locations. BFS found the shortest path to each fault from the nearest BESCOM/KPTCL depot. DFS mapped all power-outage zones. Round-Robin ensured fair crew allocation — with <strong>Bowring Hospital (S1)</strong> prioritized as critical. Avg wait: <strong>{result.avg_waiting_time} min</strong>.
          </div>
        </>
      )}
    </div>
  );
}
