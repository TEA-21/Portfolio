"use client";

/**
 * components/ui/CRTOverlay.tsx
 *
 * Fixed pointer-events-none viewport overlay providing:
 *  1. Deep celestial radial vignetting
 *  2. Subtle starlight dust depth
 *  3. Ethereal observatory corner calipers
 */

export function CRTOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Deep Celestial Radial Vignette */}
      <div className="vignette-overlay absolute inset-0" />

      {/* Screen Edge Observatory Calipers */}
      <div className="absolute top-3 left-3 border-t border-l border-nebula-violet/30 w-5 h-5 rounded-tl" />
      <div className="absolute top-3 right-3 border-t border-r border-nebula-violet/30 w-5 h-5 rounded-tr" />
      <div className="absolute bottom-3 left-3 border-b border-l border-starlight-gold/25 w-5 h-5 rounded-bl" />
      <div className="absolute bottom-3 right-3 border-b border-r border-starlight-gold/25 w-5 h-5 rounded-br" />
    </div>
  );
}
