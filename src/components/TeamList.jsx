import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import TeamCard from './TeamCard';
import {
  VIOLET, CYAN, SOFT, glass, focusRing, primaryBtn, ghostBtn, tint, Icon, Page, BackLink, Pill, Panel, Empty,
  statusTone, teamsOfTournament, setSelectedTournament, scheduleHref
} from './ui';

/* /sports/cricket/teams            -> pick a tournament first
   /sports/cricket/teams?id=<id>    -> team list of that tournament */
export default function TeamList() {
  const [sp] = useSearchParams();
  const id = sp.get('id');
  const [list, setList] = useState(null);   // tournaments (picker)
  const [data, setData] = useState(null);   // one tournament

  useEffect(() => {
    if (!id) {
      setData(null);
      API.get('/api/cricket/tournaments').then((r) => setList(r.data)).catch(() => setList([]));
      return undefined;
    }
    setSelectedTournament(id);
    setData(null);
    const load = () => API.get(`/api/cricket/tournaments/${id}`).then((r) => setData(r.data)).catch(console.error);
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [id]);

  /* ---------- no tournament chosen yet ---------- */
  if (!id) {
    return (
      <Page>
        <Panel accent={VIOLET} title="Teams" sub="Select a tournament to see its teams and players">
          {list === null ? <Empty>Loading...</Empty> : list.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => (
                <Link key={t._id} to={`/sports/cricket/teams?id=${t._id}`} style={{ '--accent': VIOLET }}
                  className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:-translate-y-0.5 hover:border-[var(--accent)] transition ${focusRing}`}>
                  <span className="w-11 h-11 rounded-xl grid place-items-center shrink-0 text-[#a78bfa]" style={{ background: tint(16), border: `1px solid ${tint(40)}` }}>
                    <Icon name="trophy" className="w-5 h-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[#eef2ff] leading-snug break-words">{t.tournamentName}</b>
                    <span className="block text-sm text-[#93a0bd]">{teamsOfTournament(t).names.length || t.teamsCount || 0} teams</span>
                  </span>
                  <Pill color={statusTone(t.status)} className="capitalize shrink-0">{t.status}</Pill>
                </Link>
              ))}
            </div>
          ) : <Empty>No tournaments yet.</Empty>}
        </Panel>
      </Page>
    );
  }

  /* ---------- one tournament ---------- */
  if (!data) return <Page><Empty>Loading...</Empty></Page>;
  const { tournament, schedules } = data;
  const { names, groupOf } = teamsOfTournament(tournament, schedules);
  const groups = tournament.groups || [];
  const grouped = groups.map((g) => ({ title: g.name, names: names.filter((n) => groupOf[n] === g.name) })).filter((s) => s.names.length);
  const others = names.filter((n) => !groupOf[n]);
  const sections = groups.length ? [...grouped, ...(others.length ? [{ title: 'Other teams', names: others }] : [])] : [{ title: '', names }];
  const teamTo = (n) => `/sports/cricket/team/${encodeURIComponent(n)}?id=${id}`;

  return (
    <Page>
      <BackLink to="/sports/cricket/tournament">Tournaments</BackLink>

      <div style={{ '--accent': VIOLET }}
        className={`${glass} rounded-3xl p-5 sm:p-8 mt-4 mb-6 sm:mb-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)]`}>
        <div className="flex items-start gap-3">
          <span className="w-1.5 self-stretch min-h-[2rem] rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] shrink-0" />
          <div className="min-w-0">
            <h1 className="font-['Barlow_Condensed'] text-4xl sm:text-5xl font-bold leading-tight text-[#eef2ff] break-words">{tournament.tournamentName}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {tournament.status && <Pill color={statusTone(tournament.status)} className="capitalize">{tournament.status}</Pill>}
              <Pill color={SOFT}>{names.length} teams</Pill>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Link to={scheduleHref(tournament, id)} className={`px-5 py-2.5 rounded-xl text-sm text-center ${primaryBtn} ${focusRing}`}>Schedule and results</Link>
          <Link to="/sports/cricket/teams" className={`px-5 py-2.5 rounded-xl text-sm text-center ${ghostBtn} ${focusRing}`}>Change tournament</Link>
        </div>
      </div>

      <Panel accent={CYAN} title="Teams" sub="Tap a team to see its players and their performance">
        {names.length > 0 ? (
          <div className="flex flex-col gap-7">
            {sections.map((sec) => (
              <div key={sec.title || 'all'}>
                {sec.title && <h3 className="font-['Barlow_Condensed'] text-xl sm:text-2xl font-bold text-[#eef2ff] mb-3">{sec.title}</h3>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {sec.names.map((n) => <TeamCard key={n} name={n} to={teamTo(n)} />)}
                </div>
              </div>
            ))}
          </div>
        ) : <Empty>Teams will appear here once matches are scheduled.</Empty>}
      </Panel>
    </Page>
  );
}