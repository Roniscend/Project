import { useEffect, useRef, useState } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Polyline,
  Popup, useMap, Tooltip, useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;

const TYPE_STYLE = {
  depot:      { color: '#10b981', fill: '#10b981', radius: 13, weight: 3 },
  critical:   { color: '#f59e0b', fill: '#f59e0b', radius: 12, weight: 3 },
  substation: { color: '#3b82f6', fill: '#3b82f6', radius: 9,  weight: 2 },
  fault:      { color: '#ef4444', fill: '#ef4444', radius: 16, weight: 3.5 },
  path:       { color: '#8b5cf6', fill: '#8b5cf6', radius: 11, weight: 3 },
  affected:   { color: '#06b6d4', fill: '#06b6d4', radius: 10, weight: 2.5 },
  start:      { color: '#10b981', fill: '#10b981', radius: 16, weight: 3.5 },
  end:        { color: '#ef4444', fill: '#ef4444', radius: 16, weight: 3.5 },
  connect_from:{ color: '#f59e0b', fill: '#f59e0b', radius: 15, weight: 4 },
};

// ── Fly map to show path / fault ──────────────────────────────────────────────
function FlyToPath({ path, nodes, faultNode }) {
  const map = useMap();
  useEffect(() => {
    const targets = path?.length ? path : faultNode ? [faultNode] : [];
    if (!targets.length) return;
    const ll = targets.map(id => [nodes[id]?.lat, nodes[id]?.lng]).filter(x => x[0]);
    if (!ll.length) return;
    map.fitBounds(L.latLngBounds(ll), { padding: [80, 80], maxZoom: 14 });
  }, [path?.join(','), faultNode]);
  return null;
}

// ── Capture clicks on the blank map ──────────────────────────────────────────
function MapClickHandler({ buildMode, onMapClick }) {
  useMapEvents({
    click(e) {
      if (buildMode === 'addNode' && onMapClick) onMapClick(e.latlng);
    },
  });
  return null;
}

// ── Pulsing ring for fault node ───────────────────────────────────────────────
function PulsingFaultRing({ position }) {
  const map = useMap();
  const ref = useRef(null);
  useEffect(() => {
    if (!position?.[0]) return;
    const icon = L.divIcon({
      className: '',
      iconSize: [60, 60],
      iconAnchor: [30, 30],
      html: '<span class="leaflet-fault-pulse"></span>',
    });
    const m = L.marker(position, { icon, interactive: false, zIndexOffset: -1 }).addTo(map);
    ref.current = m;
    return () => map.removeLayer(m);
  }, [position?.toString()]);
  return null;
}

