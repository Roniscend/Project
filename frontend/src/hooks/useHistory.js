import { useState, useCallback } from 'react';

const STORAGE_KEY = 'packetpath_history';
const MAX_ENTRIES = 100;

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function save(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {}
}

export function useHistory() {
  const [history, setHistory] = useState(() => load());

  const addEntry = useCallback((type, data) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,          // 'bfs' | 'dfs' | 'scheduler'
      timestamp: new Date().toISOString(),
      ...data,
    };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      save(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    save([]);
  }, []);

  return { history, addEntry, clearHistory };
}
