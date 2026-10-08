import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTeams } from './TeamsContext';

/* ARS X LIVE shared design system (same look as FootballHome)
   bg #060912 · ink #eef2ff · soft #93a0bd · line white/10
   gold #f2c14e · cyan #3dd6d0 · violet #a78bfa · live #ff4d6d · button text #0a0e1c
   Colour rules: red = LIVE only · gold = main action / highlight
                 cyan = upcoming / standings · violet = tournaments · grey = finished */

export const GOLD = '#f2c14e';
export const CYAN = '#3dd6d0';
export const VIOLET = '#a78bfa';
export const LIVE = '#ff4d6d';
export const SOFT = '#93a0bd';

const ICONS = {
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  teams: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  tag: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
  live: 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.25a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14',
  check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  back: 'M19 12H5M12 19l-7-7 7-7',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M18 6L6 18M6 6l12 12'
};
export const Icon = ({ name, className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);

// accent-based tints (work with whatever --accent is set on a parent)
export const tint = (pct) => `color-mix(in srgb, var(--accent, ${GOLD}) ${pct}%, transparent)`;

// shared surface: glass card on the dark page
export const glass = 'bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10';

export const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c14e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060912]';

export const primaryBtn = 'bg-[linear-gradient(100deg,#f2c14e,#ffdf8a_50%,#3dd6d0)] text-[#0a0e1c] font-bold shadow-[0_12px_40px_-10px_rgba(242,193,78,0.55)] hover:brightness-105 transition';

export const ghostBtn = 'border border-white/20 bg-white/5 text-[#eef2ff] font-bold hover:bg-white/10 hover:border-[#f2c14e]/50 transition-colors';

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'TBA');

/* ---------- status helpers ---------- */
// match / auction status text -> 'live' | 'done' | 'upcoming' | 'other'
export const statusKind = (s = '') => {
  const v = String(s).toLowerCase();
  if (/live|ongoing|progress|running/.test(v)) return 'live';
  if (/complete|finish|result|ended|closed/.test(v)) return 'done';
  if (/upcoming|schedul|not started|pending|created/.test(v)) return 'upcoming';
  return 'other';
};

// tournament / auction status -> pill colour (red is kept for LIVE only)
export const statusTone = (s = '') => {
  const k = statusKind(s);
  if (k === 'upcoming') return CYAN;
  if (k === 'done') return SOFT;
  if (k === 'live') return GOLD;
  return SOFT;
};

/* ---------- small pieces ---------- */
export const Page = ({ children, className = '' }) => (
  <div className={`max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 ${className}`}>{children}</div>
);

export const Pill = ({ children, color, className = '' }) => (
  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${className}`}
    style={{ ...(color ? { '--accent': color } : {}), color: `var(--accent, ${GOLD})`, background: tint(14), border: `1px solid ${tint(35)}` }}>
    {children}
  </span>
);

export const Empty = ({ children }) => (
  <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center text-[#93a0bd]">{children}</div>
);

export const BackLink = ({ to, children }) => (
  <Link to={to} className={`inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#93a0bd] hover:text-[#f2c14e] transition-colors ${focusRing}`}>
    <Icon name="back" className="w-4 h-4" />{children}
  </Link>
);

