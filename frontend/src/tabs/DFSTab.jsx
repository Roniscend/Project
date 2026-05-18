import { useState } from 'react';
import { api } from '../api.js';
import MapGraph from '../components/MapGraph.jsx';

export default function DFSTab({ graphData, isCustom, onClearCustom, onAddHistory }) {
  // graphData = merged (Bangalore + custom) — used for MAP display & dropdowns
  // customGraph = user's custom-only subgraph — sent to backend when isCustom
  const { nodes, edges } = graphData;
  const nodeIds = Object.keys(nodes);

  const [fault,    setFault]    = useState('');
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [pickMode, setPickMode] = useState(false);

  const effectiveFault = fault && nodes[fault] ? fault : (nodeIds[0] || '');

  const run = async () => {
    const f = effectiveFault;
    if (!f) { setError('Select a fault node first.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const body = {
        fault: f,
        blockers: [],
        // Send merged graph to backend so DFS traverses Bangalore + custom nodes
        ...(isCustom && {
          custom_nodes: nodes,
          custom_edges: edges,
        }),
      };
      const res = await api.runDFS(body);
      if (res.error) { setError(res.error); return; }
      setResult(res);
      setPickMode(false);
      // Save to history
      onAddHistory?.('dfs', {
        fault:         res.fault,
        affected_zones: res.affected_zones,
        zone_count:    res.zone_count,
        time_ms:       res.time_ms,
        blockers:      [],
      });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleNodeClick = (id) => {
    if (pickMode) { setFault(id); setPickMode(false); }
  };

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* Graph source banner */}
      {isCustom ? (
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.35)',
          borderRadius:10, padding:'10px 16px',
        }}>
          <div style={{ fontSize:'0.83rem', color:'#a78bfa', fontWeight:600 }}>
          🏗️ Using <strong>your custom graph</strong> — Bangalore nodes + custom nodes merged on map
          </div>
          <button onClick={onClearCustom} style={{
            background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
            color:'#ef4444', borderRadius:7, padding:'4px 12px',
            fontSize:'0.75rem', fontWeight:700, cursor:'pointer',
          }}>✕ Use Bangalore Grid Only</button>
        </div>
      ) : (
        <div style={{
          background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)',
          borderRadius:10, padding:'10px 16px', fontSize:'0.82rem', color:'#60a5fa',
        }}>
          🏙️ Using <strong>Bangalore preset grid</strong> — go to <strong>🏗️ Build Graph</strong> to add your own nodes.
        </div>
      )}

      {/* Controls */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon cyan">🌊</div>
          <div>
            <div className="card-title">DFS Affected Zone Mapper</div>
            <div className="card-desc">Find all nodes reachable from the fault via Depth-First Search</div>
          </div>
        </div>

        {/* Fault preview */}
        <div style={{
          display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem',
          background:'rgba(239,68,68,0.06)', borderRadius:10,
          padding:'10px 14px', border:'1px solid rgba(239,68,68,0.18)',
        }}>
          <div style={{ fontSize:'1.5rem' }}>⚡</div>
          <div>
            <div style={{ fontSize:'0.68rem', color:'#64748b', marginBottom:2, textTransform:'uppercase' }}>
              Fault Origin
            </div>
            <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#ef4444' }}>
              {effectiveFault
                ? `${effectiveFault} — ${nodes[effectiveFault]?.label || 'Custom node'}`
                : 'No node selected'}
            </div>
          </div>
        </div>

        {/* Dropdown */}
        {nodeIds.length > 0 && (
          <div className="form-row" style={{ marginBottom:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Fault / Origin Node</label>
              <select className="form-select" value={effectiveFault}
                onChange={e => setFault(e.target.value)}>
                <option value="">— select —</option>
                {nodeIds.map(id => (
                  <option key={id} value={id}>
                    {id} — {nodes[id]?.label || id}{nodes[id]?.critical ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          <button
            className={`btn ${pickMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setPickMode(m => !m)}
            style={{ borderColor:'#ef4444', color: pickMode ? undefined : '#ef4444' }}
          >
            {pickMode ? '✅ Click a node on map…' : '⚡ Pick FAULT on map'}
          </button>
          <button className="btn btn-cyan" onClick={run}
            disabled={loading || !effectiveFault} style={{ marginLeft:'auto' }}>
            {loading ? <><div className="spinner"/>Mapping zones…</> : <>🌊 Run DFS</>}
          </button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop:'1rem' }}>❌ {error}</div>}
      </div>

      {/* Map — always visible */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="card-header" style={{ padding:'1rem 1.5rem' }}>
          <div className="card-icon cyan">🗺️</div>
          <div>
            <div className="card-title">
              {isCustom ? 'Bangalore + Custom Grid — DFS Affected Zones' : 'Bangalore Grid — DFS Affected Zones'}
            </div>
            <div className="card-desc">
              {result
                ? `DFS mapped ${result.zone_count} zones from fault at ${effectiveFault}`
                : pickMode ? 'Click any node on the map to set fault origin'
                : 'Select fault, then run DFS to highlight affected nodes'}
            </div>
          </div>
        </div>
        <MapGraph
          nodes={nodes} edges={edges}
          faultNode={effectiveFault || null}
          affectedZones={result?.affected_zones || []}
          onNodeClick={pickMode ? handleNodeClick : null}
          selectMode={pickMode ? 'end' : null}
          height={500}
          showFilter={true}
        />
      </div>

      {/* Results */}
      {result && (
        <>
          <div className="stat-grid">
            <div className="stat-box"><div className="stat-value red">1</div><div className="stat-label">Fault Origin</div></div>
            <div className="stat-box"><div className="stat-value cyan">{result.zone_count}</div><div className="stat-label">Affected Zones</div></div>
            <div className="stat-box"><div className="stat-value green">{result.time_ms} ms</div><div className="stat-label">DFS Time</div></div>
            <div className="stat-box">
              <div className="stat-value amber">
                {nodeIds.length ? (result.zone_count / nodeIds.length * 100).toFixed(0) : 0}%
              </div>
              <div className="stat-label">Grid Affected</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon cyan">📋</div>
              <div>
                <div className="card-title">DFS Traversal Order</div>
                <div className="card-desc">{result.zone_count} zones visited in DFS order</div>
              </div>
            </div>
            <div className="zone-chips">
              {result.affected_zones.map((z, i) => (
                <span key={z}
                  className={`zone-chip ${nodes[z]?.critical ? 'critical-chip' : ''}`}
                  style={{ animationDelay:`${i * 30}ms` }}
                  title={nodes[z]?.label}>
                  {i+1}. {z}
                  {nodes[z]?.area && (
                    <span style={{ fontSize:'0.65rem', opacity:0.6, marginLeft:4 }}>{nodes[z].area}</span>
                  )}
                </span>
              ))}
            </div>

            {result.affected_zones.some(z => nodes[z]?.critical) && (
              <div className="alert alert-warn" style={{ marginTop:'1rem' }}>
                ⭐ Critical nodes affected: {' '}
                {result.affected_zones.filter(z => nodes[z]?.critical)
                  .map(z => `${z} (${nodes[z]?.label})`).join(' · ')}
              </div>
            )}

            <div className="alert alert-info" style={{ marginTop:'1rem' }}>
              <strong>Why DFS?</strong> Exhaustively explores each branch before backtracking —
              ideal for finding <em>all nodes in a connected component</em> that would lose power.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
