import React, { useEffect, useRef, useState } from 'react';

/* =====================================================================
   Auction -> OBS panels
   Works together with Auction.jsx (same data: `a`, `flash`, `online` - nothing is fetched here).

   OBS link  :  <auction page url>?panel=player&obs=1&bg=green
   Options   :  bg=green (default, #00b140)  |  bg=transparent  |  bg=00ff00 (any hex, no #)
                scale=0.8 / 1.2 ...          (size of the panel)
                preview=1                    (loops a demo: live bids -> SOLD -> idle, to test the design)

   Panels    :  player  = the live player lower-third (photo, base price, current bid, name, role).
                          When the admin sells / unsells the player the SAME panel turns into the
                          SOLD / UNSOLD card (from the same `flash` your page already uses),
                          and it slides away by itself when no player is live.
   ===================================================================== */

const params = () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
export const isObsMode = () => {
  const q = params();
  return q.get('obs') === '1' && !!q.get('panel');
};

export const OBS_PANELS = [
  { id: 'player', label: 'Player lower-third (photo, base price, current bid, name)' },
];

// plain number only (the amounts are tokens, no currency symbol)
const taka = (n) => (typeof n === 'number' ? n.toLocaleString() : n || n === 0 ? String(n) : '-');
const initials = (n = '') => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
// the pic shows "BATSMAN" under the name: first field that exists on the player, else dept + batch
const roleOf = (p = {}) => String(p.role || p.playingRole || p.playerRole || p.position || p.category || p.type || '').trim();
const subOf = (p = {}) => [p.dept, p.batch && `Batch ${p.batch}`].filter(Boolean).join(', ');

const bgOf = (v) => {
  if (v === 'transparent') return 'transparent';
  if (/^[0-9a-f]{3,8}$/i.test(v || '')) return `#${v}`;
  return '#00b140';
};

const FONT = "@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Noto+Sans+Bengali:wght@600;700&display=swap');";

