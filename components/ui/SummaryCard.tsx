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
  shadowos: [
    "Sub-second microVM hypervisor isolation (Firecracker/libkrun)",
    "Sub-100ms state snapshots & 1.34ms OverlayFS rollback",
    "Headless visual Chrome CDP driver & Antigravity MCP server",
  ],
  "local-llm": [
    "Asynchronous NVMe router prefetching with O_DIRECT",
    "Speculative lookahead batching reaching >8.4 tok/s",
    "SpikeBrain exponential decay hot-expert RAM pinning",
  ],
  projectparrot: [
    "Two-stage training on TinyStories with target-masked SFT",
    "Custom 1,024-token SentencePiece BPE tokenizer",
    "Bare-metal zero-dependency INT8 C runtime for ESP32-S3",
  ],
  zerotrust: [
    "Cross-platform Flutter/Dart architecture",
    "End-to-end encrypted ledger data storage",
    "Sub-second transaction anomaly telemetry",
  ],
  "aela-security": [
    "Autonomous zero-standing IAM privilege scale-down",
    "Real-time PyTorch LSTM 16-D sequence anomaly detection",
    "Scoped 5-minute TTL JIT credential leasing via AWS STS",
  ],
  dryaf: [
    "100% client-side HTML5 canvas CV water refraction scanner",
    "Google OAuth 2.0 mandatory verification & session tokens",
    "Web Audio API needle flapper physics Wheel of Sacrifice",
  ],
  "mpmc-project": [
    "YOLOv8 vehicle detection & Tesseract OCR normalization",
    "Li-Fi 3Hz flashlight optical unlock via real-time FFT",
    "Automated GDPR Gaussian blur face/plate anonymization",
  ],
  teachercopilot: [
    "Automated curriculum and lesson plan generation",
    "Dynamic grading rubric synthesizer",
    "Responsive Next.js & Tailwind CSS dashboard",
  ],
  parleylab: [
    "Stable-Baselines3 PPO reinforcement learning loops",
    "Multi-agent adversarial negotiation trees",
    "Real-time streamed debate scoring feedback",
  ],
  civicguard: [
    "WebAuthn passkey biometric authentication",
    "Local Zero-Knowledge Proof (ZKP) generation",
    "WASM compilation for client-side privacy",
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
