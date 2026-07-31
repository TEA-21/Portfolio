"use client";

/**
 * components/ui/HUDLayer.tsx
 *
 * Absolute/Fixed full-screen container for 2D HUD UI overlays (MissionControl, InspectionOverlay).
 *
 * POINTER EVENTS ARCHITECTURE
 * ───────────────────────────
 * - Container wrapper has `pointer-events-none` so mouse/pointer events pass through
 *   transparent areas directly to the 3D CanvasLayer below.
 * - Individual 2D UI elements (MissionControl panel, InspectionOverlay panel/buttons)
 *   have `pointer-events-auto` so clicks and hovers on HUD elements function normally.
 */

import { MissionControl } from "./MissionControl";
import { InspectionOverlay } from "./InspectionOverlay";
import { MascotChat } from "./MascotChat";

export function HUDLayer() {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
      {/* Top-Right Mission Control Filter Matrix HUD */}
      <MissionControl />

      {/* Dynamic Project Inspection Details Overlay */}
      <InspectionOverlay />

      {/* ARIA AI Mascot Assistant Chat Bridge */}
      <MascotChat />
    </div>
  );
}