const OBS_CSS = `
html,body{background:transparent!important;overflow:hidden!important}
body *{visibility:hidden!important}
.ao,.ao *{visibility:visible!important}
.ao{position:fixed;inset:0;z-index:2147483000;background:var(--aobg);overflow:hidden;color:#fff;font-family:'Barlow Condensed','Noto Sans Bengali',Arial,sans-serif}
.ao *,.ao *::before,.ao *::after{box-sizing:border-box}
.ao-stage{position:absolute;left:50%;bottom:4vh;width:1000px;height:300px;margin-left:-500px;transform:scale(var(--aos));transform-origin:50% 100%}

/* ---- the lower-third ---- */
.lt{--gold:#f2c14e;--cyan:#3dd6d0;--violet:#a78bfa;--pink:#ff4d6d;
  --c1:#f2c14e;--c2:#3dd6d0;--c3:#a78bfa;--cg:rgba(242,193,78,.6);--f1:#121c3c;--f2:#060912;--hx1:#f2c14e;--hx2:#3dd6d0;--hg:rgba(242,193,78,.75);--soft:#93a0bd;
  position:absolute;inset:0}
.lt.sold{--c1:#ffd45e;--c2:#f2c14e;--c3:#fff1b8;--cg:rgba(255,212,94,.85);--f1:#2c2106;--f2:#0b0802;--hx1:#fff1b8;--hx2:#f2c14e;--hg:rgba(255,212,94,.95);--soft:#e8d49a}
.lt.un{--c1:#7b8794;--c2:#d5dbe3;--c3:#7b8794;--cg:rgba(160,174,192,.45);--f1:#262c3a;--f2:#0c0f16;--hx1:#cbd5e1;--hx2:#64748b;--hg:rgba(160,174,192,.55);--soft:#a9b4cc}
.lt.leave{animation:ltLeave .85s cubic-bezier(.6,0,.9,.4) both}
.lt-glow{position:absolute;left:70px;right:70px;top:96px;height:210px;z-index:0;border-radius:50%;background:radial-gradient(closest-side,var(--cg),rgba(61,214,208,.28) 62%,transparent);filter:blur(36px);opacity:.55;animation:ltGlowIn 1.2s both,ltBreath 3.2s 1.2s ease-in-out infinite}

/* price boxes: slanted, glowing border that flows, slide out from behind the photo */
.lt-box{position:absolute;top:120px;width:392px;height:76px;z-index:2;filter:drop-shadow(0 0 12px var(--cg));animation:ltPulse 2.8s 1.4s ease-in-out infinite}
.lt-box.l{left:38px;animation:ltBoxL .85s .3s cubic-bezier(.2,.9,.2,1) both,ltPulse 2.8s 1.4s ease-in-out infinite}
.lt-box.r{right:38px;animation:ltBoxR .85s .3s cubic-bezier(.2,.9,.2,1) both,ltPulse 2.8s 1.4s ease-in-out infinite}
.lt-bo,.lt-bi{position:absolute;clip-path:polygon(0 0,100% 0,calc(100% - 26px) 100%,26px 100%)}
.lt-bo{inset:0;background:linear-gradient(100deg,var(--c1),var(--c2),var(--c3),var(--c1));background-size:300% 100%;animation:ltFlow 4s linear infinite}
.lt-bi{inset:3px;background:radial-gradient(120% 140% at 50% 0,rgba(255,255,255,.08),transparent 60%),linear-gradient(180deg,var(--f1),var(--f2));display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}
.lt-bi small{font-size:15px;font-weight:700;letter-spacing:3px;color:var(--soft);line-height:1;text-transform:uppercase}
.lt-box.l .lt-bi b{color:var(--cyan);text-shadow:0 0 22px rgba(61,214,208,.6)}
.lt-box.r .lt-bi b{color:var(--gold);text-shadow:0 0 28px rgba(242,193,78,.75),0 0 60px rgba(242,193,78,.4)}
.lt.sold .lt-box.l .lt-bi b{color:#fff1b8;text-shadow:0 0 22px rgba(255,212,94,.7)}
.lt.un .lt-box .lt-bi b{color:#e2e8f0;text-shadow:none}
.lt-bi b{margin-top:3px;max-width:300px;font-size:42px;font-weight:700;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 0 18px var(--cg);animation:ltPop .6s cubic-bezier(.2,1.5,.4,1) both}
.lt-bi b.long{font-size:30px}
.lt-bi i{position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.7),transparent);animation:ltBidFlash .9s both}

/* photo in the hexagon */
.lt-hexw{position:absolute;left:410px;top:0;width:180px;height:210px;z-index:4;filter:drop-shadow(0 0 20px var(--hg));animation:ltHex 1s cubic-bezier(.2,1.3,.4,1) both}
.lt-hexo,.lt-hexi{position:absolute;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}
.lt-hexo{inset:0;background:linear-gradient(135deg,var(--hx1),var(--hx2),var(--c3),var(--hx1));background-size:300% 300%;animation:ltFlow 4s linear infinite}
.lt-hexi{inset:7px;background:#0a1024;overflow:hidden;animation:ltBright 1.2s both}
.lt-hexi img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.lt-ini{position:absolute;inset:0;display:grid;place-items:center;font-size:68px;font-weight:800;letter-spacing:2px;background:linear-gradient(135deg,var(--hx1),var(--hx2));color:#0a0e1c}
.lt-hexi:after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);transform:translateX(-130%);animation:ltSheen 5s 1.6s ease-in-out infinite}

/* name bar */
.lt-name{position:absolute;left:130px;top:190px;width:740px;height:68px;z-index:3;filter:drop-shadow(0 0 14px var(--cg));transform-origin:50% 50%;animation:ltName .8s .55s cubic-bezier(.2,.9,.2,1) both}
.lt-no,.lt-ni{position:absolute;clip-path:polygon(30px 0,calc(100% - 30px) 0,100% 50%,calc(100% - 30px) 100%,30px 100%,0 50%)}
.lt-no{inset:0;background:linear-gradient(100deg,var(--c1),var(--c2),var(--c3),var(--c1));background-size:300% 100%;animation:ltFlow 4s linear infinite}
.lt-ni{inset:3px;background:radial-gradient(70% 120% at 50% 0,rgba(61,214,208,.14),transparent 70%),linear-gradient(180deg,var(--f1),var(--f2));display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px;overflow:hidden}
.lt-ni span{font-size:48px;font-weight:800;line-height:1;letter-spacing:5px;text-transform:uppercase;white-space:nowrap;color:#fff;text-shadow:0 0 24px rgba(242,193,78,.65),0 3px 8px rgba(0,0,0,.55);animation:ltText .7s .95s cubic-bezier(.2,.9,.2,1) both}
.lt-ni:after{content:'';position:absolute;top:0;bottom:0;left:-30%;width:22%;transform:skewX(-20deg);background:linear-gradient(100deg,transparent,rgba(255,255,255,.4),transparent);animation:ltSweep 6s 1.8s ease-in-out infinite}

/* role tab */
.lt-role{position:absolute;left:390px;top:256px;width:220px;height:32px;z-index:2;background:linear-gradient(100deg,#f2c14e,#ffe08a,#f2c14e);box-shadow:0 0 24px rgba(242,193,78,.6);clip-path:polygon(0 0,100% 0,calc(100% - 14px) 100%,14px 100%);display:grid;place-items:center;animation:ltRole .6s .9s cubic-bezier(.2,.9,.2,1) both}
.lt-role span{font-size:16px;font-weight:800;letter-spacing:5px;text-transform:uppercase;color:#0a0e1c;padding-top:3px}
.lt.sold .lt-role{background:linear-gradient(100deg,#ffd45e,#fff1b8,#ffd45e)}
.lt.un .lt-role{background:#2a303b;box-shadow:none}.lt.un .lt-role span{color:#e2e8f0}

/* LIVE pill */
.lt-live{position:absolute;left:38px;top:80px;z-index:5;display:inline-flex;align-items:center;gap:8px;padding:5px 14px 5px 11px;border-radius:999px;background:var(--pink);color:#fff;font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;box-shadow:0 0 22px -2px var(--pink);animation:ltLiveIn .6s .8s cubic-bezier(.2,.9,.2,1) both,ltLivePulse 1.6s 1.4s ease-out infinite}
.lt-live i{width:9px;height:9px;border-radius:50%;background:#fff}
/* confetti for SOLD */
.lt-conf{position:absolute;left:-120px;right:-120px;bottom:0;height:560px;pointer-events:none;overflow:hidden;z-index:6}
.lt-conf i{position:absolute;top:-16px;width:9px;height:15px;border-radius:2px;opacity:0;animation:ltFall 2.8s ease-in forwards}

@keyframes ltHex{0%{opacity:0;transform:scale(.15) rotate(-30deg)}60%{opacity:1;transform:scale(1.12) rotate(5deg)}100%{opacity:1;transform:none}}
@keyframes ltBright{0%{filter:brightness(3.2)}100%{filter:none}}
@keyframes ltBoxL{0%{opacity:0;transform:translateX(230px) scaleX(.15)}100%{opacity:1;transform:none}}
@keyframes ltBoxR{0%{opacity:0;transform:translateX(-230px) scaleX(.15)}100%{opacity:1;transform:none}}
@keyframes ltName{0%{opacity:0;transform:scaleX(.05)}100%{opacity:1;transform:none}}
@keyframes ltText{0%{opacity:0;letter-spacing:16px;transform:translateY(10px)}100%{opacity:1;letter-spacing:5px;transform:none}}
@keyframes ltRole{0%{opacity:0;transform:translateY(-36px)}100%{opacity:1;transform:none}}
@keyframes ltFlow{0%{background-position:0% 50%}100%{background-position:300% 50%}}
@keyframes ltPulse{0%,100%{filter:drop-shadow(0 0 8px var(--cg))}50%{filter:drop-shadow(0 0 22px var(--cg))}}
@keyframes ltGlowIn{0%{opacity:0;transform:scale(.6)}100%{opacity:.55;transform:none}}
@keyframes ltBreath{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.85;transform:scale(1.05)}}
@keyframes ltSheen{0%,55%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
@keyframes ltSweep{0%,60%{left:-30%}100%{left:130%}}
@keyframes ltPop{0%{transform:scale(.7);opacity:.2}60%{transform:scale(1.18)}100%{transform:none;opacity:1}}
@keyframes ltBidFlash{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
@keyframes ltLeave{0%{opacity:1;transform:none}100%{opacity:0;transform:translateY(46px) scale(.93);filter:blur(10px)}}
@keyframes ltLiveIn{0%{opacity:0;transform:translateX(-30px)}100%{opacity:1;transform:none}}
@keyframes ltLivePulse{0%{box-shadow:0 0 0 0 rgba(255,77,109,.65)}100%{box-shadow:0 0 0 14px rgba(255,77,109,0)}}
@keyframes ltFall{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(540px) rotate(560deg)}}
`;