export const Panel = ({ title, sub, to, action = 'View all', aside, accent = GOLD, children, className = '' }) => (
  <section style={{ '--accent': accent }}
    className={`${glass} rounded-2xl shadow-[0_30px_60px_-36px_rgba(0,0,0,0.8)] ${className}`}>
    <header className="flex items-start justify-between gap-3 px-4 sm:px-7 pt-5 sm:pt-7">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-1.5 self-stretch min-h-[2rem] rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] shrink-0" />
        <div className="min-w-0">
          <h2 className="font-['Barlow_Condensed'] text-[1.75rem] sm:text-4xl font-bold leading-tight text-[#eef2ff] break-words">{title}</h2>
          {sub && <p className="text-sm text-[#93a0bd] mt-1 break-words">{sub}</p>}
        </div>
      </div>
      {aside}
      {!aside && to && (
        <Link to={to}
          style={{ color: 'var(--accent)', background: tint(10), border: `1px solid ${tint(40)}` }}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold hover:brightness-125 transition ${focusRing}`}>{action}</Link>
      )}
    </header>
    <div className="p-4 sm:p-7 min-w-0">{children}</div>
  </section>
);

/* ---------- team crest (initials) ---------- */
const abbr = (n = '') => {
  const w = String(n).trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '?';
  return (w.length === 1 ? w[0].slice(0, 3) : w.slice(0, 3).map((x) => x[0]).join('')).toUpperCase();
};

export const Crest = ({ name, size = 'w-12 h-12 sm:w-14 sm:h-14', textSize = 'text-xs sm:text-sm' }) => {
  const { byName } = useTeams();
  const logo = byName[String(name || '').trim()]?.logo;
  const [bad, setBad] = useState(false);
  useEffect(() => { setBad(false); }, [logo]);
  if (logo && !bad) {
    return <img src={logo} alt="" onError={() => setBad(true)} className={`${size} rounded-full object-cover bg-white ring-1 ring-white/10 shrink-0`} />;
  }
  return <span className={`${size} rounded-full bg-[#f2c14e] text-[#0a0e1c] grid place-items-center ${textSize} font-bold shrink-0 ring-1 ring-white/10`}>{abbr(name)}</span>;
};

const initials = (n = '') => String(n).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || '?';

/* player photo (falls back to initials) */
export const Avatar = ({ src, name, size = 'w-12 h-12', text = 'text-sm', ring = 'ring-1 ring-white/10', className = '' }) => {
  const [bad, setBad] = useState(false);
  useEffect(() => { setBad(false); }, [src]);
  const base = `${size} rounded-full shrink-0 ${ring} ${className}`;
  return src && !bad
    ? <img src={src} alt="" onError={() => setBad(true)} className={`${base} object-cover bg-[#0a1024]`} />
    : <span className={`${base} grid place-items-center font-bold ${text} bg-[linear-gradient(135deg,#a78bfa,#3dd6d0)] text-[#0a0e1c]`}>{initials(name)}</span>;
};

/* ---------- match status pill ---------- */
export const StatusPill = ({ status }) => {
  const k = statusKind(status);
  if (k === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#e11d48] text-white text-xs font-bold px-2.5 py-1 rounded-full shrink-0 shadow-[0_0_22px_-4px_#ff4d6d]">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
      </span>
    );
  }
  if (k === 'done') return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-[#93a0bd] shrink-0">Completed</span>;
  if (k === 'upcoming') return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#3dd6d0]/15 text-[#3dd6d0] border border-[#3dd6d0]/35 shrink-0">Upcoming</span>;
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-[#93a0bd] shrink-0">{status || 'TBA'}</span>;
};

/* ---------- match card ---------- */
const Side = ({ name, score, overs }) => (
  <div className="flex flex-col items-center gap-2 text-center min-w-0">
    <Crest name={name} />
    <span className="text-sm font-semibold leading-tight line-clamp-2 break-words w-full text-[#eef2ff]">{name}</span>
    {score !== null && score !== undefined && (
      <span className="font-['Barlow_Condensed'] text-2xl sm:text-3xl font-bold leading-none text-[#eef2ff] whitespace-nowrap">
        {score}
        {overs !== undefined && overs !== null && overs !== '' && <small className="ml-1 text-sm font-medium text-[#93a0bd]">({overs})</small>}
      </span>
    )}
  </div>
);

export const MatchCard = ({ m, highlight = false }) => {
  const showScore = statusKind(m.status) !== 'upcoming';
  const meta = [m.tName, m.matchNumber != null && `#${m.matchNumber}`, m.stage, m.group].filter(Boolean).join(' · ');
  return (
    <Link id={`match-${m._id}`} to={`/sports/cricket/match/${m._id}`}
      className={`min-w-0 rounded-2xl border bg-white/5 p-4 sm:p-5 flex flex-col gap-4 hover:-translate-y-0.5 hover:border-[#f2c14e]/40 transition ${focusRing} ${
        highlight ? 'border-[#f2c14e] shadow-[0_0_0_1px_#f2c14e,0_18px_50px_-20px_rgba(242,193,78,0.5)]' : 'border-white/10'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-[#93a0bd] truncate min-w-0">{meta || 'Match'}</p>
        <StatusPill status={m.status} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
        <Side name={m.team1} score={showScore ? m.team1Score ?? '-' : null} overs={m.team1Overs} />
        <b className="font-['Barlow_Condensed'] text-2xl sm:text-3xl text-[#93a0bd] px-1 pt-3 sm:pt-4">vs</b>
        <Side name={m.team2} score={showScore ? m.team2Score ?? '-' : null} overs={m.team2Overs} />
      </div>
      {m.result && <p className="text-sm text-center font-semibold text-[#f2c14e] border-t border-white/10 pt-3">{m.result}</p>}
      <p className={`text-xs sm:text-sm text-center text-[#93a0bd] truncate ${m.result ? '' : 'border-t border-white/10 pt-3'}`}>{fmtDate(m.date)}</p>
    </Link>
  );
};

/* ---------- points table ---------- */
export const PointsTable = ({ tables }) => (
  <div className="flex flex-col gap-6">
    {tables.map((t) => (
      <div key={t.name} className="min-w-0">
        {t.name && <h3 className="font-['Barlow_Condensed'] text-xl sm:text-2xl font-bold text-[#eef2ff] mb-2">{t.name}</h3>}
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="text-xs text-[#93a0bd]">
                <th className="text-left font-semibold px-3 py-2.5 w-8">#</th>
                <th className="text-left font-semibold px-3 py-2.5">Team</th>
                {['P', 'W', 'L', 'T', 'NR', 'Pts', 'NRR'].map((h) => (
                  <th key={h} className={`text-center font-semibold px-3 py-2.5 ${h === 'Pts' ? 'text-[#f2c14e]' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.standings.map((r, i) => (
                <tr key={r.team} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className={`px-3 py-2.5 font-bold ${i === 0 ? 'text-[#f2c14e]' : 'text-[#93a0bd]'}`}>{i + 1}</td>
                  <td className="px-3 py-2.5 font-semibold text-[#eef2ff]"><span className="inline-flex items-center gap-2"><Crest name={r.team} size="w-7 h-7" textSize="text-[9px]" />{r.team}</span></td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-[#eef2ff]">{r.played}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-[#eef2ff]">{r.won}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-[#eef2ff]">{r.lost}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-[#eef2ff]">{r.tied}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-[#eef2ff]">{r.noResult}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums font-bold text-[#f2c14e]">{r.points}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-[#93a0bd]">{r.nrr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ))}
  </div>
);

/* ---------- selected tournament (remembered for this browser tab) ---------- */
const SEL_KEY = 'ars-selected-tournament';
export const getSelectedTournament = () => {
  try { return sessionStorage.getItem(SEL_KEY) || ''; } catch (e) { return ''; }
};
export const setSelectedTournament = (id) => {
  try { if (id) sessionStorage.setItem(SEL_KEY, id); } catch (e) { /* storage blocked: ignore */ }
  window.dispatchEvent(new Event('ars-tournament')); // lets the Header update its Teams link
};

/* team names of one tournament (groups + every team that appears in a match) */
export const teamsOfTournament = (t, schedules) => {
  const names = [];
  const groupOf = {};
  const add = (n) => { const v = String(n || '').trim(); if (v && !names.includes(v)) names.push(v); };
  ((t && t.groups) || []).forEach((g) => (g.teams || []).forEach((n) => { add(n); groupOf[String(n).trim()] = g.name; }));
  (schedules || (t && t.schedules) || []).forEach((m) => { add(m.team1); add(m.team2); });
  return { names, groupOf };
};

const KIND = { inter_university: 'inter', central_tournament: 'central', franchise_tournament: 'franchise' };
export const scheduleHref = (t, id) => `/sports/cricket/${KIND[t && t.category] || 'inter'}-schedule?id=${id}`;