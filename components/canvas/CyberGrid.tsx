"use client";

/**
 * components/canvas/CyberGrid.tsx
 *
 * A procedural cyberpunk terminal grid rendered entirely in GLSL on the XZ plane.
 *
 * VISUAL DESIGN
 * ─────────────
 * Three overlapping layers compose the terminal aesthetic:
 *
 *  1. MINOR GRID (1-unit cells, faint cyan)
 *     Ultra-thin lines forming the base lattice. Very low opacity so they
 *     feel like they're just barely visible — a ghost of structure.
 *
 *  2. MAJOR GRID (5-unit cells, brighter emerald)
 *     Every 5th line is visibly stronger, giving the grid a chunked
 *     "city block" hierarchy that reads well from an isometric angle.
 *
 *  3. ORIGIN AXES (X and Z world-space zero lines, bright cyan)
 *     The two centre lines are highlighted more strongly, acting as
 *     cardinal reference lines like a terminal's cursor position.
 *
 *  4. SCANLINE SWEEP
 *     A slow Gaussian-falloff band drifts along world Z, brightening
 *     every line it crosses — like a radar or sonar pulse.
 *
 *  5. DATA PULSE DOTS
 *     At major-grid intersections near the sweep band, a subtle
 *     point-flare appears, simulating data nodes activating.
 *
 *  6. EDGE VIGNETTE
 *     Radial fade-to-black toward the mesh perimeter so the grid
 *     dissolves naturally into the dark slate background.
 *
 * SHADER TECHNIQUE
 * ────────────────
 * A single PlaneGeometry quad — all detail is pixel-shader work.
 * `fwidth()` is used for sub-pixel anti-aliasing of line edges.
 * `AdditiveBlending` makes all lines accumulate light on the dark scene
 * background, producing neon glow without a post-processing stack.
 *
 * UNIFORMS
 *   uTime          float — elapsed seconds (for sweep animation)
 *   uGridSize      float — minor cell size in world units (default 1.0)
 *   uMajorScale    float — major cell = uGridSize × uMajorScale (default 5)
 *   uLineWidth     float — line half-width relative to cell (default 0.028)
 *   uPlaneHalfSize float — world-space half-extent (must match geometry)
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// GLSL Shaders
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec2 vWorldXZ;

  void main() {
    // Pass raw local-space XZ — plane geometry is flat so local == world XZ
    vWorldXZ = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uGridSize;
  uniform float uMajorScale;
  uniform float uLineWidth;
  uniform float uPlaneHalfSize;

  varying vec2 vWorldXZ;

  // ─── Palette (linear colour space — Canvas uses linear:true) ───────────────
  // Cyberpunk cyan  #38bdf8  →  vec3(0.141, 0.498, 0.773) + slight boost
  vec3 cCyan    = vec3(0.18,  0.55,  0.88);
  // Emerald         #10b981  →  vec3(0.063, 0.725, 0.506) + slight boost
  vec3 cEmerald = vec3(0.08,  0.80,  0.56);
  // Bright white-cyan for axes and intersections
  vec3 cAxes    = vec3(0.55,  0.92,  1.00);

  // ─── Crisp anti-aliased grid line ──────────────────────────────────────────
  // Returns 0 (cell interior) → 1 (line centre).
  // Combines a sharp smoothstepped core with a wide Gaussian glow halo.
  float gridLine(vec2 xz, float cellSize, float width) {
    vec2 f = fract(xz / cellSize);
    // Distance from nearest edge: 0 at line, 0.5 at cell centre
    vec2 df = min(f, 1.0 - f);

    // Sub-pixel AA via fwidth
    vec2 fw  = fwidth(xz / cellSize) * 0.5;
    vec2 core = smoothstep(fw, vec2(0.0), df - width);

    // Wide Gaussian glow envelope
    float gw   = width * 5.0;
    vec2  glow = exp(-df * df / (gw * gw));

    float lineVal = max(core.x, core.y);
    float glowVal = max(glow.x, glow.y);
    return max(lineVal, glowVal * 0.35);
  }

  // ─── Axis highlight: returns 1 when near world-space zero on that axis ──────
  float axisLine(float coord, float width) {
    float fw = fwidth(coord) * 0.5;
    float df = abs(coord);
    float core = smoothstep(fw + width, fw, df);
    float glow = exp(-df * df / ((width * 6.0) * (width * 6.0)));
    return max(core, glow * 0.5);
  }

  // ─── Intersection dot at major grid crossings ───────────────────────────────
  float dotFlare(vec2 xz, float cellSize, float radius) {
    vec2 f = fract(xz / cellSize);
    // Distance from nearest lattice corner (0 = on intersection)
    vec2 corner = f - round(f);
    float d = length(corner * cellSize);
    return exp(-d * d / (radius * radius));
  }

  void main() {
    float minorCell = uGridSize;
    float majorCell = uGridSize * uMajorScale;

    // ── 1. Grid layers ──────────────────────────────────────────────────────
    float minor = gridLine(vWorldXZ, minorCell, uLineWidth);
    float major = gridLine(vWorldXZ, majorCell, uLineWidth * 1.6);

    // ── 2. World-space cardinal axes (X=0 and Z=0) ─────────────────────────
    float axisX = axisLine(vWorldXZ.y, uLineWidth * 2.5); // Z=0 line
    float axisZ = axisLine(vWorldXZ.x, uLineWidth * 2.5); // X=0 line
    float axes  = max(axisX, axisZ);

    // ── 3. Radial edge vignette ─────────────────────────────────────────────
    float dist    = length(vWorldXZ) / uPlaneHalfSize;
    float vignette = 1.0 - smoothstep(0.30, 1.0, dist);
    vignette = pow(vignette, 1.6);

    // ── 4. Animated scanline sweep ──────────────────────────────────────────
    float sweepSpeed = 0.28;
    float sweepWidth = 3.5;
    float range = uPlaneHalfSize * 2.0;
    float sweepZ = mod(uTime * sweepSpeed, range) - uPlaneHalfSize;
    float sweep  = exp(-pow((vWorldXZ.y - sweepZ) / sweepWidth, 2.0));

    // ── 5. Intersection pulse dots at major nodes near sweep band ───────────
    float dotR  = 0.18;  // dot radius in world units
    float dots  = dotFlare(vWorldXZ, majorCell, dotR);
    dots *= sweep * 1.5; // only visible inside the sweep band

    // ── 6. Compose colour and alpha ─────────────────────────────────────────
    // Base layer intensities (very subtle at rest)
    float minorI = minor * 0.14;
    float majorI = major * 0.48;
    float axesI  = axes  * 0.70;
    float dotsI  = dots  * 0.90;

    // Sweep amplification
    float sweepBoost = sweep * 0.55;
    minorI += minor * sweepBoost * 0.5;
    majorI += major * sweepBoost * 0.7;
    axesI  += axes  * sweepBoost * 0.4;

    // Build final colour
    vec3 col = vec3(0.0);
    col += cCyan    * minorI;
    col += cEmerald * majorI;
    col += cAxes    * axesI;
    col += cCyan    * dotsI;

    // Apply vignette
    col *= vignette;

    // Alpha — fully transparent in cell interiors
    float alpha = clamp((minorI + majorI + axesI + dotsI) * vignette, 0.0, 0.90);
    // Extra push on strong elements so they always pop
    alpha = max(alpha, axesI * vignette * 0.85);
    alpha = max(alpha, majorI * vignette * 0.65);

    gl_FragColor = vec4(col, alpha);
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** World-space half-extent of the grid mesh. Tune to match scene scale. */
const PLANE_HALF_SIZE = 30;

