"use client";

/**
 * components/canvas/CanvasLayer.tsx
 *
 * Client-only wrapper that lazy-loads IsometricCanvas with ssr: false
 * and a mounted guard to ensure WebGL contexts only instantiate client-side.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { IsometricCanvasProps } from "./IsometricCanvas";

const IsometricCanvas = dynamic(
  () => import("./IsometricCanvas").then((m) => m.IsometricCanvas),
  { ssr: false }
);

export function CanvasLayer(props: IsometricCanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="fixed inset-0 w-full h-full min-h-screen z-0 overflow-hidden pointer-events-none bg-slate-dark"
        aria-hidden="true"
      />
    );
  }

  return <IsometricCanvas {...props} />;
}
