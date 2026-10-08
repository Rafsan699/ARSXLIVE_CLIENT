import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import API, { BASE_URL } from '../../services/api';

/* Cricket auction - live viewer page.
   Same look as the football auction page (dark stage, glowing live card, animated bid, player cards),
   fed by socket.io: the admin presses a button -> server emits 'auctionUpdated' -> this page changes at once.
   Self-contained: all styles are in the CSS string below, no Tailwind needed.
   Palette: bg #060912 · ink #eef2ff · soft #93a0bd · gold #f2c14e · cyan #3dd6d0 · violet #a78bfa · live #ff4d6d */

const PAGE = 12;
const FILTERS = [['all', 'All'], ['available', 'Available'], ['sold', 'Sold'], ['unsold', 'Unsold']];
const money = (n) => (typeof n === 'number' ? n.toLocaleString() : n ?? '-');
const initials = (n = '') => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const sub = (p) => [p.dept, p.batch && `Batch ${p.batch}`].filter(Boolean).join(', ');

const CSS = `
.ca{--bg:#060912;--ink:#eef2ff;--soft:#93a0bd;--gold:#f2c14e;--cyan:#3dd6d0;--violet:#a78bfa;--live:#ff4d6d;--line:rgba(255,255,255,.1);position:relative;isolation:isolate;min-height:100vh;overflow-x:hidden;background:var(--bg);color:var(--ink);box-sizing:border-box}
.ca *,.ca *::before,.ca *::after{box-sizing:border-box}
.ca h1,.ca h2,.ca h3,.ca p{margin:0}
.ca-disp{font-family:'Barlow Condensed',sans-serif}
.ca-amb{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
.ca-orb{position:absolute;border-radius:50%}
.ca-grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:48px 48px;-webkit-mask-image:radial-gradient(ellipse at 50% 20%,#000,transparent 72%);mask-image:radial-gradient(ellipse at 50% 20%,#000,transparent 72%)}
.ca-wrap{max-width:1152px;margin:0 auto;padding:0 16px}
.ca-hero{position:relative;overflow:hidden;border-bottom:1px solid var(--line)}
.ca-hero svg{position:absolute;inset:0;width:100%;height:100%;opacity:.07;color:#fff}
.ca-hero .ca-wrap{position:relative;padding-top:44px;padding-bottom:100px}
.ca-title{font-size:clamp(44px,8vw,72px);line-height:1;font-weight:700;color:transparent;-webkit-background-clip:text;background-clip:text;background-image:linear-gradient(100deg,#fff 15%,#f2c14e 42%,#3dd6d0 62%,#fff 88%)}
.ca-lead{margin-top:12px;color:var(--soft);font-size:17px;max-width:560px}
.ca-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:16px;font-size:12px;font-weight:700}
.ca-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.1);color:var(--ink)}
.ca-pill.g{background:rgba(242,193,78,.16);color:var(--gold)}
.ca-dot{width:8px;height:8px;border-radius:50%;background:#3ddc84}
.ca-dot.off{background:#ff9f43}
.ca-glass{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.02));border:1px solid var(--line)}
/* stage */
.ca-stagewrap{position:relative;z-index:10;margin-top:-64px}
.ca-ring{position:relative;border-radius:24px;padding:2px;overflow:hidden;box-shadow:0 30px 80px -30px rgba(242,193,78,.45),0 0 80px -30px rgba(61,214,208,.35)}
.ca-ring>i{position:absolute;inset:-60%}
.ca-stage{position:relative;border-radius:22px;background:linear-gradient(135deg,#0d1428,#0a1024 55%,#060912);overflow:hidden}
.ca-blob{position:absolute;border-radius:50%;filter:blur(64px);pointer-events:none}
.ca-pitch{position:absolute;inset:0;width:100%;height:100%;opacity:.07;color:#fff}
.ca-body{position:relative;padding:28px;display:grid;gap:28px;align-items:center}
@media(min-width:768px){.ca-body{grid-template-columns:auto minmax(0,1fr);gap:40px}}
.ca-pic{position:relative;margin:0 auto}
.ca-pic .ring{position:absolute;inset:0;border-radius:16px;border:2px solid rgba(242,193,78,.6)}
.ca-pic .frame{position:relative;padding:4px;border-radius:16px;background:linear-gradient(135deg,#f2c14e,#3dd6d0);box-shadow:0 0 50px rgba(242,193,78,.4)}
.ca-av{display:grid;place-items:center;font-family:'Barlow Condensed',sans-serif;font-weight:700;color:#0a0e1c;background:linear-gradient(135deg,#f2c14e,#3dd6d0);object-fit:cover}
.ca-pic .ca-av{width:168px;height:168px;border-radius:12px;font-size:60px}
@media(min-width:640px){.ca-pic .ca-av{width:208px;height:208px}}
.ca-info{min-width:0;text-align:center}
@media(min-width:768px){.ca-info{text-align:left}}
.ca-live{display:inline-flex;align-items:center;gap:8px;background:var(--live);color:#fff;font-size:12px;font-weight:700;padding:6px 12px 6px 10px;border-radius:999px;box-shadow:0 0 22px -4px var(--live)}
.ca-live i{width:8px;height:8px;border-radius:50%;background:#fff}
.ca-pname{margin-top:12px;font-size:clamp(44px,7vw,64px);line-height:1;font-weight:700;overflow-wrap:anywhere}
.ca-chips{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;font-size:12px;font-weight:700}
@media(min-width:768px){.ca-chips{justify-content:flex-start}}
.ca-chips span{padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.1)}
.ca-bidrow{margin-top:20px;display:flex;flex-direction:column;align-items:center;gap:16px}
@media(min-width:640px){.ca-bidrow{flex-direction:row;align-items:flex-end;gap:32px}}
@media(min-width:640px) and (max-width:767px){.ca-bidrow{justify-content:center}}
.ca-soft{font-size:14px;color:var(--soft)}
.ca-bid{font-size:clamp(68px,12vw,96px);line-height:1;font-weight:700;color:var(--gold);text-shadow:0 0 28px rgba(242,193,78,.7),0 0 64px rgba(242,193,78,.4)}
.ca-raised{margin-top:4px;font-size:14px;font-weight:700;color:var(--cyan)}
.ca-bidder{min-width:0;max-width:100%;border-radius:16px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);padding:12px 20px;backdrop-filter:blur(8px)}
.ca-bidder p:first-child{font-size:12px;color:var(--soft)}
.ca-bidder .n{font-size:clamp(24px,4vw,32px);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ca-ticker{margin-top:16px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;font-size:12px;color:var(--soft)}
@media(min-width:768px){.ca-ticker{justify-content:flex-start}}
.ca-ticker span{padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.07)}
.ca-ticker span:first-child{background:rgba(242,193,78,.16);color:var(--gold);font-weight:700}
.ca-idle{position:relative;padding:56px 24px;text-align:center}
.ca-idle .o{position:relative;width:80px;height:80px;margin:0 auto 20px;display:grid;place-items:center;font-size:32px}
.ca-idle .o i{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(242,193,78,.6)}
.ca-idle .o i+i{border-color:rgba(61,220,132,.6)}
.ca-idle h2{font-size:clamp(30px,5vw,40px);font-weight:700}
.ca-idle p{color:var(--soft);margin-top:4px;max-width:440px;margin-inline:auto}
/* sold / unsold moment */
.ca-flash{position:absolute;inset:0;z-index:5;display:grid;place-items:center;text-align:center;padding:20px;background:radial-gradient(circle at 50% 40%,rgba(10,14,28,.78),rgba(6,9,18,.94));backdrop-filter:blur(3px)}
.ca-flash h2{font-size:clamp(64px,14vw,120px);line-height:.9;font-weight:700;letter-spacing:.02em;color:var(--gold);text-shadow:0 0 40px rgba(242,193,78,.8)}
.ca-flash.un h2{color:#cbd5e1;text-shadow:none}
.ca-flash .who{margin-top:10px;font-size:clamp(26px,5vw,38px);font-weight:700}
.ca-flash .to{margin-top:6px;font-size:18px;color:var(--soft)}
.ca-flash .to b{color:var(--cyan)}
.ca-flash .pr{margin-top:6px;font-size:clamp(34px,6vw,48px);font-weight:700;color:var(--gold)}
.ca-conf{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.ca-conf i{position:absolute;top:-16px;width:8px;height:14px;border-radius:2px;opacity:0}
/* teams */
.ca-sec{margin-top:36px}
.ca-sech{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:14px}
.ca-sech h2{font-size:30px;font-weight:700}
.ca-teams{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.ca-team{border-radius:16px;padding:16px;transition:border-color .3s,box-shadow .3s}
.ca-team.lead{border-color:rgba(242,193,78,.7);box-shadow:0 0 0 1px rgba(242,193,78,.4),0 18px 50px -22px rgba(242,193,78,.5)}
.ca-th{display:flex;align-items:center;gap:10px;min-width:0}
.ca-th .ca-av{width:38px;height:38px;border-radius:50%;font-size:14px;flex:none}
.ca-th b{font-size:22px;font-family:'Barlow Condensed',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ca-bar{height:6px;border-radius:99px;background:rgba(255,255,255,.1);margin:12px 0 8px;overflow:hidden}
.ca-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--cyan),var(--gold));transition:width .6s}
.ca-buys{margin-top:10px;display:grid;gap:3px;font-size:13px;max-height:132px;overflow:auto}
.ca-buys div{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.ca-buys span:last-child{color:var(--gold);font-weight:700}
/* filters + cards */
.ca-filters{margin-top:36px;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:14px}
@media(min-width:1024px){.ca-filters{flex-direction:row;align-items:center}}
.ca-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}
.ca-tab{flex:none;height:40px;padding:0 16px;display:inline-flex;align-items:center;gap:8px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.1);color:var(--soft);font:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s}
.ca-tab:hover{background:rgba(255,255,255,.16);color:var(--ink)}
.ca-tab small{font-size:12px;padding:0 6px;border-radius:6px;background:rgba(255,255,255,.1);color:var(--cyan)}
.ca-tab.on{background:var(--gold);border-color:var(--gold);color:#0a0e1c;box-shadow:0 10px 30px -8px var(--gold)}
.ca-tab.on small{background:rgba(0,0,0,.15);color:#0a0e1c}
.ca-search{position:relative;display:block;min-width:0}
@media(min-width:1024px){.ca-search{margin-left:auto;width:288px}}
.ca-search input{display:block;width:100%;height:44px;padding:0 12px 0 42px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:var(--ink);font:inherit;font-size:14px}
.ca-search input::placeholder{color:var(--soft)}
.ca-search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:var(--soft);pointer-events:none}
.ca-tab:focus-visible,.ca-search input:focus-visible,.ca-btn:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.ca-cards{display:grid;gap:20px;grid-template-columns:1fr}
@media(min-width:640px){.ca-cards{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1024px){.ca-cards{grid-template-columns:repeat(4,1fr)}}
.ca-card{min-width:0;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;transition:border-color .3s,box-shadow .3s,transform .3s}
.ca-card:hover{transform:translateY(-4px);border-color:rgba(61,214,208,.6);box-shadow:0 20px 50px -22px rgba(61,214,208,.45)}
.ca-card.sold{border-color:rgba(242,193,78,.4)}
.ca-card.sold:hover{border-color:rgba(242,193,78,.7);box-shadow:0 20px 50px -18px rgba(242,193,78,.5)}
.ca-ph{position:relative;height:176px;overflow:hidden;background:#0a1024}
.ca-ph .ca-av{width:100%;height:100%;font-size:48px;transition:transform .5s}
.ca-card:hover .ca-ph .ca-av{transform:scale(1.05)}
.ca-ph::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(6,9,18,.9),transparent 60%)}
.ca-ph h3{position:absolute;z-index:1;left:16px;right:16px;bottom:12px;font-family:'Barlow Condensed',sans-serif;font-size:24px;line-height:1.1;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ca-bdg{position:absolute;z-index:1;top:12px;right:12px;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px}
.ca-bdg.sold{background:var(--gold);color:#0a0e1c;box-shadow:0 0 18px rgba(242,193,78,.8)}
.ca-bdg.unsold{background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.15)}
.ca-cb{flex:1;padding:14px 16px;position:relative;overflow:hidden}
.ca-cb .s{font-size:12px;color:#a9b4cc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ca-cb .r{margin-top:6px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
.ca-cb .r b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ca-cb .num{font-family:'Barlow Condensed',sans-serif;font-size:30px;line-height:1;font-weight:700;color:var(--gold);flex:none}
.ca-cb .num.c{font-size:24px;color:var(--cyan)}
.ca-card.sold .ca-cb::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(242,193,78,.16) 50%,transparent 65%);transform:translateX(-130%);pointer-events:none}
.ca-empty{border-radius:16px;border:1px dashed rgba(255,255,255,.15);background:rgba(255,255,255,.05);padding:56px 24px;text-align:center}
.ca-empty b{display:block;font-size:18px}
.ca-empty p{color:var(--soft);margin-top:4px}
.ca-btn{margin-top:20px;height:46px;padding:0 24px;border-radius:12px;border:1px solid rgba(242,193,78,.4);background:rgba(242,193,78,.1);color:var(--gold);font:inherit;font-weight:700;cursor:pointer}
.ca-btn:hover{filter:brightness(1.25)}
.ca-sk{height:288px;border-radius:16px}
@media(prefers-reduced-motion:no-preference){
  .ca-ring>i{animation:ca-spin 7s linear infinite}
  .ca-pic{animation:ca-float 4s ease-in-out infinite}
  .ca-pic .ring,.ca-idle .o i{animation:ca-rng 2.6s ease-out infinite}
  .ca-idle .o i+i{animation-delay:1.3s}
  .ca-live{animation:ca-pulse 1.6s ease-out infinite}
  .ca-bid{animation:ca-pop .55s cubic-bezier(.2,1.4,.4,1)}
  .ca-bidder{animation:ca-fl 1.1s ease-out}
  .ca-blob.a{animation:ca-glow 3s ease-in-out infinite}
  .ca-flash .in{animation:ca-pop .6s cubic-bezier(.2,1.4,.4,1)}
  .ca-conf i{animation:ca-fall 2.6s ease-in forwards}
  .ca-card.sold .ca-cb::after{animation:ca-sheen 3.4s ease-in-out infinite}
  .ca-sk{animation:ca-pls 1.6s ease-in-out infinite}
}
@media(prefers-reduced-motion:reduce){.ca-flash .in{opacity:1}}
@keyframes ca-spin{to{transform:rotate(360deg)}}
@keyframes ca-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes ca-rng{0%{transform:scale(.5);opacity:.55}100%{transform:scale(1.7);opacity:0}}
@keyframes ca-pulse{0%{box-shadow:0 0 0 0 rgba(255,77,109,.6)}100%{box-shadow:0 0 0 12px rgba(255,77,109,0)}}
@keyframes ca-pop{0%{transform:scale(.82);opacity:.3}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes ca-fl{0%{background-color:rgba(242,193,78,.4)}100%{background-color:rgba(255,255,255,.06)}}
@keyframes ca-glow{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes ca-sheen{0%,55%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
@keyframes ca-fall{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(460px) rotate(540deg)}}
@keyframes ca-pls{0%,100%{opacity:1}50%{opacity:.5}}
`;

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
const Avatar = ({ p, className = '' }) => (p.image
  ? <img src={p.image} alt="" loading="lazy" className={`ca-av ${className}`} />
  : <div className={`ca-av ${className}`} aria-hidden="true">{initials(p.name)}</div>);

