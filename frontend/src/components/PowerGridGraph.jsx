import React, { useRef, useEffect, useState, useCallback } from 'react';

const NODE_COLORS = {
  depot:      { fill: '#10b981', stroke: '#6ee7b7', glow: 'rgba(16,185,129,0.5)' },
  critical:   { fill: '#f59e0b', stroke: '#fcd34d', glow: 'rgba(245,158,11,0.5)' },
  substation: { fill: '#3b82f6', stroke: '#93c5fd', glow: 'rgba(59,130,246,0.4)' },
  fault:      { fill: '#ef4444', stroke: '#fca5a5', glow: 'rgba(239,68,68,0.6)' },
  path:       { fill: '#8b5cf6', stroke: '#c4b5fd', glow: 'rgba(139,92,246,0.5)' },
  affected:   { fill: '#06b6d4', stroke: '#67e8f9', glow: 'rgba(6,182,212,0.4)' },
};

function PowerGridGraph({ nodes, edges, highlightPath = [], faultNode = null, affectedZones = [], width = 960, height = 600 }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const getNodeState = useCallback((nodeId) => {
    if (nodeId === faultNode) return 'fault';
    if (highlightPath.includes(nodeId) && nodeId !== faultNode) return 'path';
    if (affectedZones.includes(nodeId) && nodeId !== faultNode) return 'affected';
    return nodes[nodeId]?.type || 'substation';
  }, [faultNode, highlightPath, affectedZones, nodes]);

  const isPathEdge = useCallback((u, v) => {
    for (let i = 0; i < highlightPath.length - 1; i++) {
      if ((highlightPath[i] === u && highlightPath[i + 1] === v) ||
          (highlightPath[i] === v && highlightPath[i + 1] === u)) return true;
    }
    return false;
  }, [highlightPath]);

  // Pan handlers
  const onMouseDown = (e) => {
    if (e.target.closest('.graph-node')) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
  };
  const onMouseUp = () => { isPanning.current = false; };
  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(t => ({ ...t, scale: Math.max(0.4, Math.min(2.5, t.scale * factor)) }));
  };

  return (
    <div className="graph-container" style={{ height }}>
      <svg
        ref={svgRef}
        className="graph-canvas"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ cursor: isPanning.current ? 'grabbing' : 'grab', background: 'transparent' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <defs>
          {Object.entries(NODE_COLORS).map(([k, c]) => (
            <filter key={k} id={`glow-${k}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="rgba(99,179,237,0.5)" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* Edges */}
          {edges.map((e, i) => {
            const n1 = nodes[e.from]; const n2 = nodes[e.to];
            if (!n1 || !n2) return null;
            const isHighlighted = isPathEdge(e.from, e.to);
            return (
              <g key={i}>
                <line
                  x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                  stroke={isHighlighted ? '#8b5cf6' : 'rgba(99,179,237,0.12)'}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  strokeDasharray={isHighlighted ? 'none' : 'none'}
                  style={isHighlighted ? { filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.7))' } : {}}
                />
                {/* Weight label on highlighted edges */}
                {isHighlighted && (
                  <text
                    x={(n1.x + n2.x) / 2}
                    y={(n1.y + n2.y) / 2 - 5}
                    fill="#c4b5fd"
                    fontSize="10"
                    textAnchor="middle"
                    style={{ userSelect: 'none' }}
                  >
                    {e.weight}km
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {Object.entries(nodes).map(([id, node]) => {
            const state = getNodeState(id);
            const colors = NODE_COLORS[state] || NODE_COLORS.substation;
            const r = state === 'fault' ? 16 : state === 'depot' ? 14 : state === 'critical' ? 13 : 10;
            const isOnPath = highlightPath.includes(id);

            return (
              <g
                key={id}
                className="graph-node"
                transform={`translate(${node.x},${node.y})`}
                onMouseEnter={(ev) => setTooltip({ id, node, x: ev.clientX, y: ev.clientY })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse ring for fault */}
                {state === 'fault' && (
                  <circle r={r + 10} fill="none" stroke={colors.stroke} strokeWidth="2" opacity="0.4">
                    <animate attributeName="r" from={r + 4} to={r + 18} dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Glow */}
                <circle r={r + 6} fill={colors.glow} />
                {/* Main circle */}
                <circle
                  r={r}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isOnPath ? 2.5 : 1.5}
                  filter={`url(#glow-${state})`}
                />
                {/* Icon letter */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={state === 'fault' ? '9' : '7'}
                  fontWeight="800"
                  fontFamily="Inter,sans-serif"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {state === 'depot' ? 'D' : state === 'critical' ? '★' : state === 'fault' ? '⚡' : id.replace('S','')}
                </text>
                {/* Label */}
                <text
                  y={r + 10}
                  textAnchor="middle"
                  fill={colors.stroke}
                  fontSize="8"
                  fontFamily="Inter,sans-serif"
                  fontWeight="600"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 14,
          top: tooltip.y - 10,
          background: '#1e293b',
          border: '1px solid rgba(99,179,237,0.2)',
          borderRadius: 10,
          padding: '8px 12px',
          fontSize: '0.78rem',
          pointerEvents: 'none',
          zIndex: 999,
          minWidth: 140,
        }}>
          <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>{tooltip.id}</div>
          <div style={{ color: '#94a3b8' }}>{tooltip.node.label}</div>
          <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 4 }}>Type: {tooltip.node.type}</div>
          {tooltip.node.critical && <div style={{ color: '#f59e0b', fontSize: '0.7rem' }}>⚡ Critical Infrastructure</div>}
        </div>
      )}

      {/* Legend */}
      <div className="graph-legend">
        {[
          { color: '#10b981', label: 'Depot' },
          { color: '#f59e0b', label: 'Critical Node' },
          { color: '#3b82f6', label: 'Substation' },
          { color: '#ef4444', label: 'Fault' },
          { color: '#8b5cf6', label: 'BFS Path' },
          { color: '#06b6d4', label: 'DFS Affected' },
        ].map(item => (
          <div key={item.label} className="legend-item">
            <div className="legend-dot" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div style={{ position:'absolute', bottom: 10, right: 12, fontSize: '0.67rem', color: '#374151' }}>
        Scroll to zoom • Drag to pan
      </div>
    </div>
  );
}

export default PowerGridGraph;
