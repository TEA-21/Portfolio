"use client";

/**
 * components/ui/ProjectWebGraph.tsx
 *
 * 3D Hierarchical Solar System Orbit Engine & Cosmic Telemetry Console.
 *
 * ARCHITECTURAL SPECIFICATIONS
 * ────────────────────────────
 * 1. Level 1 (Galactic Core):
 *    Incandescent Supernova Star with violet corona flares at [0, 0, 0].
 * 2. Level 2 (Topic Stars):
 *    5 Technical Domains orbiting on mathematical 3D tracks with harmonic phase locking.
 * 3. Level 3 (Project Moons):
 *    12 projects revolving in 3D around their respective topic stars.
 * 4. Full 3D Navigation:
 *    User can drag to rotate/tilt the orbital plane in true 3D, scroll to zoom in/out, and click any moon
 *    to inspect full project telemetry, architecture, and live links.
 * 5. Telemetry & Cosmic Glass HUD:
 *    4-corner celestial telemetry instruments (Radar sweep, Coordinate Compass, Telemetry Waveform, Oscilloscope)
 *    and top control panel with orbital speed controls ([ PAUSE ], [ 1x SPEED ], [ 2x SPEED ]).
 */

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { DYNAMIC_CATEGORIES, ALL_PROJECTS, type Project } from "@/lib/projects";
import { playHoverSound, playSelectSound, playTransitionSound } from "@/lib/audio";
import { usePortfolioStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Dynamically import Three.js 3D Solar System to guarantee zero SSR hydration mismatches
const PlanetarySolarSystem = dynamic(
  () => import("@/components/canvas/PlanetarySolarSystem").then((mod) => mod.PlanetarySolarSystem),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-void-black font-mono text-nebula-violet">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-nebula-violet/20 rounded-full animate-ping" />
          <div className="absolute w-12 h-12 border-2 border-nebula-violet border-t-transparent rounded-full animate-spin" />
          <div className="w-3 h-3 bg-starlight-gold rounded-full" />
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-nebula-lavender">
            [ INITIALIZING 3D HIERARCHICAL ORBIT ENGINE ]
          </p>
          <p className="text-[10px] text-slate-400 tracking-wider mt-1">
            MAPPING 5 TECHNICAL DOMAINS & 12 REPOSITORIES
          </p>
        </div>
      </div>
    ),
  }
);

