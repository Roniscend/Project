import MapGraph from '../components/MapGraph.jsx';

export default function OverviewTab({ graphData }) {
  const { nodes, edges } = graphData;
  const nodeCount   = Object.keys(nodes).length;
  const edgeCount   = edges.length;
  const depots      = Object.values(nodes).filter(n => n.type === 'depot').length;
  const criticals   = Object.values(nodes).filter(n => n.critical).length;

  // Calculate total grid km
  const totalKm = edges.reduce((s, e) => s + (e.weight || 0), 0).toFixed(0);

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      <div className="stat-grid">
        {[
          { label:'Substations',       value: nodeCount, color:'blue' },
          { label:'Transmission Lines',value: edgeCount, color:'cyan' },
          { label:'Repair Depots',     value: depots,    color:'green' },
          { label:'Critical Nodes',    value: criticals, color:'amber' },
          { label:'Grid Coverage (km)',value: totalKm,   color:'purple' },
        ].map(s => (
          <div key={s.label} className="stat-box">
            <div className={`stat-value ${s.color}`}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="card-header" style={{ padding:'1rem 1.5rem' }}>
          <div className="card-icon blue">🗺️</div>
          <div>
            <div className="card-title">Bangalore Power Grid — OpenStreetMap</div>
            <div className="card-desc">Real substation locations · Click any node for details · Scroll/drag to navigate</div>
          </div>
        </div>
        <MapGraph nodes={nodes} edges={edges} height={540} showFilter={true} />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">📐</div>
            <div><div className="card-title">DAA Concepts</div></div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <div className="alert alert-info">🔵 <strong>BFS</strong> — shortest hop-path between any two substations. Explores level-by-level, guaranteeing minimum hops. Time: O(V+E).</div>
            <div className="alert alert-info">🌊 <strong>DFS</strong> — maps all zones reachable from a fault. Explores depth-first, finds the full connected component.</div>
            <div className="alert alert-warn">⚡ <strong>Brute Force</strong> — explores all paths for comparison. Shows why BFS is exponentially faster.</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-icon green">⚙️</div>
            <div><div className="card-title">OS Concepts</div></div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <div className="alert alert-success">🔄 <strong>Round Robin</strong> — each repair crew gets a fixed quantum. Ensures fair scheduling across simultaneous faults.</div>
            <div className="alert alert-success">⭐ <strong>Priority Dispatch</strong> — critical nodes (Bowring Hospital, Water Treatment, Fire HQ) jump the queue.</div>
            <div className="alert alert-success">📊 <strong>Gantt Output</strong> — visual crew dispatch timeline with waiting &amp; turnaround times.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
