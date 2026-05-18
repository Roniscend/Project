import { useState } from 'react';
import { api } from '../api.js';
import GanttChart from '../components/GanttChart.jsx';

const PRIORITY_OPTIONS = [
  { value: 'standard',     label: 'Standard',      short: 'STD', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
  { value: 'critical',     label: 'Critical',       short: 'CRIT', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { value: 'very_critical',label: 'Very Critical',  short: 'V-CRIT', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
];

const DEFAULT_FAULTS = [
  { id:'F1', node:'S1',  burst:8,  arrival:0, crew:'Crew-Alpha',   priority:'critical'     },
  { id:'F2', node:'S14', burst:5,  arrival:1, crew:'Crew-Bravo',   priority:'standard'     },
  { id:'F3', node:'S22', burst:10, arrival:2, crew:'Crew-Charlie', priority:'standard'     },
];

export default function SchedulerTab({ graphData }) {
  const { nodes } = graphData;
  const nodeIds = Object.keys(nodes).filter(id => nodes[id]?.type !== 'depot');

  const [faults,  setFaults]  = useState(DEFAULT_FAULTS);
  const [quantum, setQuantum] = useState(3);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const updateFault = (i, field, val) =>
    setFaults(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));

  const addFault = () => {
    const id = `F${faults.length + 1}`;
    const firstNode = nodeIds[0] || 'S1';
    setFaults(prev => [...prev, {
      id, node: firstNode, burst: 6, arrival: 0,
      crew: `Crew-${String.fromCharCode(65 + faults.length)}`,
      priority: 'standard',
    }]);
  };

  const removeFault = i => setFaults(prev => prev.filter((_, idx) => idx !== i));

  const run = async () => {
    if (faults.length === 0) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.runSchedule({
        faults: faults.map(f => ({
          ...f,
          burst:    Number(f.burst),
          arrival:  Number(f.arrival),
          critical: f.priority === 'critical' || f.priority === 'very_critical',
        })),
        time_quantum: Number(quantum),
      });
      setResult(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const priorityOpt = p => PRIORITY_OPTIONS.find(o => o.value === p) || PRIORITY_OPTIONS[0];

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* ── Config Card ─────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon green">⚙️</div>
          <div>
            <div className="card-title">Round-Robin Crew Dispatcher</div>
            <div className="card-desc">Configure faults &amp; time quantum · Priority levels: Standard → Critical → Very Critical</div>
          </div>
        </div>

        {/* Priority legend */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
          {PRIORITY_OPTIONS.map(p => (
            <div key={p.value} style={{
              display:'flex', alignItems:'center', gap:6,
              background: p.bg, border: `1px solid ${p.color}44`,
              borderRadius:20, padding:'4px 12px', fontSize:'0.72rem',
            }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: p.color }} />
              <span style={{ color: p.color, fontWeight:700 }}>{p.label}</span>
              <span style={{ color:'#64748b' }}>— {
                p.value === 'very_critical' ? 'Absolute first, always dispatched before others' :
                p.value === 'critical'      ? 'Front-queued, runs before standard faults' :
                                             'Normal round-robin rotation'
              }</span>
            </div>
          ))}
        </div>

        {/* Quantum + Run row */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <div className="form-group" style={{ maxWidth:180 }}>
            <label className="form-label">Time Quantum (min)</label>
            <input
              type="number" className="form-input"
              value={quantum} min={1} max={20}
              onChange={e => setQuantum(e.target.value)}
            />
          </div>
          <div style={{ display:'flex', gap:'0.5rem', marginLeft:'auto' }}>
            <button className="btn btn-ghost" onClick={addFault}>＋ Add Fault</button>
            <button className="btn btn-green" onClick={run} disabled={loading || faults.length === 0}>
              {loading ? <><div className="spinner"/>Scheduling…</> : <>⚙️ Run Round-Robin</>}
            </button>
          </div>
        </div>

        {/* Fault rows */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
          {/* Header */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'65px 1fr 1fr 75px 70px 1fr 30px',
            gap:'0.5rem', padding:'0 6px',
          }}>
            {['ID','Node','Crew','Burst','Arrival','Priority',''].map(h => (
              <span key={h} className="form-label" style={{ fontSize:'0.67rem' }}>{h}</span>
            ))}
          </div>

          {faults.map((f, i) => {
            const opt = priorityOpt(f.priority);
            return (
              <div key={i} style={{
                display:'grid',
                gridTemplateColumns:'65px 1fr 1fr 75px 70px 1fr 30px',
                gap:'0.5rem', alignItems:'center',
                background: f.priority === 'very_critical'
                  ? 'rgba(239,68,68,0.04)'
                  : f.priority === 'critical'
                  ? 'rgba(245,158,11,0.04)'
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${f.priority === 'very_critical' ? 'rgba(239,68,68,0.18)' : f.priority === 'critical' ? 'rgba(245,158,11,0.18)' : 'rgba(99,179,237,0.08)'}`,
                borderRadius:8, padding:'6px',
              }}>
                <input className="form-input" value={f.id}
                  onChange={e => updateFault(i,'id',e.target.value)}
                  style={{ fontSize:'0.8rem', padding:'6px 8px' }} />
                <select className="form-select" value={f.node}
                  onChange={e => updateFault(i,'node',e.target.value)}
                  style={{ fontSize:'0.8rem', padding:'6px 8px' }}>
                  {nodeIds.map(id => (
                    <option key={id} value={id}>
                      {id} — {nodes[id]?.label?.slice(0,20)}
                    </option>
                  ))}
                </select>
                <input className="form-input" value={f.crew}
                  onChange={e => updateFault(i,'crew',e.target.value)}
                  style={{ fontSize:'0.8rem', padding:'6px 8px' }} />
                <input type="number" className="form-input" value={f.burst} min={1}
                  onChange={e => updateFault(i,'burst',e.target.value)}
                  style={{ fontSize:'0.8rem', padding:'6px 8px' }} />
                <input type="number" className="form-input" value={f.arrival} min={0}
                  onChange={e => updateFault(i,'arrival',e.target.value)}
                  style={{ fontSize:'0.8rem', padding:'6px 8px' }} />

                {/* ── 3-level priority selector ── */}
                <div style={{ display:'flex', gap:3 }}>
                  {PRIORITY_OPTIONS.map(p => (
                    <button key={p.value}
                      onClick={() => updateFault(i,'priority',p.value)}
                      title={p.label}
                      style={{
                        flex:1, padding:'5px 2px', fontSize:'0.62rem', fontWeight:700,
                        borderRadius:6, cursor:'pointer', transition:'all .15s',
                        background: f.priority === p.value ? p.bg : 'transparent',
                        border: `1px solid ${f.priority === p.value ? p.color : 'rgba(99,179,237,0.12)'}`,
                        color: f.priority === p.value ? p.color : '#475569',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>
                      {p.short}
                    </button>
                  ))}
                </div>

                <button onClick={() => removeFault(i)} style={{
                  background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
                  color:'#ef4444', borderRadius:6, padding:'5px', cursor:'pointer',
                  fontSize:'0.8rem', lineHeight:1,
                }} title="Remove fault">✕</button>
              </div>
            );
          })}
        </div>

        {error && <div className="alert alert-error" style={{ marginTop:'1rem' }}>❌ {error}</div>}
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      {result && (
        <>
          <div className="stat-grid">
            <div className="stat-box"><div className="stat-value green">{result.time_quantum}</div><div className="stat-label">Time Quantum</div></div>
            <div className="stat-box"><div className="stat-value blue">{result.results?.length}</div><div className="stat-label">Faults Dispatched</div></div>
            <div className="stat-box"><div className="stat-value amber">{result.avg_waiting_time}</div><div className="stat-label">Avg Wait (min)</div></div>
            <div className="stat-box"><div className="stat-value cyan">{result.avg_turnaround_time}</div><div className="stat-label">Avg Turnaround</div></div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon green">📊</div>
              <div>
                <div className="card-title">Gantt Chart — Priority Round-Robin Dispatch</div>
                <div className="card-desc">🔴 Very Critical → ★ Critical → Standard · Hover bars for details</div>
              </div>
            </div>
            <GanttChart
              gantt={result.gantt}
              results={result.results}
              timeQuantum={result.time_quantum}
            />
          </div>

          <div className="alert alert-success">
            ⚙️ <strong>Round-Robin Analysis:</strong> Very Critical faults run first always, Critical faults
            are front-queued ahead of Standard. Each fault gets a {result.time_quantum}-min slice before cycling.
            Average waiting time: <strong>{result.avg_waiting_time} min</strong> · Turnaround: <strong>{result.avg_turnaround_time} min</strong>.
          </div>
        </>
      )}
    </div>
  );
}
