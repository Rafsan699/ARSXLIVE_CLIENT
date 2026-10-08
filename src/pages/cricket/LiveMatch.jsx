import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { LIVE, glass, focusRing, primaryBtn, Page, Panel, Empty } from '../../components/ui';

/* =====================================================================
 *  LiveMatch  (route: /sports/cricket/live)
 *  Finds the most recent running match and sends the viewer to the page
 *  of the tournament it belongs to:
 *     inter     -> /sports/cricket/inter-schedule?id=<tournamentId>&match=<matchId>
 *     central   -> /sports/cricket/central-schedule?id=...&match=...
 *     franchise -> /sports/cricket/franchise-schedule?id=...&match=...
 *  If the tournament type can't be detected, it opens the Live Match Center instead.
 * ===================================================================== */

// cTournament.category -> schedule page
const CATEGORY_TO_KIND = {
  inter_university: 'inter',
  central_tournament: 'central',
  franchise_tournament: 'franchise'
};

const detectKind = (t) => (t && CATEGORY_TO_KIND[t.category]) || null;

const buildPath = (data) => {
  const kind = detectKind(data.tournament);
  if (kind && data.tournamentId) {
    return `/sports/cricket/${kind}-schedule?id=${data.tournamentId}&match=${data.matchId}`;
  }
  return `/sports/cricket/match/${data.matchId}`; // type চেনা না গেলে Live Match Center
};

const LiveMatch = () => {
  const navigate = useNavigate();
  const [noLive, setNoLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const check = async () => {
      try {
        const res = await API.get('/api/cricket/live-score/latest-live');
        if (cancelled) return;
        if (res.data && res.data.found) {
          navigate(buildPath(res.data), { replace: true });
          return;
        }
        setNoLive(true);
      } catch (err) {
        console.error('Could not check live match:', err);
        if (!cancelled) setNoLive(true);
      }
      // কোনো ম্যাচ চলছে না: ১০ সেকেন্ড পর পর আবার দেখা, শুরু হলেই নিজে চলে যাবে
      if (!cancelled) timer = setTimeout(check, 10000);
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  if (!noLive) {
    return (
      <Page>
        <div className={`${glass} rounded-2xl p-10 text-center text-lg text-[#eef2ff]`}>
          <span className="inline-flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f2c14e] animate-pulse" />Finding live match...
          </span>
        </div>
      </Page>
    );
  }

  return (
    <Page className="max-w-3xl">
      <Panel accent={LIVE} title="Live matches" sub="This page opens the match automatically as soon as one starts">
        <Empty>
          <p className="text-lg">No match is live right now.</p>
          <button type="button" onClick={() => navigate('/sports/cricket/tournament')}
            className={`mt-5 px-6 py-3 rounded-xl ${primaryBtn} ${focusRing}`}>
            View tournaments
          </button>
        </Empty>
      </Panel>
    </Page>
  );
};

export default LiveMatch;