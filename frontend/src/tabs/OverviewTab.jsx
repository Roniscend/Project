import PowerGridGraph from '../components/PowerGridGraph.jsx';

export default function OverviewTab({ graphData }) {
  const nodeCount = Object.keys(graphData.nodes).length;
  const edgeCount = graphData.edges.length;
  const depots = Object.values(graphData.nodes).filter(n => n.type === 'depot').length;
  const critical = Object.values(graphData.nodes).filter(n => n.critical).length;

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      {/* Stats */}
      <div className="stat-grid">
        {[
          { label:'Substations', value: nodeCount, color:'blue' },
          { label:'Transmission Lines', value: edgeCount, color:'cyan' },
          { label:'Repair Depots', value: depots, color:'green' },
          { label:'Critical Nodes', value: critical, color:'amber' },
        ].map(s => (
          <div key={s.label} className="stat-box">
            <div className={`stat-value ${s.color}`}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div className="card" style={{ padding: 0, overflow:'hidden' }}>
        <div className="card-header" style={{ padding:'1rem 1.5rem', borderRadius:0 }}>
          <div className="card-icon blue">🗺️</div>
          <div>
            <div className="card-title">City Power Grid Topology</div>
            <div className="card-desc">Interactive graph — scroll to zoom, drag to pan</div>
          </div>
        </div>
        <PowerGridGraph nodes={graphData.nodes} edges={graphData.edges} width={960} height={520} />
      </div>

      {/* Concepts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">📐</div>
            <div><div className="card-title">DAA Concepts</div></div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', fontSize:'0.85rem', color:'#94a3b8' }}>
            <div className="alert alert-info">🔵 <strong>BFS</strong> — finds shortest hop-path from nearest depot to fault. Explores level-by-level, guaranteeing minimum hops.</div>
            <div className="alert alert-info">🌊 <strong>DFS</strong> — maps all zones reachable from the fault. Explores depth-first, finding the full connected component.</div>
            <div className="alert alert-warn">⚡ <strong>Brute Force</strong> — explores all paths for comparison. Exponential time vs BFS linear time.</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-icon green">⚙️</div>
            <div><div className="card-title">OS Concepts</div></div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', fontSize:'0.85rem', color:'#94a3b8' }}>
            <div className="alert alert-success">🔄 <strong>Round Robin</strong> — each repair crew gets a fixed time quantum. Ensures fair CPU scheduling across simultaneous faults.</div>
            <div className="alert alert-success">⭐ <strong>Priority Dispatch</strong> — critical nodes (hospitals, emergency services) jump the queue with higher priority.</div>
            <div className="alert alert-success">📊 <strong>Gantt Output</strong> — visual timeline of crew dispatch with waiting time and turnaround time per crew.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
