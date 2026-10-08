import React from 'react';
import { Link } from 'react-router-dom';
import { Crest, Avatar, Pill, focusRing, SOFT } from './ui';
import { useTeams } from './TeamsContext';

/* team tile: logo, name, a few player photos, player count */
export default function TeamCard({ name, to, group, compact = false }) {
  const { byName } = useTeams();
  const players = byName[String(name).trim()]?.players || [];
  return (
    <Link to={to}
      className={`min-w-0 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center text-center gap-3 hover:-translate-y-1 hover:border-[var(--accent)] transition ${compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5'} ${focusRing}`}>
      <Crest name={name} size={compact ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-16 h-16 sm:w-20 sm:h-20'} />
      <span className="font-semibold leading-tight line-clamp-2 break-words w-full text-[#eef2ff]">{name}</span>
      {group && <Pill color={SOFT}>{group}</Pill>}
      <div className="flex items-center justify-center -space-x-2 min-h-[1.75rem]">
        {players.slice(0, 4).map((p) => (
          <Avatar key={p._id} src={p.image} name={p.name} size="w-7 h-7" text="text-[9px]" ring="ring-2 ring-[#060912]" />
        ))}
        {players.length > 4 && (
          <span className="w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold bg-white/10 text-[#eef2ff] ring-2 ring-[#060912]">+{players.length - 4}</span>
        )}
      </div>
      <span className="text-xs text-[#93a0bd]">{players.length} {players.length === 1 ? 'player' : 'players'}</span>
    </Link>
  );
}