import { useState } from 'react';
import { api } from '../api.js';
import PowerGridGraph from '../components/PowerGridGraph.jsx';

export default function BFSTab({ graphData }) {
  const { nodes, edges } = graphData;
  const nodeIds = Object.keys(nodes);
  const depotIds = nodeIds.filter(id => nodes[id]?.type === 'depot');
  const faultIds = nodeIds.filter(id => nodes[id]?.type !== 'depot');

  const [depot, setDepot] = useState('');
  const [fault, setFault] = useState('S14');
  const [useBF, setUseBF] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.runBFS({ depot: depot || null, fault, use_brute_force: useBF });
      setResult(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-icon blue">🔵</div>
          <div>
            <div className="card-title">BFS Shortest Path Finder</div>
            <div className="card-desc">Breadth-First Search from repair depot to fault substation</div>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom:'1rem' }}>
          <div className="form-group">
            <label className="form-label">Depot (blank = auto nearest)</label>
            <select className="form-select" value={depot} onChange={e => setDepot(e.target.value)}>
              <option value="">Auto-detect Nearest Depot</option>
              {depotIds.map(id => <option key={id} value={id}>{id} — {nodes[id]?.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fault Substation</label>
            <select className="form-select" value={fault} onChange={e => setFault(e.target.value)}>
              {faultIds.map(id => <option key={id} value={id}>{id} — {nodes[id]?.label}{nodes[id]?.critical?' ★':''}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ justifyContent:'flex-end', minWidth:120 }}>
            <label className="form-label">Brute Force Compare</label>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:4 }}>
              <input type="checkbox" checked={useBF} onChange={e => setUseBF(e.target.checked)} />
              <span style={{ fontSize:'0.85rem', color:'#94a3b8' }}>Enable</span>
            </label>
          </div>
        </div>

        <button className="btn btn-primary" onClick={run} disabled={loading || !fault}>
          {loading ? <><div className="spinner"/>Running BFS…</> : <>🔵 Run BFS</>}
        </button>

        {error && <div className="alert alert-error" style={{ marginTop:'1rem' }}>❌ {error}</div>}
      </div>

      {result && (
        <>
          {/* Graph highlight */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="card-header" style={{ padding:'1rem 1.5rem' }}>
              <div className="card-icon blue">🗺️</div>
              <div><div className="card-title">BFS Path Visualization</div>
              <div className="card-desc">Purple = BFS path · Red = Fault node · Green = Depot</div></div>
            </div>
            <PowerGridGraph nodes={nodes} edges={edges} highlightPath={result.path} faultNode={fault} width={960} height={480} />
          </div>

          {/* Stats */}
          <div className="stat-grid">
            <div className="stat-box"><div className="stat-value blue">{result.hops}</div><div className="stat-label">Hops</div></div>
            <div className="stat-box"><div className="stat-value cyan">{result.nodes_explored}</div><div className="stat-label">Nodes Explored</div></div>
            <div className="stat-box"><div className="stat-value green">{result.time_ms}ms</div><div className="stat-label">BFS Time</div></div>
            <div className="stat-box"><div className="stat-value amber">{result.path.length}</div><div className="stat-label">Path Length</div></div>
          </div>

          {/* Path trace */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon blue">📍</div>
              <div><div className="card-title">BFS Path Trace</div>
              <div className="card-desc">Depot → … → Fault ({result.hops} hops)</div></div>
            </div>
            <div className="path-trace">
              {result.path.map((node, i) => (
                <span key={node} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span className={`path-node ${node === result.depot ? 'depot' : node === fault ? 'fault' : nodes[node]?.critical ? 'critical' : ''}`}>
                    {node} — {nodes[node]?.label}
                  </span>
                  {i < result.path.length - 1 && <span className="path-arrow">→</span>}
                </span>
              ))}
            </div>

            {/* Why BFS */}
            <div className="alert alert-info" style={{ marginTop:'1rem' }}>
              <div>
                <strong>Why BFS for shortest path?</strong> BFS explores nodes layer by layer (by hop count). The first time it reaches the target is guaranteed to be via the fewest hops — unlike DFS which may find a longer route first. Time complexity: O(V+E).
              </div>
            </div>
          </div>

          {/* Brute Force comparison */}
          {result.brute_force && (
            <div className="card">
              <div className="card-header">
                <div className="card-icon amber">⚡</div>
                <div><div className="card-title">Brute Force vs BFS Comparison</div></div>
              </div>
              <div className="compare-grid">
                <div className="results-panel">
                  <div className="section-title" style={{ color:'var(--blue)' }}>🔵 BFS (Optimal)</div>
                  <div className="stat-grid">
                    <div className="stat-box"><div className="stat-value blue">{result.hops}</div><div className="stat-label">Hops</div></div>
                    <div className="stat-box"><div className="stat-value blue">{result.nodes_explored}</div><div className="stat-label">Nodes Visited</div></div>
                    <div className="stat-box"><div className="stat-value blue">{result.time_ms}ms</div><div className="stat-label">Time</div></div>
                  </div>
                </div>
                <div className="results-panel">
                  <div className="section-title" style={{ color:'var(--amber)' }}>⚡ Brute Force</div>
                  <div className="stat-grid">
                    <div className="stat-box"><div className="stat-value amber">{result.brute_force.hops}</div><div className="stat-label">Hops</div></div>
                    <div className="stat-box"><div className="stat-value amber">{result.brute_force.paths_explored}</div><div className="stat-label">Paths Explored</div></div>
                    <div className="stat-box"><div className="stat-value amber">{result.brute_force.time_ms}ms</div><div className="stat-label">Time</div></div>
                  </div>
                </div>
              </div>
              <div className="alert alert-warn" style={{ marginTop:'1rem' }}>
                ⚡ Brute Force explored <strong>{result.brute_force.paths_explored}</strong> paths vs BFS visiting only <strong>{result.nodes_explored}</strong> nodes. BFS is <strong>{result.brute_force.paths_explored > result.nodes_explored ? (result.brute_force.paths_explored / Math.max(result.nodes_explored, 1)).toFixed(1) + 'x' : 'equally'}</strong> more efficient.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
