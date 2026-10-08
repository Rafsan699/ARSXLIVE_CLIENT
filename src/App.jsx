import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import { TeamsProvider } from './components/TeamsContext';
import { GOLD, VIOLET } from './components/ui';
import Home from './pages/cricket/Home';
import Auction from './pages/cricket/Auction';
import TournamentList from './pages/cricket/TournamentList';
import SchedulePage from './pages/cricket/SchedulePage';
import MatchCenter from './pages/cricket/MatchCenter';
import LiveMatch from './pages/cricket/LiveMatch';
import TeamList from './components/TeamList';
import TeamPage from './components/TeamPage';

export default function App() {
  useEffect(() => { document.title = 'ARS X LIVE'; }, []);

  return (
    /* "dark" class keeps any dark: styles inside child components switched on */
    <TeamsProvider>
    <div className="dark relative isolate bg-[#060912] text-[#eef2ff] min-h-screen overflow-x-hidden flex flex-col" style={{ '--accent': GOLD }}>
      {/* ---------- Ambient background (orbs + grid) ---------- */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        <span className="absolute rounded-full w-[560px] h-[560px] -top-44 -left-36 opacity-[0.18]" style={{ background: `radial-gradient(closest-side, ${GOLD} 35%, transparent 100%)` }} />
        <span className="absolute rounded-full w-[520px] h-[520px] top-[35%] -right-44 opacity-[0.22]" style={{ background: 'radial-gradient(closest-side, #3348ff 35%, transparent 100%)' }} />
        <span className="absolute rounded-full w-[480px] h-[480px] -bottom-44 left-[20%] opacity-[0.16]" style={{ background: `radial-gradient(closest-side, ${VIOLET} 35%, transparent 100%)` }} />
        <span className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 20%, #000, transparent 72%)',
          maskImage: 'radial-gradient(ellipse at 50% 20%, #000, transparent 72%)'
        }} />
      </div>

      <Header />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auction" element={<Auction />} />
          <Route path="/sports/cricket/tournament" element={<TournamentList />} />
          <Route path="/sports/cricket/live" element={<LiveMatch />} />
          <Route path="/sports/cricket/teams" element={<TeamList />} />
          <Route path="/sports/cricket/team/:teamName" element={<TeamPage />} />
          <Route path="/sports/cricket/match/:matchId" element={<MatchCenter />} />
          <Route path="/sports/cricket/:kind" element={<SchedulePage />} />
        </Routes>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-[#93a0bd]">
        © {new Date().getFullYear()} ARS X LIVE
      </footer>
    </div>
    </TeamsProvider>
  );
}