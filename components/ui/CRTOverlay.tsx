"use client";

/**
 * components/ui/CRTOverlay.tsx
 *
 * Fixed pointer-events-none viewport overlay providing:
 *  1. Animated CRT scanlines for command terminal aesthetics
 *  2. Subtle radial vignetting darkening screen edges
 *  3. Subtle cyberpunk corner HUD telemetry markings
 */

export function CRTOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* CRT Scanline Scrolling Pass */}
      <div className="crt-scanlines absolute inset-0 opacity-40 mix-blend-overlay" />

      {/* Radial Vignetting Pass */}
      <div className="vignette-overlay absolute inset-0" />

      {/* Screen Edge Cyberpunk Corner Framing */}
      <div className="absolute top-2 left-2 border-t-2 border-l-2 border-cyan-focus/30 w-4 h-4" />
      <div className="absolute top-2 right-2 border-t-2 border-r-2 border-cyan-focus/30 w-4 h-4" />
      <div className="absolute bottom-2 left-2 border-b-2 border-l-2 border-cyan-focus/30 w-4 h-4" />
      <div className="absolute bottom-2 right-2 border-b-2 border-r-2 border-cyan-focus/30 w-4 h-4" />
    </div>
  );
}
