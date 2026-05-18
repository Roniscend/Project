import { useState, useEffect, useRef } from 'react';
import MapGraph from '../components/MapGraph.jsx';

/* Animated count-up hook */
function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

function AnimatedStat({ label, value, color }) {
  const animated = useCountUp(Number(value) || 0);
  return (
    <div className="stat-box">
      <div className={`stat-value ${color}`}>{animated}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const DAA = [
  { key:'BFS', bg:'rgba(59,130,246,0.12)', color:'var(--blue)', border:'rgba(59,130,246,0.25)',
    title:'Breadth-First Search', desc:'Shortest hop-path from depot to fault. Level-by-level guarantees minimum hops. O(V+E).' },
  { key:'DFS', bg:'rgba(6,182,212,0.12)', color:'var(--cyan)', border:'rgba(6,182,212,0.25)',
    title:'Depth-First Search', desc:'Maps all zones losing power. Finds the full connected component via depth-first traversal.' },
  { key:'BF', bg:'rgba(245,158,11,0.12)', color:'var(--amber)', border:'rgba(245,158,11,0.25)',
    title:'Brute Force (Compare)', desc:'Explores all paths — demonstrates exponential cost vs BFS efficiency.' },
];
const OS = [
  { key:'RR', bg:'rgba(16,185,129,0.12)', color:'var(--green)', border:'rgba(16,185,129,0.25)',
    title:'Round-Robin Scheduling', desc:'Each repair crew gets a fixed time quantum. Ensures fair allocation across simultaneous faults.' },
  { key:'★', bg:'rgba(245,158,11,0.12)', color:'var(--amber)', border:'rgba(245,158,11,0.25)',
    title:'Priority Dispatch', desc:'Critical nodes (hospitals, water, fire HQ) jump to front for immediate response.' },
  { key:'📊', bg:'rgba(139,92,246,0.12)', color:'var(--purple)', border:'rgba(139,92,246,0.25)',
    title:'Gantt Visualization', desc:'Visual crew dispatch timeline with waiting time, turnaround, and completion metrics.' },
];

function AlgoList({ items }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
      {items.map(a => (
        <div key={a.key} className="algo-item">
          <div className="algo-badge" style={{ background:a.bg, color:a.color, border:`1px solid ${a.border}` }}>
            {a.key}
          </div>
          <div>
            <div style={{ fontSize:'0.83rem', fontWeight:700, color:'#e2e8f0', marginBottom:2 }}>{a.title}</div>
            <div style={{ fontSize:'0.74rem', color:'#64748b', lineHeight:1.5 }}>{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OverviewTab({ graphData }) {
  const { nodes, edges } = graphData;
  const nodeCount = Object.keys(nodes).length;
  const edgeCount = edges.length;
  const depots    = Object.values(nodes).filter(n => n.type === 'depot').length;
  const criticals = Object.values(nodes).filter(n => n.critical).length;
  const totalKm   = Math.round(edges.reduce((s, e) => s + (e.weight || 0), 0));

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* ── Hero ── */}
      <div className="overview-hero">
        <div style={{ position:'relative', zIndex:1 }}>
          <div className="hero-badge">⚡ Live Grid Monitoring — Bangalore, Karnataka</div>
          <h1 className="hero-title">
            Power Grid Fault
            <span className="hero-title-accent"> Management System</span>
          </h1>
          <p className="hero-subtitle">
            BFS shortest-path dispatch · DFS cascading outage mapping · Round-Robin crew scheduling —
            running on real Bangalore BESCOM/KPTCL topology with OpenStreetMap visualization.
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stat-grid">
        {[
          { label:'Substations',         value:nodeCount, color:'blue'   },
          { label:'Transmission Lines',  value:edgeCount, color:'cyan'   },
          { label:'Repair Depots',       value:depots,    color:'green'  },
          { label:'Critical Nodes',      value:criticals, color:'amber'  },
          { label:'Grid Coverage (km)',  value:totalKm,   color:'purple' },
        ].map(s => <AnimatedStat key={s.label} {...s} />)}
      </div>

      {/* ── Map ── */}
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

      {/* ── Algorithm cards ── */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">📐</div>
            <div><div className="card-title">DAA Algorithms</div></div>
          </div>
          <AlgoList items={DAA} />
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-icon green">⚙️</div>
            <div><div className="card-title">OS Scheduling Concepts</div></div>
          </div>
          <AlgoList items={OS} />
        </div>
      </div>
    </div>
  );
}
