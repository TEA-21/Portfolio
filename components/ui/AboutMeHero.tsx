"use client";

/**
 * components/ui/AboutMeHero.tsx
 *
 * Stellar Orbital Observatory hero section at the top of the portfolio.
 * The background is transparent so the dynamic WebGL2 interactive nebula shines through.
 */

import { Badge } from "@/components/ui/badge";

const SKILLS = [
  { name: "Python", symbol: "λ" },
  { name: "Deep Learning", symbol: "◈" },
  { name: "NLP", symbol: "✦" },
  { name: "Scalable ML Systems", symbol: "⬡" },
  { name: "Agentic AI Architectures", symbol: "✧" },
];

/* Celestial downward chevron */
function ScrollChevron() {
  return (
    <a
      href="#domain-map"
      aria-label="Scroll to celestial project galaxy"
      className="flex flex-col items-center gap-1.5 group pointer-events-auto transition-transform hover:translate-y-1"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-slate-400 group-hover:text-starlight-gold transition-colors">
        ORBITAL TELEMETRY ◈ SCROLL
      </span>
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md group-hover:border-nebula-violet/50 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.35)] transition-all">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-nebula-lavender group-hover:text-starlight-gold transition-colors"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </a>
  );
}

export function AboutMeHero() {
  return (
    <section
      id="hero-section"
      className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 sm:px-8 overflow-hidden bg-transparent"
    >
      {/* ── Content Container (Clean, unobstructed WebGL view) ────── */}
      <div className="relative z-10 flex flex-col items-center text-center gap-7 max-w-4xl pt-8">
        {/* Celestial Observatory Status Badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-nebula-violet/30 bg-nebula-violet/10 px-4 py-1.5 backdrop-blur-[2px] shadow-[0_0_20px_rgba(139,92,246,0.2)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-starlight-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-starlight-gold" />
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-nebula-lavender">
            STELLAR OBSERVATORY // AI ARCHITECT
          </span>
          <span className="font-mono text-starlight-gold/80 text-[10px]">
            [ORBIT NOMINAL]
          </span>
        </div>

        {/* Monumental Astronomical Headline */}
        <div className="relative w-full">
          {/* Subtle celestial orbital compass lines */}
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-nebula-violet/40 to-transparent" />

          <h1 className="font-mono text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-none">
            <span className="inline-block bg-gradient-to-b from-white via-starlight-white to-nebula-lavender bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(139,92,246,0.45)]">
              TAANUSH
            </span>
            <br />
            <span className="inline-block bg-gradient-to-r from-nebula-lavender via-white to-starlight-gold bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(251,191,36,0.35)]">
              ABRAHAM
            </span>
          </h1>
        </div>

        {/* Title & Institutional Affiliation */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 font-mono text-xs sm:text-sm text-slate-100 tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
          <span className="text-nebula-lavender font-semibold">
            B.Tech Computer Science · VIT Vellore
          </span>
          <span className="hidden sm:inline-block text-slate-400">✦</span>
          <span className="text-starlight-gold font-semibold">
            AI/LLM Intern · Sstudize
          </span>
        </div>

        {/* Astronomical Divider */}
        <div className="flex items-center gap-4 w-full max-w-md drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-nebula-violet/40" />
          <span className="font-mono text-[10px] text-starlight-gold uppercase tracking-[0.3em] font-semibold">
            CORE SPECIALIZATIONS
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-nebula-violet/40" />
        </div>

        {/* Interactive Starlight Skill Constellation */}
        <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl">
          {SKILLS.map((skill) => (
            <div
              key={skill.name}
              className="group relative inline-flex items-center gap-2 rounded-xl border border-white/10 bg-void-black/40 px-3.5 py-1.5 font-mono text-xs font-medium text-starlight-white backdrop-blur-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-nebula-violet/60 hover:bg-nebula-violet/25 hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:-translate-y-0.5 cursor-default"
            >
              <span className="text-starlight-gold/90 group-hover:scale-110 transition-transform">
                {skill.symbol}
              </span>
              <span>{skill.name}</span>
            </div>
          ))}
        </div>

        {/* Mission Status Line */}
        <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-void-black/40 px-6 py-2 font-mono text-xs text-slate-100 tracking-widest backdrop-blur-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.6)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <span className="text-starlight-gold animate-pulse">◈</span>
          <span>BUILDING SCALABLE INTELLIGENT SYSTEMS ACROSS THE DIGITAL COSMOS</span>
        </div>
      </div>

      {/* ── Scroll Indicator ─────────────────────────────────────── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <ScrollChevron />
      </div>
    </section>
  );
}
