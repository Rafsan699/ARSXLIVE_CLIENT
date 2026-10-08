import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import {
  GOLD, CYAN, LIVE, VIOLET, glass, focusRing, primaryBtn, ghostBtn, tint, fmtDate, statusKind, statusTone,
  Icon, Pill, Panel, Empty, Crest, Avatar, StatusPill, MatchCard, PointsTable, teamsOfTournament
} from '../../components/ui';

const isDone = (m) => ['Completed', 'Finished'].includes(m.status);

/* big match card shown in the hero (live match, otherwise the next one) */
const HeroMatch = ({ m }) => {
  const live = statusKind(m.status) === 'live';
  const upcoming = statusKind(m.status) === 'upcoming';
  const meta = [m.tName, m.stage, m.group].filter(Boolean).join(' · ');
  const Team = ({ name, score, overs }) => (
    <div className="flex flex-col items-center gap-3 min-w-0">
      <Crest name={name} size="w-16 h-16 sm:w-24 sm:h-24" />
      <b className="text-sm sm:text-lg leading-tight line-clamp-2 break-words w-full">{name}</b>
      {!upcoming && (
        <span className="font-['Barlow_Condensed'] text-3xl sm:text-5xl font-bold leading-none whitespace-nowrap text-transparent bg-clip-text bg-[linear-gradient(100deg,#f2c14e,#3dd6d0)]">
          {score ?? '-'}
          {overs !== undefined && overs !== null && overs !== '' && <small className="ml-1 text-sm sm:text-base font-medium text-[#93a0bd] [-webkit-text-fill-color:#93a0bd]">({overs})</small>}
        </span>
      )}
    </div>
  );
  return (
    <Link to={`/sports/cricket/match/${m._id}`} style={{ '--accent': CYAN }}
      className={`block ${glass} w-full max-w-2xl mx-auto mt-8 sm:mt-10 text-[#eef2ff] rounded-3xl p-5 sm:p-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8),0_0_80px_-30px_rgba(61,214,208,0.35)] hover:-translate-y-0.5 transition ${focusRing}`}>
      <div className="flex justify-center mb-5">
        {live
          ? <StatusPill status={m.status} />
          : upcoming
            ? <span className="px-3.5 py-1.5 rounded-full text-sm font-bold"
                style={{ color: CYAN, background: 'rgba(61,214,208,0.14)', border: '1px solid rgba(61,214,208,0.35)' }}>Next match · {fmtDate(m.date)}</span>
            : <StatusPill status={m.status} />}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 sm:gap-6">
        <Team name={m.team1} score={m.team1Score} overs={m.team1Overs} />
        <div className="font-['Barlow_Condensed'] text-4xl sm:text-6xl font-bold text-[#93a0bd] pt-4 sm:pt-7">vs</div>
        <Team name={m.team2} score={m.team2Score} overs={m.team2Overs} />
      </div>
      {m.result && <p className="mt-5 text-center font-semibold text-[#f2c14e]">{m.result}</p>}
      {meta && <p className="text-sm text-[#93a0bd] mt-5 pt-4 border-t border-white/10 truncate">{meta}</p>}
    </Link>
  );
};

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [sel, setSel] = useState('');
  const [points, setPoints] = useState({ tables: [] });
  const [auction, setAuction] = useState(null);

  const load = () => {
    API.get('/api/cricket/tournaments').then((r) => {
      setTournaments(r.data);
      setSel((cur) => cur || (r.data.find((t) => t.status === 'Ongoing') || r.data[0] || {})._id || '');
    }).catch(console.error);
    API.get('/api/cricket/auction').then((r) => setAuction(r.data)).catch(() => {});
  };
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (sel) API.get(`/api/cricket/points-table/${sel}`).then((r) => setPoints(r.data)).catch(console.error);
  }, [sel, tournaments]);

  const all = useMemo(() => tournaments.flatMap((t) => (t.schedules || []).map((s) => ({ ...s, tName: t.tournamentName, tId: t._id }))), [tournaments]);
  const live = all.filter((m) => m.status === 'Ongoing');
  const done = all.filter(isDone);
  const upcoming = all.filter((m) => m.status === 'Upcoming').sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0)).slice(0, 5);
  const recent = done.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);
  const hero = live[0] || upcoming[0];
  const cur = auction && auction.current && auction.current.index >= 0 ? auction.players[auction.current.index] : null;

  const stats = [
    ['Tournaments', tournaments.length, '/sports/cricket/tournament', 'trophy', GOLD],
    ['Matches', all.length, '/sports/cricket/tournament', 'calendar', CYAN],
    ['Live now', live.length, '/sports/cricket/live', 'live', LIVE],
    ['Played', done.length, '/sports/cricket/tournament', 'check', VIOLET]
  ];

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <div className="relative overflow-hidden border-b border-white/10">
        <svg className="absolute inset-0 w-full h-full text-white opacity-[0.07]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 300" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="3">
            <ellipse cx="400" cy="150" rx="380" ry="132" />
            <ellipse cx="400" cy="150" rx="240" ry="82" strokeDasharray="10 8" />
            <rect x="386" y="100" width="28" height="100" />
            <line x1="376" y1="112" x2="424" y2="112" /><line x1="376" y1="188" x2="424" y2="188" />
          </g>
        </svg>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-24 sm:pb-28 text-center">
          <p className="text-sm sm:text-base font-medium text-[#93a0bd]">Cricket tournaments, live scores and player auction</p>
          <h1 className="font-['Barlow_Condensed'] text-6xl sm:text-7xl md:text-8xl font-bold leading-none mt-2 text-transparent bg-clip-text bg-[linear-gradient(100deg,#fff_15%,#f2c14e_42%,#3dd6d0_62%,#fff_88%)] [filter:drop-shadow(0_0_28px_rgba(242,193,78,0.25))]">ARS X LIVE</h1>

          {hero
            ? <HeroMatch m={hero} />
            : <p className="mt-8 text-[#93a0bd]">Fixtures will appear here once the schedule is published.</p>}

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/sports/cricket/live" className={`px-6 py-3 rounded-xl ${primaryBtn} ${focusRing}`}>Open live center</Link>
            <Link to="/sports/cricket/tournament" className={`px-6 py-3 rounded-xl ${ghostBtn} ${focusRing}`}>Browse tournaments</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        {/* ---------- Stats strip (overlaps hero) ---------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 -mt-12 sm:-mt-14 relative z-10 mb-8 sm:mb-10">
          {stats.map(([label, value, to, icon, accent]) => (
            <Link key={label} to={to} style={{ '--accent': accent }}
              className={`group ${glass} rounded-2xl p-4 sm:p-6 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.8)] hover:-translate-y-1 hover:border-[var(--accent)] transition ${focusRing}`}>
              <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl grid place-items-center mb-3 sm:mb-4"
                style={{ color: accent, background: tint(16), border: `1px solid ${tint(40)}`, boxShadow: `0 0 28px -4px ${accent}` }}><Icon name={icon} /></span>
              <b className="block font-['Barlow_Condensed'] text-4xl sm:text-5xl leading-none text-transparent bg-clip-text"
                style={{ backgroundImage: `linear-gradient(100deg, ${accent}, #eef2ff)` }}>{value}</b>
              <span className="block text-sm sm:text-base text-[#93a0bd] mt-1.5">{label}</span>
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-6 sm:gap-8">
          {/* ---------- Live matches ---------- */}
          <Panel accent={LIVE} title="Live now"
            sub={live.length ? `${live.length} match${live.length > 1 ? 'es' : ''} in progress` : 'Scores update here as soon as a match starts'}
            to="/sports/cricket/live" action="Open live center">
            {live.length > 0
              ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{live.map((m) => <MatchCard key={m._id} m={m} />)}</div>
              : <Empty>No live match right now.</Empty>}
          </Panel>

          {/* ---------- Upcoming + results ---------- */}
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 items-start">
            <Panel accent={CYAN} className="min-w-0" title="Upcoming matches" sub="Next fixtures" to="/sports/cricket/tournament" action="All matches">
              {upcoming.length > 0
                ? <div className="grid grid-cols-1 gap-4">{upcoming.map((m) => <MatchCard key={m._id} m={m} />)}</div>
                : <Empty>Nothing scheduled.</Empty>}
            </Panel>
            <Panel accent={GOLD} className="min-w-0" title="Recent results" sub="Latest finished matches" to="/sports/cricket/tournament" action="All matches">
              {recent.length > 0
                ? <div className="grid grid-cols-1 gap-4">{recent.map((m) => <MatchCard key={m._id} m={m} />)}</div>
                : <Empty>No results yet.</Empty>}
            </Panel>
          </div>

          {/* ---------- Points table (computed on the server from match results) ---------- */}
          <Panel accent={CYAN} title="Points table" sub="Standings by group"
            aside={tournaments.length > 0 && (
              <select value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Choose tournament"
                className={`shrink-0 max-w-[10.5rem] sm:max-w-xs rounded-lg border border-white/15 bg-[#0a0e1c] text-[#eef2ff] text-sm px-3 py-2 ${focusRing}`}>
                {tournaments.map((t) => <option key={t._id} value={t._id} className="bg-[#0a0e1c] text-[#eef2ff]">{t.tournamentName}</option>)}
              </select>
            )}>
            {points.tables.length > 0
              ? <PointsTable tables={points.tables} />
              : <Empty>Points table will appear when matches are added.</Empty>}
          </Panel>

          {/* ---------- Teams: pick a tournament, go straight to its team list ---------- */}
          <Panel accent={VIOLET} title="Teams" sub="Select a tournament to see its teams and players" to="/sports/cricket/teams" action="Team list">
            {tournaments.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tournaments.map((t) => (
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

          {/* ---------- Auction teaser ---------- */}
          <Panel accent={GOLD} title="Player auction" to="/auction" action="Open">
            {!auction ? <Empty>No auction created yet.</Empty> : (
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-[#eef2ff]">{auction.name}</h3>
                  {auction.status && <Pill color={statusTone(auction.status)} className="capitalize">{auction.status}</Pill>}
                </div>
                {cur ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-4">
                    <Avatar src={cur.image} name={cur.name} size="w-16 h-16 sm:w-20 sm:h-20" text="text-lg" />
                    <div className="min-w-0">
                      <p className="text-sm text-[#93a0bd]">On the block</p>
                      <p className="font-['Barlow_Condensed'] text-3xl sm:text-4xl font-bold leading-tight text-[#eef2ff] mt-1 break-words">{cur.name}</p>
                      <p className="text-sm text-[#93a0bd] mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        Current bid <b className="text-[#f2c14e]">{auction.current.bid}</b>
                        {auction.current.bidder && (<>by <Crest name={auction.current.bidder} size="w-6 h-6" textSize="text-[8px]" />{auction.current.bidder}</>)}
                      </p>
                    </div>
                  </div>
                ) : <p className="text-[#93a0bd] mt-3">No player on the block right now.</p>}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}