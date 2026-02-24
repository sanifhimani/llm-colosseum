import useApi from './useApi';

const CACHE_KEY = 'llm-schedule';

let cached = null;
try {
  const raw = localStorage.getItem(CACHE_KEY);
  if (raw) cached = JSON.parse(raw);
} catch { /* empty */ }

function writeCache(data) {
  cached = data;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* empty */ }
}

export default function useSchedule() {
  const { data, loading } = useApi('/api/schedule');

  if (data && data !== cached) writeCache(data);

  const source = data || cached;

  return {
    nextBattle: source?.nextBattle ?? null,
    season: source?.season ?? null,
    totalBattles: source?.totalBattles ?? null,
    loading: loading && !source,
  };
}
