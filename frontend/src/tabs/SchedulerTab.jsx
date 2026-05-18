import { useState } from 'react';
import { api } from '../api.js';
import GanttChart from '../components/GanttChart.jsx';

const DEFAULT_FAULTS = [
  { id:'F1', node:'S1',  burst:8,  arrival:0, crew:'Crew-Alpha' },
  { id:'F2', node:'S14', burst:5,  arrival:1, crew:'Crew-Bravo' },
  { id:'F3', node:'S22', burst:10, arrival:2, crew:'Crew-Charlie' },
];

export default function SchedulerTab({ graphData }) {
  const { nodes } = graphData;
  const nodeIds = Object.keys(nodes).filter(id => nodes[id]?.type !== 'depot');

  const [faults, setFaults] = useState(DEFAULT_FAULTS);
  const [quantum, setQuantum] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateFault = (i, field, val) => {
    setFaults(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));
  };

  const addFault = () => {
    const id = `F${faults.length + 1}`;
    setFaults(prev => [...prev, { id, node:'S20', burst:6, arrival:0, crew:`Crew-${id}` }]);
  };

  const removeFault = (i) => setFaults(prev => prev.filter((_, idx) => idx !== i));

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.runSchedule({
        faults: faults.map(f => ({ ...f, burst: Number(f.burst), arrival: Number(f.arrival) })),
        time_quantum: Number(quantum),
      });
      setResult(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-icon green">⚙️</div>
          <div>
            <div className="card-title">Round-Robin Crew Dispatcher</div>
            <div className="card-desc">Configure faults &amp; time quantum · Critical nodes get priority</div>
          </div>
        </div>

        {/* Quantum */}
        <div className="form-row" style={{ marginBottom:'1.25rem' }}>
          <div className="form-group" style={{ maxWidth:200 }}>
            <label className="form-label">Time Quantum (min)</label>
            <input type="number" className="form-input" value={quantum} min={1} max={20} onChange={e => setQuantum(e.target.value)} />
          </div>
        </div>

        {/* Fault rows */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 1fr 80px 80px 40px', gap:'0.5rem', padding:'0 0.5rem' }}>
            {['ID','Node','Crew','Burst','Arrival',''].map(h => (
              <span key={h} className="form-label">{h}</span>
            ))}
          </div>
          {faults.map((f, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr 1fr 80px 80px 40px', gap:'0.5rem', alignItems:'center' }}>
              <input className="form-input" value={f.id} onChange={e => updateFault(i,'id',e.target.value)} />
              <select className="form-select" value={f.node} onChange={e => updateFault(i,'node',e.target.value)}>
                {nodeIds.map(id => <option key={id} value={id}>{id}{nodes[id]?.critical?' ★':''}</option>)}
              </select>
              <input className="form-input" value={f.crew} onChange={e => updateFault(i,'crew',e.target.value)} />
              <input type="number" className="form-input" value={f.burst} min={1} onChange={e => updateFault(i,'burst',e.target.value)} />
              <input type="number" className="form-input" value={f.arrival} min={0} onChange={e => updateFault(i,'arrival',e.target.value)} />
              <button className="btn btn-ghost" onClick={() => removeFault(i)} style={{ padding:'8px' }}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button className="btn btn-ghost" onClick={addFault}>+ Add Fault</button>
          <button className="btn btn-green" onClick={run} disabled={loading || faults.length === 0}>
            {loading ? <><div className="spinner"/>Scheduling…</> : <>⚙️ Run Round-Robin</>}
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginTop:'1rem' }}>❌ {error}</div>}
      </div>

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
              <div><div className="card-title">Gantt Chart — Crew Dispatch Timeline</div>
              <div className="card-desc">★ = Critical node priority · Hover bars for details</div></div>
            </div>
            <GanttChart gantt={result.gantt} results={result.results} timeQuantum={result.time_quantum} />
          </div>

          <div className="alert alert-success">
            ⚙️ <strong>Round-Robin Analysis:</strong> Each fault gets a {result.time_quantum}-minute slot before the next fault is served. Critical nodes (★) are sorted to the front of the queue. Average waiting time: <strong>{result.avg_waiting_time} min</strong> — fair distribution prevents any crew from being starved.
          </div>
        </>
      )}
    </div>
  );
}
