import { useState } from 'react';
import { api } from '../api.js';
import PowerGridGraph from '../components/PowerGridGraph.jsx';

export default function DFSTab({ graphData }) {
  const { nodes, edges } = graphData;
  const nodeIds = Object.keys(nodes);

  const [fault, setFault] = useState('S11');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.runDFS({ fault, blockers: [] });
      setResult(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-icon cyan">🌊</div>
          <div>
            <div className="card-title">DFS Affected Zone Mapper</div>
            <div className="card-desc">Depth-First Search to find all zones reachable from the fault</div>
          </div>
        </div>
        <div className="form-row" style={{ marginBottom:'1rem' }}>
          <div className="form-group">
            <label className="form-label">Fault Substation</label>
            <select className="form-select" value={fault} onChange={e => setFault(e.target.value)}>
              {nodeIds.map(id => (
                <option key={id} value={id}>{id} — {nodes[id]?.label}{nodes[id]?.critical?' ★':''}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-cyan" onClick={run} disabled={loading || !fault}>
          {loading ? <><div className="spinner"/>Mapping Zones…</> : <>🌊 Run DFS</>}
        </button>
        {error && <div className="alert alert-error" style={{ marginTop:'1rem' }}>❌ {error}</div>}
      </div>

      {result && (
        <>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="card-header" style={{ padding:'1rem 1.5rem' }}>
              <div className="card-icon cyan">🗺️</div>
              <div><div className="card-title">DFS Affected Zones</div>
              <div className="card-desc">Cyan = affected · Red = fault origin</div></div>
            </div>
            <PowerGridGraph nodes={nodes} edges={edges} faultNode={fault} affectedZones={result.affected_zones} width={960} height={480} />
          </div>

          <div className="stat-grid">
            <div className="stat-box"><div className="stat-value red">1</div><div className="stat-label">Fault Origin</div></div>
            <div className="stat-box"><div className="stat-value cyan">{result.zone_count}</div><div className="stat-label">Affected Zones</div></div>
            <div className="stat-box"><div className="stat-value green">{result.time_ms}ms</div><div className="stat-label">DFS Time</div></div>
            <div className="stat-box"><div className="stat-value amber">{(result.zone_count / Object.keys(nodes).length * 100).toFixed(0)}%</div><div className="stat-label">Grid Affected</div></div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon cyan">📋</div>
              <div>
                <div className="card-title">DFS Traversal Order</div>
                <div className="card-desc">{result.zone_count} zones in DFS visit order</div>
              </div>
            </div>
            <div className="zone-chips">
              {result.affected_zones.map((z, i) => (
                <span key={z} className={`zone-chip ${nodes[z]?.critical ? 'critical-chip' : ''}`} style={{ animationDelay:`${i * 30}ms` }}>
                  {i+1}. {z}
                </span>
              ))}
            </div>

            <div className="alert alert-info" style={{ marginTop:'1rem' }}>
              <div>
                <strong>Why DFS for zone mapping?</strong> DFS exhaustively explores each branch to its deepest point before backtracking, making it ideal for finding <em>all reachable nodes</em> in a connected component — exactly what engineers need to know which zones lose power. BFS would work too, but DFS uses less memory (stack vs queue) on large grids.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
