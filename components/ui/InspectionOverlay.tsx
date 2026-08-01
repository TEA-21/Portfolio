"use client";

/**
 * components/ui/InspectionOverlay.tsx
 *
 * A full-viewport HUD overlay that surfaces project details when the
 * portfolio's interaction state transitions to 'inspection'.
 */

import { useEffect, useState, useCallback } from "react";
import { usePortfolioStore } from "@/lib/store";
import type { ProjectCategory } from "@/lib/store";
import { SummaryCard } from "./SummaryCard";

// ---------------------------------------------------------------------------
// Static project data registry
// ---------------------------------------------------------------------------

interface ProjectMetric {
  label: string;
  value: string;
  /** 0–100 fill % for the progress bar */
  fill: number;
  color: "cyan" | "emerald" | "amber";
}

interface ProjectData {
  title: string;
  category: ProjectCategory;
  tagline: string;
  description: string;
  techStack: string[];
  status: "DEPLOYED" | "IN_DEV" | "ARCHIVED";
  metrics: ProjectMetric[];
  liveSandboxUrl?: string;
  githubRepoUrl?: string;
}

const PROJECTS: Record<string, ProjectData> = {
  parleylab: {
    title: "ParleyLab",
    category: "AI Automation",
    tagline: "Adaptive AI Negotiation Engine",
    description:
      "A multi-agent LLM pipeline that simulates adversarial negotiation scenarios. Uses reinforcement feedback loops to tune persuasion strategies across structured conversation trees.",
    techStack: ["Python", "LangChain", "FastAPI", "React", "PostgreSQL"],
    status: "DEPLOYED",
    metrics: [
      { label: "Response Accuracy", value: "94.2%", fill: 94, color: "emerald" },
      { label: "Avg Latency",       value: "380ms",  fill: 72, color: "cyan"    },
      { label: "Context Retention", value: "8K tok", fill: 80, color: "cyan"    },
      { label: "Test Coverage",     value: "88%",    fill: 88, color: "emerald" },
    ],
    liveSandboxUrl: "https://example.com/parleylab-sandbox",
    githubRepoUrl: "https://github.com/example/parleylab",
  },
  zerotrust: {
    title: "ZeroTrust Finance",
    category: "Security & Systems",
    tagline: "Behavioural Anomaly Detection Platform",
    description:
      "Real-time transaction monitoring system that applies a zero-trust architecture and ML-based anomaly scoring to flag suspicious financial behaviour with sub-second latency.",
    techStack: ["Flutter", "Dart", "Prisma ORM", "Go", "Kafka", "Redis"],
    status: "DEPLOYED",
    metrics: [
      { label: "Detection Rate",   value: "99.1%",  fill: 99, color: "emerald" },
      { label: "False Positives",  value: "0.3%",   fill: 3,  color: "amber"   },
      { label: "P99 Latency",      value: "45ms",   fill: 90, color: "cyan"    },
      { label: "Events / sec",     value: "12K",    fill: 82, color: "cyan"    },
    ],
    liveSandboxUrl: "https://example.com/zerotrust-sandbox",
    githubRepoUrl: "https://github.com/example/zerotrust",
  },
  mpmc: {
    title: "MPMC System",
    category: "Full-Stack Architecture",
    tagline: "Multi-Producer Multi-Consumer Queue Engine",
    description:
      "A hardware-integrated concurrent queue engine with ESP32 sensors and YOLOv8 predictive analytics. Benchmarked for ultra-low latency data pipelines.",
    techStack: ["ESP32", "YOLOv8", "Python", "C++17", "React", "WebSockets"],
    status: "IN_DEV",
    metrics: [
      { label: "Throughput",       value: "4.2M/s", fill: 88, color: "emerald" },
      { label: "Lock Contention",  value: "0.01%",  fill: 99, color: "emerald" },
      { label: "Memory Overhead",  value: "18MB",   fill: 55, color: "amber"   },
      { label: "Benchmark Score",  value: "97/100", fill: 97, color: "cyan"    },
    ],
    liveSandboxUrl: "https://example.com/mpmc-sandbox",
    githubRepoUrl: "https://github.com/example/mpmc",
  },
  civicguard: {
    title: "Civic Guard",
    category: "Security & Systems",
    tagline: "Critical Infrastructure Threat Monitor",
    description:
      "A WebAuthn biometric security platform integrated with Solidity smart contracts and DigiLocker API for verifiable municipal credential authentication.",
    techStack: ["WebAuthn", "Solidity", "DigiLocker API", "Node.js", "Docker"],
    status: "DEPLOYED",
    metrics: [
      { label: "Uptime",           value: "99.97%", fill: 100, color: "emerald" },
      { label: "Nodes Monitored",  value: "340",    fill: 68,  color: "cyan"    },
      { label: "Alert MTTD",       value: "1.2s",   fill: 95,  color: "emerald" },
      { label: "Data Ingestion",   value: "6K/min", fill: 78,  color: "cyan"    },
    ],
    liveSandboxUrl: "https://example.com/civicguard-sandbox",
    githubRepoUrl: "https://github.com/example/civicguard",
  },
};

