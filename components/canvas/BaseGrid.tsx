"use client";

/**
 * components/canvas/BaseGrid.tsx
 *
 * A full-shader cyberpunk terminal grid rendered on the XZ plane.
 *
 * WHY A CUSTOM SHADER?
 * --------------------
 * Three.js `GridHelper` uses `LineSegments` which:
 *  - Cannot be anti-aliased or glowed via material parameters.
 *  - Requires geometry proportional to line count (CPU-heavy for fine grids).
 *
 * A custom ShaderMaterial on a single PlaneGeometry:
 *  - Draws infinite-resolution lines in the fragment shader.
 *  - Enables per-pixel glow falloff, dual grid (major + minor cells),
 *    animated scanlines, edge vignette, and centre radial fade — all at
 *    near-zero geometry cost.
 *
 * VISUAL DESIGN
 * -------------
 * • Two grid frequencies:
 *    - Minor grid (1 unit cells) — very faint, 8% opacity baseline
 *    - Major grid (5 unit cells) — brighter, 30% opacity baseline
 * • Glow: each line has a smooth Gaussian-style falloff so it
 *   bleeds into adjacent pixels (fake bloom, no post-processing needed).
 * • Edge vignette: radial fade-to-black toward the plane perimeter.
 * • Scanline pulse: a slow animated horizontal band drifts upward,
 *   brightening lines it passes over — like a radar sweep.
 * • Colour: primary cyan (#38bdf8), secondary emerald (#10b981)
 *   mirroring the Tailwind theme.
 *
 * UNIFORMS (all live-updated each frame via useFrame):
 *   uTime        float  — elapsed seconds for animation
 *   uGridSize    float  — minor cell size in world units (default 1.0)
 *   uMajorScale  float  — major = uGridSize * uMajorScale (default 5.0)
 *   uLineWidth   float  — half-width of minor lines in UV space
 *   uPlaneSize   float  — world-space half-extent of the mesh (must match geometry)
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Shader source
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec2 vWorldXZ; // world-space XZ passed to fragment

  void main() {
    // position.xz gives world XZ before model transform on a flat plane
    vWorldXZ = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uGridSize;      // minor cell world-unit size
  uniform float uMajorScale;    // major = uGridSize * uMajorScale
  uniform float uLineWidth;     // fraction of cell for line half-width
  uniform float uPlaneHalfSize; // world-space half-extent for vignette

  varying vec2 vWorldXZ;

  // -------------------------------------------------------------------
  // Colours (linear space — Canvas uses linear:true)
  // -------------------------------------------------------------------
  vec3 cCyan    = vec3(0.141, 0.498, 0.773);  // #38bdf8
  vec3 cEmerald = vec3(0.063, 0.725, 0.506);  // #10b981
  vec3 cDark    = vec3(0.043, 0.059, 0.090);  // #0b0f17

  // -------------------------------------------------------------------
  // Grid line intensity at worldXZ for a given cell size.
  // Returns 0 (cell interior) → 1 (on line centre).
  // Uses smoothstep for anti-aliasing + a Gaussian-style glow envelope.
  // -------------------------------------------------------------------
  float gridLine(vec2 xz, float cellSize, float width) {
    // Fractional position within the cell [0, 1)
    vec2 f = fract(xz / cellSize);

    // Distance from the nearest cell edge (0 = on line, 0.5 = cell centre)
    vec2 df = min(f, 1.0 - f);

    // Crisp anti-aliased core using fwidth for correct perspective
    vec2 fw = fwidth(xz / cellSize) * 0.5;
    vec2 core = smoothstep(fw, vec2(0.0), df - width);

    // Soft glow envelope (wide Gaussian around the line)
    float glowWidth = width * 4.0;
    vec2 glow = exp(-df * df / (glowWidth * glowWidth));

    float lineVal = max(core.x, core.y);
    float glowVal = max(glow.x, glow.y);

    return max(lineVal, glowVal * 0.4);
  }

  void main() {
    // -------------------------------------------------------------------
    // 1. GRID LAYERS
    // -------------------------------------------------------------------
    float minorCellSize = uGridSize;
    float majorCellSize = uGridSize * uMajorScale;

    float minor = gridLine(vWorldXZ, minorCellSize, uLineWidth);
    float major = gridLine(vWorldXZ, majorCellSize, uLineWidth * 1.5);

    // -------------------------------------------------------------------
    // 2. RADIAL EDGE VIGNETTE
    // Fade to zero at plane edges so the grid appears to recede into fog.
    // -------------------------------------------------------------------
    float dist = length(vWorldXZ) / uPlaneHalfSize; // 0=centre, 1=edge
    float vignette = 1.0 - smoothstep(0.35, 1.0, dist);
    vignette = pow(vignette, 1.8); // shape the curve

    // -------------------------------------------------------------------
    // 3. ANIMATED SCANLINE SWEEP
    // A slow bright band drifts along the Z axis (world space),
    // brightening both grid layers as it passes.
    // -------------------------------------------------------------------
    float sweepSpeed = 0.3;
    float sweepWidth = 4.0;  // world units
    float sweepZ = mod(uTime * sweepSpeed, uPlaneHalfSize * 2.0) - uPlaneHalfSize;
    float sweep = exp(-pow((vWorldXZ.y - sweepZ) / sweepWidth, 2.0));
    sweep *= 0.6; // max brightness boost

    // -------------------------------------------------------------------
    // 4. COMPOSE
    // Minor lines: cyan tinted, low base opacity
    // Major lines: emerald tinted, higher base opacity
    // Sweep brightens both
    // -------------------------------------------------------------------
    // Base intensities
    float minorI = minor * 0.18;
    float majorI = major * 0.55;

    // Sweep contribution
    minorI += minor * sweep * 0.45;
    majorI += major * sweep * 0.60;

    // Blend colours
    vec3 col = cCyan * minorI + cEmerald * majorI;

    // Apply vignette
    col *= vignette;

    // Alpha: fully transparent where no lines, partially transparent on lines
    float alpha = clamp((minorI + majorI) * vignette, 0.0, 0.85);

    // Boost alpha slightly at major lines for extra pop
    alpha = max(alpha, majorI * vignette * 0.7);

    gl_FragColor = vec4(col, alpha);
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Half-size of the grid plane mesh in world units. */
const PLANE_HALF_SIZE = 30;

export function BaseGrid() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Update uTime every frame for the scanline animation
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh
      // Rotate the XY plane to lie flat on XZ
      rotation={[-Math.PI / 2, 0, 0]}
      // Slightly below y=0 so objects sitting on the grid don't z-fight
      position={[0, -0.001, 0]}
      // Receive shadows from scene objects
      receiveShadow
    >
      {/*
       * A single quad — all grid detail lives in the shader.
       * Segments > 1 only needed for geometry displacement; 1 is sufficient here.
       */}
      <planeGeometry
        args={[PLANE_HALF_SIZE * 2, PLANE_HALF_SIZE * 2, 1, 1]}
      />

      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime:          { value: 0 },
          uGridSize:      { value: 1.0 },   // 1-unit minor cells
          uMajorScale:    { value: 5.0 },   // 5-unit major cells
          uLineWidth:     { value: 0.03 },  // line half-width as fraction of cell
          uPlaneHalfSize: { value: PLANE_HALF_SIZE },
        }}
        // Additive blending makes glow look neon without a post-processing stack
        blending={THREE.AdditiveBlending}
        // Both sides visible (not needed for a flat plane but safe default)
        side={THREE.DoubleSide}
        // Must be true for AdditiveBlending to composite correctly
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}
