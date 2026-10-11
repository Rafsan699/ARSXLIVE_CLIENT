import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import API, { BASE_URL } from '../../services/api';
import {
  GOLD, CYAN, LIVE, VIOLET, glass, focusRing, primaryBtn, ghostBtn, tint, fmtDate, statusKind, statusTone,
  Icon, Pill, Panel, Empty, Crest, Avatar, StatusPill, MatchCard, PointsTable, teamsOfTournament
} from '../../components/ui';

/* =====================================================================
   HOME
   1. Video stage   : the admin's YouTube live (confirmed in Admin > Stream). While nothing is live it shows the
                      "upcoming" thumbnail the admin set. Updates by itself through socket.io (no reload).
                      Desktop: video + Match center side by side. Phone: video first, full width, then a swipe row of matches.
   2. Quick numbers
   3. Matches (Live / Upcoming / Results tabs)  +  sidebar (auction, teams)
   4. Points table
   ===================================================================== */

const isDone = (m) => ['Completed', 'Finished'].includes(m.status);
const abs = (u) => (u && u.startsWith('/') ? `${String(BASE_URL || '').replace(/\/$/, '')}${u}` : u || '');

const embedUrl = (l) => {
  const q = 'autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1';   // browsers only autoplay muted video
  return l.channelId
    ? `https://www.youtube-nocookie.com/embed/live_stream?channel=${l.channelId}&${q}`
    : `https://www.youtube-nocookie.com/embed/${l.videoId}?${q}`;
};
const watchUrl = (l) => (l.channelId ? `https://www.youtube.com/channel/${l.channelId}/live` : `https://www.youtube.com/watch?v=${l.videoId}`);

const CSS = `
.hm-ring{position:relative;border-radius:26px;padding:2px;overflow:hidden;box-shadow:0 30px 80px -30px rgba(242,193,78,.45),0 0 80px -30px rgba(61,214,208,.35)}
.hm-ring>i{position:absolute;inset:-60%}
.hm-rise{animation:hm-rise .7s cubic-bezier(.2,.8,.2,1) both}
.hm-d1{animation-delay:.08s}.hm-d2{animation-delay:.16s}.hm-d3{animation-delay:.24s}.hm-d4{animation-delay:.32s}
.hm-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.25) transparent}
.hm-scroll::-webkit-scrollbar{height:6px;width:6px}.hm-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.22);border-radius:99px}
.hm-pulse{animation:hm-pulse 1.6s ease-out infinite}
.hm-play{animation:hm-float 3.6s ease-in-out infinite}
@media(prefers-reduced-motion:no-preference){.hm-ring>i{animation:hm-spin 7s linear infinite}}
@media(prefers-reduced-motion:reduce){.hm-rise,.hm-pulse,.hm-play{animation:none}}
@keyframes hm-spin{to{transform:rotate(360deg)}}
@keyframes hm-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes hm-pulse{0%{box-shadow:0 0 0 0 rgba(255,77,109,.65)}100%{box-shadow:0 0 0 12px rgba(255,77,109,0)}}
@keyframes hm-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
`;

/* ---------- data: the admin's stream settings (socket = instant, polling = safety net) ---------- */
const useStream = () => {
  const [s, setS] = useState(undefined);        // undefined = loading, null = could not load
  useEffect(() => {
    let alive = true;
    const load = () => API.get('/api/cricket/stream')
      .then((r) => { if (alive) setS(r.data); })
      .catch(() => { if (alive) setS((p) => (p === undefined ? null : p)); });
    load();
    const socket = io(BASE_URL);
    socket.on('streamUpdated', (d) => { if (alive) setS(d); });
    socket.on('connect', load);
    const iv = setInterval(load, 30000);
    return () => { alive = false; clearInterval(iv); socket.disconnect(); };
  }, []);
  return s;
};

const useCountdown = (iso) => {
  const t = iso ? new Date(iso).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!t || t < Date.now()) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [t]);
  if (!t) return null;
  const d = t - now;
  if (d <= 0) return { over: true };
  return {
    over: false,
    d: Math.floor(d / 86400000),
    h: Math.floor((d % 86400000) / 3600000),
    m: Math.floor((d % 3600000) / 60000),
    s: Math.floor((d % 60000) / 1000)
  };
};