const COLORS = ['#f2c14e', '#3dd6d0', '#a78bfa', '#ff4d6d', '#ffffff'];
const Confetti = () => (
  <div className="ca-conf" aria-hidden="true">
    {Array.from({ length: 22 }, (_, i) => (
      <i key={i} style={{ left: `${(i * 37 + 8) % 100}%`, background: COLORS[i % COLORS.length], animationDelay: `${(i % 7) * 0.12}s`, animationDuration: `${2.2 + (i % 5) * 0.25}s` }} />
    ))}
  </div>
);

/* ---------- Live stage ---------- */
function LiveStage({ a, live, flash, online }) {
  const bidder = a.current.bidder;
  const raised = bidder && live ? a.current.bid - live.basePrice : 0;
  const recent = [...(a.current.bids || [])].slice(-4).reverse();
  const done = a.status === 'Completed';
  return (
    <section aria-label="Live bidding" className="ca-stagewrap">
      <div className="ca-ring">
        <i aria-hidden="true" style={{ background: live
          ? 'conic-gradient(from 0deg,#f2c14e,#3dd6d0,#060912 35%,#a78bfa 55%,#ff4d6d 75%,#f2c14e)'
          : 'conic-gradient(from 0deg,rgba(242,193,78,.35),#060912,rgba(61,214,208,.35))' }} />
        <div className="ca-stage">
          <span className="ca-blob a" aria-hidden="true" style={{ top: -96, left: '25%', width: 448, height: 448, background: 'rgba(242,193,78,.2)' }} />
          <span className="ca-blob" aria-hidden="true" style={{ bottom: -128, right: 0, width: 384, height: 384, background: 'rgba(61,214,208,.15)' }} />
          <svg className="ca-pitch" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 300" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="3"><rect x="20" y="20" width="760" height="260" rx="130" /><rect x="340" y="60" width="120" height="180" /><line x1="340" y1="90" x2="460" y2="90" /><line x1="340" y1="210" x2="460" y2="210" /></g>
          </svg>

          {live ? (
            <div className="ca-body" aria-live="polite">
              <div className="ca-pic">
                <span className="ring" aria-hidden="true" />
                <div className="frame"><Avatar p={live} /></div>
              </div>
              <div className="ca-info">
                <span className="ca-live"><i />Live bidding</span>
                <h2 className="ca-pname ca-disp">{live.name}</h2>
                <div className="ca-chips">
                  {live.dept && <span>{live.dept}</span>}
                  {live.batch && <span>Batch {live.batch}</span>}
                  <span>Base {money(live.basePrice)}</span>
                </div>
                <div className="ca-bidrow">
                  <div>
                    <p className="ca-soft">Current bid</p>
                    <p key={a.current.bid} className="ca-bid ca-disp">{money(a.current.bid)}</p>
                    {raised > 0 && <p className="ca-raised">+{money(raised)} above base</p>}
                  </div>
                  <div key={bidder || 'none'} className="ca-bidder">
                    <p>{bidder ? 'Highest bidder' : 'No bids yet'}</p>
                    <p className="n ca-disp">{bidder || 'Waiting for the first bid'}</p>
                  </div>
                </div>
                {recent.length > 0 && <div className="ca-ticker">{recent.map((b, i) => <span key={`${b.at}-${i}`}>{b.team} {money(b.amount)}</span>)}</div>}
              </div>
            </div>
          ) : (
            <div className="ca-idle">
              <div className="o" aria-hidden="true"><i /><i />🏏</div>
              <h2 className="ca-disp">{done ? 'Auction completed' : a.status === 'Upcoming' ? 'Auction starts soon' : 'Next player coming up'}</h2>
              <p>{done
                ? (a.squadsApplied ? 'All sold players have joined their teams.' : 'Thanks for watching.')
                : online ? 'This page updates by itself when the next player goes live.' : 'Reconnecting to the live feed...'}</p>
            </div>
          )}

          {flash && (
            <div className={`ca-flash ${flash.status === 'sold' ? '' : 'un'}`} role="status">
              {flash.status === 'sold' && <Confetti />}
              <div className="in">
                <h2 className="ca-disp">{flash.status === 'sold' ? 'SOLD!' : 'UNSOLD'}</h2>
                <p className="who ca-disp">{flash.name}</p>
                {flash.status === 'sold' && (<>
                  <p className="to">to <b>{flash.team}</b></p>
                  <p className="pr ca-disp">{money(flash.price)}</p>
                </>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const TeamCard = ({ t, lead, bought }) => {
  const left = t.budget - t.spent;
  return (
    <article className={`ca-team ca-glass ${lead ? 'lead' : ''}`}>
      <div className="ca-th">
        {t.logo ? <img src={t.logo} alt="" className="ca-av" /> : <div className="ca-av" aria-hidden="true">{initials(t.name)}</div>}
        <b>{t.name}</b>
        {lead && <span className="ca-pill g" style={{ marginLeft: 'auto' }}>Leading</span>}
      </div>
      <div className="ca-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (t.spent / (t.budget || 1)) * 100)}%` }} /></div>
      <p className="ca-soft">Left <b style={{ color: 'var(--ink)' }}>{money(left)}</b> of {money(t.budget)}, {bought.length} bought</p>
      {bought.length > 0 && <div className="ca-buys">{bought.map((p) => <div key={p.playerId}><span>{p.name}</span><span>{money(p.soldPrice)}</span></div>)}</div>}
    </article>
  );
};

const PlayerCard = ({ p }) => {
  const sold = p.state === 'sold';
  return (
    <article className={`ca-card ca-glass ${sold ? 'sold' : ''}`}>
      <div className="ca-ph">
        <Avatar p={p} />
        {sold && <span className="ca-bdg sold">Sold</span>}
        {p.state === 'unsold' && <span className="ca-bdg unsold">Unsold</span>}
        <h3>{p.name}</h3>
      </div>
      <div className="ca-cb">
        {sub(p) && <p className="s">{sub(p)}</p>}
        {sold ? (
          <div className="r"><div style={{ minWidth: 0 }}><p className="s">Sold to</p><b>{p.soldTo || '-'}</b></div><span className="num">{money(p.soldPrice)}</span></div>
        ) : p.state === 'unsold' ? (
          <p className="ca-soft" style={{ marginTop: 6, color: '#a9b4cc' }}>No team bid on this player.</p>
        ) : (
          <div className="r"><p className="s">Base price</p><span className="num c">{money(p.basePrice)}</span></div>
        )}
      </div>
    </article>
  );
};

const Empty = ({ title, text, action }) => <div className="ca-empty"><b>{title}</b><p>{text}</p>{action}</div>;

/* ---------- Page ---------- */
export default function Auction() {
  const [a, setA] = useState(undefined);       // undefined = loading, null = no auction yet
  const [error, setError] = useState(false);
  const [online, setOnline] = useState(false);
  const [flash, setFlash] = useState(null);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const seenAt = useRef(undefined);
  const flashTimer = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = () => API.get('/api/cricket/auction')
      .then((r) => { if (alive) { setA(r.data || null); setError(false); } })
      .catch(() => { if (alive) { setError(true); setA((prev) => (prev === undefined ? null : prev)); } });

    const socket = io(BASE_URL);
    // join on EVERY (re)connect: the server forgets the room when the connection drops
    socket.on('connect', () => { setOnline(true); socket.emit('joinAuction'); load(); });
    socket.on('disconnect', () => setOnline(false));
    socket.on('auctionUpdated', (d) => { if (alive) { setA(d); setError(false); } });
    load();
    return () => { alive = false; clearTimeout(flashTimer.current); socket.emit('leaveAuction'); socket.disconnect(); };
  }, []);

  // SOLD / UNSOLD moment: plays once per NEW result. Never for an old result when the page opens,
  // and it is removed again if the admin presses Undo on that sale.
  useEffect(() => {
    if (a === undefined) return;
    const t = a?.lastResult?.at ? new Date(a.lastResult.at).getTime() : 0;
    const seen = seenAt.current;
    seenAt.current = t;                       // always follow the server (it can also go backwards after an undo)
    if (seen === undefined) return;
    if (t > seen) {
      setFlash(a.lastResult);
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(null), 7000);
    } else if (t < seen) {
      clearTimeout(flashTimer.current);
      setFlash(null);
    }
  }, [a]);

  if (a === undefined) {
    return (
      <div className="ca"><style>{CSS}</style>
        <div className="ca-wrap" style={{ paddingTop: 80 }}><div className="ca-cards">{[0, 1, 2, 3].map((i) => <div key={i} className="ca-sk ca-glass" />)}</div></div>
      </div>
    );
  }
  if (!a) {
    return (
      <div className="ca"><style>{CSS}</style>
        <div className="ca-wrap" style={{ paddingTop: 80 }}>
          <Empty title={error ? 'Couldn’t load the auction' : 'No auction yet'} text={error ? 'Check your connection. We’ll try again automatically.' : 'The admin has not created an auction yet. This page will update by itself.'} />
        </div>
      </div>
    );
  }

  const idx = a.current.index;
  const live = idx >= 0 ? a.players[idx] : null;
  const rows = a.players.map((p, i) => ({ ...p, state: i === idx ? 'live' : p.status === 'pending' ? 'available' : p.status }));
  const pool = rows.filter((p) => p.state !== 'live');
  const count = (k) => (k === 'all' ? pool.length : pool.filter((p) => p.state === k).length);
  const term = q.trim().toLowerCase();
  const filtered = pool.filter((p) => (filter === 'all' || p.state === filter) && (!term || p.name?.toLowerCase().includes(term)));
  const shown = filtered.slice(0, limit);
  const more = filtered.length - shown.length;
  const soldN = rows.filter((p) => p.state === 'sold').length;
  const availN = rows.filter((p) => p.state === 'available').length;
  const reset = () => { setFilter('all'); setQ(''); setLimit(PAGE); };

  return (
    <div className="ca">
      <style>{CSS}</style>
      <div className="ca-amb" aria-hidden="true">
        <span className="ca-orb" style={{ width: 560, height: 560, top: -176, left: -144, opacity: 0.18, background: 'radial-gradient(closest-side,#f2c14e 35%,transparent 100%)' }} />
        <span className="ca-orb" style={{ width: 520, height: 520, top: '35%', right: -176, opacity: 0.22, background: 'radial-gradient(closest-side,#3348ff 35%,transparent 100%)' }} />
        <span className="ca-orb" style={{ width: 480, height: 480, bottom: -176, left: '20%', opacity: 0.16, background: 'radial-gradient(closest-side,#a78bfa 35%,transparent 100%)' }} />
        <span className="ca-grid-bg" />
      </div>

      <header className="ca-hero">
        <svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 300" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="3"><rect x="20" y="20" width="760" height="260" rx="130" /><circle cx="400" cy="150" r="80" /><rect x="380" y="95" width="40" height="110" /></g>
        </svg>
        <div className="ca-wrap">
          <h1 className="ca-title ca-disp">Player auction</h1>
          <p className="ca-lead">{rows.length} players, {soldN} sold, {availN} still to come. Watch every bid as it happens.</p>
          <div className="ca-meta">
            {a.tournament?.name && <span className="ca-pill g">{a.tournament.name}</span>}
            <span className="ca-pill">{a.name}</span>
            <span className="ca-pill"><span className={`ca-dot ${online ? '' : 'off'}`} />{online ? 'Live feed connected' : 'Reconnecting...'}</span>
          </div>
        </div>
      </header>

      <div className="ca-wrap" style={{ paddingBottom: 56 }}>
        <LiveStage a={a} live={live} flash={flash} online={online} />

        <section className="ca-sec" aria-label="Teams">
          <div className="ca-sech"><h2 className="ca-disp">Teams</h2><p className="ca-soft">Budget left and players bought</p></div>
          <div className="ca-teams">
            {a.teams.map((t) => <TeamCard key={t.name} t={t} lead={!!live && a.current.bidder === t.name} bought={rows.filter((p) => p.state === 'sold' && p.soldTo === t.name)} />)}
          </div>
        </section>

        <section aria-label="Find a player" className="ca-filters ca-glass">
          <div className="ca-tabs" role="tablist" aria-label="Player status">
            {FILTERS.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={filter === k} className={`ca-tab ${filter === k ? 'on' : ''}`} onClick={() => { setFilter(k); setLimit(PAGE); }}>{l}<small>{count(k)}</small></button>
            ))}
          </div>
          <label className="ca-search">
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search players</span>
            <SearchIcon />
            <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Search by player name" />
          </label>
        </section>

        <div className="ca-sec" style={{ marginTop: 28 }}>
          {filtered.length === 0 ? (
            <Empty title={pool.length === 0 ? 'No players yet' : 'No player found'} text={pool.length === 0 ? 'Players will appear here once they are added to the auction.' : 'Try a different name or status.'}
              action={(filter !== 'all' || q) && <button className="ca-btn" onClick={reset}>Clear filters</button>} />
          ) : (<>
            <p className="ca-soft" style={{ marginBottom: 16 }}>Showing <b style={{ color: 'var(--gold)' }}>{shown.length}</b> of {filtered.length}</p>
            <div className="ca-cards">{shown.map((p) => <PlayerCard key={p.playerId} p={p} />)}</div>
            {more > 0 && <div style={{ textAlign: 'center' }}><button className="ca-btn" onClick={() => setLimit(limit + PAGE)}>Show more ({more} left)</button></div>}
          </>)}
        </div>
      </div>
    </div>
  );
}