import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { CreatorCard } from "@/components/creator/CreatorCard";
import "@/landing.css";

const B = import.meta.env.BASE_URL;
const fix = (h: string) => h.split("__B__").join(B);

const TOP = fix(`

<header class="nav">
  <div class="nav-in">
    <a class="brand" href="#top" aria-label="Arc Agent Pay home"><span class="tile-mark" style="width:46px;height:46px"><span class="mark" style="--h:32px"><img src="__B__lp/logo.png" alt=""></span></span><span style="font-size:17px">Arc Agent Pay</span></a>
    <nav class="links" aria-label="Page sections">
      <a href="#flow">How it works</a>
      <a href="#inside">What's inside</a>
      <a href="#roadmap">Roadmap</a>
      <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer">ArcScan</a>
    </nav>
    <a class="btn btn-white" href="#cta" data-nav="/dashboard">Dashboard</a>
  </div>
</header>

<section class="hero-wrap" id="heroWrap">
  <div class="stage" id="stage">
    <div class="layer earth"><img src="__B__lp/earth.png" alt="" fetchpriority="high"></div>
    <div class="layer mtn mback"><img src="__B__lp/mountains.png" alt=""></div>
    <div class="fog" aria-hidden="true"></div>
    <canvas id="gl" aria-hidden="true"></canvas>
    <div class="fallback-logo" aria-hidden="true"><span class="mark" style="--h:300px"><img src="__B__lp/logo.png" alt=""></span></div>
    <div class="layer mtn mfront"><img src="__B__lp/mountains.png" alt=""></div>

    <div class="cards" aria-hidden="true">
      <div class="card c1"><div class="in glass cp"><div class="row"><div class="ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#04122B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4M9 13h.01M15 13h.01"/></svg></div><div><div class="t1">Research Agent</div><div class="t2">Paid 0.002 USDC</div></div></div></div></div>
      <div class="card c2"><div class="in glass cp"><div class="row" style="color:var(--good);font-weight:600;font-size:13px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>Settled on Arc</div><div class="mono" style="margin-top:10px;font-size:13px;color:#C9D4EA">0x7a3f…c91e</div><div style="margin-top:6px;font-size:12px;color:var(--sky)">View on ArcScan ↗</div></div></div>
      <div class="card c3"><div class="in glass cp"><div class="kv" style="font-size:13px"><b style="font-weight:600">Spending limit</b><span style="color:var(--ink-2)">62%</span></div><div class="bar" style="margin-top:12px"><b style="width:62%"></b></div><div class="mono" style="margin-top:10px;font-size:12px;color:#C9D4EA">12.40 / 20.00 USDC</div></div></div>
      <div class="card c4"><div class="in glass cp"><div class="t2">Emergency stop</div><div class="t1" style="margin-top:4px;font-size:15px">Armed and ready</div><div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap"><span class="pill blue">Allowlisted</span><span class="pill good">Under limit</span></div></div></div>
      <div class="card c5"><div class="in glass chip" style="color:#BFE3FF">+0.002 USDC</div></div>
      <div class="card c6"><div class="in glass chip" style="color:var(--good)">x402 paid ✓</div></div>
    </div>

    <div class="headline">
      <span class="badge"><span class="ping"></span><b>Live on Arc Testnet</b><i class="opt"></i><span class="mono opt">Chain 5042002</span><i class="opt"></i><span class="opt">Native USDC</span></span>
      <h1>Payments infrastructure <span class="grad">for autonomous agents</span></h1>
    </div>
    <div class="lower">
      <p class="sub">Fund, monitor, and control your AI agent swarm on Arc Testnet. Real on-chain USDC, live balance alerts, zero mocks.</p>
      <div class="cta-row">
        <a class="btn btn-blue btn-lg" href="#cta" data-nav="/dashboard">Open Dashboard →</a>
        <a class="btn btn-ghost btn-lg" href="https://testnet.arcscan.app" target="_blank" rel="noreferrer">View Explorer</a>
      </div>
    </div>
    <div class="hint" aria-hidden="true">Scroll<i></i></div>
  </div>
</section>

<main id="top">
  <div class="marquee" aria-hidden="true">
    <div class="track">
      <span>ARC TESTNET<i></i>CHAIN 5042002<i></i>NATIVE USDC<i></i>CIRCLE DEVELOPER CONTROLLED WALLETS<i></i>X402 PAYMENTS<i></i>ARCSCAN VERIFIED<i></i>PER-WALLET DATA ISOLATION<i></i></span>
      <span>ARC TESTNET<i></i>CHAIN 5042002<i></i>NATIVE USDC<i></i>CIRCLE DEVELOPER CONTROLLED WALLETS<i></i>X402 PAYMENTS<i></i>ARCSCAN VERIFIED<i></i>PER-WALLET DATA ISOLATION<i></i></span>
    </div>
  </div>

  <section class="sec wrap" id="flow">
    <h2>How a payment moves</h2>
    <p class="lede">Every payment passes the same three stops, and each one leaves a trail you can check.</p>
    <div class="flow">
      <div class="node" style="--glow:rgba(34,240,255,.35)">
        <div class="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22F0FF" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V4M9 13.5h.01M15 13.5h.01M2 13v2M22 13v2"/></svg></div>
        <div><h3>AI Agent</h3><div class="sm">signs intent</div></div>
        <p>Your agent asks to pay, through a rule you set or an x402 request.</p>
      </div>
      <div class="wire" aria-hidden="true"></div>
      <div class="node" style="--glow:rgba(58,180,255,.35)">
        <div class="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3AB4FF" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7a2 2 0 0 1 2-2h12v4"/><path d="M4 7v11a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1"/></svg></div>
        <div><h3>Circle DCW</h3><div class="sm">wallet policy</div></div>
        <p>Spending limit, approved addresses and the emergency stop are checked, then a Circle Developer Controlled Wallet signs.</p>
      </div>
      <div class="wire w2" aria-hidden="true"></div>
      <div class="node" style="--glow:rgba(52,211,153,.35)">
        <div class="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg></div>
        <div><h3>Arc Settlement</h3><div class="sm">USDC · ArcScan</div></div>
        <p>Native USDC settles on Arc Testnet, and the transaction links straight to ArcScan.</p>
      </div>
    </div>
  </section>

  <section class="sec wrap" id="inside" style="padding-top:0">
    <h2>Everything an agent needs to pay safely</h2>
    <p class="lede">Real on-chain payments, with the controls to keep them in bounds.</p>
    <div class="bento" id="bento">

      <article class="tile s3">
        <div><h3>Spending controls</h3><p>Set a limit, approve the addresses an agent can pay, and stop it in one click. The backend checks all three before any payment is sent.</p></div>
        <div class="ui">
          <div class="kv"><span>Spending limit</span><span class="mono">12.40 / 20.00 USDC</span></div>
          <div class="bar"><b style="width:62%"></b></div>
          <div class="kv" style="margin-top:4px"><span>Approved addresses</span><span class="pill blue">2 allowed</span></div>
          <div class="row" style="gap:8px;flex-wrap:wrap"><span class="chip" style="background:rgba(255,255,255,.05);color:#C9D4EA;padding:8px 12px">0x9c2e…41ab</span><span class="chip" style="background:rgba(255,255,255,.05);color:#C9D4EA;padding:8px 12px">0x41d8…02b7</span></div>
          <div class="stop"><div><b>Emergency stop</b><em>Halts every payment for this agent</em></div><span class="b">Stop</span></div>
        </div>
      </article>

      <article class="tile s3">
        <div><h3>x402 micropayments</h3><p>Agents pay per request and get a receipt with the transaction hash and an ArcScan link, so every payment can be verified.</p></div>
        <div class="ui">
          <div class="kv"><b style="font-weight:600">x402 receipt</b><span class="pill good">Paid</span></div>
          <div class="kv"><span>Resource</span><span class="mono">/api/market-data</span></div>
          <div class="kv"><span>Amount</span><span class="mono">0.001 USDC</span></div>
          <div class="kv"><span>Network</span><span>Arc Testnet</span></div>
          <div class="kv" style="padding-top:10px;border-top:1px solid var(--line-2)"><span>Transaction</span><span class="mono" style="color:var(--sky)">0x7a3f…c91e ↗</span></div>
        </div>
      </article>

      <article class="tile s2">
        <div><h3>Agent registry</h3><p>Register wallets as named agents, see live balances, and fund them directly.</p></div>
        <div class="ui" style="gap:0">
          <div class="agent"><span class="dot" style="background:var(--good)"></span><span class="n">Research Agent</span><span class="mono">24.80</span></div>
          <div class="agent"><span class="dot" style="background:var(--good)"></span><span class="n">Market Agent</span><span class="mono">8.15</span></div>
          <div class="agent"><span class="dot" style="background:var(--warn)"></span><span class="n">Scout Agent</span><span class="mono">0.40</span><span class="pill warn">Low</span></div>
        </div>
      </article>

      <article class="tile s2">
        <div><h3>Spending rules</h3><p>Recurring or one-time rules per agent. Every payment shows which rule triggered it.</p></div>
        <div class="ui" style="gap:0">
          <div class="ev"><span class="tm">13:00</span><span>Hourly data fetch</span><span class="mono">0.002</span><span class="why">Triggered by rule · confirmed</span></div>
          <div class="ev"><span class="tm">12:00</span><span>Hourly data fetch</span><span class="mono">0.002</span><span class="why">Triggered by rule · confirmed</span></div>
          <div class="ev"><span class="tm">14:00</span><span style="color:var(--sky)">Next payment</span><span class="mono dim">0.002</span><span class="why">Every 1 hour</span></div>
        </div>
      </article>

      <article class="tile s2">
        <div><h3>Real-time analytics</h3><p>Volume charts and agent breakdowns built from your actual on-chain history.</p></div>
        <div class="ui">
          <svg class="chart" viewBox="0 0 260 110" role="img" aria-label="Bar chart of USDC volume over seven days, rising from 3.2 to 6.6">
            <defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22F0FF"/><stop offset="1" stop-color="#0A84FF"/></linearGradient></defs>
            <g stroke="rgba(140,180,255,.14)" stroke-width="1"><line x1="26" y1="8" x2="256" y2="8"/><line x1="26" y1="43" x2="256" y2="43"/><line x1="26" y1="78" x2="256" y2="78"/></g>
            <text x="20" y="11" text-anchor="end">8</text><text x="20" y="46" text-anchor="end">4</text><text x="20" y="81" text-anchor="end">0</text>
            <g fill="url(#bg1)">
              <rect x="34" y="42" width="22" height="36" rx="4"/><rect x="66" y="24" width="22" height="54" rx="4"/><rect x="98" y="45" width="22" height="33" rx="4"/><rect x="130" y="9" width="22" height="69" rx="4"/><rect x="162" y="17" width="22" height="61" rx="4"/><rect x="194" y="-4" width="22" height="82" rx="4"/><rect x="226" y="4" width="22" height="74" rx="4"/>
            </g>
            <g text-anchor="middle"><text x="45" y="94">Mon</text><text x="77" y="94">Tue</text><text x="109" y="94">Wed</text><text x="141" y="94">Thu</text><text x="173" y="94">Fri</text><text x="205" y="94">Sat</text><text x="237" y="94">Sun</text></g>
            <text x="26" y="108" style="fill:var(--ink-3)">USDC volume, sample week</text>
          </svg>
        </div>
      </article>

      <article class="tile s3">
        <div><h3>Auto-confirm</h3><p>Pending transactions confirm on their own every 5 seconds. No manual refresh.</p></div>
        <div class="ui">
          <div class="kv"><span class="mono" style="color:#C9D4EA">0x4be1…77d0</span><span class="pc" style="width:96px"><span class="a pill warn">Pending</span><span class="b pill good">Confirmed</span></span></div>
          <div class="prog"><b></b></div>
        </div>
      </article>

      <article class="tile s3">
        <div class="row" style="justify-content:space-between;align-items:flex-start"><div><h3>Multi-send</h3><p>Queue several recipients and send USDC to all of them in one batch.</p></div><span class="pill mute">Soon</span></div>
        <div class="ui dim">
          <div class="kv"><span class="mono">0x9c2e…41ab</span><span class="mono">0.50</span></div>
          <div class="kv"><span class="mono">0x41d8…02b7</span><span class="mono">0.25</span></div>
          <div class="kv"><span class="mono">0x6d10…a9f3</span><span class="mono">1.00</span></div>
        </div>
      </article>
    </div>
    <p style="margin:18px 0 0;font-size:12.5px;color:var(--ink-3)">Screens show sample data from Arc Testnet.</p>
  </section>

  <section class="sec wrap" id="roadmap" style="padding-top:0">
    <h2>Testnet today. Built for mainnet.</h2>
    <p class="lede">Arc Agent Pay runs on Arc Testnet, so no real funds move. This is the path to production.</p>
    <div class="road">
      <div class="step now"><span class="pill blue" style="align-self:flex-start">Next</span><h3>Per-agent Circle wallets</h3><p>Each agent gets its own Circle wallet, so funds stay separated by agent.</p></div>
      <div class="step"><span class="pill mute" style="align-self:flex-start">Planned</span><h3>Circle Gateway and nanopayments</h3><p>Smaller, faster micropayments settled through Circle's payment tools.</p></div>
      <div class="step"><span class="pill mute" style="align-self:flex-start">Planned</span><h3>Mainnet readiness</h3><p>Getting Arc Agent Pay ready to handle real funds on Arc mainnet.</p></div>
    </div>
  </section>

  `);
