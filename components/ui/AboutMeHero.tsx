"use client";

/**
 * components/ui/AboutMeHero.tsx
 *
 * Stellar Orbital Observatory hero section at the top of the portfolio.
 * The background is transparent so the dynamic WebGL2 interactive nebula shines through.
 */

const SKILLS = [
  "Python",
  "Deep Learning",
  "NLP",
  "Scalable ML Systems",
  "Agentic AI Architectures",
];

export function AboutMeHero() {
  return (
    <section
      id="hero-section"
      className="relative flex min-h-screen w-full max-w-[100vw] flex-col items-center justify-center px-4 sm:px-8 overflow-hidden bg-transparent"
    >
      {/* ── Content Container (Clean, unobstructed WebGL view) ────── */}
      <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-4xl">
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
          <span className="hidden sm:inline-block text-slate-400">·</span>
          <span className="text-starlight-gold font-semibold">
            AI/LLM Intern · Sstudize
          </span>
        </div>

        {/* Interactive Starlight Skill Constellation */}
        <div
          data-mascot-interest="skills"
          className="flex flex-wrap justify-center gap-2.5 max-w-2xl mt-1"
        >
          {SKILLS.map((skill) => (
            <div
              key={skill}
              data-mascot-interest="skill"
              data-skill-name={skill.toLowerCase()}
              className="skill-badge group relative inline-flex items-center rounded-xl border border-white/10 bg-void-black/40 px-4 py-2 font-mono text-xs font-medium text-starlight-white backdrop-blur-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-nebula-violet/60 hover:bg-nebula-violet/25 hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:-translate-y-0.5 cursor-default"
            >
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