const COLORS = ['#f5b301', '#3dd6d0', '#a78bfa', '#ff4d6d', '#ffffff'];
const Confetti = () => (
  <div className="lt-conf" aria-hidden="true">
    {Array.from({ length: 34 }, (_, i) => (
      <i key={i} style={{ left: `${(i * 29 + 6) % 100}%`, background: COLORS[i % COLORS.length], animationDelay: `${(i % 8) * 0.1}s`, animationDuration: `${2.3 + (i % 5) * 0.25}s` }} />
    ))}
  </div>
);

/* ---------- the panel ---------- */
function PlayerLowerThird({ players, live, bid, bidder, flash }) {
  // flash (SOLD / UNSOLD) wins for the few seconds your page shows it, then the live player, else nothing
  const mode = flash ? 'result' : live ? 'live' : '';
  const key = mode === 'result' ? `r${flash.at || flash.name}` : mode === 'live' ? `p${live.playerId ?? live.name}` : '';
  const lastRef = useRef(null);
  if (key) lastRef.current = { key, mode, content: mode === 'result' ? flash : live, bid, bidder };

  const [gone, setGone] = useState(!key);
  useEffect(() => {
    if (key) { setGone(false); return undefined; }
    const t = setTimeout(() => setGone(true), 1000);   // wait for the exit animation
    return () => clearTimeout(t);
  }, [key]);

  const shown = key || !gone ? lastRef.current : null;
  if (!shown) return null;
  const leaving = !key;
  const isLive = shown.mode === 'live';
  const c = shown.content;
  const p = isLive ? c : ((players || []).find((x) => x.name === c.name) || c);   // photo / role of the sold player
  const sold = !isLive && c.status === 'sold';
  const cls = isLive ? 'live' : sold ? 'sold' : 'un';

  let L; let R;
  if (isLive) {
    L = { label: 'Base price', val: taka(p.basePrice) };
    R = { label: 'Current bid', val: taka(shown.bid), k: shown.bid };
  } else if (sold) {
    L = { label: 'Sold to', val: c.team || '-' };
    R = { label: 'Sold price', val: taka(c.price), k: c.price };
  } else {
    L = { label: 'Base price', val: taka(p.basePrice) };
    R = { label: 'Result', val: 'UNSOLD' };
  }
  const roleText = isLive ? (roleOf(p) || subOf(p) || 'PLAYER') : sold ? 'SOLD' : 'UNSOLD';
  const nameText = p.name || c.name || '';

  return (
    <div className={`lt ${cls}${leaving ? ' leave' : ''}`} key={shown.key}>
      {sold && !leaving && <Confetti />}
      <div className="lt-glow" />
      {isLive && !leaving && <span className="lt-live"><i />Live bidding</span>}

      <div className="lt-box l"><div className="lt-bo" /><div className="lt-bi"><small>{L.label}</small><b className={String(L.val).length > 12 ? 'long' : ''}>{L.val}</b></div></div>
      <div className="lt-box r"><div className="lt-bo" /><div className="lt-bi"><small>{R.label}</small><b key={R.k ?? R.val} className={String(R.val).length > 12 ? 'long' : ''}>{R.val}</b><i key={`f${R.k ?? R.val}`} /></div></div>

      <div className="lt-name"><div className="lt-no" /><div className="lt-ni"><span>{nameText}</span></div></div>
      <div className="lt-role"><span>{roleText}</span></div>

      <div className="lt-hexw"><div className="lt-hexo" /><div className="lt-hexi">{p.image ? <img src={p.image} alt="" /> : <div className="lt-ini">{initials(nameText)}</div>}</div></div>
    </div>
  );
}