const BOTTOM = fix(`

  <section class="sec wrap" id="cta" style="padding-top:0">
    <div class="cta">
      <div class="cta-brand"><span class="tile-mark" style="width:116px;height:116px;border-radius:30px"><span class="mark" style="--h:78px"><img src="__B__lp/logo.png" alt=""></span></span><span class="cta-name">Arc Agent Pay</span></div>
      <h2>Send your first agent payment</h2>
      <p class="lede">Connect a wallet, register an agent, and watch the first USDC payment settle on Arc Testnet.</p>
      <div class="cta-row" style="margin-top:32px">
        <a class="btn btn-blue btn-lg" href="#top" data-nav="/dashboard">Open Dashboard →</a>
        <a class="btn btn-ghost btn-lg" href="https://testnet.arcscan.app" target="_blank" rel="noreferrer">View Explorer</a>
      </div>
    </div>
  </section>
</main>

<footer class="foot">
  <div class="wrap">
    <span class="row" style="gap:10px"><span class="tile-mark" style="width:34px;height:34px;border-radius:10px"><span class="mark" style="--h:23px"><img src="__B__lp/logo.png" alt=""></span></span><span style="color:var(--ink-2);font-weight:600;font-size:14px">Arc Agent Pay</span></span>
    <span class="row" style="gap:8px"><span class="dot" style="background:var(--good)"></span>Arc Testnet · Chain 5042002 · Native USDC (18 decimals)</span>
  </div>
</footer>

`);

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const stage = el.querySelector<HTMLElement>("#stage");
    const wrap = el.querySelector<HTMLElement>("#heroWrap");
    const canvas = el.querySelector<HTMLCanvasElement>("#gl");
    if (!stage || !wrap || !canvas) return;
    const prevScroll = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const st = { p: 0, ps: 0, mx: 0, my: 0, tx: 0, ty: 0 };
    const read = () => {
      const r = wrap.getBoundingClientRect();
      const max = wrap.offsetHeight - window.innerHeight;
      st.p = max > 0 ? Math.min(1, Math.max(0, (-r.top / max) * 1.2)) : 0;
    };
    const onMove = (e: PointerEvent) => {
      st.tx = (e.clientX / window.innerWidth) * 2 - 1;
      st.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });
    read();

    let raf = 0;
    const tick = () => {
      st.ps += (st.p - st.ps) * (reduce ? 1 : 0.09);
      st.mx += (st.tx - st.mx) * 0.06;
      st.my += (st.ty - st.my) * 0.06;
      stage.style.setProperty("--p", st.ps.toFixed(4));
      stage.style.setProperty("--mx", st.mx.toFixed(4));
      stage.style.setProperty("--my", st.my.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    tick();

    let dispose: (() => void) | undefined;
    let cancelled = false;
    import("@/lib/landingScene")
      .then((m) => {
        if (cancelled) return;
        dispose = m.startLandingScene({ stage, canvas, state: st, base: B });
      })
      .catch(() => stage.classList.add("no-gl"));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.style.scrollBehavior = prevScroll;
      dispose?.();
    };
  }, []);

  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>("[data-nav]");
    if (a) {
      e.preventDefault();
      setLocation(a.dataset.nav as string);
    }
  };

  const onMove = (e: React.PointerEvent) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>(".tile");
    if (!t) return;
    const r = t.getBoundingClientRect();
    t.style.setProperty("--sx", e.clientX - r.left + "px");
    t.style.setProperty("--sy", e.clientY - r.top + "px");
  };

  return (
    <div ref={root} onClick={onClick} onPointerMove={onMove} className="bg-[#07090D]">
      <div className="lp" dangerouslySetInnerHTML={{ __html: TOP }} />
      <div className="bg-[#07090D] pb-[clamp(72px,11vw,140px)]">
        <div className="mx-auto w-full max-w-[1200px] px-4">
          <CreatorCard variant="full" />
        </div>
      </div>
      <div className="lp" dangerouslySetInnerHTML={{ __html: BOTTOM }} />
    </div>
  );
}
