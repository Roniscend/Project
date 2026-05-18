import { useState } from 'react';
import { api } from '../api.js';
import MapGraph from '../components/MapGraph.jsx';

export default function BFSTab({ graphData, isCustom, onClearCustom }) {
  // graphData = merged (Bangalore + custom) — used for MAP display & dropdowns
  // customGraph = user's custom-only subgraph — sent to backend when isCustom
  const { nodes, edges } = graphData;
  const nodeIds  = Object.keys(nodes);
  const depotIds = nodeIds.filter(id => nodes[id]?.type === 'depot');
  const faultIds = nodeIds.filter(id => nodes[id]?.type !== 'depot');

  const [depot,      setDepot]      = useState('');
  const [fault,      setFault]      = useState('');
  const [useBF,      setUseBF]      = useState(false);
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [selectMode, setSelectMode] = useState(null); // 'start' | 'end'

  const effectiveDepot = depot && nodes[depot] ? depot : '';
  const effectiveFault = fault && nodes[fault] ? fault : (faultIds[0] || '');

  const run = async () => {
    const f = effectiveFault;
    if (!f) { setError('Select a fault node first.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const body = {
        depot: effectiveDepot || null,
        fault: f,
        use_brute_force: useBF,
        // Send merged graph to backend so BFS can path across Bangalore + custom nodes
        ...(isCustom && {
          custom_nodes: nodes,
          custom_edges: edges,
        }),
      };
      const res = await api.runBFS(body);
      if (res.error) { setError(res.error); return; }
      setResult(res);
      setSelectMode(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleNodeClick = (id) => {
    if (selectMode === 'start') { setDepot(id);  setSelectMode(null); }
    if (selectMode === 'end')   { setFault(id); setSelectMode(null); }
  };

  const depotLabel = effectiveDepot
    ? `${effectiveDepot} — ${nodes[effectiveDepot]?.label}`
    : 'Auto (nearest depot)';
  const faultLabel = effectiveFault
    ? `${effectiveFault} — ${nodes[effectiveFault]?.label}`
    : 'None selected';

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
          🏗️ Using <strong>your custom graph</strong> — Bangalore nodes + {Object.keys(graphData.nodes).length - Object.keys(graphData.nodes).filter(id => ['D1','D2','D3'].includes(id) || id.startsWith('S')).length} custom node(s) merged
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
          🏙️ Using <strong>Bangalore preset grid</strong> — go to <strong>🏗️ Build Graph</strong> tab to add your own nodes.
        </div>
      )}

      {/* Controls */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon blue">🔵</div>
          <div>
            <div className="card-title">BFS Shortest Path Finder</div>
            <div className="card-desc">Click nodes on the map to pick depot &amp; fault, then run BFS</div>
          </div>
        </div>

        {/* Current selection */}
        <div style={{
          display:'flex', gap:'1rem', marginBottom:'1rem',
          background:'rgba(15,23,42,0.6)', borderRadius:10,
          padding:'10px 14px', border:'1px solid rgba(99,179,237,0.1)', flexWrap:'wrap',
        }}>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ fontSize:'0.68rem', color:'#64748b', marginBottom:3, textTransform:'uppercase' }}>Depot / Start</div>
            <div style={{ fontSize:'0.83rem', fontWeight:700, color:'#10b981' }}>{depotLabel}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', color:'#475569', fontSize:'1.3rem' }}>→</div>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ fontSize:'0.68rem', color:'#64748b', marginBottom:3, textTransform:'uppercase' }}>Fault / Target</div>
            <div style={{ fontSize:'0.83rem', fontWeight:700, color:'#ef4444' }}>{faultLabel}</div>
          </div>
        </div>

        {/* Dropdowns */}
        {nodeIds.length > 0 && (
          <div className="form-row" style={{ marginBottom:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Depot (blank = auto nearest)</label>
              <select className="form-select" value={effectiveDepot} onChange={e => setDepot(e.target.value)}>
                <option value="">Auto-detect nearest depot</option>
                {depotIds.map(id => <option key={id} value={id}>{id} — {nodes[id]?.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fault / Target Node</label>
              <select className="form-select" value={effectiveFault} onChange={e => setFault(e.target.value)}>
                <option value="">— select —</option>
                {faultIds.map(id => (
                  <option key={id} value={id}>{id} — {nodes[id]?.label}{nodes[id]?.critical?' ★':''}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ minWidth:140 }}>
              <label className="form-label">Brute Force Compare</label>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:4 }}>
                <input type="checkbox" checked={useBF} onChange={e => setUseBF(e.target.checked)} />
                <span style={{ fontSize:'0.85rem', color:'#94a3b8' }}>Enable</span>
              </label>
            </div>
          </div>
        )}

        {/* Map pick buttons + run */}
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          <button
            className={`btn ${selectMode==='start' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectMode(m => m==='start' ? null : 'start')}
            style={{ borderColor:'#10b981', color: selectMode==='start' ? undefined : '#10b981' }}
          >
            {selectMode==='start' ? '✅ Click a node…' : '📍 Pick DEPOT on map'}
          </button>
          <button
            className={`btn ${selectMode==='end' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectMode(m => m==='end' ? null : 'end')}
            style={{ borderColor:'#ef4444', color: selectMode==='end' ? undefined : '#ef4444' }}
          >
            {selectMode==='end' ? '✅ Click a node…' : '⚡ Pick FAULT on map'}
          </button>
          <button className="btn btn-primary" onClick={run}
            disabled={loading || !effectiveFault} style={{ marginLeft:'auto' }}>
            {loading ? <><div className="spinner"/>Running BFS…</> : <>🔵 Run BFS</>}
          </button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop:'1rem' }}>❌ {error}</div>}
      </div>

      {/* Map — always visible */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="card-header" style={{ padding:'1rem 1.5rem' }}>
          <div className="card-icon blue">🗺️</div>
          <div>
            <div className="card-title">
              {isCustom ? 'Bangalore + Custom Grid — BFS Visualization' : 'Bangalore Power Grid — BFS Visualization'}
            </div>
            <div className="card-desc">
              {result
                ? `BFS found path in ${result.hops} hops · ${result.total_km} km`
                : selectMode ? `Click a node to set ${selectMode === 'start' ? 'DEPOT' : 'FAULT'}`
                : 'Use pick buttons or dropdowns to select nodes, then run BFS'}
            </div>
          </div>
        </div>
        <MapGraph
          nodes={nodes} edges={edges}
          highlightPath={result?.path || []}
          startNode={result?.depot || effectiveDepot || null}
          endNode={result?.fault  || effectiveFault  || null}
          faultNode={effectiveFault || null}
          onNodeClick={selectMode ? handleNodeClick : null}
          selectMode={selectMode}
          height={500}
          showFilter={true}
        />
      </div>

      {/* Results */}
      {result && (
        <>
          <div className="stat-grid">
            <div className="stat-box"><div className="stat-value blue">{result.hops}</div><div className="stat-label">Hops</div></div>
            <div className="stat-box"><div className="stat-value cyan">{result.nodes_explored}</div><div className="stat-label">Nodes Explored</div></div>
            <div className="stat-box"><div className="stat-value green">{result.time_ms} ms</div><div className="stat-label">BFS Time</div></div>
            <div className="stat-box"><div className="stat-value amber">{result.total_km} km</div><div className="stat-label">Real Distance</div></div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon blue">📍</div>
              <div>
                <div className="card-title">BFS Path — {result.hops} hops</div>
                <div className="card-desc">{result.depot_label} → {result.fault_label}</div>
              </div>
            </div>
            <div className="path-trace">
              {result.path.map((n, i) => (
                <span key={n} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span className={`path-node ${n===result.depot?'depot':n===result.fault?'fault':nodes[n]?.critical?'critical':''}`}>
                    <strong>{n}</strong>
                    {nodes[n]?.area && <span style={{ fontSize:'0.7rem', marginLeft:4, opacity:0.6 }}>— {nodes[n].area}</span>}
                  </span>
                  {i < result.path.length-1 && <span className="path-arrow">→</span>}
                </span>
              ))}
            </div>
            <div className="alert alert-info" style={{ marginTop:'1rem' }}>
              <strong>Why BFS?</strong> Explores nodes layer-by-layer — guarantees fewest hops to target. Time: O(V+E).
            </div>
          </div>

          {result.brute_force && (
            <>
              {/* BF vs BFS Stats */}
              <div className="card">
                <div className="card-header">
                  <div className="card-icon amber">⚡</div>
                  <div>
                    <div className="card-title">BFS (Optimal) vs Brute Force (Random) — Comparison</div>
                    <div className="card-desc">BFS always finds the shortest path · Brute Force picks a random valid path</div>
                  </div>
                </div>
                <div className="compare-grid">
                  <div className="results-panel">
                    <div className="section-title" style={{ color:'var(--blue)' }}>🔵 BFS — Optimal Path</div>
                    <div className="stat-grid">
                      <div className="stat-box"><div className="stat-value blue">{result.hops}</div><div className="stat-label">Hops</div></div>
                      <div className="stat-box"><div className="stat-value blue">{result.nodes_explored}</div><div className="stat-label">Visited</div></div>
                      <div className="stat-box"><div className="stat-value blue">{result.time_ms}ms</div><div className="stat-label">Time</div></div>
                    </div>
                  </div>
                  <div className="results-panel">
                    <div className="section-title" style={{ color:'var(--amber)' }}>⚡ Brute Force — Random Path</div>
                    <div className="stat-grid">
                      <div className="stat-box"><div className="stat-value amber">{result.brute_force.hops}</div><div className="stat-label">Hops</div></div>
                      <div className="stat-box"><div className="stat-value amber">{result.brute_force.paths_explored}</div><div className="stat-label">Paths Tried</div></div>
                      <div className="stat-box"><div className="stat-value amber">{result.brute_force.time_ms}ms</div><div className="stat-label">Time</div></div>
                    </div>
                  </div>
                </div>
                <div className="alert alert-warn" style={{ marginTop:'1rem' }}>
                  🎲 Brute Force explored <strong>{result.brute_force.paths_explored}</strong> paths and picked one <strong>at random</strong> ({result.brute_force.hops} hops).{' '}
                  BFS guaranteed the <strong>shortest path in {result.hops} hops</strong> by exploring only {result.nodes_explored} nodes layer-by-layer.
                </div>
              </div>

              {/* Brute Force Random Path Map */}
              <div className="card" style={{ padding:0, overflow:'hidden' }}>
                <div className="card-header" style={{ padding:'1rem 1.5rem' }}>
                  <div className="card-icon amber">🎲</div>
                  <div>
                    <div className="card-title">Brute Force — Random Path Visualization</div>
                    <div className="card-desc">
                      ⚡ {result.brute_force.hops} hops · Not optimal · Random route selected from {result.brute_force.paths_explored} explored paths
                    </div>
                  </div>
                </div>

                {/* Amber path overlay: re-use MapGraph with bfPath as highlightPath */}
                <MapGraph
                  nodes={nodes}
                  edges={edges}
                  highlightPath={result.brute_force.path || []}
                  startNode={result?.depot || effectiveDepot || null}
                  endNode={result?.fault  || effectiveFault  || null}
                  faultNode={effectiveFault || null}
                  height={400}
                  pathColor="amber"
                />

                {/* Random path trace */}
                {result.brute_force.path?.length > 0 && (
                  <div style={{ padding:'0.75rem 1.5rem', borderTop:'1px solid var(--border)' }}>
                    <div style={{ fontSize:'0.7rem', color:'#f59e0b', fontWeight:700, marginBottom:6 }}>
                      🎲 Random Brute Force Path ({result.brute_force.hops} hops):
                    </div>
                    <div className="path-trace" style={{ flexWrap:'wrap' }}>
                      {result.brute_force.path.map((n, i) => (
                        <span key={`${n}-${i}`} style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{
                            background: n === result.depot ? 'rgba(16,185,129,0.15)' : n === result.fault ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.1)',
                            border: `1px solid ${n === result.depot ? '#10b981' : n === result.fault ? '#ef4444' : '#f59e0b'}`,
                            color: n === result.depot ? '#10b981' : n === result.fault ? '#ef4444' : '#f59e0b',
                            borderRadius:6, padding:'2px 8px', fontSize:'0.72rem', fontWeight:700,
                          }}>
                            {n}
                            <span style={{ fontSize:'0.6rem', marginLeft:3, opacity:0.6 }}>{nodes[n]?.area}</span>
                          </span>
                          {i < result.brute_force.path.length - 1 && (
                            <span style={{ color:'#f59e0b', fontSize:'0.8rem' }}>→</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="alert alert-info" style={{ marginTop:'0.75rem' }}>
                      <strong>Why random?</strong> Brute Force has no heuristic — it explores all possible routes
                      and picks one arbitrarily. BFS guarantees the <strong>fewest hops</strong> by exploring layer-by-layer.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
