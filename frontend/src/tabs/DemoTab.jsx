import { useState } from 'react';
import { api } from '../api.js';
import PowerGridGraph from '../components/PowerGridGraph.jsx';
import GanttChart from '../components/GanttChart.jsx';

export default function DemoTab({ graphData }) {
  const { nodes, edges } = graphData;
  const [quantum, setQuantum] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState(0); // which fault BFS view

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.runDemo({ time_quantum: Number(quantum) });
      setResult(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const FAULT_COLORS = ['var(--red)', 'var(--amber)', 'var(--purple)'];

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-icon purple">🚀</div>
          <div>
            <div className="card-title">Full System Demo — 3 Simultaneous Faults</div>
            <div className="card-desc">BFS pathfinding + DFS zone mapping + Round-Robin scheduling all at once</div>
          </div>
        </div>
        <div className="alert alert-warn" style={{ marginBottom:'1rem' }}>
          ⭐ Demo includes a <strong>critical fault at City Hospital (S1)</strong> which gets priority dispatch via Round-Robin priority scheduling.
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
          <div className="form-group" style={{ maxWidth:180 }}>
            <label className="form-label">Time Quantum (min)</label>
            <input type="number" className="form-input" value={quantum} min={1} max={20} onChange={e => setQuantum(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={run} disabled={loading} style={{ alignSelf:'flex-end', marginBottom:'1px' }}>
            {loading ? <><div className="spinner"/>Running Demo…</> : <>🚀 Launch Full Demo</>}
          </button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop:'1rem' }}>❌ {error}</div>}
      </div>

      {result && (
        <>
          {/* Fault Summary Cards */}
          <div className="grid-3">
            {result.demo_faults.map((f, i) => {
              const bfs = result.bfs_results[i];
              const dfs = result.dfs_results[i];
              return (
                <div key={f.id} className={`demo-fault-card ${f.critical ? 'critical-fault' : ''}`}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontWeight:800, color: FAULT_COLORS[i], fontFamily:'monospace', fontSize:'1.1rem' }}>{f.id}</span>
                    {f.critical && <span className="badge badge-amber">★ Critical</span>}
                  </div>
                  <div style={{ fontSize:'0.82rem', color:'#cbd5e1', marginBottom:4 }}>{f.node} — {nodes[f.node]?.label}</div>
                  <div style={{ fontSize:'0.75rem', color:'#64748b' }}>
                    Crew: {f.crew} · Burst: {f.burst}min · Arrival: t={f.arrival}
                  </div>
                  <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:4 }}>
                    <div style={{ fontSize:'0.75rem', color:'var(--blue)' }}>
                      🔵 BFS: {bfs?.hops} hops via {bfs?.depot}
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--cyan)' }}>
                      🌊 DFS: {dfs?.affected_count} zones affected
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BFS Graph Views */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="card-header" style={{ padding:'1rem 1.5rem' }}>
              <div className="card-icon blue">🔵</div>
              <div><div className="card-title">BFS Paths — Click a fault to view its route</div></div>
            </div>
            <div style={{ display:'flex', gap:'0.5rem', padding:'0 1.5rem 1rem' }}>
              {result.bfs_results.map((b, i) => (
                <button key={i} className={`btn ${activeView === i ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveView(i)}>
                  {b.fault_id} — {b.fault_node}
                </button>
              ))}
            </div>
            {result.bfs_results[activeView] && (
              <>
                <PowerGridGraph
                  nodes={nodes} edges={edges}
                  highlightPath={result.bfs_results[activeView].path}
                  faultNode={result.bfs_results[activeView].fault_node}
                  affectedZones={result.dfs_results[activeView].affected_zones}
                  width={960} height={440}
                />
                <div className="card-header" style={{ padding:'0.75rem 1.5rem', borderTop:'1px solid var(--border)' }}>
                  <div className="path-trace" style={{ flexWrap:'wrap' }}>
                    {result.bfs_results[activeView].path.map((n, i) => (
                      <span key={n} style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <span className={`path-node ${n === result.bfs_results[activeView].depot ? 'depot' : n === result.bfs_results[activeView].fault_node ? 'fault' : ''}`}>
                          {n}
                        </span>
                        {i < result.bfs_results[activeView].path.length - 1 && <span className="path-arrow">→</span>}
                      </span>
                    ))}
                    <span style={{ marginLeft:'auto', fontSize:'0.75rem', color:'#64748b' }}>
                      {result.bfs_results[activeView].hops} hops
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Gantt */}
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
            🎯 <strong>Demo Summary:</strong> All 3 faults were handled concurrently. BFS found the shortest path to each fault from the nearest depot. DFS mapped all power-outage zones. Round-Robin ensured fair crew allocation — with <strong>City Hospital (S1)</strong> prioritized as a critical node. Avg wait: <strong>{result.avg_waiting_time} min</strong>.
          </div>
        </>
      )}
    </div>
  );
}
