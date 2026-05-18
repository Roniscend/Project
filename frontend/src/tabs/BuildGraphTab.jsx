import { useState, useCallback, useRef } from 'react';
import MapGraph from '../components/MapGraph.jsx';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, r = d => d * Math.PI / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2
    + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 100) / 100;
}

let _counter = 1;

const MODE_META = {
  addNode: { label: '✚ Add Node',     color: '#3b82f6', hint: 'Click anywhere on the map to place a node' },
  connect: { label: '🔗 Connect',      color: '#f59e0b', hint: 'Click source node then target node to draw an edge' },
  delete:  { label: '🗑 Delete',       color: '#ef4444', hint: 'Click any node to remove it and its edges' },
};

const TYPE_OPTIONS = [
  { value: 'depot',      label: '🟢 Depot',       desc: 'Repair crew base / start point' },
  { value: 'substation', label: '🔵 Substation',   desc: 'Regular grid substation' },
  { value: 'critical',   label: '🟡 Critical',     desc: 'Hospital, water, fire HQ etc.' },
];

// Nominatim reverse geocode — returns a human-readable place name
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'GridFaultMgmtApp/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Build a nice short name: neighbourhood / suburb / road / city
    const addr = data.address || {};
    const name =
      addr.amenity ||
      addr.building ||
      addr.neighbourhood ||
      addr.suburb ||
      addr.quarter ||
      addr.road ||
      addr.village ||
      addr.town ||
      addr.city_district ||
      addr.city ||
      data.name ||
      null;
    const city = addr.city || addr.town || addr.county || '';
    return name ? (city && name !== city ? `${name}, ${city}` : name) : null;
  } catch {
    return null;
  }
}

