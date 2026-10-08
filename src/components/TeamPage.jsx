import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTeams } from './TeamsContext';
import PlayerProfile, { statHighlights } from './PlayerProfile';
import {
  GOLD, CYAN, SOFT, glass, focusRing, Page, BackLink, Pill, Panel, Empty, Crest, Avatar, getSelectedTournament
} from './ui';

/* /sports/cricket/team/:teamName  -> player list + performance profile */
export default function TeamPage() {
  const { teamName } = useParams();
  const [sp] = useSearchParams();
  const tid = sp.get('id') || getSelectedTournament();
  const { byName, loading, refresh } = useTeams();
  const [openId, setOpenId] = useState(null);
  const close = useCallback(() => setOpenId(null), []);

  // fresh stats while the page is open
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
  }, [refresh]);

  const team = byName[String(teamName).trim()];
  const players = (team && team.players) || [];
  const openPlayer = players.find((p) => p._id === openId);
  const backTo = tid ? `/sports/cricket/teams?id=${tid}` : '/sports/cricket/teams';

  if (loading && !team) return <Page><Empty>Loading...</Empty></Page>;

  return (
    <Page>
      <BackLink to={backTo}>Teams</BackLink>

      <div style={{ '--accent': CYAN }}
        className={`${glass} rounded-3xl p-5 sm:p-8 mt-4 mb-6 sm:mb-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8),0_0_80px_-30px_rgba(61,214,208,0.35)]`}>
        <div className="flex items-center gap-4 sm:gap-6">
          <Crest name={teamName} size="w-20 h-20 sm:w-28 sm:h-28" textSize="text-xl sm:text-3xl" />
          <div className="min-w-0">
            <h1 className="font-['Barlow_Condensed'] text-4xl sm:text-6xl font-bold leading-tight text-[#eef2ff] break-words">{teamName}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Pill color={SOFT}>{players.length} {players.length === 1 ? 'player' : 'players'}</Pill>
            </div>
          </div>
        </div>
      </div>

      <Panel accent={GOLD} title="Players" sub="Tap a player to open the full performance profile">
        {players.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => {
              const hi = statHighlights(p.stats);
              const info = [p.id && `ID ${p.id}`, p.dept || p.department, p.batch && `Batch ${p.batch}`].filter(Boolean).join(' · ');
              return (
                <button key={p._id} type="button" onClick={() => setOpenId(p._id)}
                  className={`text-left min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 hover:-translate-y-0.5 hover:border-[#f2c14e]/40 transition ${focusRing}`}>
                  <div className="flex items-center gap-3">
                    <Avatar src={p.image} name={p.name} size="w-14 h-14 sm:w-16 sm:h-16" text="text-base" />
                    <div className="min-w-0">
                      <b className="block text-[#eef2ff] leading-tight break-words">{p.name}</b>
                      {info && <span className="block text-xs sm:text-sm text-[#93a0bd] truncate">{info}</span>}
                    </div>
                  </div>
                  {hi.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {hi.map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
                          <div className="font-['Barlow_Condensed'] text-xl font-bold leading-none text-[#eef2ff]">{value}</div>
                          <div className="text-[11px] text-[#93a0bd] mt-1 truncate">{label}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[#93a0bd]">No performance data yet.</p>}
                  <span className="text-sm font-semibold text-[#f2c14e]">Open performance profile</span>
                </button>
              );
            })}
          </div>
        ) : <Empty>No players added to this team yet.</Empty>}
      </Panel>

      {openPlayer && <PlayerProfile player={openPlayer} onClose={close} />}
    </Page>
  );
}