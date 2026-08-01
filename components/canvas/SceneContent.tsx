"use client";

/**
 * components/canvas/SceneContent.tsx
 *
 * Client component rendering the project nodes on the isometric grid.
 *
 * This component is passed as children to <CanvasLayer> inside app/layout.tsx.
 */

import { ProjectNode } from "./ProjectNode";
import { SpeedRunController } from "./SpeedRunController";
import type { ProjectCategory } from "@/lib/store";

interface ProjectConfig {
  id: string;
  label: string;
  category: ProjectCategory;
  position: [number, number, number];
}

/** Portfolio project nodes configuration. */
const PROJECTS: ProjectConfig[] = [
  { id: "parleylab", label: "ParleyLab", category: "AI Automation", position: [-3, 0, 3] },
  { id: "zerotrust", label: "ZeroTrust Finance", category: "Security & Systems", position: [3, 0, 3] },
  { id: "mpmc", label: "MPMC System", category: "Full-Stack Architecture", position: [3, 0, -3] },
  { id: "civicguard", label: "Civic Guard", category: "Security & Systems", position: [-3, 0, -3] },
];

export function SceneContent() {
  return (
    <>
      {/* Speed Run automated tour controller — no visual output */}
      <SpeedRunController />

      {PROJECTS.map((proj) => (
        <ProjectNode
          key={proj.id}
          id={proj.id}
          label={proj.label}
          category={proj.category}
          position={proj.position}
        />
      ))}
    </>
  );
}

