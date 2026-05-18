import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
const ALGO_COLORS = {
  bfs:       { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  text: '#60a5fa',  label: 'BFS',       icon: '🔵' },
  dfs:       { bg: 'rgba(6,182,212,0.1)',    border: 'rgba(6,182,212,0.3)',    text: '#22d3ee',  label: 'DFS',       icon: '🌊' },
  scheduler: { bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.3)',   text: '#a78bfa',  label: 'Scheduler', icon: '⚙️' },
};

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
}

function StatPill({ label, value, color = '#60a5fa' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,179,237,0.12)',
      borderRadius: 10, padding: '8px 14px', minWidth: 80,
    }}>
      <div style={{ fontSize: '1.15rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function BFSCard({ entry }) {
  const c = ALGO_COLORS.bfs;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 14, padding: '1rem 1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1rem' }}>{c.icon}</span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: c.text }}>BFS Shortest Path</div>
            <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 1 }}>{fmtTime(entry.timestamp)}</div>
          </div>
        </div>
        <div style={{
          background: entry.used_brute_force ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
          border: `1px solid ${entry.used_brute_force ? 'rgba(245,158,11,0.4)' : 'rgba(59,130,246,0.4)'}`,
          color: entry.used_brute_force ? '#f59e0b' : '#60a5fa',
          borderRadius: 20, padding: '2px 10px', fontSize: '0.65rem', fontWeight: 700,
        }}>
          {entry.used_brute_force ? '⚡ + Brute Force' : 'BFS Only'}
        </div>
      </div>

      {/* Route */}
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 10 }}>
        <span style={{ color: '#10b981', fontWeight: 700 }}>{entry.depot_label || entry.depot}</span>
        <span style={{ margin: '0 6px', color: '#475569' }}>→</span>
        <span style={{ color: '#ef4444', fontWeight: 700 }}>{entry.fault_label || entry.fault}</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatPill label="Hops" value={entry.hops} color="#60a5fa" />
        <StatPill label="Distance" value={`${entry.total_km} km`} color="#10b981" />
        <StatPill label="Explored" value={entry.nodes_explored} color="#a78bfa" />
        <StatPill label="Time" value={`${entry.time_ms} ms`} color="#f59e0b" />
        {entry.used_brute_force && entry.bf_hops != null && (
          <StatPill label="BF Hops" value={entry.bf_hops} color="#f59e0b" />
        )}
      </div>

      {/* Path */}
      {entry.path?.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {entry.path.map((n, i) => (
            <span key={`${n}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                background: n === entry.depot ? 'rgba(16,185,129,0.15)' : n === entry.fault ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.1)',
                border: `1px solid ${n === entry.depot ? '#10b981' : n === entry.fault ? '#ef4444' : 'rgba(59,130,246,0.3)'}`,
                color: n === entry.depot ? '#10b981' : n === entry.fault ? '#ef4444' : '#60a5fa',
                borderRadius: 6, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700,
              }}>{n}</span>
              {i < entry.path.length - 1 && <span style={{ color: '#334155', fontSize: '0.7rem' }}>→</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DFSCard({ entry }) {
  const c = ALGO_COLORS.dfs;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 14, padding: '1rem 1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1rem' }}>{c.icon}</span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: c.text }}>DFS Zone Mapping</div>
            <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 1 }}>{fmtTime(entry.timestamp)}</div>
          </div>
        </div>
        <div style={{
          background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)',
          color: '#22d3ee', borderRadius: 20, padding: '2px 10px', fontSize: '0.65rem', fontWeight: 700,
        }}>
          {entry.zone_count} zones
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 10 }}>
        Fault: <span style={{ color: '#ef4444', fontWeight: 700 }}>{entry.fault}</span>
        {entry.blockers?.length > 0 && (
          <span style={{ marginLeft: 8, color: '#475569' }}>Blockers: {entry.blockers.join(', ')}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatPill label="Zones" value={entry.zone_count} color="#22d3ee" />
        <StatPill label="Time" value={`${entry.time_ms} ms`} color="#f59e0b" />
      </div>
      {entry.affected_zones?.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {entry.affected_zones.slice(0, 12).map((n, i) => (
            <span key={`${n}-${i}`} style={{
              background: n === entry.fault ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.1)',
              border: `1px solid ${n === entry.fault ? '#ef4444' : 'rgba(6,182,212,0.3)'}`,
              color: n === entry.fault ? '#ef4444' : '#22d3ee',
              borderRadius: 6, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700,
            }}>{n}</span>
          ))}
          {entry.affected_zones.length > 12 && (
            <span style={{ color: '#475569', fontSize: '0.68rem', padding: '1px 7px' }}>
              +{entry.affected_zones.length - 12} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SchedulerCard({ entry }) {
  const c = ALGO_COLORS.scheduler;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 14, padding: '1rem 1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1rem' }}>{c.icon}</span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: c.text }}>Round-Robin Scheduler</div>
            <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 1 }}>{fmtTime(entry.timestamp)}</div>
          </div>
        </div>
        <div style={{
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)',
          color: '#a78bfa', borderRadius: 20, padding: '2px 10px', fontSize: '0.65rem', fontWeight: 700,
        }}>
          Q={entry.time_quantum}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <StatPill label="Faults" value={entry.fault_count} color="#a78bfa" />
        <StatPill label="Avg Wait" value={`${entry.avg_waiting_time}s`} color="#f59e0b" />
        <StatPill label="Avg TAT" value={`${entry.avg_turnaround_time}s`} color="#10b981" />
      </div>
      {entry.results?.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispatched Crews</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {entry.results.slice(0, 5).map(r => (
              <div key={r.fault_id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(15,23,42,0.5)', borderRadius: 8, padding: '5px 10px',
              }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  color: r.priority === 'very_critical' ? '#ef4444' : r.priority === 'critical' ? '#f59e0b' : '#a78bfa',
                  background: r.priority === 'very_critical' ? 'rgba(239,68,68,0.12)' : r.priority === 'critical' ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)',
                  border: `1px solid ${r.priority === 'very_critical' ? 'rgba(239,68,68,0.3)' : r.priority === 'critical' ? 'rgba(245,158,11,0.3)' : 'rgba(139,92,246,0.3)'}`,
                  borderRadius: 4, padding: '1px 6px',
                }}>
                  {r.priority === 'very_critical' ? '🔴 V.Critical' : r.priority === 'critical' ? '🟡 Critical' : '🟢 Standard'}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', flex: 1 }}>{r.crew} → {r.node}</span>
                <span style={{ fontSize: '0.68rem', color: '#475569' }}>TAT: {r.turnaround}s</span>
              </div>
            ))}
            {entry.results.length > 5 && (
              <div style={{ fontSize: '0.68rem', color: '#475569', padding: '2px 10px' }}>
                +{entry.results.length - 5} more crews…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfileTab({ history, clearHistory }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const bfsRuns  = history.filter(h => h.type === 'bfs');
  const dfsRuns  = history.filter(h => h.type === 'dfs');
  const schRuns  = history.filter(h => h.type === 'scheduler');

  const filtered = filter === 'all' ? history : history.filter(h => h.type === filter);

  // Aggregate stats
  const totalKm     = bfsRuns.reduce((s, r) => s + (r.total_km || 0), 0);
  const avgHops     = bfsRuns.length ? (bfsRuns.reduce((s, r) => s + (r.hops || 0), 0) / bfsRuns.length).toFixed(1) : '—';
  const totalZones  = dfsRuns.reduce((s, r) => s + (r.zone_count || 0), 0);
  const avgWait     = schRuns.length ? (schRuns.reduce((s, r) => s + (r.avg_waiting_time || 0), 0) / schRuns.length).toFixed(1) : '—';

  const avatarChar = (user?.displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Profile card ── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
        border: '1px solid rgba(99,179,237,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          {user?.photoURL ? (
            <img src={user.photoURL} alt="avatar" style={{
              width: 72, height: 72, borderRadius: '50%',
              border: '3px solid rgba(59,130,246,0.5)',
              boxShadow: '0 0 20px rgba(59,130,246,0.3)',
            }} />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 800, color: '#fff',
              boxShadow: '0 0 20px rgba(59,130,246,0.3)',
              border: '3px solid rgba(59,130,246,0.4)',
            }}>{avatarChar}</div>
          )}

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              {user?.displayName || 'User'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 3 }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                color: '#60a5fa', borderRadius: 20, padding: '3px 12px',
                fontSize: '0.7rem', fontWeight: 700,
              }}>🔵 {bfsRuns.length} BFS runs</span>
              <span style={{
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
                color: '#22d3ee', borderRadius: 20, padding: '3px 12px',
                fontSize: '0.7rem', fontWeight: 700,
              }}>🌊 {dfsRuns.length} DFS runs</span>
              <span style={{
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#a78bfa', borderRadius: 20, padding: '3px 12px',
                fontSize: '0.7rem', fontWeight: 700,
              }}>⚙️ {schRuns.length} Scheduler runs</span>
            </div>
          </div>

          {/* Member since */}
          {user?.metadata?.creationTime && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member since</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                {new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Aggregate stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { icon: '🔵', label: 'Total BFS Runs',     value: bfsRuns.length,        color: '#60a5fa' },
          { icon: '📏', label: 'Total km Found',      value: `${totalKm.toFixed(1)} km`, color: '#10b981' },
          { icon: '📡', label: 'Avg BFS Hops',        value: avgHops,               color: '#a78bfa' },
          { icon: '🌊', label: 'Total DFS Zones',     value: totalZones,            color: '#22d3ee' },
          { icon: '⚙️', label: 'Scheduler Runs',      value: schRuns.length,        color: '#a78bfa' },
          { icon: '⏱️', label: 'Avg Wait Time',       value: avgWait !== '—' ? `${avgWait}s` : '—', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="stat-box" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── History feed ── */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <div className="card-icon blue">📋</div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Run History</div>
            <div className="card-desc">All your algorithm runs — most recent first</div>
          </div>
          {history.length > 0 && (
            <div>
              {confirmClear ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { clearHistory(); setConfirmClear(false); }} style={{
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                    color: '#ef4444', borderRadius: 8, padding: '5px 12px',
                    fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  }}>✓ Confirm Clear</button>
                  <button onClick={() => setConfirmClear(false)} style={{
                    background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)',
                    color: '#94a3b8', borderRadius: 8, padding: '5px 12px',
                    fontSize: '0.72rem', cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmClear(true)} style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444', borderRadius: 8, padding: '5px 14px',
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                }}>🗑 Clear All</button>
              )}
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all',       label: `All (${history.length})`,          color: '#94a3b8' },
            { key: 'bfs',       label: `🔵 BFS (${bfsRuns.length})`,       color: '#60a5fa' },
            { key: 'dfs',       label: `🌊 DFS (${dfsRuns.length})`,       color: '#22d3ee' },
            { key: 'scheduler', label: `⚙️ Scheduler (${schRuns.length})`, color: '#a78bfa' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter === f.key ? `${f.color}22` : 'rgba(15,23,42,0.4)',
              border: `1px solid ${filter === f.key ? f.color : 'rgba(99,179,237,0.12)'}`,
              color: filter === f.key ? f.color : '#475569',
              borderRadius: 20, padding: '4px 14px', fontSize: '0.72rem',
              fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Feed */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem 1rem',
            color: '#334155', borderRadius: 12,
            background: 'rgba(15,23,42,0.4)',
            border: '1px dashed rgba(99,179,237,0.1)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              {filter === 'all'
                ? 'No runs yet — go run some BFS, DFS, or Scheduler!'
                : `No ${filter.toUpperCase()} runs yet.`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 620, overflowY: 'auto', paddingRight: 4 }}>
            {filtered.map(entry => (
              entry.type === 'bfs'       ? <BFSCard       key={entry.id} entry={entry} /> :
              entry.type === 'dfs'       ? <DFSCard       key={entry.id} entry={entry} /> :
              entry.type === 'scheduler' ? <SchedulerCard key={entry.id} entry={entry} /> :
              null
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
