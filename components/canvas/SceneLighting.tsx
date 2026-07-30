"use client";

/**
 * components/canvas/SceneLighting.tsx
 *
 * Lighting rig for a dark cyberpunk scene.
 *
 * LIGHT SETUP
 * -----------
 * 1. AmbientLight (very dim, cool blue-grey)
 *    — Fills shadow areas so they read as deep navy, not pure black.
 *    — Intensity is intentionally low to preserve the moody, high-contrast look.
 *
 * 2. DirectionalLight (key, top-right cyan-tinted)
 *    — Simulates a distant neon billboard / overhead strip light.
 *    — Casts soft shadows to give depth to scene geometry.
 *    — Positioned along the isometric diagonal so highlights feel natural.
 *
 * 3. DirectionalLight (fill, back-left magenta-tinted)
 *    — Classic cyberpunk complementary fill light from behind-left.
 *    — Gives silhouette pop and rim-light separation from the background.
 *
 * All lights are stateless — no store connection needed. If the design calls
 * for dynamic lighting later, wrap this in a useFrame driver.
 */

export function SceneLighting() {
  return (
    <>
      {/* ── 1. Ambient fill ─────────────────────────────────────────── */}
      <ambientLight
        color="#1a2035" // deep cool blue-grey
        intensity={0.6}
      />

      {/* ── 2. Key directional (cyan / neon) ────────────────────────── */}
      <directionalLight
        color="#38bdf8" // cyan-focus from Tailwind theme
        intensity={1.4}
        position={[8, 12, 6]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      {/* ── 3. Back-fill (magenta rim) ───────────────────────────────── */}
      <directionalLight
        color="#d946ef" // fuchsia-500 — classic cyberpunk complementary
        intensity={0.5}
        position={[-10, 6, -8]}
        castShadow={false}
      />

      {/* ── 4. Ground hemisphere (optional subtle warmth underside) ─── */}
      <hemisphereLight
        // @ts-expect-error — R3F v8 hemisphereLight accepts color props
        skyColor="#0b0f17"
        groundColor="#0d1117"
        intensity={0.3}
      />
    </>
  );
}