export default function MapGraph({
  nodes = {},
  edges = [],
  highlightPath = [],
  startNode = null,
  endNode = null,
  faultNode = null,
  affectedZones = [],
  // selection / algorithm mode
  onNodeClick = null,
  selectMode = null,      // 'start' | 'end' | null (for BFS/DFS pick)
  // builder mode
  buildMode = null,       // 'addNode' | 'connect' | 'delete' | null
  onMapClick = null,      // (latlng) => void  — fires when empty map clicked
  connectFrom = null,     // node id being connected FROM
  onDeleteNode = null,    // (id) => void
  // display
  height = 520,
  showFilter = false,
}) {
  const nodeIds = Object.keys(nodes);
  const [filter, setFilter] = useState('all');

  if (nodeIds.length === 0 && !buildMode) {
    return (
      <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center',
        color:'#64748b', background:'#0d1421', borderRadius:12 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'2rem', marginBottom:8 }}>🗺️</div>
          <div>Loading map…</div>
        </div>
      </div>
    );
  }

  const center = nodeIds.length
    ? [nodes[nodeIds[0]].lat, nodes[nodeIds[0]].lng]
    : [12.9716, 77.5946];

  const getStyle = (id) => {
    if (id === connectFrom)                           return TYPE_STYLE.connect_from;
    if (id === startNode)                             return TYPE_STYLE.start;
    if (id === endNode)                               return TYPE_STYLE.end;
    if (id === faultNode)                             return TYPE_STYLE.fault;
    if (highlightPath.includes(id))                   return TYPE_STYLE.path;
    if (affectedZones.includes(id) && id !== faultNode) return TYPE_STYLE.affected;
    return TYPE_STYLE[nodes[id]?.type] ?? TYPE_STYLE.substation;
  };

  const isPathEdge = (u, v) => {
    for (let i = 0; i < highlightPath.length - 1; i++) {
      if ((highlightPath[i]===u && highlightPath[i+1]===v) ||
          (highlightPath[i]===v && highlightPath[i+1]===u)) return true;
    }
    return false;
  };

  const isAffectedEdge = (u, v) =>
    affectedZones.includes(u) && affectedZones.includes(v);

  const visibleIds = nodeIds.filter(id =>
    filter === 'all' || nodes[id]?.type === filter
  );

  const faultPos = faultNode && nodes[faultNode]
    ? [nodes[faultNode].lat, nodes[faultNode].lng] : null;

  // Cursor style for builder
  const cursorMap = { addNode:'crosshair', connect:'cell', delete:'not-allowed' };
  const mapCursor = buildMode ? cursorMap[buildMode] : 'grab';

  return (
    <div style={{ position:'relative', borderRadius:12, overflow:'hidden',
      border:'1px solid rgba(99,179,237,0.15)' }}>

      {/* Filter chips */}
      {showFilter && (
        <div style={{
          position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)',
          zIndex:1000, display:'flex', gap:6, background:'rgba(8,12,20,0.88)',
          backdropFilter:'blur(8px)', border:'1px solid rgba(99,179,237,0.18)',
          borderRadius:24, padding:'5px 10px',
        }}>
          {[
            { key:'all',        label:'All',         color:'#94a3b8' },
            { key:'depot',      label:'Depots',      color:'#10b981' },
            { key:'critical',   label:'Critical',    color:'#f59e0b' },
            { key:'substation', label:'Substations', color:'#3b82f6' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter===f.key ? `${f.color}22` : 'transparent',
              border: `1px solid ${filter===f.key ? f.color : 'transparent'}`,
              color: filter===f.key ? f.color : '#64748b',
              borderRadius:16, padding:'3px 10px', fontSize:'0.7rem',
              fontWeight:600, cursor:'pointer', transition:'all .2s',
            }}>{f.label}</button>
          ))}
        </div>
      )}

      <MapContainer center={center} zoom={nodeIds.length ? 11 : 12}
        style={{ height, background:'#0d1421', cursor: mapCursor }}
        zoomControl={true}>

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />

        <MapClickHandler buildMode={buildMode} onMapClick={onMapClick} />
        <FlyToPath path={highlightPath} nodes={nodes} faultNode={faultNode} />
        {faultPos && <PulsingFaultRing position={faultPos} />}

        {/* Edges */}
        {edges.map((e, i) => {
          const n1 = nodes[e.from], n2 = nodes[e.to];
          if (!n1 || !n2) return null;
          const onPath = isPathEdge(e.from, e.to);
          const onAff  = isAffectedEdge(e.from, e.to);
          return (
            <Polyline key={`e-${i}`}
              positions={[[n1.lat, n1.lng], [n2.lat, n2.lng]]}
              pathOptions={{
                color: onPath ? '#a78bfa' : onAff ? '#06b6d4' : 'rgba(99,179,237,0.2)',
                weight: onPath ? 5 : onAff ? 2.5 : 1.8,
                opacity: onPath ? 1 : 0.6,
                dashArray: onAff && !onPath ? '6,5' : undefined,
              }}
            />
          );
        })}

        {/* Nodes */}
        {visibleIds.map(id => {
          const node = nodes[id];
          const style = getStyle(id);
          const clickable = !!(onNodeClick || (buildMode && buildMode !== 'addNode'));

          const handleClick = () => {
            if (buildMode === 'delete' && onDeleteNode) { onDeleteNode(id); return; }
            if (onNodeClick) onNodeClick(id);
          };

          return (
            <CircleMarker key={id} center={[node.lat, node.lng]} radius={style.radius}
              pathOptions={{
                color: style.color, fillColor: style.fill,
                fillOpacity: 0.92, weight: style.weight, opacity: 1,
              }}
              eventHandlers={clickable ? {
                click: handleClick,
                mouseover: e => e.target.setStyle({ fillOpacity:1, weight: style.weight+2 }),
                mouseout:  e => e.target.setStyle({ fillOpacity:0.92, weight: style.weight }),
              } : {
                mouseover: e => e.target.setStyle({ fillOpacity:1 }),
                mouseout:  e => e.target.setStyle({ fillOpacity:0.92 }),
              }}
            >
              {id === connectFrom && (
                <Tooltip permanent direction="top" offset={[0, -style.radius - 2]}
                  className="leaflet-dark-tooltip">
                  <span style={{ fontSize:'0.7rem', fontWeight:700 }}>🔗 From: {id}</span>
                </Tooltip>
              )}
              {(id === startNode || id === endNode || id === faultNode) && (
                <Tooltip permanent direction="top" offset={[0, -style.radius - 2]}
                  className="leaflet-dark-tooltip">
                  <span style={{ fontSize:'0.7rem', fontWeight:700 }}>{id}</span>
                </Tooltip>
              )}
              <Popup>
                <div style={{ fontFamily:'Inter,sans-serif', minWidth:190 }}>
                  <div style={{ fontWeight:800, color:style.color, fontSize:'0.95rem', marginBottom:4 }}>{id}</div>
                  <div style={{ fontSize:'0.82rem', color:'#e2e8f0', marginBottom:3 }}>{node.label}</div>
                  <div style={{ fontSize:'0.72rem', color:'#64748b' }}>
                    Type: {node.type} · {node.lat?.toFixed(4)}, {node.lng?.toFixed(4)}
                  </div>
                  {node.critical && (
                    <div style={{ marginTop:5, fontSize:'0.72rem', color:'#f59e0b' }}>★ Critical Infrastructure</div>
                  )}
                  {buildMode === 'delete' && onDeleteNode && (
                    <button onClick={() => onDeleteNode(id)} style={{
                      marginTop:8, background:'rgba(239,68,68,0.15)',
                      border:'1px solid rgba(239,68,68,0.4)', color:'#ef4444',
                      borderRadius:6, padding:'3px 10px', fontSize:'0.72rem',
                      cursor:'pointer', fontWeight:700,
                    }}>🗑 Delete Node</button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div style={{
        position:'absolute', top:12, right:12, zIndex:1000,
        background:'rgba(8,12,20,0.88)', backdropFilter:'blur(8px)',
        border:'1px solid rgba(99,179,237,0.18)', borderRadius:10,
        padding:'10px 14px', display:'flex', flexDirection:'column', gap:5,
        pointerEvents:'none',
      }}>
        {[
          { color:'#10b981', label:'Depot' },
          { color:'#f59e0b', label:'Critical' },
          { color:'#3b82f6', label:'Substation' },
          { color:'#ef4444', label:'Fault / End' },
          { color:'#8b5cf6', label:'BFS Path' },
          { color:'#06b6d4', label:'DFS Affected' },
        ].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.69rem', color:'#94a3b8' }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:l.color, flexShrink:0 }} />
            {l.label}
          </div>
        ))}
        <div style={{ borderTop:'1px solid rgba(99,179,237,0.12)', paddingTop:5, fontSize:'0.62rem', color:'#475569' }}>
          © OpenStreetMap / CARTO
        </div>
      </div>

      {/* Mode badge */}
      {(selectMode || buildMode) && (
        <div style={{
          position:'absolute', top:12, left:12, zIndex:1000,
          background: buildMode==='addNode' ? 'rgba(59,130,246,0.2)'
            : buildMode==='connect' ? 'rgba(245,158,11,0.2)'
            : buildMode==='delete'  ? 'rgba(239,68,68,0.2)'
            : selectMode==='start'  ? 'rgba(16,185,129,0.2)'
            : 'rgba(239,68,68,0.2)',
          border: `1px solid ${buildMode==='addNode' ? '#3b82f6'
            : buildMode==='connect' ? '#f59e0b'
            : buildMode==='delete'  ? '#ef4444'
            : selectMode==='start'  ? '#10b981' : '#ef4444'}`,
          color: buildMode==='addNode' ? '#3b82f6'
            : buildMode==='connect' ? '#f59e0b'
            : buildMode==='delete'  ? '#ef4444'
            : selectMode==='start'  ? '#10b981' : '#ef4444',
          borderRadius:8, padding:'6px 14px', fontSize:'0.8rem', fontWeight:700,
          pointerEvents:'none',
        }}>
          {buildMode==='addNode' ? '✚ Click map to place node'
            : buildMode==='connect' ? (connectFrom ? `🔗 Now click target node` : '🔗 Click source node')
            : buildMode==='delete'  ? '🗑 Click node to delete'
            : selectMode==='start'  ? '▶ Click node → set START'
            : '⚡ Click node → set FAULT'}
        </div>
      )}
    </div>
  );
}
