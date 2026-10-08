import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import API from '../services/api';

/* One shared copy of every team (logo + players with photo and stats).
   Used everywhere so a team logo / player photo shows on every page. */
const Ctx = createContext({ teams: [], byName: {}, loading: true, refresh: () => {} });
export const useTeams = () => useContext(Ctx);

export function TeamsProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    () => API.get('/api/cricket/teams')
      .then((r) => setTeams(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, [refresh]);

  const value = useMemo(() => ({
    teams,
    loading,
    refresh,
    byName: Object.fromEntries(teams.map((t) => [String(t.name || '').trim(), t]))
  }), [teams, loading, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}