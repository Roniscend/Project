import React from 'react';

const CREW_COLORS = [
  { bg: 'linear-gradient(90deg,#3b82f6,#2563eb)', text: '#fff', border: '#3b82f6' },
  { bg: 'linear-gradient(90deg,#10b981,#059669)', text: '#fff', border: '#10b981' },
  { bg: 'linear-gradient(90deg,#f59e0b,#d97706)', text: '#fff', border: '#f59e0b' },
  { bg: 'linear-gradient(90deg,#8b5cf6,#7c3aed)', text: '#fff', border: '#8b5cf6' },
  { bg: 'linear-gradient(90deg,#ef4444,#dc2626)', text: '#fff', border: '#ef4444' },
  { bg: 'linear-gradient(90deg,#06b6d4,#0891b2)', text: '#fff', border: '#06b6d4' },
];

function GanttChart({ gantt, results, timeQuantum }) {
  if (!gantt || gantt.length === 0) return null;

  const maxTime = Math.max(...gantt.map(g => g.end));
  const faultIds = [...new Set(gantt.map(g => g.fault_id))];
  const colorMap = {};
  faultIds.forEach((id, i) => { colorMap[id] = CREW_COLORS[i % CREW_COLORS.length]; });

  // Build per-fault timeline
  const faultTimelines = {};
  faultIds.forEach(id => { faultTimelines[id] = []; });
  gantt.forEach(g => faultTimelines[g.fault_id].push(g));

  // Tick marks every quantum
  const ticks = [];
  for (let t = 0; t <= maxTime; t += timeQuantum) ticks.push(t);
  if (ticks[ticks.length - 1] !== maxTime) ticks.push(maxTime);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Timeline rows */}
      <div className="gantt-wrapper">
        <div className="gantt-chart">
          {faultIds.map(fid => {
            const bars = faultTimelines[fid];
            const c = colorMap[fid];
            const isCritical = bars[0]?.critical;
            return (
              <div key={fid} className="gantt-row">
                <div className="gantt-label" style={{ color: isCritical ? '#f59e0b' : undefined }}>
                  {fid} {isCritical ? '★' : ''}
                </div>
                <div className="gantt-track">
                  {bars.map((bar, i) => {
                    const leftPct = (bar.start / maxTime) * 100;
                    const widthPct = ((bar.end - bar.start) / maxTime) * 100;
                    return (
                      <div
                        key={i}
                        className="gantt-bar tooltip-wrap"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          background: c.bg,
                          color: c.text,
                          minWidth: 24,
                        }}
                        title={`${fid}: t=${bar.start}→${bar.end} (${bar.end - bar.start} min)`}
                      >
                        {widthPct > 6 && `t${bar.start}-${bar.end}`}
                        <div className="tooltip-box">
                          {fid} | {bar.start}→{bar.end} min<br/>
                          Crew: {bar.crew}
                        </div>
                      </div>
                    );
                  })}
                  {/* Idle gaps */}
                  {Array.from({ length: bars.length - 1 }, (_, i) => {
                    const gap = bars[i + 1].start - bars[i].end;
                    if (gap <= 0) return null;
                    const leftPct = (bars[i].end / maxTime) * 100;
                    const widthPct = (gap / maxTime) * 100;
                    return (
                      <div
                        key={`gap-${i}`}
                        style={{
                          position: 'absolute',
                          top: 4, height: 26,
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 4px, rgba(255,255,255,0.03) 4px, rgba(255,255,255,0.03) 8px)',
                          borderRadius: 4,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Timeline ticks */}
          <div style={{ display: 'flex', paddingLeft: 110, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
            {ticks.map(t => (
              <div key={t} style={{ position: 'absolute', left: `calc(110px + ${(t / maxTime) * 100}% * (100% - 110px) / 100%)` }}>
                <div style={{ width: 1, height: 5, background: 'rgba(255,255,255,0.15)' }} />
                <div style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono,monospace', color: '#475569', marginTop: 2, transform: 'translateX(-50%)' }}>{t}</div>
              </div>
            ))}
            <div style={{ flex: 1 }} />
          </div>
          <div style={{ paddingLeft: 110, paddingTop: 18, fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace' }}>
            Time (minutes) — Quantum = {timeQuantum} min
          </div>
        </div>
      </div>

      {/* Results table */}
      {results && results.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fault ID</th>
                <th>Node</th>
                <th>Crew</th>
                <th>Priority</th>
                <th>Burst (min)</th>
                <th>Arrival</th>
                <th>Completion</th>
                <th>Turnaround</th>
                <th>Waiting</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.fault_id}>
                  <td style={{ color: colorMap[r.fault_id]?.border || '#fff', fontWeight: 700 }}>{r.fault_id}</td>
                  <td style={{ color: '#e2e8f0' }}>{r.node}</td>
                  <td>{r.crew}</td>
                  <td>
                    {r.critical
                      ? <span className="badge badge-amber">★ Critical</span>
                      : <span className="badge badge-blue">Standard</span>}
                  </td>
                  <td>{r.burst}</td>
                  <td>{r.arrival}</td>
                  <td style={{ color: '#10b981' }}>{r.completion}</td>
                  <td>{r.turnaround}</td>
                  <td style={{ color: r.waiting > 5 ? '#ef4444' : '#10b981' }}>{r.waiting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GanttChart;
