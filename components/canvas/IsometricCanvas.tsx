"use client";

/**
 * components/canvas/IsometricCanvas.tsx
 *
 * Full-screen React Three Fiber canvas with a fixed isometric orthographic
 * camera. Renders behind all Next.js page content via CSS positioning.
 *
 * ARCHITECTURE NOTES
 * ------------------
 * • `fixed inset-0 w-full h-full min-h-screen z-0` makes the canvas fill the viewport and sit
 *   behind page content (z-index: 0). Page UI layers on top via z-index.
 *
 * • The R3F <Canvas> uses an orthographic camera with frustum bounds derived
 *   from viewport aspect ratio and zoom level from the Zustand store.
 *
 * • React.Suspense & CanvasErrorBoundary prevent silent asset or WebGL context failures.
 */

import React, { useRef, useEffect, type ReactNode, Component } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { IsometricCamera } from "./IsometricCamera";
import { SceneLighting } from "./SceneLighting";
import { CyberGrid } from "./CyberGrid";

// ---------------------------------------------------------------------------
// Error Boundary Component for R3F Scene
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[CanvasErrorBoundary] Caught R3F rendering exception:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return null; // Gracefully handle canvas error without crashing page layout
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The orthographic frustum half-size at zoom=1.
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

  useEffect(() => {
    console.log("[IsometricCanvas] Canvas Mounted successfully");
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full min-h-screen z-0 overflow-hidden pointer-events-none"
    >
      <Canvas
        orthographic
        camera={{
          position: [10, 10, 10],
          near: -100,
          far: 1000,
          zoom: 1,
        }}
        dpr={[1, 2]}
        frameloop="always"
        shadows={{ type: THREE.PCFSoftShadowMap }}
        linear
        gl={{ alpha: true, antialias: true }}
        style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
        onCreated={({ camera, size }) => {
          console.log("[IsometricCanvas] WebGL context created", size);
          if (camera instanceof THREE.OrthographicCamera) {
            const aspect = size.width / size.height || 1;
            camera.left = -FRUSTUM_SIZE * aspect;
            camera.right = FRUSTUM_SIZE * aspect;
            camera.top = FRUSTUM_SIZE;
            camera.bottom = -FRUSTUM_SIZE;
            camera.near = -100;
            camera.far = 1000;
            camera.updateProjectionMatrix();
          }
        }}
      >
        <CanvasErrorBoundary>
          <React.Suspense fallback={null}>

            {/* Camera rig — reads pan + zoom from Zustand store */}
            <IsometricCamera />

            {/* Lighting rig */}
            <SceneLighting />

            {/* Cyberpunk terminal grid — foundational XZ floor */}
            <CyberGrid />

            {/* Scene children (nodes, connectors, controllers) */}
            {children}
          </React.Suspense>
        </CanvasErrorBoundary>
      </Canvas>
    </div>
  );
}
