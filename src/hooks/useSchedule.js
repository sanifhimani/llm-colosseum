import useApi from './useApi';

export default function useSchedule() {
  const { data, loading } = useApi('/api/schedule');

  return {
    nextBattle: data?.nextBattle ?? null,
    season: data?.season ?? null,
    totalBattles: data?.totalBattles ?? null,
    loading,
  };
}
