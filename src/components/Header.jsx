import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icon, focusRing, getSelectedTournament } from './ui';

/* Logo: put your picture next to this file as  src/components/logoo.jpg
   (the path is already set below, nothing else to change). */
import logo from './logoo.jpg';

const desktopLink = ({ isActive }) =>
  `px-3 lg:px-4 py-2 rounded-full text-sm font-semibold transition-colors ${focusRing} ${
    isActive
      ? 'bg-[#f2c14e] text-[#0a0e1c] shadow-[0_10px_30px_-10px_#f2c14e]'
      : 'text-[#93a0bd] hover:text-[#eef2ff] hover:bg-white/10'}`;

const mobileLink = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold border transition-colors ${focusRing} ${
    isActive
      ? 'bg-[#f2c14e]/10 text-[#f2c14e] border-[#f2c14e]/35'
      : 'text-[#eef2ff] border-transparent hover:bg-white/10'}`;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [tid, setTid] = useState(getSelectedTournament); // tournament the visitor picked last
  const { pathname } = useLocation();

  // close the phone menu after navigating or pressing Esc
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // keep the Teams link in step with the selected tournament
  useEffect(() => {
    const sync = () => setTid(getSelectedTournament());
    window.addEventListener('ars-tournament', sync);
    return () => window.removeEventListener('ars-tournament', sync);
  }, []);

  /* Teams: no tournament picked yet -> the page asks the visitor to pick one first */
  const NAV = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/sports/cricket/tournament', label: 'Tournaments', icon: 'trophy' },
    { to: tid ? `/sports/cricket/teams?id=${tid}` : '/sports/cricket/teams', label: 'Teams', icon: 'teams', also: '/sports/cricket/team' },
    { to: '/sports/cricket/live', label: 'Live', icon: 'live' },
    { to: '/auction', label: 'Auction', icon: 'tag' }
  ];
  const on = (n, s) => s.isActive || (n.also ? pathname.startsWith(n.also) : false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060912]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* logo + title */}
        <Link to="/" className={`flex items-center gap-3 min-w-0 rounded-lg ${focusRing}`}>
          <img src={logo} alt="ARS X LIVE logo" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover bg-white ring-1 ring-white/10 shrink-0" />
          <span className="font-['Barlow_Condensed'] text-2xl sm:text-3xl font-bold leading-none whitespace-nowrap text-transparent bg-clip-text bg-[linear-gradient(100deg,#fff_15%,#f2c14e_55%,#3dd6d0)]">
            ARS X LIVE
          </span>
        </Link>

        {/* desktop menu */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.label} to={n.to} end={n.end} className={(s) => desktopLink({ isActive: on(n, s) })}>{n.label}</NavLink>
          ))}
        </nav>

        {/* phone: three-line button */}
        <button type="button" onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav"
          className={`md:hidden w-11 h-11 grid place-items-center rounded-xl border border-white/15 bg-white/5 text-[#eef2ff] hover:bg-white/10 transition-colors ${focusRing}`}>
          <Icon name={open ? 'close' : 'menu'} className="w-6 h-6" />
        </button>
      </div>

      {/* phone: all menu items live inside the three-line button */}
      {open && (
        <div id="mobile-nav" className="md:hidden absolute inset-x-0 top-full border-b border-white/10 bg-[#060912]/95 backdrop-blur-md shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1.5" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.label} to={n.to} end={n.end} className={(s) => mobileLink({ isActive: on(n, s) })}>
                <Icon name={n.icon} className="w-5 h-5" />{n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}