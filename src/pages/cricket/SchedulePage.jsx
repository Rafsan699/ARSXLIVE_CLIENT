import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../services/api';
import {
  GOLD, CYAN, SOFT, VIOLET, glass, Page, BackLink, Pill, Panel, Empty, MatchCard, PointsTable, statusTone,
  teamsOfTournament, setSelectedTournament
} from '../../components/ui';
import TeamCard from '../../components/TeamCard';

export default function SchedulePage() {
  const [sp] = useSearchParams();
  const id = sp.get('id');
  const highlight = sp.get('match');
  const [data, setData] = useState(null);
  const [points, setPoints] = useState({ tables: [] });
  const scrolled = useRef(false);

  useEffect(() => {
    if (!id) return;
    const load = () => {
      API.get(`/api/cricket/tournaments/${id}`).then((r) => setData(r.data)).catch(console.error);
      API.get(`/api/cricket/points-table/${id}`).then((r) => setPoints(r.data)).catch(console.error);
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [id]);

  // remember this tournament so the header Teams link opens its team list
  useEffect(() => { if (id) setSelectedTournament(id); }, [id]);

  // bring the opened match into view once (not on every refresh)
  useEffect(() => {
    if (!data || !highlight || scrolled.current) return;
    const el = document.getElementById(`match-${highlight}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); scrolled.current = true; }
  }, [data, highlight]);

  if (!id) return <Page><Empty>No tournament selected.</Empty></Page>;
  if (!data) return <Page><Empty>Loading...</Empty></Page>;
  const { tournament, schedules } = data;
  const { names: teamNames, groupOf } = teamsOfTournament(tournament, schedules);

  return (
    <Page>
      <BackLink to="/sports/cricket/tournament">Tournaments</BackLink>

      {/* tournament banner */}
      <div style={{ '--accent': GOLD }}
        className={`${glass} rounded-3xl p-5 sm:p-8 mt-4 mb-6 sm:mb-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)]`}>
        <div className="flex items-start gap-3">
          <span className="w-1.5 self-stretch min-h-[2rem] rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] shrink-0" />
          <div className="min-w-0">
            <h1 className="font-['Barlow_Condensed'] text-4xl sm:text-5xl font-bold leading-tight text-[#eef2ff] break-words">{tournament.tournamentName}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {tournament.status && <Pill color={statusTone(tournament.status)} className="capitalize">{tournament.status}</Pill>}
              {tournament.teamsCount != null && <Pill color={SOFT}>{tournament.teamsCount} teams</Pill>}
              {tournament.oversPerMatch != null && <Pill color={SOFT}>{tournament.oversPerMatch} overs</Pill>}
              <Pill color={SOFT}>{schedules.length} matches</Pill>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 sm:gap-8">
        <Panel accent={VIOLET} title="Teams" sub={`${teamNames.length} teams in this tournament`} to={`/sports/cricket/teams?id=${id}`} action="Open team list">
          {teamNames.length > 0
            ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {teamNames.map((n) => (
                  <TeamCard key={n} name={n} group={groupOf[n]} compact
                    to={`/sports/cricket/team/${encodeURIComponent(n)}?id=${id}`} />
                ))}
              </div>
            : <Empty>Teams will appear here once matches are scheduled.</Empty>}
        </Panel>

        <Panel accent={GOLD} title="Schedule" sub="Tap a match to open the live center">
          {schedules.length > 0
            ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {schedules.map((m) => <MatchCard key={m._id} m={m} highlight={m._id === highlight} />)}
              </div>
            : <Empty>No matches scheduled yet.</Empty>}
        </Panel>

        <Panel accent={CYAN} title="Points table" sub="Standings by group">
          {points.tables.length > 0
            ? <PointsTable tables={points.tables} />
            : <Empty>Points table will appear when matches are added.</Empty>}
        </Panel>
      </div>
    </Page>
  );
}