"use client";

/**
 * components/canvas/NodeConnectors.tsx
 *
 * Renders animated glowing connector lines between adjacent project nodes
 * on the XZ grid plane, simulating active data telemetry flowing between nodes.
 *
 * VISUAL DESIGN
 * ─────────────
 * • Lines connect the six premier project nodes in a hexagonal perimeter + cross chords:
 *
 *              local-llm(0,0,3.5)
 *             ╱                  ╲
 *   shadowos(-3.5,0,2)     projectparrot(3.5,0,2)
 *          │       ╲       ╱       │
 *          │         ╳ ──          │
 *          │       ╱       ╲       │
 *     dryaf(-3.5,0,-2)     zerotrust(3.5,0,-2)
 *             ╲                  ╱
 *            aela-security(0,0,-3.5)
 *
 * • Color: cyan-focus (#38bdf8)
 * • Animation technique: Three.js r185's LineDashedMaterial exposes `scale`,
 *   `dashSize`, and `gapSize`. By incrementing `scale` each frame, the dash
 *   pattern origin shifts continuously along line distances, producing a
 *   "data packets flowing down the wire" marching effect.
 * • A second lower-opacity layer creates a soft glowing halo.
 * • A static baseline layer provides constant structural grid presence.
 *
 * IMPLEMENTATION NOTES
 * ─────────────────────
 * • Uses native Three.js BufferGeometry + lineSegments R3F primitives
 *   to avoid SSR issues with @react-three/drei's <Line> component.
 * • computeLineDistances() is called once via onUpdate to enable
 *   LineDashedMaterial's per-segment dash rendering.
 * • All mutations happen inside useFrame directly on material refs —
 *   no React state involved for maximum animation throughput.
 * • AdditiveBlending with depthWrite=false prevents depth artifacts and
 *   produces an emissive glow effect against the dark background.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Node positions (XZ plane, Y=0) — matches SceneContent.tsx
// ---------------------------------------------------------------------------
const NODE_POSITIONS: [number, number, number][] = [
  [-3.5, 0,  2.0], // 0: shadowos
  [ 0.0, 0,  3.5], // 1: local-llm
  [ 3.5, 0,  2.0], // 2: projectparrot
  [ 3.5, 0, -2.0], // 3: zerotrust
  [ 0.0, 0, -3.5], // 4: aela-security
  [-3.5, 0, -2.0], // 5: dryaf
];

// Hexagonal perimeter loop + cross-hub telemetry chords
const CONNECTIONS: [number, number][] = [
  [0, 1], // shadowos      ─── local-llm
  [1, 2], // local-llm     ─── projectparrot
  [2, 3], // projectparrot ─── zerotrust
  [3, 4], // zerotrust     ─── aela-security
  [4, 5], // aela-security ─── dryaf
  [5, 0], // dryaf         ─── shadowos
  [0, 3], // shadowos      ─── zerotrust (cross diagonal)
  [1, 4], // local-llm     ─── aela-security (cross axis)
  [2, 5], // projectparrot ─── dryaf (cross diagonal)
];

const CYAN = new THREE.Color("#38bdf8");

/** Lift lines fractionally above Y=0 to prevent Z-fighting with the grid mesh */
const Y_OFFSET = 0.04;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NodeConnectors() {
  const primaryMatRef = useRef<THREE.LineDashedMaterial>(null!);
  const glowMatRef = useRef<THREE.LineDashedMaterial>(null!);

  // Build shared BufferGeometry from connection pairs (one-time computation)
  const geometry = useMemo(() => {
    const vertices: number[] = [];

    for (const [a, b] of CONNECTIONS) {
      const [ax, ay, az] = NODE_POSITIONS[a];
      const [bx, by, bz] = NODE_POSITIONS[b];
      vertices.push(ax, ay + Y_OFFSET, az);
      vertices.push(bx, by + Y_OFFSET, bz);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geo.computeBoundingSphere();
    return geo;
  }, []);

  // ---------------------------------------------------------------------------
  // Animation: increment LineDashedMaterial.scale each frame.
  //
  // Three.js r185 LineDashedMaterial dashes are computed as:
  //   dashStart = accumulatedDistance * scale
  // Incrementing scale continuously shifts where the pattern starts along each
  // line, producing a marching "data packet" flow animation.
  //
  // Speed is controlled by the multiplier on `delta` (not clock.elapsedTime)
  // so animation rate is frame-rate independent.
  // ---------------------------------------------------------------------------
  useFrame((_, delta) => {
    if (primaryMatRef.current) {
      primaryMatRef.current.scale += delta * 1.8;
      // Wrap to avoid floating-point overflow over long sessions
      if (primaryMatRef.current.scale > 1000) {
        primaryMatRef.current.scale = 0;
      }
      primaryMatRef.current.needsUpdate = false; // scale change doesn't need full recompile
    }
    if (glowMatRef.current) {
      // Glow layer moves at a slightly different speed for depth layering
      glowMatRef.current.scale += delta * 1.2;
      if (glowMatRef.current.scale > 1000) {
        glowMatRef.current.scale = 0;
      }
    }
  });

  return (
    <group name="node-connectors">
      {/*
        Primary layer — sharp cyan dashes representing data packets in transit.
        dashSize=0.3 / gapSize=0.5 gives a ~37% duty cycle for clear visibility.
      */}
      <lineSegments
        geometry={geometry}
        onUpdate={(self) => (self as THREE.LineSegments).computeLineDistances()}
      >
        <lineDashedMaterial
          ref={primaryMatRef}
          color={CYAN}
          dashSize={0.3}
          gapSize={0.5}
          scale={1}
          linewidth={1}
          opacity={0.9}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/*
        Glow halo layer — larger gaps for a softer pulsing outer glow.
        Runs at a distinct scale speed for parallax depth between layers.
      */}
      <lineSegments
        geometry={geometry}
        onUpdate={(self) => (self as THREE.LineSegments).computeLineDistances()}
      >
        <lineDashedMaterial
          ref={glowMatRef}
          color={CYAN}
          dashSize={0.5}
          gapSize={1.6}
          scale={1}
          linewidth={1}
          opacity={0.3}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/*
        Static baseline — always-on solid faint line to anchor the network
        topology and keep the grid structure visible when dashes are in gap phase.
      */}
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color={CYAN}
          opacity={0.1}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
