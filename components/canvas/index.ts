/**
 * components/canvas/index.ts
 *
 * Public barrel for the canvas sub-module.
 * Import canvas components from '@/components/canvas'.
 *
 * NOTE: All exports are Client Components ('use client').
 * Never import these from a Server Component's render tree directly —
 * they are safe to import in other Client Components or in layout via
 * a thin lazy-loaded wrapper.
 */

export { IsometricCanvas } from "./IsometricCanvas";
export type { IsometricCanvasProps } from "./IsometricCanvas";

export { IsometricCamera } from "./IsometricCamera";
export { SceneLighting } from "./SceneLighting";
export { BaseGrid } from "./BaseGrid";
export { CyberGrid } from "./CyberGrid";
export { ProjectNode } from "./ProjectNode";
export type { ProjectNodeProps } from "./ProjectNode";