/* preview=1 : loops live bids -> SOLD -> UNSOLD-free idle gap so you can check the animation without a live auction */
const useDemo = (on, a) => {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!on) return undefined;
    const iv = setInterval(() => setT((x) => x + 1), 2200);
    return () => clearInterval(iv);
  }, [on]);
  if (!on) return null;
  const base = (a && a.players && a.players[0]) || {};
  const live = { playerId: 'demo', name: base.name || 'TUFAZZAL', image: base.image, role: roleOf(base) || 'BATSMAN', basePrice: typeof base.basePrice === 'number' ? base.basePrice : 1600, dept: base.dept, batch: base.batch };
  const step = t % 9;
  const cycle = Math.floor(t / 9);
  const bid = live.basePrice + Math.min(step, 4) * 200;
  if (step <= 4) return { live, bid, bidder: 'Demo team', flash: null };
  if (step <= 7) return { live: null, bid, bidder: 'Demo team', flash: { status: 'sold', name: live.name, team: 'Rangtia Fighters', price: bid, at: `d${cycle}` } };
  return { live: null, bid, bidder: null, flash: null };
};

/* ---------- what Auction.jsx renders when the URL has ?obs=1&panel=... ---------- */
export function ObsRoot({ a, flash }) {
  const q = params();
  const panel = q.get('panel');
  const bg = bgOf(q.get('bg'));
  const scale = Math.min(3, Math.max(0.3, Number(q.get('scale')) || 1));
  const demo = useDemo(q.get('preview') === '1', a);

  const idx = a && a.current ? a.current.index : -1;
  const real = {
    live: a && idx >= 0 ? a.players[idx] : null,
    bid: a && a.current ? a.current.bid : 0,
    bidder: a && a.current ? a.current.bidder : null,
    flash,
  };
  const d = demo || real;

  return (
    <div className="ao" style={{ '--aobg': bg, '--aos': scale }}>
      <style>{FONT}</style>
      <style>{OBS_CSS}</style>
      <div className="ao-stage">
        {panel === 'player' && <PlayerLowerThird players={a ? a.players : []} live={d.live} bid={d.bid} bidder={d.bidder} flash={d.flash} />}
      </div>
    </div>
  );
}

