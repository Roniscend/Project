import React from 'react';

const PALETTE = [
  { bg: 'linear-gradient(90deg,#3b82f6,#6366f1)', border: '#3b82f6', glow: 'rgba(59,130,246,0.45)' },
  { bg: 'linear-gradient(90deg,#10b981,#059669)', border: '#10b981', glow: 'rgba(16,185,129,0.45)' },
  { bg: 'linear-gradient(90deg,#f59e0b,#d97706)', border: '#f59e0b', glow: 'rgba(245,158,11,0.45)' },
  { bg: 'linear-gradient(90deg,#8b5cf6,#7c3aed)', border: '#8b5cf6', glow: 'rgba(139,92,246,0.45)' },
  { bg: 'linear-gradient(90deg,#ef4444,#dc2626)', border: '#ef4444', glow: 'rgba(239,68,68,0.45)' },
  { bg: 'linear-gradient(90deg,#06b6d4,#0891b2)', border: '#06b6d4', glow: 'rgba(6,182,212,0.45)' },
];

const LABEL_W = 130;

function GanttChart({ gantt, results, timeQuantum }) {
  if (!gantt || gantt.length === 0) return null;

  const maxTime  = Math.max(...gantt.map(g => g.end));
  const faultIds = [...new Set(gantt.map(g => g.fault_id))];

  const colorMap = {};
  faultIds.forEach((id, i) => { colorMap[id] = PALETTE[i % PALETTE.length]; });

  const faultTimelines = {};
  faultIds.forEach(id => { faultTimelines[id] = []; });
  gantt.forEach(g => faultTimelines[g.fault_id].push(g));

  const tickStep = Math.ceil(maxTime / 10) || 1;
  const ticks    = [];
  for (let t = 0; t <= maxTime; t += tickStep) ticks.push(t);
  if (ticks[ticks.length - 1] < maxTime) ticks.push(maxTime);

  const pct = t => `${(t / maxTime) * 100}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Gantt rows ── */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ minWidth: 540 }}>

          {/* Tick header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, paddingLeft: LABEL_W }}>
            <div style={{ flex: 1, position: 'relative', height: 18 }}>
              {ticks.map(t => (
                <div key={t} style={{
                  position: 'absolute', left: pct(t), transform: 'translateX(-50%)',
                  fontSize: '0.62rem', fontFamily: 'JetBrains Mono,monospace',
                  color: '#475569', whiteSpace: 'nowrap',
                }}>{t}</div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {faultIds.map(fid => {
            const bars         = faultTimelines[fid];
            const c            = colorMap[fid];
            const priority     = bars[0]?.priority || (bars[0]?.critical ? 'critical' : 'standard');
            const isVeryCrit   = priority === 'very_critical';
            const isCritical   = isVeryCrit || priority === 'critical';
            const rowColor     = isVeryCrit ? '#ef4444' : isCritical ? '#f59e0b' : c.border;
            const rowGlow      = isVeryCrit ? 'rgba(239,68,68,0.5)' : isCritical ? 'rgba(245,158,11,0.5)' : c.glow;
            const barBg        = isVeryCrit
              ? 'linear-gradient(90deg,#ef4444,#dc2626)'
              : isCritical
              ? 'linear-gradient(90deg,#f59e0b,#d97706)'
              : c.bg;
            const crewName     = bars[0]?.crew || fid;

            return (
              <div key={fid} style={{ display: 'flex', alignItems: 'center', height: 52, marginBottom: 10 }}>

                {/* Label */}
                <div style={{
                  width: LABEL_W, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                  paddingRight: 14,
                }}>
                  <div style={{
                    fontSize: '0.78rem', fontFamily: 'JetBrains Mono,monospace',
                    color: rowColor, fontWeight: 700,
                  }}>
                    {fid}{isVeryCrit ? ' 🔴' : isCritical ? ' ★' : ''}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: 1, maxWidth: 115,
                    textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {crewName}
                  </div>
                </div>

                {/* Track */}
                <div style={{
                  flex: 1, height: 38, position: 'relative',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, overflow: 'visible',
                }}>
                  {/* Grid lines */}
                  {ticks.slice(1, -1).map(t => (
                    <div key={t} style={{
                      position: 'absolute', top: 0, bottom: 0, left: pct(t), width: 1,
                      background: 'rgba(255,255,255,0.05)',
                    }} />
                  ))}

                  {/* Bars */}
                  {bars.map((bar, i) => {
                    const widthPct = ((bar.end - bar.start) / maxTime) * 100;
                    return (
                      <div key={i} style={{
                        position: 'absolute',
                        left: pct(bar.start),
                        width: `${widthPct}%`,
                        top: 4, height: 30,
                        background: barBg,
                        borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.62rem', fontWeight: 700, color: '#fff',
                        fontFamily: 'JetBrains Mono,monospace',
                        whiteSpace: 'nowrap', overflow: 'hidden',
                        boxShadow: `0 2px 12px ${rowGlow}`,
                        cursor: 'default',
                        transition: 'filter .15s',
                        minWidth: 4,
                      }}
                        title={`${fid}: t=${bar.start}→${bar.end} (${bar.end - bar.start} min) — ${bar.crew}`}
                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.3)'}
                        onMouseLeave={e => e.currentTarget.style.filter = ''}
                      >
                        {widthPct > 6 && `${bar.start}–${bar.end}`}
                      </div>
                    );
                  })}

                  {/* Idle gaps */}
                  {bars.slice(0, -1).map((bar, i) => {
                    const next = bars[i + 1];
                    const gap  = next.start - bar.end;
                    if (gap <= 0) return null;
                    return (
                      <div key={`gap-${i}`} style={{
                        position: 'absolute', left: pct(bar.end),
                        width: `${(gap / maxTime) * 100}%`,
                        top: 4, height: 30, borderRadius: 5,
                        background: 'repeating-linear-gradient(90deg,transparent 0,transparent 4px,rgba(255,255,255,0.03) 4px,rgba(255,255,255,0.03) 8px)',
                      }} />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* X-axis label */}
          <div style={{
            paddingLeft: LABEL_W, marginTop: 2,
            fontSize: '0.65rem', color: '#475569',
            fontFamily: 'JetBrains Mono,monospace',
          }}>
            ← Time (minutes) · Quantum = {timeQuantum} min →
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {faultIds.map(fid => {
          const c        = colorMap[fid];
          const pri      = faultTimelines[fid][0]?.priority || (faultTimelines[fid][0]?.critical ? 'critical' : 'standard');
          const isVC     = pri === 'very_critical';
          const isCrit   = isVC || pri === 'critical';
          const dotColor = isVC ? '#ef4444' : isCrit ? '#f59e0b' : c.border;
          const dotGlow  = isVC ? 'rgba(239,68,68,0.5)' : isCrit ? 'rgba(245,158,11,0.5)' : c.glow;
          const crew     = faultTimelines[fid][0]?.crew || fid;
          return (
            <div key={fid} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem',
              background: isVC ? 'rgba(239,68,68,0.08)' : isCrit ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isVC ? 'rgba(239,68,68,0.25)' : isCrit ? 'rgba(245,158,11,0.25)' : 'rgba(99,179,237,0.12)'}`,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: dotColor, boxShadow: `0 0 6px ${dotGlow}`,
              }} />
              <span style={{ color: dotColor, fontWeight: 700 }}>
                {fid}{isVC ? ' 🔴' : isCrit ? ' ★' : ''}
              </span>
              <span style={{ color: '#475569' }}>— {crew}</span>
            </div>
          );
        })}
      </div>

      {/* ── Results table ── */}
      {results && results.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Node</th><th>Crew</th><th>Priority</th>
                <th>Burst</th><th>Arrival</th><th>Completion</th>
                <th>Turnaround</th><th>Waiting</th><th>Order</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => {
                const c    = colorMap[r.fault_id];
                const pri  = r.priority || (r.critical ? 'critical' : 'standard');
                const isVC = pri === 'very_critical';
                const isC  = isVC || pri === 'critical';
                const idColor = isVC ? '#ef4444' : isC ? '#f59e0b' : (c?.border || '#fff');
                return (
                  <tr key={r.fault_id}>
                    <td style={{ color: idColor, fontWeight: 800, fontFamily: 'JetBrains Mono,monospace' }}>
                      {r.fault_id}{isVC ? ' 🔴' : isC ? ' ★' : ''}
                    </td>
                    <td style={{ color: '#e2e8f0', fontWeight: 600 }}>{r.node}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{r.crew}</td>
                    <td>
                      {isVC
                        ? <span className="badge" style={{ background:'rgba(239,68,68,0.15)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)', padding:'2px 8px', borderRadius:12, fontSize:'0.7rem', fontWeight:700 }}>🔴 Very Critical</span>
                        : isC
                        ? <span className="badge badge-amber">★ Critical</span>
                        : <span className="badge badge-blue">Standard</span>}
                    </td>
                    <td style={{ color: '#cbd5e1' }}>{r.burst}</td>
                    <td style={{ color: '#64748b' }}>{r.arrival}</td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>{r.completion}</td>
                    <td style={{ color: '#94a3b8' }}>{r.turnaround}</td>
                    <td style={{ color: r.waiting > 5 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                      {r.waiting}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'JetBrains Mono,monospace' }}>#{idx + 1}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GanttChart;
