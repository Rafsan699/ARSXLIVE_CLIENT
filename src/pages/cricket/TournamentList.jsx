import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { VIOLET, focusRing, Icon, Pill, Panel, Empty, Page, statusTone } from '../../components/ui';

const KIND = { inter_university: 'inter', central_tournament: 'central', franchise_tournament: 'franchise' };

export default function TournamentList() {
  const [list, setList] = useState([]);
  useEffect(() => { API.get('/api/cricket/tournaments').then((r) => setList(r.data)).catch(console.error); }, []);

  return (
    <Page>
      <Panel accent={VIOLET} title="Cricket tournaments" sub="Browse every competition" to="/sports/cricket/live" action="Live match">
        {list.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => (
              <Link key={t._id} to={`/sports/cricket/${KIND[t.category] || 'inter'}-schedule?id=${t._id}`}
                style={{ '--accent': VIOLET }}
                className={`group rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_26px_60px_-22px_var(--accent)] transition ${focusRing}`}>
                {t.banner
                  ? <img src={t.banner} alt="" className="h-32 sm:h-40 w-full object-cover" />
                  : <div className="h-32 sm:h-40 bg-[radial-gradient(circle_at_30%_20%,rgba(167,139,250,0.45),#0a1024_75%)] grid place-items-center text-[#a78bfa]"><Icon name="trophy" className="w-12 h-12" /></div>}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <b className="text-[#eef2ff] leading-snug">{t.tournamentName}</b>
                    <Pill color={statusTone(t.status)} className="capitalize shrink-0">{t.status}</Pill>
                  </div>
                  {t.category && <p className="text-sm text-[#93a0bd] mt-2 capitalize">{String(t.category).replace(/_/g, ' ')}</p>}
                  <p className="text-sm text-[#93a0bd]">{t.teamsCount} teams · {t.oversPerMatch} overs</p>
                </div>
              </Link>
            ))}
          </div>
        ) : <Empty>No tournaments yet.</Empty>}
      </Panel>
    </Page>
  );
}