const FALLBACK_PROJECT: ProjectData = {
  title: "Unknown Node",
  category: "Full-Stack Architecture",
  tagline: "No data loaded",
  description: "Select a project node on the grid to load its telemetry data.",
  techStack: [],
  status: "ARCHIVED",
  metrics: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BAR_COLOR = {
  cyan:    "bg-cyan-focus",
  emerald: "bg-emerald-highlight",
  amber:   "bg-amber-caution",
} as const;

// ---------------------------------------------------------------------------
// Sub-component: metric row
// ---------------------------------------------------------------------------

function MetricRow({ metric }: { metric: ProjectMetric }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-slate-400 uppercase tracking-wider">{metric.label}</span>
        <span className={`font-bold ${
          metric.color === "cyan"    ? "text-cyan-focus"         :
          metric.color === "emerald" ? "text-emerald-highlight" :
                                       "text-amber-caution"
        }`}>
          {metric.value}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-slate-800/80">
        <div
          className={`h-1 rounded-full ${BAR_COLOR[metric.color]} transition-all duration-700`}
          style={{ width: `${metric.fill}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function InspectionOverlay() {
  const mode          = usePortfolioStore((s) => s.mode);
  const focusedNodeId = usePortfolioStore((s) => s.focusedNodeId);
  const setIdle       = usePortfolioStore((s) => s.setIdle);
  const resetCamera   = usePortfolioStore((s) => s.resetCamera);
  const setFocusedNodeId = usePortfolioStore((s) => s.setFocusedNodeId);

  const speedRunSequence = usePortfolioStore((s) => s.speedRunSequence);
  const currentStepIndex = usePortfolioStore((s) => s.currentStepIndex);
  const advanceSpeedRun  = usePortfolioStore((s) => s.advanceSpeedRun);
  const activeRole       = usePortfolioStore((s) => s.activeRole);

  const isSpeedRunActive =
    activeRole != null &&
    speedRunSequence.length > 0 &&
    currentStepIndex < speedRunSequence.length;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (mode === "inspection") {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [mode]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIdle();
      resetCamera();
      setFocusedNodeId(null);
    }, 300);
  }, [setIdle, resetCamera, setFocusedNodeId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mode === "inspection") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, handleClose]);

  if (mode !== "inspection") return null;

  const project: ProjectData =
    (focusedNodeId != null && focusedNodeId in PROJECTS)
      ? PROJECTS[focusedNodeId]!
      : FALLBACK_PROJECT;

  return (
    <div
      className={`
        fixed inset-0 z-30
        flex items-end justify-center
        pb-8 px-6
        transition-all duration-300 ease-out
        ${visible ? "opacity-100" : "opacity-0"}
      `}
    >
      {/* Click backdrop to close */}
      <div
        className="absolute inset-0 bg-slate-dark/50 backdrop-blur-sm pointer-events-auto"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* ── Main panel ───────────────────────────────────────────────────── */}
      <div
        className={`
          relative z-10 w-full max-w-5xl pointer-events-auto
          transition-all duration-300 ease-out
          ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
        `}
      >
        {/* Top scan-line bar */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-focus to-transparent mb-1 opacity-60" />

        {/* Panel container */}
        <div className="rounded-xl border border-cyan-focus/30 bg-slate-dark/95 shadow-[0_0_40px_rgba(56,189,248,0.15)] overflow-hidden">

          {/* ── Top bar: id + advance tour + close button ──────────────── */}
          <div className="flex items-center justify-between border-b border-cyan-focus/15 px-5 py-3">
            <div className="flex items-center gap-3 font-mono text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-highlight animate-pulse" />
              <span>NODE_ID: <span className="text-cyan-focus">{focusedNodeId ?? "NULL"}</span></span>
              <span className="text-slate-700">|</span>
              <span>MODE: <span className="text-emerald-highlight">INSPECTION</span></span>
              {isSpeedRunActive && (
                <>
                  <span className="text-slate-700">|</span>
                  <span className="text-amber-caution font-bold">
                    TOUR STEP {currentStepIndex + 1}/{speedRunSequence.length}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isSpeedRunActive && (
                <button
                  onClick={() => advanceSpeedRun()}
                  className="flex items-center gap-2 rounded-md border border-emerald-500/60 bg-emerald-950/40 px-3 py-1.5 font-mono text-xs font-bold text-emerald-highlight transition-all duration-150 hover:bg-emerald-900/60 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                >
                  <span>
                    {currentStepIndex + 1 < speedRunSequence.length
                      ? "NEXT PROJECT IN TOUR"
                      : "FINISH TOUR"}
                  </span>
                  <span>&rarr;</span>
                </button>
              )}

              <button
                onClick={handleClose}
                className="group flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 font-mono text-xs text-slate-400 transition-all duration-150 hover:border-red-500/60 hover:bg-red-950/40 hover:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
              >
                <span>CLOSE</span>
                <span className="text-base leading-none group-hover:rotate-90 transition-transform duration-200">×</span>
              </button>
            </div>
          </div>


          {/* ── Two-column content grid ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* ── LEFT: Executive Summary Card ────────────────────────── */}
            <div className="border-b lg:border-b-0 lg:border-r border-cyan-focus/10 p-5">
              <SummaryCard
                focusedNodeId={focusedNodeId}
                title={project.title}
                category={project.category}
                tagline={project.tagline}
                description={project.description}
                techStack={project.techStack}
                status={project.status}
                liveSandboxUrl={project.liveSandboxUrl}
                githubRepoUrl={project.githubRepoUrl}
              />
            </div>

            {/* ── RIGHT: Metric Telemetry Panel ───────────────────────── */}
            <div className="p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500">
                    [ Metric Telemetry ]
                  </h3>
                  <span className="font-mono text-[10px] text-emerald-highlight animate-pulse">
                    ● LIVE
                  </span>
                </div>

                {project.metrics.length > 0 ? (
                  <div className="space-y-4">
                    {project.metrics.map((metric) => (
                      <MetricRow key={metric.label} metric={metric} />
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-slate-600">No telemetry available.</p>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-cyan-focus/10">
                <div className="font-mono text-[10px] text-slate-600 space-y-1">
                  <p>
                    SYS_TIME:{" "}
                    <span className="text-slate-500">
                      {new Date().toISOString()}
                    </span>
                  </p>
                  <p>
                    RENDER_NODE: <span className="text-cyan-focus">ISO_GRID_v2</span>
                    {"  "}
                    CAMERA: <span className="text-cyan-focus">ORTHO_35.26°</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom scan-line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-focus to-transparent mt-1 opacity-40" />
      </div>
    </div>
  );
}
