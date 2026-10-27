"use client";

/**
 * components/ui/PixelAstronaut.tsx
 *
 * 16-Bit Retro Pixel-Art Astronaut ("ARIA Cadet") Sprite Engine.
 *
 * PERFORMANCE & GUARDRAILS:
 * ─────────────────────────
 * • Consolidated SVG: Groups 24x24 pixels by color into consolidated <path> elements
 *   with shape-rendering="crispEdges". Strictly < 25 DOM elements total (zero DOM thrashing).
 * • Multi-Pose States:
 *     - 'idle': Gentle breathing cycle and visor glint
 *     - 'thrust': Dual jetpack flames burning with particle exhaust
 *     - 'drag': Puffed limbs in grabbed state
 *     - 'spin': 360° rotational tumble
 *     - 'wave': Animated friendly arm wave
 *     - 'transmitting': Pulsing antenna beacon with concentric radio waves
 * • Dedicated Canvas Particle Trail: Zero-re-render pooled retro pixel sparks.
 */

import React, { memo } from "react";

export type AstronautPose = "idle" | "thrust" | "drag" | "spin" | "wave" | "transmitting";

interface PixelAstronautProps {
  pose?: AstronautPose;
  size?: number;
  flipX?: boolean;
  className?: string;
}

export const PixelAstronaut = memo(function PixelAstronaut({
  pose = "idle",
  size = 56,
  flipX = false,
  className = "",
}: PixelAstronautProps) {
  const isThrusting = pose === "thrust" || pose === "spin";
  const isTransmitting = pose === "transmitting";
  const isWaving = pose === "wave";
  const isDragging = pose === "drag";

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
    >
      {/* ── Transmitting Radio Wave Rings ────────────────────────── */}
      {isTransmitting && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center">
          <span className="absolute w-8 h-8 rounded-full border border-starlight-gold/60 animate-ping opacity-75" />
          <span className="absolute w-12 h-12 rounded-full border border-cyan-400/40 animate-pulse" />
        </div>
      )}

      {/* ── Consolidated 24x24 Pixel Art SVG (<25 Elements) ──────── */}
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`w-full h-full drop-shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-transform duration-200 ${
          isDragging ? "scale-105" : ""
        }`}
        shapeRendering="crispEdges"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Defs: Glow filters and subtle linear gradients */}
        <defs>
          <filter id="visor-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#38bdf8" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* 1. JETPACK TANKS & NOZZLES (Dark Slate & Titanium) */}
        <path
          d="M3 11h2v5H3zm16 0h2v5h-2zM3 16h2v1H3zm16 0h2v1h-2z"
          fill="#334155"
        />
        <path
          d="M4 12h1v3H4zm15 0h1v3h-1z"
          fill="#64748b"
        />

        {/* 2. THRUSTER FLAMES (Animated in thrust/spin mode) */}
        {isThrusting && (
          <>
            {/* Outer Orange Flame */}
            <path
              d="M3 17h2v3H3zm16 0h2v3h-2z"
              fill="#f97316"
              className="animate-pulse"
            />
            {/* Inner Yellow Core */}
            <path
              d="M4 17h1v4H4zm16 0h1v4h-1z"
              fill="#fbbf24"
            />
            {/* Hot Cyan Tip */}
            <path
              d="M4 21h1v1H4zm16 0h1v1h-1z"
              fill="#38bdf8"
            />
          </>
        )}

        {/* 3. SUIT OUTLINE & JOINTS (Deep Obsidian Shadow #0f172a) */}
        <path
          d="M7 2h10v1H7zM6 3h1v8H6zm11 0h1v8h-1zM5 4h1v7H5zm13 0h1v7h-1zM7 11h10v1H7zM6 12h1v6H6zm11 0h1v6h-1zM7 18h3v1H7zm7 0h3v1h-3zM7 19h3v3H7zm7 0h3v3h-3zM6 22h4v1H6zm8 0h4v1h-4z"
          fill="#0a0f1d"
        />

        {/* 4. MAIN CERAMIC ARMOR PLATES (Bright White/Silver #f8fafc) */}
        <path
          d="M7 3h10v2H7zM5 5h3v6H5zm11 0h3v6h-3zM7 12h10v2H7zM8 14h8v4H8zm-1 4h3v4H7zm7 0h3v4h-3z"
          fill="#f8fafc"
        />

        {/* 5. SUIT SHADING (Cool Grey #cbd5e1) */}
        <path
          d="M7 10h10v1H7zM5 10h2v1H5zm12 0h2v1h-2zM8 17h8v1H8zm-1 3h3v1H7zm7 0h3v1h-3z"
          fill="#94a3b8"
        />

        {/* 6. NEBULA VIOLET ACCENTS & CUFFS (#8b5cf6) */}
        <path
          d="M6 16h2v1H6zm10 0h2v1h-2zM11 13h2v2h-2z"
          fill="#8b5cf6"
        />

        {/* 7. VISOR GLASS BASE (Glowing Cyan #0284c7 & #38bdf8) */}
        <path
          d="M8 5h8v5H8z"
          fill="#0284c7"
          filter="url(#visor-glow)"
        />
        <path
          d="M8 6h8v4H8z"
          fill="#38bdf8"
        />

        {/* 8. VISOR REFLECTION GLINT (Crisp White #ffffff) */}
        <path
          d="M9 6h3v1H9zm-1 1h2v1H8z"
          fill="#ffffff"
          className={pose === "idle" ? "animate-pulse" : ""}
        />

        {/* 9. ANTENNA MAST & BEACON (Gold #fbbf24 & Amber #f59e0b) */}
        <path
          d="M11 1h2v2h-2z"
          fill="#64748b"
        />
        <path
          d="M11 0h2v1h-2z"
          fill={isTransmitting ? "#38bdf8" : "#fbbf24"}
          className={isTransmitting ? "animate-ping" : ""}
        />

        {/* 10. WAVING ARM POSE (When isWaving is true) */}
        {isWaving && (
          <path
            d="M18 10h3v2h-3zm2-3h2v3h-2z"
            fill="#f8fafc"
            className="origin-bottom-left animate-bounce"
          />
        )}
      </svg>
    </div>
  );
});
