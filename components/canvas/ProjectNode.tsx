"use client";

/**
 * components/canvas/ProjectNode.tsx
 *
 * An interactive hexagonal module representing a portfolio project.
 *
 * VISUAL ANATOMY
 * ──────────────
 *  ┌──────────────────────────────────┐
 *  │   [Label text]  ← Drei <Text>   │  floating above, billboard-locked
 *  │                                  │
 *  │  ╔══════╗  ← hex body           │  CylinderGeometry(6 sides)
 *  │  ║ ring ║  ← accent ring        │  slightly larger, thin torus-like cyl
 *  │  ╚══════╝                        │
 *  │   [glow plane] ← ground halo    │  semi-transparent circle at y = -0.01
 *  └──────────────────────────────────┘
 *
 * INTERACTION MODEL
 * ─────────────────
 *  idle       → subtle emissive pulse via useFrame sine wave
 *  hovered    → emissive snaps to cyan-focus (#38bdf8), cursor → pointer,
 *               body scales up slightly, label brightens
 *  clicked    → dispatches to Zustand:
 *                 setCamera({ x: position[0], z: position[2] })
 *                 setZoom(2.5)
 *                 setFocusedNodeId(id)
 *                 setInspection()
 *
 * PERFORMANCE NOTES
 * ─────────────────
 *  • `useRef` for all per-frame mutations — no setState in the render loop.
 *  • `useCallback` on event handlers to prevent re-creation.
 *  • Emissive animation uses lerp so transitions feel physical, not snappy.
 *  • Text uses `fontSize` relative to scene units; font is loaded once by
 *    Drei's internal cache (troika-three-text).
 *  • Hover/focus state managed with plain React `useState` — one boolean
 *    re-render per enter/leave is acceptable and idiomatic R3F.
 */

import {
  useRef,
  useState,
  useCallback,
  useMemo,
  type JSX,
} from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Float, Center } from "@react-three/drei";
import * as THREE from "three";
import { usePortfolioStore } from "@/lib/store";

// ---------------------------------------------------------------------------
// Theme colours (matching Tailwind config, in linear-space hex)
// ---------------------------------------------------------------------------

const C_IDLE_EMISSIVE    = new THREE.Color("#0d2a3a");   // very dark teal base
const C_HOVER_EMISSIVE   = new THREE.Color("#38bdf8");   // cyan-focus
const C_FOCUSED_EMISSIVE = new THREE.Color("#10b981");   // emerald-highlight
const C_BODY             = new THREE.Color("#0b1929");   // near-black navy
const C_RING             = new THREE.Color("#1e3a4a");   // slightly lighter navy
const C_GLOW             = new THREE.Color("#38bdf8");   // cyan for ground halo
const C_LABEL_IDLE       = new THREE.Color("#7dd3fc");   // sky-300
const C_LABEL_HOVER      = new THREE.Color("#e0f2fe");   // sky-50

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of sides for the hex prism geometry. */
const HEX_SEGMENTS = 6;

/** Hex body radius in world units. */
const HEX_RADIUS = 0.72;

/** Hex body height. */
const HEX_HEIGHT = 0.18;

/** Accent ring outer/inner radii. */
const RING_OUTER = 0.78;
const RING_INNER = 0.72;
const RING_HEIGHT = 0.22;

/** Zoom level dispatched when a node is clicked. */
const FOCUS_ZOOM = 2.5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectNodeProps {
  /** Unique project identifier — written to Zustand focusedNodeId on click. */
  id: string;

  /** Display label rendered above the node. */
  label: string;

  /**
   * World-space position [x, y, z].
   * y is typically 0 (sitting on the grid); the component adds its own height.
   */
  position: [number, number, number];

  /**
   * Optional accent colour override (hex string).
   * Defaults to cyan-focus when hovered, emerald-highlight when focused.
   */
  accentColor?: string;
}

// ---------------------------------------------------------------------------
// Sub-component: ground glow halo
// ---------------------------------------------------------------------------

