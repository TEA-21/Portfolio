"use client";

/**
 * components/ui/PixelAstronaut.tsx
 *
 * True Chibi Mascot ("ARIA Cadet") Sprite Engine.
 * 60:40 Head-to-Body Proportion (Modeled on Chibi Iron Man / Nendoroid aesthetic).
 *
 * ARCHITECTURAL SPECIFICATIONS:
 * ─────────────────────────────
 * • 60:40 Head-to-Body Ratio:
 *     - Giant ~18px dome helmet (Y=1..19)
 *     - Compact 6px stealth armor torso (Y=20..23) with neon cyan piping & glowing arc reactor
 *     - Chunky 7px legs & magnetic gold boot soles (Y=24..30)
 * • Visor & Pilot Inside:
 *     - Starlight Gold bevel rim (#FACC15, #FFF066, #D97706)
 *     - Transparent cosmic glass visor interior (#0D1527) with curved specular gleam arc (#FFFFFF)
 *     - Warm peach skin (#FDBA74) & rosy cheek blush (#FB7185)
 *     - Floating midnight navy hair (#0F172A) with neon cyan highlights (#00F5FF)
 * • Expressive Anime Eyes (Strictly Absolute M... M... coordinates for 100% symmetry):
 *     - Randomized natural blink cycle (2.8s - 4.5s with snappy double blink)
 *     - Dynamic idle gaze shifting (center, left, right)
 *     - Pose-reactive anime expressions:
 *         * idle: 6x5 large anime eyes with starlight pupils & white catchlights
 *         * thrust: fierce slanted anime sprint eyes with cyan sparks & thruster flames
 *         * drag: huge shocked round eyes (O_O) with pinpoint pupils & open 'O' mouth
 *         * wave: joyful crescent arch eyes (^ ^), smiling mouth, blush & waving gold gauntlet
 *         * spin: dizzy X X tumbling pupils with plasma thrusters
 *         * transmitting: concentric radio rings & cyan scanline glint across visor
 * • Consolidated <path> Architecture: Strictly < 25 DOM elements with shape-rendering="crispEdges".
 */

import React, { memo, useState, useEffect, useRef } from "react";

export type AstronautPose =
  | "idle"
  | "thrust"
  | "drag"
  | "spin"
  | "wave"
  | "transmitting"
  | "scan"
  | "cheer"
  | "snooze"
  | "poke";

export interface PixelAstronautProps {
  pose?: AstronautPose;
  size?: number;
  flipX?: boolean;
  className?: string;
  cursorGaze?: "center" | "left" | "right" | "up" | "down";
}

