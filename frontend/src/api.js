const BASE = 'http://localhost:8000/api';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  getGraph:    () => get('/graph'),
  getNodes:    () => get('/nodes'),
  // depot (optional, null = auto-nearest) + fault = target substation
  runBFS:      (body) => post('/bfs', body),
  runDFS:      (body) => post('/dfs', body),
  runSchedule: (body) => post('/schedule', body),
  runDemo:     (body) => post('/demo', body),
};

