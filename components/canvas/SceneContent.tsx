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
import { NodeConnectors } from "./NodeConnectors";
import type { ProjectCategory } from "@/lib/store";

interface ProjectConfig {
  id: string;
  label: string;
  category: ProjectCategory;
  position: [number, number, number];
}

/** Portfolio project nodes configuration. */
const PROJECTS: ProjectConfig[] = [
  { id: "shadowos", label: "ShadowOS", category: "Security & Systems", position: [-3.5, 0, 2.0] },
  { id: "local-llm", label: "Colibri MoE", category: "AI Automation", position: [0.0, 0, 3.5] },
  { id: "projectparrot", label: "Project Parrot", category: "AI Automation", position: [3.5, 0, 2.0] },
  { id: "zerotrust", label: "ZeroTrust Finance", category: "Security & Systems", position: [3.5, 0, -2.0] },
  { id: "aela-security", label: "AELA Security", category: "Security & Systems", position: [0.0, 0, -3.5] },
  { id: "dryaf", label: "DryAF Oasis", category: "Full-Stack Architecture", position: [-3.5, 0, -2.0] },
];

export function SceneContent() {
  return (
    <>
      {/* Speed Run automated tour controller — no visual output */}
      <SpeedRunController />

      {/* Animated data-telemetry connector lines between nodes */}
      <NodeConnectors />

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