/* ---------- "OBS links" button + popup for the normal auction page ---------- */
const LINK_CSS = `
.aol-back{position:fixed;inset:0;z-index:100000;background:rgba(3,6,14,.72);backdrop-filter:blur(4px);display:grid;place-items:center;padding:16px}
.aol-box{width:min(560px,100%);max-height:88vh;overflow:auto;border-radius:20px;padding:22px;background:linear-gradient(165deg,#111a36,#070b1a);border:1px solid rgba(242,193,78,.45);box-shadow:0 30px 80px -20px rgba(242,193,78,.4);color:#eef2ff;font-size:14px;text-align:left}
.aol-box h3{margin:0 0 4px;font-size:20px}
.aol-box p{margin:0 0 14px;color:#93a0bd;font-size:13px;line-height:1.5;font-weight:400}
.aol-opts{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.aol-opts label{display:flex;align-items:center;gap:8px;color:#cbd5ee;font-weight:600}
.aol-opts select{height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:#0b1226;color:#fff;padding:0 8px;font:inherit}
.aol-row{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);margin-bottom:8px}
.aol-row span{flex:1;min-width:0;font-weight:700}
.aol-row button,.aol-row a{height:34px;padding:0 14px;display:inline-flex;align-items:center;border-radius:10px;border:0;background:#f2c14e;color:#0a0e1c;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
.aol-row a.t{background:rgba(255,255,255,.14);color:#fff}
.aol-url{margin:0 0 12px;padding:8px 10px;border-radius:10px;background:#050812;color:#8fa0c4;font:12px/1.4 ui-monospace,monospace;word-break:break-all}
.aol-close{margin-top:6px;width:100%;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;font:inherit;font-weight:700;cursor:pointer}
`;

