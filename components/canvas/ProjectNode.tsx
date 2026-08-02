"use client";

/**
 * components/canvas/ProjectNode.tsx
 *
 * An interactive hexagonal module representing a portfolio project.
 */

import {
  useRef,
  useState,
  useCallback,
  useMemo,
  type JSX,
} from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Float } from "@react-three/drei";
import * as THREE from "three";
import { usePortfolioStore, type ProjectCategory } from "@/lib/store";

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
const C_LABEL_DIMMED     = new THREE.Color("#334155");   // slate-700

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

  /** Project category for filtering. */
  category?: ProjectCategory;

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
  isDimmed,
}: {
  hovered: boolean;
  isFocused: boolean;
  isDimmed: boolean;
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (!matRef.current) return;
    const targetOpacity = isDimmed
      ? 0.01
      : isFocused
      ? 0.25
      : hovered
      ? 0.18
      : 0.06;
    matRef.current.opacity +=
      (targetOpacity - matRef.current.opacity) * 0.1;
  });

  return (
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
  isDimmed,
}: {
  label: string;
  hovered: boolean;
  isFocused: boolean;
  isDimmed: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null);
  const lerpedColor = useRef(C_LABEL_IDLE.clone());

  useFrame(() => {
    const target = isDimmed
      ? C_LABEL_DIMMED
      : hovered || isFocused
      ? C_LABEL_HOVER
      : C_LABEL_IDLE;
    lerpedColor.current.lerp(target, 0.1);
    if (textRef.current) {
      textRef.current.color = lerpedColor.current;
    }
  });

  return (
    <Float
      speed={isDimmed ? 0.5 : 1.4}
      rotationIntensity={0}
      floatIntensity={isDimmed ? 0.1 : 0.3}
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
  isDimmed,
  accentColor,
}: {
  hovered: boolean;
  isFocused: boolean;
  isDimmed: boolean;
  accentColor?: string;
}) {
  const bodyRef    = useRef<THREE.Mesh>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const focusedEmissive = useMemo(
    () => (accentColor ? new THREE.Color(accentColor) : C_FOCUSED_EMISSIVE),
    [accentColor]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // ── Body emissive ─────────────────────────────────────────────────
    if (bodyMatRef.current) {
      let targetEmissive: THREE.Color;
      if (isDimmed) {
        targetEmissive = new THREE.Color("#05080f");
      } else if (isFocused) {
        targetEmissive = focusedEmissive;
      } else if (hovered) {
        targetEmissive = C_HOVER_EMISSIVE;
      } else {
        const pulse = (Math.sin(t * 1.6) * 0.5 + 0.5) * 0.12;
        targetEmissive = C_IDLE_EMISSIVE.clone().multiplyScalar(1 + pulse * 4);
      }
      bodyMatRef.current.emissive.lerp(targetEmissive, 0.08);

      const targetIntensity = isDimmed
        ? 0.05
        : isFocused
        ? 1.2
        : hovered
        ? 0.9
        : 0.3;
      bodyMatRef.current.emissiveIntensity +=
        (targetIntensity - bodyMatRef.current.emissiveIntensity) * 0.08;
    }

    // ── Ring emissive ─────────────────────────────────────────────────
    if (ringMatRef.current) {
      const ringTarget = isDimmed
        ? new THREE.Color("#05080f")
        : isFocused
        ? focusedEmissive
        : hovered
        ? C_HOVER_EMISSIVE
        : C_IDLE_EMISSIVE;
      ringMatRef.current.emissive.lerp(ringTarget, 0.1);
      const ringIntensity = isDimmed
        ? 0.05
        : isFocused
        ? 2.0
        : hovered
        ? 1.4
        : 0.2;
      ringMatRef.current.emissiveIntensity +=
        (ringIntensity - ringMatRef.current.emissiveIntensity) * 0.1;
    }

    // ── Body scale on hover ───────────────────────────────────────────
    if (bodyRef.current) {
      const targetScale = isDimmed
        ? 0.92
        : hovered
        ? 1.07
        : isFocused
        ? 1.05
        : 1.0;
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

      {/* Accent ring */}
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
          opacity={isDimmed ? 0.2 : 0.85}
        />
      </mesh>

      {/* Top cap ring */}
      <mesh position={[0, HEX_HEIGHT + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[HEX_RADIUS - 0.04, HEX_RADIUS, HEX_SEGMENTS]} />
        <meshStandardMaterial
          color={C_RING}
          emissive={C_HOVER_EMISSIVE}
          emissiveIntensity={isDimmed ? 0.02 : hovered || isFocused ? 0.6 : 0.08}
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

import { playHoverSound, playSelectSound, playTransitionSound } from "@/lib/audio";

export function ProjectNode({
  id,
  label,
  category,
  position,
  accentColor,
}: ProjectNodeProps): JSX.Element {
  const [hovered, setHovered] = useState(false);

  const focusedNodeId = usePortfolioStore((s) => s.focusedNodeId);
  const activeCategories = usePortfolioStore((s) => s.activeCategories);
  const setCamera     = usePortfolioStore((s) => s.setCamera);
  const setZoom       = usePortfolioStore((s) => s.setZoom);
  const setFocusedNodeId = usePortfolioStore((s) => s.setFocusedNodeId);
  const setInspection = usePortfolioStore((s) => s.setInspection);

  const isFocused = focusedNodeId === id;
  const isDimmed = category ? !activeCategories.includes(category) : false;

  const onPointerEnter = useCallback(() => {
    setHovered(true);
    document.body.style.cursor = "pointer";
    playHoverSound();
  }, []);

  const onPointerLeave = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = "auto";
  }, []);

  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();

      playSelectSound();
      playTransitionSound();
      setCamera({ x: position[0], z: position[2] });
      setZoom(FOCUS_ZOOM);
      setFocusedNodeId(id);
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
      <HexBody
        hovered={hovered}
        isFocused={isFocused}
        isDimmed={isDimmed}
        accentColor={accentColor}
      />
      <GroundHalo hovered={hovered} isFocused={isFocused} isDimmed={isDimmed} />
      <NodeLabel label={label} hovered={hovered} isFocused={isFocused} isDimmed={isDimmed} />
    </group>
  );
}
