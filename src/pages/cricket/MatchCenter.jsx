import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import API, { BASE_URL } from '../../services/api';
import MatchHistoryView from './MatchHistoryView';
import { CYAN, glass, Page, BackLink, Empty, StatusPill, Crest } from '../../components/ui';

export default function MatchCenter() {
  const { matchId } = useParams();
  const [live, setLive] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    const loadHistory = () => API.get(`/api/cricket/live-score/${matchId}/history`).then((r) => setHistory(r.data)).catch(() => {});
    API.get(`/api/cricket/live-score/${matchId}`).then((r) => setLive(r.data)).catch(() => {});
    loadHistory();
    const socket = io(BASE_URL);
    socket.emit('joinMatch', matchId);
    socket.on('liveScoreUpdated', (d) => { setLive(d); loadHistory(); });
    return () => { socket.emit('leaveMatch', matchId); socket.disconnect(); };
  }, [matchId]);

  const h = history && (history.matchHistory || history);
  const log = (h && h.ballLog) || [];
  const meta = (h && h.meta) || {};

  return (
    <Page>
      <BackLink to="/sports/cricket/tournament">Tournaments</BackLink>

      <div className="my-4 sm:my-6">
        {!live ? <Empty>No live data for this match yet.</Empty> : (
          <div style={{ '--accent': CYAN }}
            className={`${glass} rounded-3xl p-5 sm:p-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8),0_0_80px_-30px_rgba(61,214,208,0.35)]`}>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={live.matchStatus} />
              {live.innings && <span className="text-sm text-[#93a0bd]">{live.innings}</span>}
            </div>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-3 font-['Barlow_Condensed'] text-2xl sm:text-3xl font-bold text-[#eef2ff]">
                <Crest name={live.battingTeam} size="w-10 h-10 sm:w-12 sm:h-12" />{live.battingTeam}
              </span>
              <b className="font-['Barlow_Condensed'] text-6xl sm:text-8xl font-bold leading-none text-transparent bg-clip-text bg-[linear-gradient(100deg,#f2c14e,#3dd6d0)]">
                {live.runs}/{live.wickets}
              </b>
              <span className="font-['Barlow_Condensed'] text-xl sm:text-2xl text-[#93a0bd]">({live.overs})</span>
            </div>
            {live.target > 0 && <p className="mt-3 text-[#93a0bd]">Target <b className="text-[#f2c14e]">{live.target}</b></p>}
            {live.result && <p className="mt-3 text-xl sm:text-2xl font-semibold text-[#f2c14e]">{live.result}</p>}
          </div>
        )}
      </div>

      <MatchHistoryView log={log} meta={meta} team1={meta.team1 || ''} team2={meta.team2 || ''}
        matchId={matchId} live={live} loading={!history} />
    </Page>
  );
}