export function ObsLinksButton() {
  const [open, setOpen] = useState(false);
  const [bg, setBg] = useState('green');
  const [scale, setScale] = useState('1');
  const [copied, setCopied] = useState('');
  const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const urlFor = (id, extra = '') => `${base}?panel=${id}&obs=1&bg=${bg}${scale !== '1' ? `&scale=${scale}` : ''}${extra}`;
  const copy = async (id) => {
    const u = urlFor(id);
    try {
      await navigator.clipboard.writeText(u);
    } catch (err) {
      const t = document.createElement('textarea');
      t.value = u; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
      document.body.removeChild(t);
    }
    setCopied(id);
    setTimeout(() => setCopied(''), 1500);
  };
  return (
    <>
      <button type="button" className="ca-pill g" style={{ border: 0, cursor: 'pointer', font: 'inherit' }} onClick={() => setOpen(true)}>📡 OBS links</button>
      {open && (
        <div className="aol-back" onClick={() => setOpen(false)}>
          <div className="aol-box" onClick={(e) => e.stopPropagation()}>
            <h3>OBS panels</h3>
            <p>In OBS: Sources &rarr; <b>+</b> &rarr; <b>Browser</b>, paste the link, set the size to your canvas (e.g. 1920 x 1080). Only the panel is shown. With the green background add a <b>Chroma Key</b> filter; with transparent no filter is needed.</p>
            <div className="aol-opts">
              <label>Background
                <select value={bg} onChange={(e) => setBg(e.target.value)}>
                  <option value="green">Green (chroma key)</option>
                  <option value="transparent">Transparent</option>
                </select>
              </label>
              <label>Size
                <select value={scale} onChange={(e) => setScale(e.target.value)}>
                  <option value="0.8">80%</option><option value="1">100%</option><option value="1.2">120%</option><option value="1.5">150%</option>
                </select>
              </label>
            </div>
            {OBS_PANELS.map((pn) => (
              <div key={pn.id}>
                <div className="aol-row">
                  <span>{pn.label}</span>
                  <button type="button" onClick={() => copy(pn.id)}>{copied === pn.id ? 'Copied' : 'Copy link'}</button>
                  <a className="t" href={urlFor(pn.id, '&preview=1')} target="_blank" rel="noreferrer" title="Opens a looping demo to check the design">Test</a>
                  <a href={urlFor(pn.id)} target="_blank" rel="noreferrer">Open</a>
                </div>
                <div className="aol-url">{urlFor(pn.id)}</div>
              </div>
            ))}
            <button type="button" className="aol-close" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
      <style>{LINK_CSS}</style>
    </>
  );
}