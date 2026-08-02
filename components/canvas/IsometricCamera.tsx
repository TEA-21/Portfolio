"use client";

/**
 * components/canvas/IsometricCamera.tsx
 *
 * An orthographic camera positioned for a classic isometric view.
 *
 * ISOMETRIC MATH
 * --------------
 * True isometric uses equal 120° angles between axes, achieved by rotating
 * the camera:
 *   - 45° around the world Y-axis (azimuth)
 *   - arctan(1/√2) ≈ 35.264° around the local X-axis (elevation)
 *
 * We express this as a world-space camera position that looks at the target
 * (pan offset from Zustand) and let Three.js compute the view matrix.
 *
 * ZUSTAND INTEGRATION
 * -------------------
 * - camera.x / camera.y → pan offset applied to BOTH camera and lookAt target
 * - zoom → orthographic camera zoom property (not FOV)
 * - camera.z is unused for orthographic isometric (frustum size controls depth)
 *
 * We use useFrame instead of useEffect so mutations happen inside the render
 * loop, which is the R3F-idiomatic way to drive camera parameters every tick.
 */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePortfolioStore } from "@/lib/store";

// Distance the camera sits from the look-at target along the isometric ray.
const ISO_DISTANCE = 20;

// Isometric elevation angle (arctan(1/√2))
const ELEVATION = Math.atan(1 / Math.sqrt(2)); // ≈ 35.264°

// Azimuth around Y (45° gives equal left/right isometric look)
const AZIMUTH = Math.PI / 4; // 45°

// Pre-compute the normalised direction vector for the isometric camera ray.
//   x = cos(ELEVATION) * sin(AZIMUTH)
//   y = sin(ELEVATION)
//   z = cos(ELEVATION) * cos(AZIMUTH)
const ISO_DIR = new THREE.Vector3(
  Math.cos(ELEVATION) * Math.sin(AZIMUTH),
  Math.sin(ELEVATION),
  Math.cos(ELEVATION) * Math.cos(AZIMUTH)
).normalize();

export function IsometricCamera() {
  const { camera } = useThree();

  // Refs for smooth lerp — avoids re-renders
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  const storeCamera = usePortfolioStore((s) => s.camera);
  const zoom = usePortfolioStore((s) => s.zoom);

  useFrame(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;

    // Pan target derived from store x/y with fallback protection against NaN/undefined
    const panX = Number.isFinite(storeCamera?.x) ? storeCamera.x : 0;
    const panY = Number.isFinite(storeCamera?.y) ? storeCamera.y : 0;
    const rawZoom = Number.isFinite(zoom) ? zoom : 1;

    // Desired look-at point (pan in XZ world plane)
    targetLookAt.current.set(panX, 0, panY);

    // Camera position = look-at + isometric direction * distance
    targetPosition.current
      .copy(targetLookAt.current)
      .addScaledVector(ISO_DIR, ISO_DISTANCE);

    // Smooth lerp (0.08 = responsive but not snappy)
    camera.position.lerp(targetPosition.current, 0.08);
    camera.lookAt(targetLookAt.current);

    // Zoom — orthographic cameras use the `.zoom` property directly
    // Clamp so scene never inverts or disappears
    const targetZoom = Math.max(0.1, Math.min(10, rawZoom));
    camera.zoom += (targetZoom - camera.zoom) * 0.08;
    camera.near = -100;
    camera.far = 1000;
    camera.updateProjectionMatrix();
  });

  // This component drives the camera imperatively; no JSX output needed.
  return null;
}