const Tick = ({ v, l }) => (
  <div className="min-w-[3.1rem] sm:min-w-[4.2rem] rounded-xl border border-white/15 bg-white/10 backdrop-blur-md px-2 py-1.5 sm:py-2.5 text-center">
    <b className="block font-['Barlow_Condensed'] text-2xl sm:text-4xl leading-none text-[#f2c14e] tabular-nums">{String(v).padStart(2, '0')}</b>
    <span className="block text-[10px] sm:text-xs uppercase tracking-wider text-[#93a0bd] mt-1">{l}</span>
  </div>
);

const PlayIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
);

/* shown when the admin did not upload a thumbnail: the next fixture on a pitch background */
const PosterFallback = ({ m }) => (
  <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_50%_0%,rgba(242,193,78,0.18),transparent_70%),linear-gradient(135deg,#0d1428,#0a1024_55%,#060912)]">
    <svg className="absolute inset-0 w-full h-full text-white opacity-[0.07]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 300" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="3"><ellipse cx="400" cy="150" rx="380" ry="132" /><ellipse cx="400" cy="150" rx="240" ry="82" strokeDasharray="10 8" /><rect x="386" y="100" width="28" height="100" /></g>
    </svg>
    {m ? (
      <div className="absolute inset-x-0 top-[12%] sm:top-[14%] flex items-start justify-center gap-5 sm:gap-14 px-4">
        <div className="flex flex-col items-center gap-2 w-24 sm:w-40 min-w-0"><Crest name={m.team1} size="w-14 h-14 sm:w-24 sm:h-24" /><b className="text-xs sm:text-lg text-center leading-tight line-clamp-2 w-full">{m.team1}</b></div>
        <span className="font-['Barlow_Condensed'] text-3xl sm:text-6xl font-bold text-[#93a0bd] pt-3 sm:pt-6">vs</span>
        <div className="flex flex-col items-center gap-2 w-24 sm:w-40 min-w-0"><Crest name={m.team2} size="w-14 h-14 sm:w-24 sm:h-24" /><b className="text-xs sm:text-lg text-center leading-tight line-clamp-2 w-full">{m.team2}</b></div>
      </div>
    ) : (
      <div className="absolute inset-0 grid place-items-center text-5xl sm:text-7xl opacity-80" aria-hidden="true">🏏</div>
    )}
  </div>
);

