import Link from 'next/link';
import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleDot, MoveUpRight } from 'lucide-react';

const signals = [
  { number: '01', title: 'The right person, sooner.', body: 'Every enquiry gets context, intent and a next move. Your team starts with the useful part.' },
  { number: '02', title: 'A quieter kind of follow-up.', body: 'Small, timely nudges keep conversations moving without turning people into a campaign.' },
  { number: '03', title: 'One city. One clear picture.', body: 'Leads, inventory and team activity meet in one live view of the work already happening.' },
];

function DubaiSignalMap() {
  return (
    <div className="landing-map" aria-label="Abstract map of Dubai with real estate signals">
      <div className="landing-map-top"><span><CircleDot size={12} /> CITY / 25.2048° N</span><span>LIVE FIELD NOTES <i /></span></div>
      <svg className="landing-map-art" viewBox="0 0 700 550" role="img" aria-label="Abstract Dubai coastline and property signals">
        <defs>
          <linearGradient id="land-wash" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#d4e3b0" /><stop offset="1" stopColor="#c3d4bd" /></linearGradient>
          <linearGradient id="water-wash" x1="0" x2="1"><stop stopColor="#aecbd1" /><stop offset="1" stopColor="#9bb9c5" /></linearGradient>
          <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#273742" strokeOpacity=".1" strokeWidth="1" /></pattern>
          <filter id="soft-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#173239" floodOpacity=".18" /></filter>
        </defs>
        <rect width="700" height="550" fill="url(#water-wash)" />
        <path d="M0 0h700v165c-72 5-105 32-145 45-53 17-67 2-119 29-57 29-84 72-142 75-55 2-83-24-130-12C111 317 85 367 0 365z" fill="url(#land-wash)" />
        <path d="M0 0h700v550H0z" fill="url(#grid)" />
        <g fill="none" stroke="#50665e" strokeOpacity=".25" strokeWidth="2">
          <path d="M-30 78c118 47 173 38 260 74s151 77 267 45c71-20 129-71 237-46" />
          <path d="M-29 104c118 47 173 38 260 74s151 77 267 45c71-20 129-71 237-46" />
          <path d="M40-40c19 84 70 142 64 215-7 85-80 150-68 259" />
          <path d="M76-40c19 84 70 142 64 215-7 85-80 150-68 259" />
          <path d="M450-10c-15 72-6 113 18 159 24 47 31 91 10 145-17 45-55 69-62 141" />
          <path d="M486-10c-15 72-6 113 18 159 24 47 31 91 10 145-17 45-55 69-62 141" />
        </g>
        <path d="M0 388c79-16 102-70 157-85 64-17 96 14 154 8 68-7 104-67 172-86 81-23 131 4 217-39v364H0z" fill="#eae3cb" opacity=".88" />
        <path d="M0 388c79-16 102-70 157-85 64-17 96 14 154 8 68-7 104-67 172-86 81-23 131 4 217-39" fill="none" stroke="#f7f4e7" strokeWidth="12" />
        <path d="M22 428c67-29 97-55 148-65 50-10 98 12 147-2 68-20 108-72 169-81 66-9 118 17 198-27" fill="none" stroke="#ef7254" strokeWidth="3" strokeDasharray="7 9" />
        <g filter="url(#soft-shadow)">
          <g transform="translate(500 138)"><circle r="23" fill="#f15d41" /><circle r="7" fill="#fbf2d6" /><circle r="34" fill="none" stroke="#f15d41" strokeOpacity=".35" strokeWidth="2" /></g>
          <g transform="translate(342 295)"><circle r="17" fill="#314dc6" /><circle r="5" fill="#fff" /><circle r="27" fill="none" stroke="#314dc6" strokeOpacity=".35" strokeWidth="2" /></g>
          <g transform="translate(170 350)"><circle r="14" fill="#f2b844" /><circle r="4" fill="#fff" /><circle r="23" fill="none" stroke="#c28b23" strokeOpacity=".4" strokeWidth="2" /></g>
          <g transform="translate(593 284)"><circle r="12" fill="#738f48" /><circle r="4" fill="#fff" /></g>
        </g>
        <g className="landing-map-label" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" letterSpacing="1.3" fill="#263d3e">
          <text x="452" y="97">PALM JUMEIRAH</text><text x="367" y="340">DOWNTOWN</text><text x="122" y="390">MARINA</text><text x="553" y="316">CREEK</text>
        </g>
        <g transform="translate(530 391) rotate(-13)" filter="url(#soft-shadow)">
          <rect width="143" height="88" rx="4" fill="#f8f5e9" />
          <text x="14" y="23" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" letterSpacing="1.2" fill="#6f7d70">SIGNAL / 024</text>
          <text x="14" y="50" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700" fill="#202b2c">3 new matches</text>
          <path d="M14 67h112" stroke="#d5d3c5" /><circle cx="20" cy="77" r="3" fill="#ef7254" /><text x="29" y="80" fontFamily="Arial, sans-serif" fontSize="8" fill="#54605b">MARINA · 4 MIN AGO</text>
        </g>
      </svg>
      <div className="landing-map-caption"><span>Not a map of properties.</span><span>A map of what matters.</span></div>
      <span className="landing-map-index">DXB—01 / 2026</span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link className="landing-brand" href="/" aria-label="Dune home"><span className="landing-brand-mark"><i /><i /><i /></span><span>DUNE<span className="landing-brand-dot">.</span></span></Link>
        <div className="landing-nav-center"><a href="#why">A different way to work</a><span>Dubai, UAE <i /></span></div>
        <Link className="landing-nav-cta" href="/login">Enter the workspace <MoveUpRight size={15} /></Link>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-kicker"><span className="landing-kicker-line" /> REAL ESTATE, WITH THE NOISE TURNED DOWN</div>
          <h1>The city is loud.<br /><em>Your signal</em><br />should be clear<span className="landing-title-stop">.</span></h1>
          <p className="landing-hero-description">A sharper view of Dubai property conversations. Find the signal, give it context, and let good work move at its own pace.</p>
          <div className="landing-hero-actions"><Link href="/login" className="landing-primary-cta">Step inside <ArrowUpRight size={17} /></Link><a href="#why" className="landing-text-cta">See what we mean <ArrowDownRight size={16} /></a></div>
          <div className="landing-note"><span className="landing-note-symbol">✳</span><span>Made for people who know<br />a good conversation takes time.</span></div>
        </div>
        <div className="landing-hero-art"><div className="landing-art-orbit landing-art-orbit-a" /><div className="landing-art-orbit landing-art-orbit-b" /><div className="landing-art-sun" /><div className="landing-art-stamp">LESS<br />CHASE.<br /><b>MORE<br />CONTEXT.</b></div><div className="landing-art-coordinates">25° 12' 17.3" N<br />55° 16' 17.8" E</div><DubaiSignalMap /></div>
        <div className="landing-scroll-cue"><span>SCROLL TO FIND THE POINT</span><span className="landing-scroll-line" /></div>
        <div className="landing-side-index">FIELD STUDY&nbsp; / &nbsp;NO. 01</div>
      </section>

      <section className="landing-strip" aria-label="Product principles"><span>BUILT FOR THE IN-BETWEEN</span><i /> LEADS WITH CONTEXT <i /> PROPERTY WITH PURPOSE <i /> FOLLOW-THROUGH, NOT FOLLOW-UP <i /> A LITTLE MORE HUMAN <i /></section>

      <section id="why" className="landing-why">
        <div className="landing-why-heading"><div className="landing-kicker landing-kicker-dark"><span className="landing-kicker-line" /> A BETTER WAY TO PAY ATTENTION</div><h2>Less dashboard.<br /><span>More <em>perspective.</em></span></h2><p>Tools should give your attention back. Dune brings the moving pieces into focus, then gets out of the way.</p></div>
        <div className="landing-signal-list">{signals.map((signal) => <article className="landing-signal-row" key={signal.number}><span className="landing-signal-number">{signal.number}</span><div><h3>{signal.title}</h3><p>{signal.body}</p></div><ArrowUpRight className="landing-signal-arrow" size={20} /></article>)}</div>
        <div className="landing-why-orbit" aria-hidden="true"><span>ATTENTION</span><div><i /><i /><i /></div></div>
      </section>

      <section className="landing-last-call"><div className="landing-last-call-art"><span>GOOD WORK<br />MOVES QUIETLY</span><div className="landing-last-call-orb" /><div className="landing-last-call-ring" /></div><div className="landing-last-call-copy"><span className="landing-kicker"><span className="landing-kicker-line" /> YOUR NEXT CONVERSATION STARTS HERE</span><h2>Make room<br />for <em>the real thing.</em></h2><Link href="/login" className="landing-primary-cta">Enter the workspace <ArrowRight size={17} /></Link></div></section>

      <footer className="landing-footer"><Link className="landing-brand" href="/"><span className="landing-brand-mark"><i /><i /><i /></span><span>DUNE<span className="landing-brand-dot">.</span></span></Link><span>REAL ESTATE INTELLIGENCE / DUBAI</span><span>BUILT FOR BETTER CONVERSATIONS&nbsp; ✳</span></footer>
    </main>
  );
}
