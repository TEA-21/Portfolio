"use client";

/**
 * components/canvas/IsometricCanvas.tsx
 *
 * Full-screen React Three Fiber canvas with a fixed isometric orthographic
 * camera. Renders behind all Next.js page content via CSS positioning.
 *
 * ARCHITECTURE NOTES
 * ------------------
 * • `position: fixed; inset: 0` makes the canvas fill the viewport and sit
 *   behind page content (z-index: 0). Page UI layers on top via z-index.
 *
 * • The R3F <Canvas> uses an orthographic camera. The frustum size is
 *   derived from the viewport aspect ratio so scene units map predictably.
 *   `camera.manual` is NOT set — we let R3F manage resize automatically.
 *
 * • `frameloop="demand"` or `"always"`:
 *   We use "always" for smooth animation driven by the Zustand camera lerp.
 *   Switch to "demand" + `invalidate()` calls if performance profiling shows
 *   unnecessary frames when the scene is static.
 *
 * • `gl.antialias` + `dpr` clamp balance quality vs. mobile GPU budget.
 *
 * • `shadows` is enabled so the directional light can cast soft shadow maps
 *   when geometry is added later.
 *
 * • `linear` (true) disables automatic sRGB encoding on the renderer so that
 *   post-processing passes get correct linear-space input.
 *
 * USAGE
 * -----
 * Drop <IsometricCanvas> as the FIRST child inside <body> (or layout root).
 * It is already included in app/layout.tsx via CanvasLayer.
 *
 *   <IsometricCanvas>
 *     {/‌* your scene objects — nodes, grid, particles *‌/}
 *   </IsometricCanvas>
 */

import { useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { IsometricCamera } from "./IsometricCamera";
import { SceneLighting } from "./SceneLighting";
import { CyberGrid } from "./CyberGrid";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The orthographic frustum half-size at zoom=1.
 * Increasing this "zooms out" the scene; decreasing zooms in.
 * Tune alongside DEFAULT_ZOOM in the store.
 */
const FRUSTUM_SIZE = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface IsometricCanvasProps {
  /** Scene objects to render inside the canvas. */
  children?: ReactNode;
}

export function IsometricCanvas({ children }: IsometricCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none", // Let mouse events fall through to page UI
      }}
    >
      <Canvas
        /**
         * Orthographic camera — position is just a starting hint;
         * IsometricCamera.useFrame overrides it every tick via lerp.
         *
         * We set a manual initial position along the isometric ray so the
         * very first rendered frame isn't at the origin (avoids one-frame pop).
         *
         * left/right/top/bottom are computed from FRUSTUM_SIZE and the
         * current aspect ratio inside onCreated, and on resize R3F updates
         * them automatically when camera.type === "OrthographicCamera" and
         * we provide the `orthographic` shorthand prop.
         */
        orthographic
        camera={{
          position: [
            ISO_INIT.x,
            ISO_INIT.y,
            ISO_INIT.z,
          ],
          near: 0.1,
          far: 1000,
          zoom: 1,
        }}
        // Render at device pixel ratio, clamped to 2 for performance
        dpr={[1, 2]}
        // Always-on loop for smooth camera lerp
        frameloop="always"
        // Enable shadow map
        shadows={{ type: THREE.PCFSoftShadowMap }}
        // Keep linear colour space for future post-processing
        linear
        // Transparent background — page background (slate-dark) shows through
        gl={{ alpha: true, antialias: true }}
        style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
        onCreated={({ camera, size }) => {
          // Set the initial orthographic frustum based on viewport aspect ratio
          if (camera instanceof THREE.OrthographicCamera) {
            const aspect = size.width / size.height;
            camera.left = -FRUSTUM_SIZE * aspect;
            camera.right = FRUSTUM_SIZE * aspect;
            camera.top = FRUSTUM_SIZE;
            camera.bottom = -FRUSTUM_SIZE;
            camera.updateProjectionMatrix();
          }
        }}
      >
        {/* Camera rig — reads pan + zoom from Zustand store */}
        <IsometricCamera />

        {/* Lighting rig */}
        <SceneLighting />

        {/* Cyberpunk terminal grid — foundational XZ floor */}
        <CyberGrid />

        {/* Optional scene children (nodes, particles, etc.) */}
        {children}
      </Canvas>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Pre-compute initial camera world position along the isometric ray
// (mirrors the math in IsometricCamera.tsx so there's no first-frame pop)
const ELEVATION = Math.atan(1 / Math.sqrt(2));
const AZIMUTH = Math.PI / 4;
const ISO_DISTANCE = 20;

const ISO_INIT = {
  x: ISO_DISTANCE * Math.cos(ELEVATION) * Math.sin(AZIMUTH),
  y: ISO_DISTANCE * Math.sin(ELEVATION),
  z: ISO_DISTANCE * Math.cos(ELEVATION) * Math.cos(AZIMUTH),
};