/* ---------- 1. the video stage ---------- */
function StreamStage({ stream, next }) {
  const l = stream && stream.live;
  const live = !!(l && l.enabled);
  const up = (stream && stream.upcoming) || {};
  const thumb = abs(up.thumbnail);
  const cd = useCountdown(up.startsAt);
  const fallbackTitle = next ? `${next.team1} vs ${next.team2}` : 'Next stream';
  const title = live ? (l.title || 'Live now') : (up.title || fallbackTitle);
  const sub = live ? '' : (up.subtitle || (next ? [next.tName, next.stage, next.group].filter(Boolean).join(' · ') : ''));

  if (stream === undefined) {
    return <div className="aspect-video w-full rounded-3xl bg-white/5 border border-white/10 animate-pulse" aria-busy="true" />;
  }

  return (
    <section aria-label={live ? 'Live video' : 'Next stream'}>
      <div className="hm-ring">
        <i aria-hidden="true" style={{ background: live
          ? 'conic-gradient(from 0deg,#f2c14e,#3dd6d0,#060912 35%,#a78bfa 55%,#ff4d6d 75%,#f2c14e)'
          : 'conic-gradient(from 0deg,rgba(242,193,78,.35),#060912,rgba(61,214,208,.35))' }} />
        <div className="relative rounded-[24px] overflow-hidden bg-[#060912]">
          <div className="relative aspect-video w-full bg-black">
            {live ? (
              <iframe key={embedUrl(l)} title={title} src={embedUrl(l)} className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
            ) : (
              <>
                {thumb ? <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <PosterFallback m={next} />}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(6,9,18,0.96),rgba(6,9,18,0.45)_52%,rgba(6,9,18,0.12))]" />
                <span className="absolute top-3 left-3 sm:top-5 sm:left-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold"
                  style={{ color: CYAN, background: 'rgba(6,9,18,0.7)', border: '1px solid rgba(61,214,208,0.45)', backdropFilter: 'blur(6px)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: CYAN }} />Upcoming stream
                </span>
                {(up.link || thumb) && (
                  <span className="hm-play absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-6 sm:-mt-10 w-14 h-14 sm:w-20 sm:h-20 rounded-full grid place-items-center text-[#0a0e1c] bg-[linear-gradient(135deg,#f2c14e,#3dd6d0)] shadow-[0_0_50px_rgba(242,193,78,0.55)]">
                    <PlayIcon className="w-6 h-6 sm:w-9 sm:h-9 ml-0.5" />
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-['Barlow_Condensed'] text-2xl sm:text-5xl lg:text-6xl font-bold leading-[1.02] text-[#eef2ff] line-clamp-2 break-words">{title}</h2>
                    {sub && <p className="mt-1 sm:mt-2 text-xs sm:text-base text-[#b4bfd8] line-clamp-1">{sub}</p>}
                    {up.startsAt && <p className="mt-1 text-xs sm:text-sm font-semibold text-[#f2c14e]">{fmtDate(up.startsAt)}</p>}
                  </div>
                  {cd && (cd.over
                    ? <span className="self-start sm:self-end shrink-0 px-4 py-2 rounded-xl bg-white/10 border border-white/15 font-semibold text-[#f2c14e]">Starting soon</span>
                    : (
                      <div className="flex gap-1.5 sm:gap-2 shrink-0" role="timer" aria-label="Time left">
                        {cd.d > 0 && <Tick v={cd.d} l="days" />}<Tick v={cd.h} l="hrs" /><Tick v={cd.m} l="min" /><Tick v={cd.s} l="sec" />
                      </div>
                    ))}
                </div>
                {up.link && <a href={up.link} target="_blank" rel="noreferrer" aria-label="Open the stream link" className="absolute inset-0" />}
              </>
            )}
          </div>

          {/* info bar under the video */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-3.5 py-3 sm:px-6 sm:py-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] border-t border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              {live
                ? <span className="hm-pulse shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-bold text-white bg-[#ff4d6d]"><span className="w-2 h-2 rounded-full bg-white" />LIVE</span>
                : <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold text-[#93a0bd] bg-white/10">Offline</span>}
              <div className="min-w-0">
                <p className="font-semibold text-[#eef2ff] truncate">{title}</p>
                <p className="text-xs sm:text-sm text-[#93a0bd] truncate">{live ? 'Streaming now from our YouTube channel. Tap the player for sound.' : 'The live video appears here the moment the stream starts.'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link to="/sports/cricket/live" className={`px-4 py-2.5 rounded-xl text-sm ${primaryBtn} ${focusRing}`}>Open live center</Link>
              {live
                ? <a href={watchUrl(l)} target="_blank" rel="noreferrer" className={`px-4 py-2.5 rounded-xl text-sm ${ghostBtn} ${focusRing}`}>Watch on YouTube</a>
                : up.link && <a href={up.link} target="_blank" rel="noreferrer" className={`px-4 py-2.5 rounded-xl text-sm ${ghostBtn} ${focusRing}`}>Open stream page</a>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- compact match tile (side panel / swipe row) ---------- */
const MiniMatch = ({ m }) => {
  const showScore = statusKind(m.status) !== 'upcoming';
  return (
    <Link to={`/sports/cricket/match/${m._id}`}
      className={`block shrink-0 w-[17rem] sm:w-72 lg:w-auto snap-start ${glass} rounded-2xl p-3.5 hover:-translate-y-0.5 hover:border-white/30 transition ${focusRing}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <StatusPill status={m.status} />
        <span className="text-xs text-[#93a0bd] truncate">{m.tName}</span>
      </div>
      {[[m.team1, m.team1Score, m.team1Overs], [m.team2, m.team2Score, m.team2Overs]].map(([n, sc, ov], i) => (
        <div key={i} className="flex items-center gap-2.5 py-1">
          <Crest name={n} size="w-7 h-7" textSize="text-[9px]" />
          <span className="flex-1 min-w-0 truncate font-semibold text-[#eef2ff]">{n}</span>
          {showScore && (
            <span className="font-['Barlow_Condensed'] text-xl font-bold text-[#f2c14e] whitespace-nowrap">{sc ?? '-'}
              {ov !== undefined && ov !== null && ov !== '' && <small className="ml-1 text-xs font-medium text-[#93a0bd]">({ov})</small>}
            </span>
          )}
        </div>
      ))}
      {!showScore && <p className="text-xs text-[#93a0bd] mt-1.5">{fmtDate(m.date)}</p>}
      {m.result && <p className="text-xs font-semibold text-[#f2c14e] mt-1.5 truncate">{m.result}</p>}
    </Link>
  );
};

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [sel, setSel] = useState('');
  const [points, setPoints] = useState({ tables: [] });
  const [auction, setAuction] = useState(null);
  const [tab, setTab] = useState('');
  const stream = useStream();

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
  const upcoming = all.filter((m) => m.status === 'Upcoming').sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const recent = [...done].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const next = live[0] || upcoming[0];
  const cur = auction && auction.current && auction.current.index >= 0 ? auction.players[auction.current.index] : null;

  const side = live.length ? live : upcoming.length ? upcoming : recent;
  const sideTitle = live.length ? 'Live scores' : upcoming.length ? 'Next matches' : 'Latest results';

  const tabs = [['live', 'Live now', live], ['upcoming', 'Upcoming', upcoming], ['results', 'Results', recent]];
  const active = tab || (live.length ? 'live' : upcoming.length ? 'upcoming' : 'results');
  const shown = (tabs.find((t) => t[0] === active) || tabs[0])[2].slice(0, 8);

  const stats = [
    ['Tournaments', tournaments.length, '/sports/cricket/tournament', 'trophy', GOLD],
    ['Matches', all.length, '/sports/cricket/tournament', 'calendar', CYAN],
    ['Live now', live.length, '/sports/cricket/live', 'live', LIVE],
    ['Played', done.length, '/sports/cricket/tournament', 'check', VIOLET]
  ];

  return (
    <div>
      <style>{CSS}</style>
      <h1 className="sr-only">ARS X LIVE: cricket live scores, tournaments and player auction</h1>

      {/* ============ 1. VIDEO STAGE ============ */}
      <div className="relative border-b border-white/10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(242,193,78,0.10),transparent_70%),radial-gradient(40%_80%_at_85%_10%,rgba(61,214,208,0.08),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8 pb-8 sm:pb-12 grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="hm-rise min-w-0"><StreamStage stream={stream} next={next} /></div>

          {/* Match center: beside the video on desktop, a swipe row under it on phones */}
          <aside className="hm-rise hm-d1 relative min-w-0 lg:min-h-[20rem]" aria-label={sideTitle}>
            <div className={`${glass} rounded-3xl p-3.5 sm:p-5 flex flex-col lg:absolute lg:inset-0`}>
              <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-1.5 h-6 rounded-full" style={{ background: live.length ? LIVE : CYAN, boxShadow: `0 0 14px ${live.length ? LIVE : CYAN}` }} />
                  <h2 className="font-['Barlow_Condensed'] text-2xl font-bold text-[#eef2ff] truncate">{sideTitle}</h2>
                </div>
                <Link to="/sports/cricket/tournament" className={`text-sm font-semibold text-[#f2c14e] hover:underline shrink-0 ${focusRing}`}>All</Link>
              </div>
              {side.length > 0 ? (
                <div className="hm-scroll flex gap-3 overflow-x-auto snap-x pb-2 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 lg:flex-1 lg:min-h-0">
                  {side.slice(0, 8).map((m) => <MiniMatch key={m._id} m={m} />)}
                </div>
              ) : <Empty>Fixtures will appear here once the schedule is published.</Empty>}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-14">
        {/* ============ 2. QUICK NUMBERS ============ */}
        <div className="hm-rise hm-d2 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          {stats.map(([label, value, to, icon, accent]) => (
            <Link key={label} to={to} style={{ '--accent': accent }}
              className={`group ${glass} rounded-2xl p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 hover:-translate-y-0.5 hover:border-[var(--accent)] transition ${focusRing}`}>
              <span className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl grid place-items-center shrink-0"
                style={{ color: accent, background: tint(16), border: `1px solid ${tint(40)}`, boxShadow: `0 0 26px -6px ${accent}` }}><Icon name={icon} /></span>
              <span className="min-w-0">
                <b className="block font-['Barlow_Condensed'] text-3xl sm:text-5xl leading-none text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(100deg, ${accent}, #eef2ff)` }}>{value}</b>
                <span className="block text-xs sm:text-base text-[#93a0bd] mt-1 truncate">{label}</span>
              </span>
            </Link>
          ))}
        </div>

        {/* ============ 3. MATCHES + SIDEBAR ============ */}
        <div className="mt-6 sm:mt-8 grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
          <section className="hm-rise hm-d3 min-w-0" aria-label="Matches">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-7 rounded-full" style={{ background: GOLD, boxShadow: `0 0 14px ${GOLD}` }} />
                <h2 className="font-['Barlow_Condensed'] text-3xl sm:text-4xl font-bold text-[#eef2ff]">Matches</h2>
              </div>
              <div className="flex gap-2 overflow-x-auto hm-scroll" role="tablist" aria-label="Match list">
                {tabs.map(([k, label, list]) => (
                  <button key={k} type="button" role="tab" aria-selected={active === k} onClick={() => setTab(k)}
                    className={`shrink-0 h-10 px-4 rounded-full text-sm font-bold inline-flex items-center gap-2 transition ${focusRing} ${active === k
                      ? 'bg-[linear-gradient(100deg,#f2c14e,#3dd6d0)] text-[#0a0e1c] shadow-[0_10px_30px_-10px_rgba(242,193,78,0.8)]'
                      : 'bg-white/10 text-[#93a0bd] hover:text-white border border-white/10'}`}>
                    {label}<small className={`px-1.5 rounded-md text-xs ${active === k ? 'bg-black/15' : 'bg-white/10 text-[#3dd6d0]'}`}>{list.length}</small>
                  </button>
                ))}
              </div>
            </div>
            {shown.length > 0
              ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{shown.map((m) => <MatchCard key={m._id} m={m} />)}</div>
              : <Empty>{active === 'live' ? 'No live match right now.' : active === 'upcoming' ? 'Nothing scheduled.' : 'No results yet.'}</Empty>}
          </section>

          <div className="hm-rise hm-d4 flex flex-col gap-6 sm:gap-8 min-w-0">
            {/* ---- auction ---- */}
            <Panel accent={GOLD} title="Player auction" to="/auction" action="Open">
              {!auction ? <Empty>No auction created yet.</Empty> : (
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-[#eef2ff]">{auction.name}</h3>
                    {auction.status && <Pill color={statusTone(auction.status)} className="capitalize">{auction.status}</Pill>}
                  </div>
                  {cur ? (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-4">
                      <Avatar src={cur.image} name={cur.name} size="w-16 h-16" text="text-lg" />
                      <div className="min-w-0">
                        <p className="text-sm text-[#93a0bd]">On the block</p>
                        <p className="font-['Barlow_Condensed'] text-3xl font-bold leading-tight text-[#eef2ff] mt-1 break-words">{cur.name}</p>
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

            {/* ---- teams ---- */}
            <Panel accent={VIOLET} title="Teams" sub="Pick a tournament" to="/sports/cricket/teams" action="Team list">
              {tournaments.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {tournaments.map((t) => (
                    <Link key={t._id} to={`/sports/cricket/teams?id=${t._id}`} style={{ '--accent': VIOLET }}
                      className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:-translate-y-0.5 hover:border-[var(--accent)] transition ${focusRing}`}>
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
          </div>
        </div>

        {/* ============ 4. POINTS TABLE ============ */}
        <div className="mt-6 sm:mt-8">
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
        </div>
      </div>
    </div>
  );
}