"use client";

/**
 * components/ui/BioDetails.tsx
 *
 * Detailed biographical section sitting immediately below the Hero section.
 * Features frosted obsidian glassmorphism, celestial telemetry metadata,
 * the floating MascotCompanion NPC probe, and an orbital rotating lens housing
 * the photorealistic cyber-astronaut portrait.
 */

import Image from "next/image";

export function BioDetails() {
  return (
    <section
      id="bio-details-section"
      className="relative w-full px-4 sm:px-8 lg:px-16 py-16 bg-transparent overflow-hidden"
    >
      {/* ── Crystalline Glassmorphic Dossier Card ─────────────────── */}
      <div data-mascot-interest="dossier" className="max-w-6xl mx-auto rounded-3xl border border-white/10 bg-void-black/30 backdrop-blur-[2px] p-6 sm:p-10 lg:p-12 shadow-[0_16px_50px_0_rgba(0,0,0,0.6),inset_0_1px_1px_0_rgba(255,255,255,0.15)] relative z-10 transition-all hover:border-nebula-violet/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* ── Left Column (Biographical Narrative & Probe) ────────── */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <h2 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              ABOUT ME
            </h2>

            <div className="flex flex-col gap-4 font-sans text-sm sm:text-base leading-relaxed text-slate-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              <p>
                I'm a B.Tech CS student at VIT Vellore and an AI/LLM Intern at Sstudize, specializing in architecting intelligent systems that scale reliably in high-throughput production environments. My core technical investments center on Python, Deep Learning, and NLP, with a principal focus on designing autonomous agentic AI frameworks and bridging the hardware-software frontier.
              </p>
              <p>
                From engineering decentralized identity protocols using <span data-mascot-interest="skill" data-skill-name="zk" className="skill-badge text-nebula-lavender font-medium underline decoration-nebula-violet/50 cursor-pointer">Zero-Knowledge Proofs</span> to quantizing and deploying micro-SLMs on <span data-mascot-interest="skill" data-skill-name="esp32" className="skill-badge text-starlight-gold font-medium underline decoration-amber-400/40 cursor-pointer">ESP32 microcontrollers</span>, I treat complex bottlenecks in security and machine learning like high-stakes boss fights. When I'm not orchestrating multi-agent pipelines, I'm grinding out trophies in the Clash Royale arena, clutching rounds in Valorant, or managing my private Minecraft server infrastructure. I build tools for automation, resilience, and maximum performance.
              </p>
            </div>
          </div>

          {/* ── Right Column (Orbital Portrait Lens) ────────────────── */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative flex items-center justify-center w-72 h-72 sm:w-80 sm:h-80">
              {/* Outer Rotating Starlight Orbit Ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-nebula-violet/40 animate-orbit-cw pointer-events-none" />

              {/* Inner Counter-Rotating Golden Telemetry Ring */}
              <div className="absolute inset-3 rounded-full border border-starlight-gold/30 animate-orbit-ccw pointer-events-none" />

              {/* The Celestial Cyber-Astronaut Portrait Lens */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-2 border-nebula-violet/60 shadow-[0_0_35px_rgba(139,92,246,0.35)] group">
                <Image
                  src="/profile.jpg"
                  alt="Taanush Abraham — AI Architect & Celestial Technologist"
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />

                {/* Frosted rim vignette overlay */}
                <div className="absolute inset-0 pointer-events-none rounded-full ring-1 ring-inset ring-white/20 shadow-[inset_0_0_30px_rgba(3,7,18,0.7)]" />

                {/* Soft purple nebula reflection sweep */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-nebula-violet/25 via-transparent to-starlight-gold/15 mix-blend-screen opacity-60 group-hover:opacity-80 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
