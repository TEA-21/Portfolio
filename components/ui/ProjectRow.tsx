"use client";

/**
 * components/ui/ProjectRow.tsx
 *
 * Individual project card rendered inside an expanded ClusterCard.
 * Features hover glow, tech tags, and micro-audio interactions.
 */

import { playHoverSound, playSelectSound } from "@/lib/audio";
import type { Project } from "@/lib/projects";

const STATUS_CONFIG = {
  live:     { label: "LIVE",     classes: "text-emerald-highlight border-emerald-highlight/50 bg-emerald-highlight/10" },
  wip:      { label: "WIP",      classes: "text-amber-caution border-amber-caution/50 bg-amber-caution/10" },
  archived: { label: "ARCHIVED", classes: "text-slate-500 border-slate-600/50 bg-slate-800/30" },
};

interface ProjectRowProps {
  project: Project;
  accentColor: string; // CSS color string for left border glow
}

export function ProjectRow({ project, accentColor }: ProjectRowProps) {
  const status = project.status ? STATUS_CONFIG[project.status] : null;

  return (
    <div
      role="article"
      onMouseEnter={() => playHoverSound()}
      className="group relative rounded-xl border border-white/5 bg-slate-900/50 p-4 transition-all duration-300 hover:border-white/20 hover:bg-slate-800/60 hover:shadow-lg"
      style={{
        boxShadow: "inset 3px 0 0 " + accentColor + "33",
      }}
    >
      {/* Hover left accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex flex-col gap-2">
        {/* Name row */}
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-mono text-sm font-bold tracking-wide text-white group-hover:text-white transition-colors">
            {project.name}
          </h4>
          {status && (
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${status.classes}`}
            >
              {status.label}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="font-sans text-xs leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
          {project.shortDesc}
        </p>

        {/* Tech tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        {(project.repoUrl || project.demoUrl) && (
          <div className="flex gap-3 mt-2">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => playHoverSound()}
                onClick={() => playSelectSound()}
                className="font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors pointer-events-auto"
              >
                [ SOURCE ]
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => playHoverSound()}
                onClick={() => playSelectSound()}
                className="font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors pointer-events-auto"
              >
                [ DEMO ]
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
