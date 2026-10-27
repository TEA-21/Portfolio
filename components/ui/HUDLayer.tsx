"use client";

/**
 * components/ui/HUDLayer.tsx
 *
 * Fixed full-screen container for ambient UI overlays (CRT overlay & custom cursor).
 * The fixed bottom-corner mascot chat button has been removed in favor of the floating
 * NPC MascotCompanion embedded directly in the page flow.
 */

import { CyberCursor } from "./CyberCursor";
import { CRTOverlay } from "./CRTOverlay";
import { FlyingMascotCompanion } from "./FlyingMascotCompanion";
import { MascotChat } from "./MascotChat";

export function HUDLayer() {
  return (
    <div className="fixed inset-0 w-full h-full z-[99998] pointer-events-none overflow-hidden">
      {/* Animated CRT Scanlines & Vignetting */}
      <CRTOverlay />

      {/* Floating 16-Bit Pixel-Art Astronaut Companion (Self-contained pointer-events-auto hitboxes) */}
      <FlyingMascotCompanion />

      {/* ARIA AI Chat Terminal (Triggered via Mascot HUD or hotkey) */}
      <MascotChat />

      {/* Custom Starlight Magnetic Cursor & Trail (Topmost) */}
      <CyberCursor />
    </div>
  );
}