function GroundHalo({
  hovered,
  isFocused,
}: {
  hovered: boolean;
  isFocused: boolean;
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (!matRef.current) return;
    const targetOpacity = isFocused ? 0.25 : hovered ? 0.18 : 0.06;
    matRef.current.opacity +=
      (targetOpacity - matRef.current.opacity) * 0.1;
  });

  return (
    // Flat circle on the XZ plane, just below the hex body
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
      <circleGeometry args={[HEX_RADIUS * 1.6, 32]} />
      <meshBasicMaterial
        ref={matRef}
        color={C_GLOW}
        transparent
        opacity={0.06}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: floating label
// ---------------------------------------------------------------------------

function NodeLabel({
  label,
  hovered,
  isFocused,
}: {
  label: string;
  hovered: boolean;
  isFocused: boolean;
}) {
  // Drive label colour via a lerped THREE.Color inside useFrame,
  // then write it to the <Text> color prop each tick via a ref to
  // the troika mesh (which exposes a `color` property directly).
  //
  // We use `any` for the troika ref type — Drei v9 does not export
  // the underlying troika-three-text instance type, and the @ts-expect-error
  // directive would be flagged as unused if the type accidentally resolves.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null);
  const lerpedColor = useRef(C_LABEL_IDLE.clone());

  useFrame(() => {
    const target = hovered || isFocused ? C_LABEL_HOVER : C_LABEL_IDLE;
    lerpedColor.current.lerp(target, 0.1);
    if (textRef.current) {
      textRef.current.color = lerpedColor.current;
    }
  });

  return (
    // Float gives a gentle vertical bob without any extra state
    <Float
      speed={1.4}
      rotationIntensity={0}
      floatIntensity={0.3}
      floatingRange={[-0.04, 0.04]}
    >
      <Text
        ref={textRef}
        position={[0, HEX_HEIGHT + 0.45, 0]}
        fontSize={0.22}
        color={C_LABEL_IDLE}
        anchorX="center"
        anchorY="middle"
        renderOrder={1}
        depthOffset={-1}
        font="/fonts/JetBrainsMono-Regular.woff2"
        letterSpacing={0.04}
        outlineWidth={0.012}
        outlineColor="#000000"
      >
        {label.toUpperCase()}
      </Text>
    </Float>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: hex body + accent ring
// ---------------------------------------------------------------------------

function HexBody({
  hovered,
  isFocused,
  accentColor,
}: {
  hovered: boolean;
  isFocused: boolean;
  accentColor?: string;
}) {
  const bodyRef    = useRef<THREE.Mesh>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Memoize the focused emissive so it reacts to the accentColor prop
  const focusedEmissive = useMemo(
    () => (accentColor ? new THREE.Color(accentColor) : C_FOCUSED_EMISSIVE),
    [accentColor]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // ── Body emissive ─────────────────────────────────────────────────
    if (bodyMatRef.current) {
      let targetEmissive: THREE.Color;
      if (isFocused) {
        targetEmissive = focusedEmissive;
      } else if (hovered) {
        targetEmissive = C_HOVER_EMISSIVE;
      } else {
        // Idle pulse: slow sine wave on the dark base
        const pulse = (Math.sin(t * 1.6) * 0.5 + 0.5) * 0.12;
        targetEmissive = C_IDLE_EMISSIVE.clone().multiplyScalar(1 + pulse * 4);
      }
      bodyMatRef.current.emissive.lerp(targetEmissive, 0.08);

      // Emissive intensity
      const targetIntensity = isFocused ? 1.2 : hovered ? 0.9 : 0.3;
      bodyMatRef.current.emissiveIntensity +=
        (targetIntensity - bodyMatRef.current.emissiveIntensity) * 0.08;
    }

    // ── Ring emissive ─────────────────────────────────────────────────
    if (ringMatRef.current) {
      const ringTarget = isFocused
        ? focusedEmissive
        : hovered
        ? C_HOVER_EMISSIVE
        : C_IDLE_EMISSIVE;
      ringMatRef.current.emissive.lerp(ringTarget, 0.1);
      const ringIntensity = isFocused ? 2.0 : hovered ? 1.4 : 0.2;
      ringMatRef.current.emissiveIntensity +=
        (ringIntensity - ringMatRef.current.emissiveIntensity) * 0.1;
    }

    // ── Body scale on hover ───────────────────────────────────────────
    if (bodyRef.current) {
      const targetScale = hovered ? 1.07 : isFocused ? 1.05 : 1.0;
      bodyRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  return (
    <group>
      {/* Main hex prism */}
      <mesh
        ref={bodyRef}
        position={[0, HEX_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
      >
        {/*
         * CylinderGeometry(radiusTop, radiusBottom, height,
         *   radialSegments, heightSegments, openEnded)
         * radialSegments=6 → hexagonal prism
         */}
        <cylinderGeometry
          args={[HEX_RADIUS, HEX_RADIUS, HEX_HEIGHT, HEX_SEGMENTS, 1, false]}
        />
        <meshStandardMaterial
          ref={bodyMatRef}
          color={C_BODY}
          emissive={C_IDLE_EMISSIVE}
          emissiveIntensity={0.3}
          roughness={0.35}
          metalness={0.75}
        />
      </mesh>

      {/* Accent ring — slightly larger, very thin */}
      <mesh position={[0, RING_HEIGHT / 2 - 0.01, 0]}>
        <cylinderGeometry
          args={[RING_OUTER, RING_OUTER, RING_HEIGHT, HEX_SEGMENTS, 1, true]}
        />
        <meshStandardMaterial
          ref={ringMatRef}
          color={C_RING}
          emissive={C_IDLE_EMISSIVE}
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.9}
          side={THREE.BackSide}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Top cap ring — thin disc at the top face edge */}
      <mesh position={[0, HEX_HEIGHT + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[HEX_RADIUS - 0.04, HEX_RADIUS, HEX_SEGMENTS]} />
        <meshStandardMaterial
          color={C_RING}
          emissive={C_HOVER_EMISSIVE}
          emissiveIntensity={hovered || isFocused ? 0.6 : 0.08}
          roughness={0.1}
          metalness={1.0}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ProjectNode({
  id,
  label,
  position,
  accentColor,
}: ProjectNodeProps): JSX.Element {
  const [hovered, setHovered] = useState(false);

  // Fine-grained selectors — each re-renders only when its slice changes
  const focusedNodeId = usePortfolioStore((s) => s.focusedNodeId);
  const setCamera     = usePortfolioStore((s) => s.setCamera);
  const setZoom       = usePortfolioStore((s) => s.setZoom);
  const setFocusedNodeId = usePortfolioStore((s) => s.setFocusedNodeId);
  const setInspection = usePortfolioStore((s) => s.setInspection);

  const isFocused = focusedNodeId === id;

  // ── Pointer cursor management ─────────────────────────────────────────────
  const onPointerEnter = useCallback(() => {
    setHovered(true);
    document.body.style.cursor = "pointer";
  }, []);

  const onPointerLeave = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = "auto";
  }, []);

  // ── Click → Zustand dispatch ─────────────────────────────────────────────
  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation(); // prevent event bubbling to canvas background

      // Pan camera to this node's XZ position
      setCamera({ x: position[0], z: position[2] });

      // Zoom in for inspection
      setZoom(FOCUS_ZOOM);

      // Record which node is focused
      setFocusedNodeId(id);

      // Transition global mode to inspection
      setInspection();
    },
    [id, position, setCamera, setZoom, setFocusedNodeId, setInspection]
  );

  return (
    <group
      position={position}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {/* Hex body + ring */}
      <HexBody
        hovered={hovered}
        isFocused={isFocused}
        accentColor={accentColor}
      />

      {/* Ground glow halo */}
      <GroundHalo hovered={hovered} isFocused={isFocused} />

      {/* Floating label */}
      <NodeLabel label={label} hovered={hovered} isFocused={isFocused} />
    </group>
  );
}