export const PixelAstronaut = memo(function PixelAstronaut({
  pose = "idle",
  size = 58,
  flipX = false,
  className = "",
  cursorGaze,
}: PixelAstronautProps) {
  const isThrusting = pose === "thrust" || pose === "spin";
  const isTransmitting = pose === "transmitting";
  const isWaving = pose === "wave";
  const isDragging = pose === "drag";
  const isSpinning = pose === "spin";
  const isScanning = pose === "scan";
  const isCheering = pose === "cheer";
  const isSnoozing = pose === "snooze";
  const isPoking = pose === "poke";

  // ── Expressive Dynamic Blink & Gaze State ──────────────────────────
  const [isBlinking, setIsBlinking] = useState(false);
  const [gaze, setGaze] = useState<"center" | "left" | "right">("center");
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gazeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effective gaze combines cursor tracking with natural idle wander
  const effectiveGaze = cursorGaze ?? gaze;

  // Randomized Natural Blink Cycle (2.8s - 4.5s, 100ms duration, 22% double-blink)
  useEffect(() => {
    let isMounted = true;

    const scheduleNextBlink = () => {
      const delay = 2800 + Math.random() * 1700;
      blinkTimerRef.current = setTimeout(() => {
        if (!isMounted) return;
        setIsBlinking(true);

        const isDoubleBlink = Math.random() < 0.22;
        setTimeout(() => {
          if (!isMounted) return;
          setIsBlinking(false);

          if (isDoubleBlink) {
            setTimeout(() => {
              if (!isMounted) return;
              setIsBlinking(true);
              setTimeout(() => {
                if (!isMounted) return;
                setIsBlinking(false);
                scheduleNextBlink();
              }, 90);
            }, 80);
          } else {
            scheduleNextBlink();
          }
        }, 100);
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      isMounted = false;
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // Idle Dynamic Gaze Shifts (center, left, right)
  useEffect(() => {
    if (pose !== "idle") {
      setGaze("center");
      return;
    }

    let isMounted = true;
    const scheduleNextGaze = () => {
      const delay = 1800 + Math.random() * 1600;
      gazeTimerRef.current = setTimeout(() => {
        if (!isMounted) return;
        const roll = Math.random();
        if (roll < 0.5) setGaze("center");
        else if (roll < 0.75) setGaze("left");
        else setGaze("right");
        scheduleNextGaze();
      }, delay);
    };

    scheduleNextGaze();

    return () => {
      isMounted = false;
      if (gazeTimerRef.current) clearTimeout(gazeTimerRef.current);
    };
  }, [pose]);

  // Scarf flutter animation class based on motion state
  const scarfAnimClass = isThrusting ? "animate-totm-scarf-dash" : "animate-totm-scarf-wave";

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
    >
      {/* ── Transmitting Radio Rings ───────────────────────────────── */}
      {isTransmitting && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center">
          <span className="absolute w-8 h-8 rounded-full border border-nebula-violet/80 animate-ping opacity-75" />
          <span className="absolute w-12 h-12 rounded-full border border-starlight-gold/60 animate-pulse" />
        </div>
      )}

      {/* ── 32x32 Pixel Art SVG (<25 Elements, Zero DOM Thrashing) ──── */}
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className={`w-full h-full transition-transform duration-150 ${
          isDragging ? "scale-105" : ""
        } ${
          isPoking ? "scale-110 animate-bounce" : ""
        } ${
          isSnoozing ? "animate-pulse" : "animate-totm-aura"
        }`}
        shapeRendering="crispEdges"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="chibi-cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#C4B5FD" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* 1. JETPACK THRUSTER CANISTERS (Titanium Slate #334155 & #64748B) */}
        <path d="M6 19h3v5H6zM23 19h3v5h-3z" fill="#334155" />
        <path d="M6 21h1v3H6zM25 21h1v3h-1z" fill="#64748B" />

        {/* 2. THRUSTER FLICKERING FLAMES (Thrust & Spin Modes) */}
        {isThrusting && (
          <g className="animate-totm-thruster">
            {/* Outer Orange Flame */}
            <path d="M6 24h3v5H6zM23 24h3v5h-3z" fill="#F97316" />
            {/* Inner Gold Flame */}
            <path d="M6 24h3v3H6zM23 24h3v3h-3z" fill="#FACC15" />
            {/* Hot Gold Plasma Tip */}
            <path d="M7 28h1v2H7zM24 28h1v2h-1z" fill="#FEF08A" />
          </g>
        )}

        {/* 3. FLAPPING ZERO-G SCARF (Connected at collar x=8..10, y=19..20) */}
        <g className={scarfAnimClass}>
          {/* Obsidian Border */}
          <path
            d="M8 19h3v1H8zm-3 2h4v1H5zm-3 2h4v1H2zm-1 2h3v1H1z"
            fill="#090D16"
          />
          {/* Deep Violet Shadow */}
          <path
            d="M8 21h3v1H8zm-3 2h4v1H5zm-2 2h3v1H3z"
            fill="#6D28D9"
          />
          {/* Nebula Violet Main Fabric */}
          <path
            d="M8 20h3v1H8zm-3 1h4v2H5zm-3 2h3v2H2z"
            fill="#8B5CF6"
          />
          {/* Luminous Lavender Top Highlight */}
          <path
            d="M9 20h2v1H9zm-3 1h3v1H6zm-3 2h2v1H3z"
            fill="#C4B5FD"
          />
        </g>

        {/* 4. HELMET OUTLINE & OBSIDIAN ARMOR BASE (#090D16) */}
        <path
          d="M12 1h8v1h-8zM10 2h2v1h-2zm10 0h2v1h-2zM7 3h3v1H7zm15 0h3v1h-3zM5 4h2v2H5zm20 0h2v2h-2zM4 6h2v10H4zm22 0h2v10h-2zM5 16h2v2H5zm20 0h2v2h-2zM7 18h2v1H7zm16 0h2v1h-2zM9 19h2v1H9zm12 0h2v1h-2zM11 20h10v4H11zm-2 0h2v2H9zm12 0h2v2h-2zm-3 4h4v4h-4zm-6 0h4v4h-4zm-1 4h5v2h-5zm7 0h5v2h-5zm-1 1h6v1H9zm8 0h6v1h-6z"
          fill="#090D16"
        />

        {/* 5. HELMET STARLIGHT GOLD RIM (Bevel highlights & amber shadow) */}
        {/* Top Rim Highlight */}
        <path
          d="M12 2h8v1h-8zm-3 1h3v1H9zm11 0h3v1h-3zm-2 1h2v2h-2zm-12 0h2v2H6z"
          fill="#FFF066"
        />
        {/* Main Starlight Gold Rim */}
        <path
          d="M11 2h1v1h-1zm9 0h1v1h-1zM8 3h1v1H8zm15 0h1v1h-1zM6 4h1v2H6zm19 0h1v2h-1zM5 6h1v10H5zm21 0h1v10h-1zM6 16h1v2H6zm19 0h1v2h-1zM7 18h2v1H7zm16 0h2v1h-2zM10 19h12v1H10z"
          fill="#FACC15"
        />
        {/* Amber Shadow Accent */}
        <path
          d="M7 17h1v1H7zm17 0h1v1h-1zm-9 2h8v1h-8zm-2 1h12v1H10z"
          fill="#D97706"
        />

        {/* 6. TRANSPARENT COSMIC GLASS VISOR INTERIOR (#0D1527) */}
        <path
          d="M8 4h16v2H8zM7 6h18v10H7zm1 10h16v1H8zm2 1h12v1H10z"
          fill="#0D1527"
        />

        {/* 7. PILOT WARM PEACH SKIN (#FDBA74) */}
        <path
          d="M10 9h12v2H10zM8 11h16v5H8zm1 5h14v2H9zm2 2h10v1H11z"
          fill="#FDBA74"
        />

        {/* 8. PILOT FLOATING MIDNIGHT NAVY HAIR (#0F172A) */}
        <path
          d="M11 4h10v2H11zm-2 2h14v1H9zm-1 1h16v1H8zm0 1h4v1H8zm7 0h2v1h-2zm5 0h4v1h-4zm-8 1h3v2H7zm15 0h3v2h-3zm-15 2h2v2H7zm16 0h2v2h-2z"
          fill="#0F172A"
        />

        {/* 9. PILOT NEON LAVENDER HAIR HIGHLIGHTS (#C4B5FD) */}
        <path
          d="M13 5h2v1h-2zm4 0h2v1h-2zm-3 1h2v1h-2zm6 0h2v1h-2zm-5 2h2v1h-2z"
          fill="#C4B5FD"
        />

        {/* 10. ROSY CHEEK BLUSH (#FB7185) */}
        <path
          d={
            isPoking
              ? "M7 14h4v2H7zm14 0h4v2h-4z"
              : isWaving || isCheering
              ? "M8 15h3v2H8zm13 0h3v2h-3z"
              : "M8 15h2v1H8zm14 0h2v1h-2z"
          }
          fill="#FB7185"
        />

        {/* 11. EXPRESSIVE ANIME EYES SUITE (Strict Absolute M... M... Coordinates) */}
        {isBlinking ? (
          /* Natural 1px Anime Blink Slit */
          <g fill="#090D16">
            <path d="M8 12h8v1H8zM16 12h8v1h-8z" />
            <path d="M9 13h6v1H9zM17 13h6v1h-6z" />
          </g>
        ) : isSnoozing ? (
          /* Soft curved sleeping eyelid slits */
          <g fill="#090D16">
            <path d="M9 13h4v1H9zm10 0h4v1h-4z" />
            <path d="M10 12h2v1h-2zm10 0h2v1h-2z" />
          </g>
        ) : isPoking ? (
          /* Squeezed tickle eyes */
          <g fill="#090D16">
            <path d="M9 12h2v1H9zm2 1h2v1h-2zM17 12h2v1h-2zm2 1h2v1h-2z" />
            <path d="M9 14h2v-1H9zm2-1h2v-1h-2zM17 14h2v-1h-2zm2-1h2v-1h-2z" />
          </g>
        ) : isCheering ? (
          /* Glowing 4-point golden/cyan starlight stars (★ ★) */
          <g>
            <path d="M9 11h6v5H9zm8 0h6v5h-6z" fill="#0D1527" />
            <path d="M11 11h3v1h-3zm1-1h1v3h-1zM19 11h3v1h-3zm1-1h1v3h-1z" fill="#FACC15" />
            <path d="M12 11h1v1h-1zM20 11h1v1h-1z" fill="#FFFFFF" />
          </g>
        ) : isScanning ? (
          /* Determined Curious Visor Expression with Scanning Glint */
          <g>
            <path d="M9 11h6v5H9zm8 0h6v5h-6z" fill="#FFFFFF" />
            <path d="M10 12h4v4h-4zm8 0h4v4h-4z" fill="#090D16" />
            <path d="M11 14h2v2h-2zm8 0h2v2h-2z" fill="#C4B5FD" filter="url(#chibi-cyan-glow)" />
            <path d="M7 14h18v1H7z" fill="#C4B5FD" opacity="0.8" className="animate-pulse" filter="url(#chibi-cyan-glow)" />
          </g>
        ) : isWaving ? (
          /* Joyful Closed Anime Crescent Eyes (^ ^) */
          <g fill="#090D16">
            {/* Left Crescent */}
            <path d="M9 13h2v1H9zm2-1h2v1h-2zm2 1h2v1h-2z" />
            {/* Right Crescent */}
            <path d="M17 13h2v1h-2zm2-1h2v1h-2zm2 1h2v1h-2z" />
          </g>
        ) : isSpinning ? (
          /* Dizzy X X Tumbling Eyes */
          <g>
            {/* White Sclera */}
            <path d="M9 11h6v5H9zM17 11h6v5h-6z" fill="#FFFFFF" />
            {/* X X Pupils */}
            <path
              d="M10 12h1v1h1v1h-1v1h-1v-1h1v-1h-1zm3 0h1v1h-1v1h1v1h-1v-1h-1v-1h1zM18 12h1v1h1v1h-1v1h-1v-1h1v-1h-1zm3 0h1v1h-1v1h1v1h-1v-1h-1v-1h1z"
              fill="#090D16"
            />
            {/* Center Lavender Spark */}
            <path d="M12 13h1v1h-1zM20 13h1v1h-1z" fill="#C4B5FD" />
          </g>
        ) : isDragging ? (
          /* Shocked Round Eyes (O_O) with Pinpoint Pupils */
          <g>
            {/* Round White Sclera */}
            <path d="M9 10h6v6H9zM17 10h6v6h-6z" fill="#FFFFFF" />
            {/* Pinpoint Dark Pupils */}
            <path d="M11 12h2v2h-2zM19 12h2v2h-2z" fill="#090D16" />
            {/* Visor Panic Sweat Drops */}
            <path d="M24 7h1v2h-1zm1 1h1v3h-1z" fill="#C4B5FD" />
          </g>
        ) : isThrusting ? (
          /* Fierce Slanted Fast Sprint Eyes */
          <g>
            {/* White Sclera */}
            <path d="M9 12h6v4H9zM17 12h6v4h-6z" fill="#FFFFFF" />
            {/* Fierce Slanted Eyeliner */}
            <path
              d="M8 11h4v1H8zm4 1h4v1h-4zM20 11h4v1h-4zm-4 1h4v1h-4z"
              fill="#090D16"
            />
            {/* Sprint Pupils */}
            <path d="M11 12h4v4h-4zM17 12h4v4h-4z" fill="#090D16" />
            {/* Lavender Sparks */}
            <path
              d="M12 13h2v2h-2zM18 13h2v2h-2z"
              fill="#C4B5FD"
              filter="url(#chibi-cyan-glow)"
            />
            {/* White Catchlight */}
            <path d="M11 12h1v1h-1zM20 12h1v1h-1z" fill="#FFFFFF" />
          </g>
        ) : (
          /* Default Idle / Transmitting 6x5 Anime Eyes */
          <g>
            {/* Thick Anime Upper Eyelash Line */}
            <path
              d="M8 10h8v1H8zm8 0h8v1h-8zM8 11h1v1H8zm15 0h1v1h-1z"
              fill="#090D16"
            />
            {/* 6x5 White Sclera */}
            <path d="M9 11h6v5H9zm8 0h6v5h-6z" fill="#FFFFFF" />

            {/* Dynamic Pupils based on Gaze / Cursor tracking */}
            {effectiveGaze === "left" ? (
              <g>
                <path d="M9 11h4v5H9zm8 0h4v5h-4z" fill="#090D16" />
                <path
                  d="M10 13h2v2h-2zm8 0h2v2h-2z"
                  fill="#C4B5FD"
                  filter="url(#chibi-cyan-glow)"
                />
                <path d="M9 11h2v2H9zm8 0h2v2h-2zm2 3h1v1h-1zm8 0h1v1h-1z" fill="#FFFFFF" />
              </g>
            ) : effectiveGaze === "right" ? (
              <g>
                <path d="M11 11h4v5h-4zm8 0h4v5h-4z" fill="#090D16" />
                <path
                  d="M12 13h2v2h-2zm8 0h2v2h-2z"
                  fill="#C4B5FD"
                  filter="url(#chibi-cyan-glow)"
                />
                <path d="M11 11h2v2h-2zm8 0h2v2h-2zm2 3h1v1h-1zm8 0h1v1h-1z" fill="#FFFFFF" />
              </g>
            ) : effectiveGaze === "up" ? (
              <g>
                <path d="M10 11h4v4h-4zm8 0h4v4h-4z" fill="#090D16" />
                <path
                  d="M11 12h2v2h-2zm8 0h2v2h-2z"
                  fill="#C4B5FD"
                  filter="url(#chibi-cyan-glow)"
                />
                <path d="M10 11h2v2h-2zm8 0h2v2h-2z" fill="#FFFFFF" />
              </g>
            ) : effectiveGaze === "down" ? (
              <g>
                <path d="M10 12h4v4h-4zm8 0h4v4h-4z" fill="#090D16" />
                <path
                  d="M11 14h2v2h-2zm8 0h2v2h-2z"
                  fill="#C4B5FD"
                  filter="url(#chibi-cyan-glow)"
                />
                <path d="M10 12h2v2h-2zm8 0h2v2h-2z" fill="#FFFFFF" />
              </g>
            ) : (
              /* Center Gaze */
              <g>
                <path d="M10 11h4v5h-4zm8 0h4v5h-4z" fill="#090D16" />
                <path
                  d="M11 13h2v2h-2zm8 0h2v2h-2z"
                  fill="#C4B5FD"
                  filter="url(#chibi-cyan-glow)"
                />
                <path d="M10 11h2v2h-2zm8 0h2v2h-2zm2 3h1v1h-1zm8 0h1v1h-1z" fill="#FFFFFF" />
              </g>
            )}

            {/* Transmitting Visor Glint Line */}
            {isTransmitting && (
              <path
                d="M7 13h18v1H7z"
                fill="#C4B5FD"
                className="animate-pulse"
                filter="url(#chibi-cyan-glow)"
              />
            )}
          </g>
        )}

        {/* 12. EXPRESSIVE MOUTH */}
        {isDragging ? (
          /* Shocked Open 'O' Mouth */
          <g>
            <path d="M14 17h4v3h-4z" fill="#050811" />
            <path d="M15 18h2v2h-2z" fill="#F43F5E" />
          </g>
        ) : isWaving || isCheering ? (
          /* Cheerful Smiling Mouth */
          <g>
            <path d="M14 17h4v2h-4z" fill="#090D16" />
            <path d="M15 17h2v1h-2z" fill="#F43F5E" />
          </g>
        ) : isPoking ? (
          /* Cute Laughing Open Mouth */
          <g>
            <path d="M14 17h4v2h-4z" fill="#090D16" />
            <path d="M15 18h2v1h-2z" fill="#F43F5E" />
          </g>
        ) : isThrusting ? (
          /* Focused Sprint Clenched Intake Breath Line */
          <g>
            <path d="M14 17h4v1h-4z" fill="#090D16" />
            <path d="M15 17h2v1h-2z" fill="#C4B5FD" />
          </g>
        ) : isSpinning ? (
          /* Dizzy Mouth */
          <path d="M15 17h2v2h-2z" fill="#090D16" />
        ) : isSnoozing ? (
          /* Peaceful Resting Smile */
          <path d="M15 17h2v1h-2z" fill="#090D16" />
        ) : isScanning ? (
          /* Curious Focused Smirk */
          <g>
            <path d="M15 17h2v1h-2z" fill="#090D16" />
            <path d="M16 17h1v1h-1z" fill="#C4B5FD" />
          </g>
        ) : (
          /* Standard Cute Anime Mouth */
          <path d="M15 17h2v1h-2z" fill="#090D16" />
        )}

        {/* 13. CURVED SPECULAR REFLECTION ARC ON VISOR GLASS (#FFFFFF) */}
        <path
          d="M11 4h3v1h-3zM9 5h3v1H9zM8 6h2v1H8zm-1 1h2v1H7zm0 1h1v2H7zm0 3h1v1H7z"
          fill="#FFFFFF"
          opacity="0.8"
        />

        {/* 14. COMPACT TORSO DETAILS (Luminous Lavender Harness & Starlight Diamond Core) */}
        {/* Luminous Lavender Harness Piping */}
        <path d="M12 20h1v4h-1zm7 0h1v4h-1z" fill="#C4B5FD" />
        {/* Glowing Arc Reactor Diamond Core */}
        <path
          d="M15 21h2v2h-2z"
          fill="#C4B5FD"
          filter="url(#chibi-cyan-glow)"
          className={isTransmitting ? "animate-pulse" : ""}
        />
        <path d="M15 21h1v1h-1z" fill="#FFFFFF" />

        {/* 15. STARLIGHT GOLD BELT & COMPACT GAUNTLETS */}
        <path d="M11 23h10v1H11z" fill="#D97706" />
        <path d="M14 23h4v2h-4z" fill="#FACC15" />
        <path d="M15 23h2v1h-2z" fill="#FFF066" />
        {/* Compact Gauntlets (when not waving or cheering) */}
        {!isWaving && !isCheering && (
          <path d="M8 22h3v2H8zm13 0h3v2h-3z" fill="#FACC15" />
        )}

        {/* 16. CHUNKY LEGS & MAGNETIC GOLD BOOTS */}
        {/* Lavender Knee Stripes */}
        <path d="M11 26h4v1h-4zm6 0h4v1h-4z" fill="#C4B5FD" />
        {/* Magnetic Gold Boot Soles */}
        <path d="M9 30h6v1H9zm8 0h6v1h-6z" fill="#FACC15" />
        <path d="M9 29h1v1H9zm13 0h1v1h-1z" fill="#D97706" />

        {/* 17. ANTENNA MAST & BEACON */}
        <path d="M15 1h2v2h-2z" fill="#64748B" />
        <path
          d="M15 0h2v1h-2z"
          fill={isTransmitting ? "#C4B5FD" : "#FACC15"}
          className={isTransmitting ? "animate-ping" : ""}
          filter={isTransmitting ? "url(#chibi-cyan-glow)" : undefined}
        />

        {/* 18. WAVING GOLD GAUNTLET (Wave Pose) */}
        {isWaving && (
          <g className="origin-bottom-left animate-bounce">
            <path d="M24 8h3v4h-3zm2-3h2v3h-2z" fill="#FACC15" />
            <path d="M26 4h2v2h-2z" fill="#FFF066" />
          </g>
        )}

        {/* 19. CHEERING GOLD GAUNTLETS RAISED IN VICTORY (Cheer Pose) */}
        {isCheering && (
          <g className="animate-bounce">
            <path d="M6 9h3v4H6zm2-3h2v3H8zm13 3h3v4h-3zm2-3h2v3h-2z" fill="#FACC15" />
            <path d="M8 5h2v2H8zm13 0h2v2h-2z" fill="#FFF066" />
          </g>
        )}

        {/* 20. SNOOZING DRIFTING ZZZ LETTERS (Snooze Pose) */}
        {isSnoozing && (
          <g className="animate-bounce">
            <path d="M22 3h3v1l-2 2h2v1h-3v-1l2-2h-2z" fill="#FACC15" />
            <path d="M24 0h2v1l-1 1h1v1h-2v-1l1-1h-1z" fill="#C4B5FD" opacity="0.8" />
          </g>
        )}

        {/* 21. SCANNING HOLOGRAPHIC LAVENDER SCANNER CONE (Scan Pose) */}
        {isScanning && (
          <g>
            <path d="M11 16L6 29h20l-5-13z" fill="#C4B5FD" opacity="0.25" filter="url(#chibi-cyan-glow)" />
            <path d="M9 22h14v1H9zm-2 4h18v1H7z" fill="#C4B5FD" opacity="0.6" />
          </g>
        )}
      </svg>
    </div>
  );
});
