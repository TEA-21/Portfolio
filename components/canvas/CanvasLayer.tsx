"use client";

/**
 * components/canvas/CanvasLayer.tsx
 *
 * Thin 'use client' wrapper that lazy-loads IsometricCanvas.
 *
 * WHY A SEPARATE WRAPPER?
 * -----------------------
 * app/layout.tsx is a Server Component. Three.js (and R3F) rely on browser
 * globals (WebGL, ResizeObserver, etc.) that don't exist on the server.
 *
 * Using next/dynamic with `{ ssr: false }` ensures the canvas is only ever
 * instantiated client-side, preventing "window is not defined" SSR errors
 * and hydration mismatches — even if Next.js tries to pre-render the layout.
 *
 * This wrapper is itself `'use client'` so it can receive the dynamic import
 * result safely. It is imported as a normal import in layout.tsx; Next.js
 * will automatically treat it as a client boundary.
 */

import dynamic from "next/dynamic";
import type { IsometricCanvasProps } from "./IsometricCanvas";

const IsometricCanvas = dynamic(
  () => import("./IsometricCanvas").then((m) => m.IsometricCanvas),
  { ssr: false }
);

export function CanvasLayer(props: IsometricCanvasProps) {
  return <IsometricCanvas {...props} />;
}