export function CyberGrid() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Push elapsed time to the shader every frame for the sweep animation.
  // useFrame is the R3F-idiomatic way — no setState, no React re-render.
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh
      // Rotate the default XY plane to lie flat on the XZ world plane
      rotation={[-Math.PI / 2, 0, 0]}
      // Slightly below y=0 so scene objects don't z-fight with the grid
      position={[0, -0.002, 0]}
      // Receive shadows from ProjectNodes and other scene geometry
      receiveShadow
    >
      {/*
       * Single quad geometry — all line detail is per-pixel in the shader.
       * Width × Height must match PLANE_HALF_SIZE × 2 for the vignette to
       * align correctly with the edge of the visible grid.
       */}
      <planeGeometry args={[PLANE_HALF_SIZE * 2, PLANE_HALF_SIZE * 2, 1, 1]} />

      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime:          { value: 0 },
          uGridSize:      { value: 1.0 },          // 1-world-unit minor cells
          uMajorScale:    { value: 5.0 },          // major line every 5 cells
          uLineWidth:     { value: 0.028 },        // line half-width (tuned for iso view)
          uPlaneHalfSize: { value: PLANE_HALF_SIZE },
        }}
        // Additive blending: lines add luminance to the scene, never darken it.
        // This is how neon signs work — perfect for a cyberpunk palette.
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        transparent={true}
        // depthWrite=false so the transparent grid doesn't occlude scene objects
        depthWrite={false}
      />
    </mesh>
  );
}