export function ProjectWebGraph() {
  const selectedProjectId = usePortfolioStore((s) => s.selectedProjectId);
  const setSelectedProjectId = usePortfolioStore((s) => s.setSelectedProjectId);
  const isSolarTourActive = usePortfolioStore((s) => s.isSolarTourActive);
  const isSpeedRunActive = usePortfolioStore((s) => s.isSpeedRunActive);
  const speedRunStepIndex = usePortfolioStore((s) => s.speedRunStepIndex);
  const speedRunProjects = usePortfolioStore((s) => s.speedRunProjects);
  const nextSpeedRunStep = usePortfolioStore((s) => s.nextSpeedRunStep);
  const endSpeedRunTour = usePortfolioStore((s) => s.endSpeedRunTour);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isControlsEngaged, setIsControlsEngaged] = useState<boolean>(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const isEngaged = isControlsEngaged || isSolarTourActive || isSpeedRunActive;

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return ALL_PROJECTS.find((p) => p.id === selectedProjectId) || null;
  }, [selectedProjectId]);

  const handleCloseModal = useCallback(() => {
    playSelectSound();
    setSelectedProjectId(null);
    if (isSpeedRunActive) {
      endSpeedRunTour();
    }
  }, [isSpeedRunActive, setSelectedProjectId, endSpeedRunTour]);

  const handleEngageControls = useCallback(() => {
    playSelectSound();
    setIsControlsEngaged(true);
    window.dispatchEvent(
      new CustomEvent("mascot-inspect-component", {
        detail: {
          text: "Entering Galactic Supernova Project Core! Choose an orbit to inspect.",
          force: true,
        },
      })
    );
  }, []);

  const handleDetachControls = useCallback(() => {
    playSelectSound();
    setIsControlsEngaged(false);
  }, []);

  // Global Escape key listener: dismisses open modal first, else detaches pilot controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedProjectId) {
          handleCloseModal();
        } else if (isControlsEngaged) {
          handleDetachControls();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProjectId, isControlsEngaged, handleCloseModal, handleDetachControls]);

  // Auto-detach controls when scrolling far outside canvas view
  useEffect(() => {
    if (!isControlsEngaged || selectedProjectId) return;
    const container = canvasContainerRef.current;
    if (!container) return;

    let wasIntersecting = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          wasIntersecting = true;
        } else if (wasIntersecting) {
          // Only detach after container was confirmed visible and user scrolled away
          setIsControlsEngaged(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isControlsEngaged, selectedProjectId]);

  return (
    <section
      id="interactive-project-web"
      data-mascot-interest="projects"
      className="relative w-full px-2 sm:px-6 lg:px-12 py-16 min-h-screen bg-transparent overflow-hidden select-none"
    >
      {/* Main Console Container */}
      <div className="relative z-10 max-w-[1360px] mx-auto flex flex-col gap-6">

        {/* ── Section Header (Featured Systems & Repositories) ── */}
        <div className="flex flex-col gap-2.5 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-nebula-violet animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-nebula-lavender">
              ORBITAL OBSERVATORY · 12 REPOSITORIES & 5 DOMAINS
            </span>
          </div>
          <h2 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            FEATURED SYSTEMS & REPOSITORIES
          </h2>
          <p className="font-sans text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Interactive multi-tier orbital model mapping core architectures from deep learning pipelines to decentralized security protocols.
          </p>
        </div>

        {/* ── Main 3D Constellation Canvas ── */}
        <div
          ref={canvasContainerRef}
          className="relative w-full h-[680px] rounded-3xl border border-white/10 bg-transparent overflow-hidden group"
        >
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── 3D THREE.JS SOLAR SYSTEM ENGINE ── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className={`absolute inset-0 w-full h-full ${isEngaged ? "pointer-events-auto" : "pointer-events-none"}`}>
            <PlanetarySolarSystem
              onSelectProject={(id) => {
                playSelectSound();
                playTransitionSound();
                setSelectedProjectId(id);
              }}
              speedMultiplier={speedMultiplier}
              isInteractive={isEngaged}
            />
          </div>

          {/* ── Observation Deck Ambient CTA Overlay (Inactive State) ── */}
          {!isEngaged && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-void-black/30 backdrop-blur-[1px] pointer-events-none transition-all duration-300">
              <button
                type="button"
                onClick={handleEngageControls}
                onMouseEnter={() => playHoverSound()}
                className="pointer-events-auto group/btn flex items-center gap-3 px-6 py-3.5 rounded-2xl border border-nebula-violet/60 bg-slate-950/85 font-mono text-xs font-bold text-nebula-lavender shadow-[0_0_25px_rgba(139,92,246,0.35)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] hover:border-nebula-violet hover:text-white hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-md"
              >
                <span className="w-2 h-2 rounded-full bg-nebula-violet animate-ping" />
                <span className="tracking-wider uppercase">ENTER ORBITAL SYSTEM</span>
                <span className="text-starlight-gold group-hover/btn:translate-x-1 transition-transform">➔</span>
              </button>
              <span className="font-mono text-[10px] text-slate-400 mt-2.5 tracking-wider uppercase drop-shadow">
                Observational Deck · Click to pilot 3D camera & zoom into orbits
              </span>
            </div>
          )}

          {/* ── Floating Pilot Mode Detach Button (Active State) ── */}
          {isEngaged && !isSolarTourActive && !isSpeedRunActive && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto animate-fade-in">
              <button
                type="button"
                onClick={handleDetachControls}
                onMouseEnter={() => playHoverSound()}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/20 bg-void-black/85 font-mono text-[11px] font-bold text-slate-300 hover:text-white hover:border-rose-400/60 hover:bg-rose-500/15 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                title="Return to Observation Deck (Escape)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PILOT MODE</span>
                <span className="text-slate-500">|</span>
                <span className="text-rose-400 font-semibold">[ DETACH (ESC) ✕ ]</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Speed Control ── */}
        <div className="flex flex-wrap items-center justify-end gap-4 font-mono text-xs text-slate-300 border-t border-white/10 pt-4 px-2">
          {/* Discreet Speed Controls */}
          <div className="flex items-center gap-1 bg-void-black/60 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                setSpeedMultiplier(0);
              }}
              className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                speedMultiplier === 0
                  ? "bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.35)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              PAUSE
            </button>
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                setSpeedMultiplier(1);
              }}
              className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                speedMultiplier === 1
                  ? "bg-nebula-violet/25 text-nebula-lavender border border-nebula-violet/50 shadow-[0_0_12px_rgba(139,92,246,0.35)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              1x SPEED
            </button>
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                setSpeedMultiplier(2);
              }}
              className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                speedMultiplier === 2
                  ? "bg-starlight-gold/25 text-starlight-gold border border-starlight-gold/50 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              2x SPEED
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── PROJECT DETAIL INSPECTION MODAL (DEEP TRANSLUCENT OBSIDIAN GLASS) ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void-black/40 backdrop-blur-[2px] transition-all duration-300 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            id="project-detail-modal-panel"
            className="relative w-full max-w-xl rounded-2xl p-7 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200 border border-nebula-violet/30 bg-[#090d1d]/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(139,92,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] font-bold text-starlight-gold uppercase tracking-widest">
                    [ REPOSITORY TELEMETRY ]
                  </span>
                  <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 font-bold uppercase">
                    {selectedProject.status}
                  </span>
                </div>
                <h3 className="font-mono text-2xl font-black text-white drop-shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                  {selectedProject.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleCloseModal();
                }}
                className="interactive group flex items-center gap-1.5 font-mono text-xs font-bold px-3.5 py-1.5 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-rose-500/20 hover:border-rose-400/60 hover:text-rose-200 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <span>[ CLOSE</span>
                <span className="text-starlight-gold group-hover:text-rose-300">✕</span>
                <span>]</span>
              </button>
            </div>

            {/* Mapped Categories Badges */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-starlight-gold uppercase tracking-widest">
                BRIDGED TECHNICAL DOMAINS:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedProject.categoryIds.map((catId) => {
                  const catObj = DYNAMIC_CATEGORIES.find((c) => c.id === catId);
                  if (!catObj) return null;
                  return (
                    <span
                      key={catId}
                      className="font-mono text-xs font-semibold px-3 py-1 rounded-md border backdrop-blur-md"
                      style={{
                        color: catObj.accentHex,
                        borderColor: `${catObj.accentHex}66`,
                        backgroundColor: `${catObj.accentHex}15`,
                      }}
                    >
                      {catObj.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-starlight-gold uppercase tracking-widest">
                PROJECT OVERVIEW:
              </span>
              <p className="font-sans text-sm text-slate-200 leading-relaxed">
                {selectedProject.longDesc}
              </p>
            </div>

            {/* Tech Stack Tags */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-starlight-gold uppercase tracking-widest">
                TECH STACK:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedProject.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md font-mono text-xs bg-white/5 border border-white/10 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 mt-1">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                REPO: {selectedProject.repoName}
              </span>
              <div className="flex items-center gap-3">
                {selectedProject.demoUrl && (
                  <a
                    href={selectedProject.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => playSelectSound()}
                    className="interactive font-mono text-xs font-bold px-4 py-2 rounded-xl border border-starlight-gold/50 bg-starlight-gold/15 text-starlight-gold hover:bg-starlight-gold/25 hover:shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-all cursor-pointer"
                  >
                    [ LIVE DEMO ↗ ]
                  </a>
                )}
                <a
                  href={selectedProject.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => playHoverSound()}
                  onClick={() => playSelectSound()}
                  className="interactive font-mono text-xs font-bold px-4 py-2 rounded-xl border border-nebula-violet/50 bg-nebula-violet/20 text-nebula-lavender hover:bg-nebula-violet/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all cursor-pointer"
                >
                  [ VIEW REPOSITORY ON GITHUB ↗ ]
                </a>
              </div>
            </div>

            {/* ── Dedicated Speed Run Tour Navigation Bar ── */}
            {isSpeedRunActive && (
              <div className="flex items-center justify-between border-t border-nebula-violet/30 pt-3 mt-1 bg-void-black/70 -mx-7 -mb-7 p-4 px-7 rounded-b-2xl">
                <span className="font-mono text-xs font-bold text-starlight-gold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-nebula-violet animate-pulse" />
                  [ TOUR STEP {speedRunStepIndex + 1} OF {speedRunProjects.length} ]
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                    }}
                    className="font-mono text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:border-white/40 transition-all cursor-pointer"
                  >
                    [ END TOUR ✕ ]
                  </button>
                  {speedRunStepIndex < speedRunProjects.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        playSelectSound();
                        playTransitionSound();
                        nextSpeedRunStep();
                      }}
                      className="font-mono text-xs font-bold px-4 py-1.5 rounded-xl border border-nebula-violet/60 bg-nebula-violet/20 text-nebula-lavender hover:bg-nebula-violet/35 hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
                    >
                      [ NEXT PROJECT ➔ ]
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playSelectSound();
                        playTransitionSound();
                        setSelectedProjectId(null);
                        endSpeedRunTour();
                        window.dispatchEvent(new CustomEvent("tour-finished"));
                      }}
                      className="font-mono text-xs font-bold px-4 py-1.5 rounded-xl border border-starlight-gold/60 bg-starlight-gold/20 text-starlight-gold hover:bg-starlight-gold/35 hover:shadow-[0_0_20px_rgba(251,191,36,0.45)] transition-all cursor-pointer animate-pulse"
                    >
                      [ FINISH TOUR ★ ]
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
