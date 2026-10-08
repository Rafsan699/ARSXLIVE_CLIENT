import React, { useEffect, useRef } from 'react';
import { Avatar, Crest, Pill, Empty, Icon, SOFT, GOLD, glass, focusRing } from './ui';

/* ---------- performance data helpers (works with flat or grouped stats) ---------- */
const pretty = (k) => String(k).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
const isVal = (v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '');
const fmtVal = (v) => (typeof v === 'number' && !Number.isInteger(v) ? Number(v.toFixed(2)) : v);

// stats written by playerStatsSync (flat object) -> grouped, nicely labelled sections
const SCHEMA = [
  { title: 'Overview', keys: [['matches', 'Matches']] },
  { title: 'Batting', keys: [['innings', 'Innings'], ['runs', 'Runs'], ['highestScore', 'Highest score'], ['average', 'Average'], ['strikeRate', 'Strike rate'], ['ballsFaced', 'Balls faced'], ['fours', 'Fours'], ['sixes', 'Sixes'], ['timesOut', 'Dismissals']] },
  { title: 'Bowling', keys: [['oversBowled', 'Overs'], ['wickets', 'Wickets'], ['runsConceded', 'Runs conceded'], ['economy', 'Economy'], ['maidens', 'Maidens']] }
];
const HIDDEN = ['ballsBowled']; // shown as Overs instead

export const statSections = (stats) => {
  const st = stats || {};
  const nums = Object.values(st).flatMap((v) => (typeof v === 'number' ? [v] : v && typeof v === 'object' ? Object.values(v).filter((x) => typeof x === 'number') : []));
  if (!nums.some((n) => n > 0)) return []; // nothing recorded yet

  const used = new Set(HIDDEN);
  const sections = [];
  SCHEMA.forEach(({ title, keys }) => {
    const items = keys.filter(([k]) => isVal(st[k])).map(([k, label]) => { used.add(k); return [label, fmtVal(st[k])]; });
    if (items.length) sections.push({ title, items });
  });

  // anything the server adds later still shows up
  const other = [];
  Object.entries(st).forEach(([k, v]) => {
    if (used.has(k)) return;
    if (isVal(v)) other.push([pretty(k), fmtVal(v)]);
    else if (v && typeof v === 'object' && !Array.isArray(v)) {
      const items = Object.entries(v).filter(([, x]) => isVal(x)).map(([a, x]) => [pretty(a), fmtVal(x)]);
      if (items.length) sections.push({ title: pretty(k), items });
    }
  });
  if (other.length) sections.push({ title: 'More', items: other });
  return sections;
};

// up to 3 quick numbers for the player list
export const statHighlights = (stats) => {
  const all = statSections(stats).flatMap((s) => s.items);
  const picked = ['Matches', 'Runs', 'Wickets'].map((l) => all.find(([x]) => x === l)).filter(Boolean);
  return (picked.length ? picked : all).slice(0, 3);
};

/* ---------- profile popup ---------- */
export default function PlayerProfile({ player, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (closeRef.current) closeRef.current.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const sections = statSections(player.stats);
  const dept = player.dept || player.department;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label={`${player.name} profile`} onClick={(e) => e.stopPropagation()}
        style={{ '--accent': GOLD }}
        className={`${glass} bg-[#0a0e1c] relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]`}>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close profile"
          className={`absolute top-3 right-3 w-10 h-10 grid place-items-center rounded-xl border border-white/15 bg-white/5 text-[#eef2ff] hover:bg-white/10 transition-colors ${focusRing}`}>
          <Icon name="close" className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 sm:gap-6 pr-10">
          <Avatar src={player.image} name={player.name} size="w-24 h-24 sm:w-32 sm:h-32" text="text-3xl" ring="ring-2 ring-[#f2c14e]/60" />
          <div className="min-w-0">
            <h2 className="font-['Barlow_Condensed'] text-3xl sm:text-5xl font-bold leading-tight text-[#eef2ff] break-words">{player.name}</h2>
            {player.team && (
              <p className="mt-1 flex items-center gap-2 text-[#93a0bd]">
                <Crest name={player.team} size="w-6 h-6" textSize="text-[8px]" />{player.team}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {player.id && <Pill color={SOFT}>ID {player.id}</Pill>}
              {dept && <Pill color={SOFT}>{dept}</Pill>}
              {player.batch && <Pill color={SOFT}>Batch {player.batch}</Pill>}
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 flex flex-col gap-6">
          {sections.length === 0 && <Empty>No performance data yet. It appears here after the player's first match.</Empty>}
          {sections.map((sec) => (
            <section key={sec.title}>
              <h3 className="font-['Barlow_Condensed'] text-xl sm:text-2xl font-bold text-[#eef2ff] mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-[#f2c14e]" />{sec.title}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sec.items.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center">
                    <div className="font-['Barlow_Condensed'] text-3xl font-bold leading-none text-[#eef2ff]">{value}</div>
                    <div className="text-xs text-[#93a0bd] mt-1.5">{label}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}