export default function BuildGraphTab({ customGraph, setCustomGraph }) {
  const { nodes, edges } = customGraph;

  const [buildMode,   setBuildMode]   = useState('addNode');
  const [nodeType,    setNodeType]    = useState('substation');
  const [nodeLabel,   setNodeLabel]   = useState('');
  const [connectFrom, setConnectFrom] = useState(null);
  const [saved,       setSaved]       = useState(true);
  const [geocoding,   setGeocoding]   = useState(false); // shows spinner while fetching name
  const pendingLabelRef = useRef('');  // stores user-typed label before geocode resolves

  /* ── Place a new node on map click ─────────────────────────── */
  const handleMapClick = useCallback(async (latlng) => {
    if (buildMode !== 'addNode') return;

    const prefix = nodeType === 'depot' ? 'D' : nodeType === 'critical' ? 'C' : 'S';
    const id = `${prefix}${_counter++}`;

    // Use whatever the user typed, or a placeholder until geocode resolves
    const typedLabel = nodeLabel.trim();
    const placeholderLabel = typedLabel || `${id} (fetching location…)`;

    // Add node immediately with placeholder so it shows up on map right away
    setCustomGraph(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [id]: {
          lat: latlng.lat, lng: latlng.lng,
          type: nodeType,
          label: placeholderLabel,
          area: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
          critical: nodeType === 'critical',
        },
      },
    }));
    setSaved(false);

    // If user did NOT type a label, auto-fetch from Nominatim
    if (!typedLabel) {
      setGeocoding(true);
      const geocodedName = await reverseGeocode(latlng.lat, latlng.lng);
      setGeocoding(false);

      if (geocodedName) {
        setCustomGraph(prev => {
          if (!prev.nodes[id]) return prev; // node was deleted before geocode finished
          return {
            ...prev,
            nodes: {
              ...prev.nodes,
              [id]: {
                ...prev.nodes[id],
                label: geocodedName,
                area: geocodedName,
              },
            },
          };
        });
      } else {
        // Fallback to coordinate-based name
        setCustomGraph(prev => {
          if (!prev.nodes[id]) return prev;
          const fallback = `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${id}`;
          return {
            ...prev,
            nodes: {
              ...prev.nodes,
              [id]: { ...prev.nodes[id], label: fallback, area: fallback },
            },
          };
        });
      }
    }
  }, [buildMode, nodeType, nodeLabel, setCustomGraph]);

  /* ── Node click: connect or delete ─────────────────────────── */
  const handleNodeClick = useCallback((id) => {
    if (buildMode === 'connect') {
      if (!connectFrom) {
        setConnectFrom(id);
      } else if (connectFrom === id) {
        setConnectFrom(null);
      } else {
        const exists = edges.some(e =>
          (e.from === connectFrom && e.to === id) ||
          (e.from === id && e.to === connectFrom)
        );
        if (!exists) {
          const n1 = nodes[connectFrom], n2 = nodes[id];
          const w = haversine(n1.lat, n1.lng, n2.lat, n2.lng);
          setCustomGraph(prev => ({
            ...prev,
            edges: [...prev.edges, { from: connectFrom, to: id, weight: w }],
          }));
          setSaved(false);
        }
        setConnectFrom(null);
      }
    }
  }, [buildMode, connectFrom, edges, nodes, setCustomGraph]);

  /* ── Delete a node + its edges ──────────────────────────────── */
  const handleDeleteNode = useCallback((id) => {
    setCustomGraph(prev => {
      const newNodes = { ...prev.nodes };
      delete newNodes[id];
      return {
        nodes: newNodes,
        edges: prev.edges.filter(e => e.from !== id && e.to !== id),
      };
    });
    if (connectFrom === id) setConnectFrom(null);
    setSaved(false);
  }, [connectFrom, setCustomGraph]);

  /* ── Delete an edge ─────────────────────────────────────────── */
  const handleDeleteEdge = (idx) => {
    setCustomGraph(prev => ({
      ...prev,
      edges: prev.edges.filter((_, i) => i !== idx),
    }));
    setSaved(false);
  };

  /* ── Clear everything ───────────────────────────────────────── */
  const handleClear = () => {
    setCustomGraph({ nodes: {}, edges: [] });
    setConnectFrom(null);
    setSaved(true);
    _counter = 1;
  };

  const nodeCount  = Object.keys(nodes).length;
  const edgeCount  = edges.length;
  const depotCount = Object.values(nodes).filter(n => n.type === 'depot').length;

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon blue">🏗️</div>
          <div>
            <div className="card-title">Graph Builder — Design Your Own Power Grid</div>
            <div className="card-desc">
              Place nodes on the Bangalore map · Locations auto-named from OpenStreetMap · Connect them · Then run BFS / DFS on your custom grid
            </div>
          </div>
        </div>

        {/* Mode toolbar */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
          {Object.entries(MODE_META).map(([mode, meta]) => (
            <button
              key={mode}
              onClick={() => { setBuildMode(mode); if (mode !== 'connect') setConnectFrom(null); }}
              style={{
                padding:'9px 18px', borderRadius:10, fontWeight:700,
                fontSize:'0.85rem', cursor:'pointer', transition:'all .18s',
                background: buildMode === mode ? `${meta.color}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${buildMode === mode ? meta.color : 'rgba(99,179,237,0.15)'}`,
                color: buildMode === mode ? meta.color : '#64748b',
              }}
            >{meta.label}</button>
          ))}
          <button
            onClick={handleClear}
            style={{
              padding:'9px 18px', borderRadius:10, fontWeight:700, fontSize:'0.85rem',
              cursor:'pointer', background:'rgba(239,68,68,0.08)',
              border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', marginLeft:'auto',
            }}
          >🗑 Clear All</button>
        </div>

        {/* Node type (only in addNode mode) */}
        {buildMode === 'addNode' && (
          <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
            {TYPE_OPTIONS.map(t => (
              <button
                key={t.value}
                onClick={() => setNodeType(t.value)}
                title={t.desc}
                style={{
                  padding:'7px 16px', borderRadius:20, fontSize:'0.8rem', fontWeight:700,
                  cursor:'pointer', transition:'all .18s',
                  background: nodeType === t.value
                    ? (t.value==='depot' ? 'rgba(16,185,129,0.15)' : t.value==='critical' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)')
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${nodeType===t.value
                    ? (t.value==='depot'?'#10b981':t.value==='critical'?'#f59e0b':'#3b82f6')
                    : 'rgba(99,179,237,0.12)'}`,
                  color: nodeType===t.value
                    ? (t.value==='depot'?'#10b981':t.value==='critical'?'#f59e0b':'#3b82f6')
                    : '#64748b',
                }}
              >{t.label}</button>
            ))}

            <div style={{ flex:1, minWidth:200, position:'relative' }}>
              <input
                value={nodeLabel}
                onChange={e => setNodeLabel(e.target.value)}
                placeholder="Custom label (leave blank to auto-fetch from map)…"
                style={{
                  width:'100%', boxSizing:'border-box',
                  background:'rgba(15,23,42,0.6)',
                  border:'1px solid rgba(99,179,237,0.15)', borderRadius:10,
                  padding:'7px 36px 7px 14px', color:'#e2e8f0', fontSize:'0.83rem',
                  fontFamily:'Inter,sans-serif', outline:'none',
                }}
              />
              {geocoding && (
                <div style={{
                  position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                  width:14, height:14, border:'2px solid #3b82f6',
                  borderTopColor:'transparent', borderRadius:'50%',
                  animation:'spin 0.7s linear infinite',
                }} />
              )}
            </div>

            {/* Geocode hint */}
            <div style={{ width:'100%', fontSize:'0.72rem', color:'#475569', marginTop:-6 }}>
              🗺️ Leave label blank — location name will be fetched automatically from OpenStreetMap when you click the map
              {geocoding && <span style={{ color:'#3b82f6', marginLeft:8 }}>⏳ Fetching location name…</span>}
            </div>
          </div>
        )}

        {/* Hint bar */}
        <div style={{
          padding:'8px 14px', borderRadius:8, fontSize:'0.78rem', fontWeight:600,
          background:'rgba(15,23,42,0.6)', border:'1px solid rgba(99,179,237,0.1)',
          color: MODE_META[buildMode].color,
        }}>
          {MODE_META[buildMode].hint}
          {buildMode === 'connect' && connectFrom && (
            <span style={{ color:'#f59e0b', marginLeft:10 }}>
              → Source locked: <strong>{connectFrom}</strong> — now click target
            </span>
          )}
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-box"><div className="stat-value blue">{nodeCount}</div><div className="stat-label">Nodes</div></div>
        <div className="stat-box"><div className="stat-value cyan">{edgeCount}</div><div className="stat-label">Edges</div></div>
        <div className="stat-box"><div className="stat-value green">{depotCount}</div><div className="stat-label">Depots</div></div>
        <div className="stat-box">
          <div className="stat-value amber">{Object.values(nodes).filter(n=>n.critical).length}</div>
          <div className="stat-label">Critical</div>
        </div>
      </div>

      {/* ── OSM Map ─────────────────────────────────────────── */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="card-header" style={{ padding:'1rem 1.5rem' }}>
          <div className="card-icon blue">🗺️</div>
          <div>
            <div className="card-title">Interactive Map — Click to Build Your Grid</div>
            <div className="card-desc">
              Bangalore OSM · Zoom / pan freely · {nodeCount} node{nodeCount!==1?'s':''} placed
              {geocoding && <span style={{ color:'#3b82f6', marginLeft:8 }}>· ⏳ fetching location name…</span>}
            </div>
          </div>
        </div>
        <MapGraph
          nodes={nodes}
          edges={edges}
          buildMode={buildMode}
          onMapClick={handleMapClick}
          onNodeClick={handleNodeClick}
          onDeleteNode={handleDeleteNode}
          connectFrom={connectFrom}
          height={540}
        />
      </div>

      {/* ── Node & Edge tables ──────────────────────────────── */}
      {nodeCount > 0 && (
        <div className="grid-2">
          {/* Nodes table */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon blue">📍</div>
              <div><div className="card-title">Nodes ({nodeCount})</div></div>
            </div>
            <div style={{ overflowY:'auto', maxHeight:280 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Type</th><th>Label / Location</th><th>Lat / Lng</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(nodes).map(([id, n]) => (
                    <tr key={id}>
                      <td style={{ color: n.type==='depot'?'#10b981':n.type==='critical'?'#f59e0b':'#3b82f6', fontWeight:700 }}>{id}</td>
                      <td style={{ textTransform:'capitalize', fontSize:'0.75rem' }}>{n.type}</td>
                      <td style={{ fontSize:'0.75rem', color:'#94a3b8' }}>
                        {n.label.includes('fetching') ? (
                          <span style={{ color:'#475569', fontStyle:'italic' }}>{n.label}</span>
                        ) : n.label}
                      </td>
                      <td style={{ fontSize:'0.72rem', color:'#475569' }}>{n.lat.toFixed(4)}, {n.lng.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edges table */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon cyan">🔗</div>
              <div><div className="card-title">Edges ({edgeCount})</div></div>
            </div>
            {edgeCount === 0 ? (
              <div style={{ color:'#475569', fontSize:'0.82rem', textAlign:'center', padding:'2rem' }}>
                No edges yet — use 🔗 Connect mode to draw connections
              </div>
            ) : (
              <div style={{ overflowY:'auto', maxHeight:280 }}>
                <table className="data-table">
                  <thead>
                    <tr><th>From</th><th>To</th><th>Distance</th><th></th></tr>
                  </thead>
                  <tbody>
                    {edges.map((e, i) => (
                      <tr key={i}>
                        <td style={{ color:'#10b981', fontWeight:700 }}>{e.from}</td>
                        <td style={{ color:'#ef4444', fontWeight:700 }}>{e.to}</td>
                        <td style={{ color:'#94a3b8', fontSize:'0.75rem' }}>{e.weight} km</td>
                        <td>
                          <button onClick={() => handleDeleteEdge(i)} style={{
                            background:'none', border:'none', color:'#475569',
                            cursor:'pointer', fontSize:'0.9rem',
                          }} title="Delete edge">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tips ────────────────────────────────────────────── */}
      {nodeCount === 0 && (
        <div className="alert alert-info">
          💡 <strong>How to build your graph:</strong> Make sure <strong>✚ Add Node</strong> is selected above,
          choose a node type (Depot / Substation / Critical), then <strong>click anywhere on the Bangalore map</strong> to place it.
          The location name will be <strong>auto-fetched from OpenStreetMap</strong> — or type your own label above first.
          Add at least one Depot and one Substation, connect them in 🔗 Connect mode, then go to the
          <strong> BFS</strong> or <strong>DFS</strong> tabs to run algorithms on your custom grid.
        </div>
      )}

      {nodeCount > 0 && depotCount === 0 && (
        <div className="alert alert-warn">
          ⚠️ No <strong>Depot</strong> node placed yet. Add at least one Depot (green) — it acts as the repair crew start point for BFS.
        </div>
      )}

      {nodeCount >= 2 && edgeCount === 0 && (
        <div className="alert alert-warn">
          ⚠️ Nodes exist but no edges. Switch to <strong>🔗 Connect</strong> mode and click two nodes to draw a connection.
        </div>
      )}

      {nodeCount >= 2 && edgeCount > 0 && (
        <div className="alert alert-success">
          ✅ Graph ready! Go to the <strong>BFS Pathfinder</strong> or <strong>DFS Zone Mapper</strong> tabs —
          your custom graph will be used automatically alongside the Bangalore preset.
        </div>
      )}
    </div>
  );
}
