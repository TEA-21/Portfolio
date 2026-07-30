"use client";

/**
 * components/ui/SummaryCard.tsx
 *
 * Executive Summary Card component rendered within the InspectionOverlay.
 * Displays project metadata, high-contrast core contribution bullet points,
 * and direct links for Live Sandbox & GitHub Repository.
 *
 * Styled with an emerald-highlight (#10b981) border and cyberpunk HUD aesthetic.
 */

import type { ProjectCategory } from "@/lib/store";

export interface SummaryCardProps {
  focusedNodeId: string | null;
  title: string;
  category: ProjectCategory;
  tagline: string;
  description: string;
  techStack: string[];
  status: "DEPLOYED" | "IN_DEV" | "ARCHIVED";
  liveSandboxUrl?: string;
  githubRepoUrl?: string;
}

/** 3-bullet core contributions keyed by focusedNodeId */
const CORE_CONTRIBUTIONS: Record<string, [string, string, string]> = {
  parleylab: [
    "Python LLM fallback routing",
    "Zustand state management",
    "Interactive negotiation panels",
  ],
  zerotrust: [
    "Cross-platform Flutter/Dart applications",
    "Prisma ORM integration",
    "Transaction telemetry",
  ],
  mpmc: [
    "ESP32 hardware integration",
    "YOLOv8 predictive analytics",
    "Python backend",
  ],
  civicguard: [
    "WebAuthn biometrics",
    "Solidity smart contracts",
    "DigiLocker API integration",
  ],
};

const DEFAULT_CONTRIBUTIONS: [string, string, string] = [
  "Modular architecture design",
  "High-performance state synchronization",
  "Automated telemetry tracking",
];

const CATEGORY_STYLES: Record<ProjectCategory, string> = {
  "AI Automation": "bg-cyan-focus/15 text-cyan-focus border-cyan-focus/40",
  "Security & Systems": "bg-emerald-highlight/15 text-emerald-highlight border-emerald-highlight/40",
  "Full-Stack Architecture": "bg-amber-caution/15 text-amber-caution border-amber-caution/40",
};

const STATUS_STYLES = {
  DEPLOYED: "border-emerald-highlight/60 text-emerald-highlight bg-emerald-highlight/10",
  IN_DEV: "border-amber-caution/60 text-amber-caution bg-amber-caution/10",
  ARCHIVED: "border-slate-600 text-slate-500 bg-slate-800/40",
} as const;

export function SummaryCard({
  focusedNodeId,
  title,
  category,
  tagline,
  description,
  techStack,
  status,
  liveSandboxUrl = "#",
  githubRepoUrl = "#",
}: SummaryCardProps) {
  const bullets =
    (focusedNodeId && CORE_CONTRIBUTIONS[focusedNodeId]) || DEFAULT_CONTRIBUTIONS;

  return (
    <div className="flex flex-col justify-between h-full rounded-xl border border-emerald-highlight/60 bg-slate-dark/90 p-6 shadow-[0_0_25px_rgba(16,185,129,0.15)] space-y-5">
      {/* Top Header & Badges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${CATEGORY_STYLES[category]}`}
          >
            {category}
          </span>
          <span
            className={`rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_STYLES[status]}`}
          >
            {status}
          </span>
        </div>

        {/* Project Title & Tagline */}
        <div>
          <h2 className="font-mono text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
            {title}
          </h2>
          <p className="mt-1 font-mono text-sm text-emerald-highlight">
            // {tagline}
          </p>
        </div>

        {/* Project Overview Description */}
        <p className="font-sans text-sm leading-relaxed text-slate-300">
          {description}
        </p>

        {/* Core Contributions (3 High-Contrast Bullets) */}
        <div className="rounded-lg border border-emerald-highlight/30 bg-emerald-highlight/5 p-4 space-y-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-highlight font-semibold">
            [ CORE CONTRIBUTIONS ]
          </p>
          <ul className="space-y-2 font-mono text-xs text-slate-200">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-emerald-highlight font-bold font-mono">
                  &gt;&gt;
                </span>
                <span className="leading-tight text-slate-100 font-medium">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tech Stack Tags */}
        {techStack.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
              Tech Stack
            </p>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 font-mono text-xs text-slate-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Links: Live Sandbox & GitHub Repo */}
      <div className="pt-2 border-t border-emerald-highlight/20 flex flex-wrap gap-3">
        <a
          href={liveSandboxUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center rounded-lg border border-emerald-highlight bg-emerald-highlight/20 px-4 py-2.5 font-mono text-xs font-semibold text-emerald-highlight shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all duration-200 hover:bg-emerald-highlight/35 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] focus:outline-none focus:ring-1 focus:ring-emerald-highlight"
        >
          LIVE SANDBOX ↗
        </a>
        <a
          href={githubRepoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center rounded-lg border border-cyan-focus/50 bg-cyan-focus/10 px-4 py-2.5 font-mono text-xs font-semibold text-cyan-focus transition-all duration-200 hover:bg-cyan-focus/25 hover:border-cyan-focus focus:outline-none focus:ring-1 focus:ring-cyan-focus"
        >
          GITHUB REPO ↗
        </a>
      </div>
    </div>
  );
}
