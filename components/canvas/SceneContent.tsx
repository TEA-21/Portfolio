"use client";

/**
 * components/canvas/SceneContent.tsx
 *
 * Default scene content — a sample cluster of ProjectNodes arranged
 * in a hexagonal ring around the origin on the XZ grid.
 *
 * This is a Client Component that renders R3F objects inside the canvas.
 * It is imported by app/page.tsx and passed as `children` to CanvasLayer,
 * keeping page.tsx itself a clean Server Component.
 *
 * Swap / extend this with real project data as the portfolio grows.
 */

import { ProjectNode } from "./ProjectNode";

/** Sample project data — replace with real content. */
const DEMO_PROJECTS = [
  { id: "proj-01", label: "Neural OS",     position: [ 0,   0,  0  ] as [number, number, number] },
  { id: "proj-02", label: "HexForge",      position: [ 3,   0,  0  ] as [number, number, number] },
  { id: "proj-03", label: "Grid Protocol", position: [ 1.5, 0,  2.6] as [number, number, number] },
  { id: "proj-04", label: "Void Runner",   position: [-1.5, 0,  2.6] as [number, number, number] },
  { id: "proj-05", label: "Cipher Chain",  position: [-3,   0,  0  ] as [number, number, number] },
  { id: "proj-06", label: "Neon Archive",  position: [-1.5, 0, -2.6] as [number, number, number] },
  { id: "proj-07", label: "Pulse Engine",  position: [ 1.5, 0, -2.6] as [number, number, number] },
] as const;

export function SceneContent() {
  return (
    <>
      {DEMO_PROJECTS.map((proj) => (
        <ProjectNode
          key={proj.id}
          id={proj.id}
          label={proj.label}
          position={proj.position}
        />
      ))}
    </>
  );
}
