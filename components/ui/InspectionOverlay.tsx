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
  shadowos: {
    title: "ShadowOS",
    category: "Security & Systems",
    tagline: "Hardware-Isolated Ephemeral MicroVM Sandbox",
    description:
      "Sub-second hardware-isolated microVM sandbox designed for autonomous AI agents in Rust. Features sub-100ms state snapshots & rollbacks via 4-layer OverlayFS, direct memory-mapped virtiofsd DAX, Chrome CDP browser driving, and a native Model Context Protocol (MCP) server for Google Antigravity IDE.",
    techStack: ["Rust", "Firecracker", "libkrun", "OverlayFS", "AF_VSOCK", "CDP", "MCP", "Xvfb"],
    status: "DEPLOYED",
    metrics: [
      { label: "Cold Boot Provisioning", value: "22.4ms", fill: 98, color: "emerald" },
      { label: "Rollback Latency",      value: "1.34ms", fill: 99, color: "emerald" },
      { label: "RAM-Disk Speed",        value: "14,929 MB/s", fill: 95, color: "cyan" },
      { label: "Zero-TCP Framing",      value: "0.32 µs", fill: 96, color: "cyan" },
    ],
    githubRepoUrl: "https://github.com/TEA-21/ShadowOS",
  },
  "local-llm": {
    title: "Colibri MoE Engine",
    category: "AI Automation",
    tagline: "Ultra-Low Footprint MoE Inference Engine",
    description:
      "High-throughput C++ Mixture-of-Experts inference runtime executing Qwen 27B (3.8B active) within a strict 5.0 GB physical RAM ceiling. Resolves NVMe streaming latency using asynchronous router prefetching (O_DIRECT), speculative lookahead draft batching, and dynamic SpikeBrain hot-expert pinning.",
    techStack: ["C++", "Qwen 27B MoE", "NVMe Streaming", "AVX2", "SpikeBrain Pinning", "Quantization"],
    status: "DEPLOYED",
    metrics: [
      { label: "Generation Throughput", value: "8.4 tok/s", fill: 85, color: "emerald" },
      { label: "Host RAM Ceiling",     value: "5.0 GB Max", fill: 92, color: "cyan" },
      { label: "Hot-Store Hit Rate",    value: "75%", fill: 75, color: "emerald" },
      { label: "NVMe Read Rate",        value: "4.0 GB/s", fill: 90, color: "cyan" },
    ],
    githubRepoUrl: "https://github.com/TEA-21/Local_LLM",
  },
  projectparrot: {
    title: "Project Parrot",
    category: "AI Automation",
    tagline: "Bare-Metal Micro-SLM on ESP32 Microcontrollers",
    description:
      "Custom ~1.97M parameter decoder-only Transformer micro-SLM trained from scratch on TinyStories with a dedicated 1,024-token SentencePiece BPE tokenizer. INT8 quantized into a 2.0MB flash payload executing local conversational inference with zero dependencies on ESP32-S3 and WROVER hardware.",
    techStack: ["C", "ESP32-S3", "Micro-SLM", "PyTorch", "SentencePiece", "INT8 Quantization", "Bare-Metal"],
    status: "DEPLOYED",
    metrics: [
      { label: "Active Parameters",     value: "1.97M", fill: 70, color: "cyan" },
      { label: "INT8 Flash Budget",     value: "2.00 MB", fill: 95, color: "emerald" },
      { label: "CPU Throughput",        value: "250+ tok/s", fill: 94, color: "emerald" },
      { label: "Target-Masked SFT Loss", value: "0.0025", fill: 99, color: "emerald" },
    ],
    githubRepoUrl: "https://github.com/TEA-21/ProjectParrot",
  },
  zerotrust: {
    title: "ZeroTrust Finance",
    category: "Security & Systems",
    tagline: "Zero-Trust Encrypted Ledger & Financial Platform",
    description:
      "Zero-trust financial architecture engineered with Flutter and Dart, featuring end-to-end encrypted ledger storage, cryptographic audit trails, role-based access control, and real-time transaction telemetry.",
    techStack: ["Flutter", "Dart", "Zero-Trust RBAC", "Cryptography", "REST API", "Telemetry"],
    status: "DEPLOYED",
    metrics: [
      { label: "Encryption Grade",      value: "End-to-End", fill: 100, color: "emerald" },
      { label: "Access Architecture",   value: "Zero-Standing", fill: 96, color: "cyan" },
      { label: "Transaction Latency",   value: "32ms", fill: 92, color: "emerald" },
      { label: "State Synchronization", value: "Real-time", fill: 88, color: "cyan" },
    ],
    githubRepoUrl: "https://github.com/TEA-21/ZeroTrust-Finance-Tracker",
  },
  "aela-security": {
    title: "AELA Cloud Security",
    category: "Security & Systems",
    tagline: "Autonomous Zero-Standing Privilege & JIT IAM Engine",
    description:
      "Closed-loop cloud security framework that eliminates standing privileges by dynamically scaling permissions down to absolute zero during inactivity. Features time-decay triggers, PyTorch LSTM sequence anomaly detection over CloudTrail/CloudWatch streams, and automated 5-minute scoped JIT credential leasing via AWS STS.",
    techStack: ["AWS Lambda", "CloudTrail", "DynamoDB", "PyTorch LSTM", "Step Functions", "Vite", "React"],
    status: "DEPLOYED",
    metrics: [
      { label: "Standing Privileges",   value: "0 Standing", fill: 100, color: "emerald" },
      { label: "JIT Lease TTL",         value: "5 Minutes", fill: 90, color: "cyan" },
      { label: "Anomaly Detection",     value: "16-D LSTM", fill: 94, color: "emerald" },
      { label: "Public Egress",         value: "0% (Private Endpoints)", fill: 100, color: "cyan" },
    ],
    githubRepoUrl: "https://github.com/TEA-21/Cloud-Project",
  },
  dryaf: {
    title: "DryAF Oasis",
    category: "Full-Stack Architecture",
    tagline: "Hostel Dehydration Guide & On-Device Vision Scanner",
    description:
      "Neo-brutalist hostel utility solving the dorm tragedy of the commons. Features 100% client-side HTML5 canvas computer vision water refraction verification (analyzing caustics and meniscus gradients with zero server uploads), mandatory Google OAuth, Web Audio API flapper physics for the Wheel of Sacrifice, and LRU fairness queues.",
    techStack: ["JavaScript", "HTML5 Canvas", "Client-Side CV", "Google OAuth 2.0", "Firebase", "Web Audio API"],
    status: "DEPLOYED",
    metrics: [
      { label: "Verification Engine",   value: "On-Device CV", fill: 95, color: "emerald" },
      { label: "Server Image Uploads",  value: "0 Bytes", fill: 100, color: "emerald" },
      { label: "Authentication",        value: "Google OAuth 2.0", fill: 90, color: "cyan" },
      { label: "Tie-Breaker Engine",    value: "Audio Physics Wheel", fill: 88, color: "amber" },
    ],
    liveSandboxUrl: "https://dryaf-oasis-65def.web.app/",
    githubRepoUrl: "https://github.com/TEA-21/DryAF",
  },
  teachercopilot: {
    title: "TeacherCopilot",
    category: "AI Automation",
    tagline: "AI Dashboard for Educators & Automated Curriculum",
    description:
      "Comprehensive AI assistant designed to automate curriculum planning, lesson creation, and dynamic grading rubric generation for educators using modern LLM APIs and Next.js.",
    techStack: ["TypeScript", "Next.js", "OpenAI API", "Tailwind CSS", "React"],
    status: "DEPLOYED",
    metrics: [
      { label: "Curriculum Generation", value: "Instant", fill: 94, color: "emerald" },
      { label: "Rubric Accuracy",       value: "96%", fill: 96, color: "cyan" },
      { label: "API Response Time",     value: "420ms", fill: 82, color: "cyan" },
      { label: "UI Component Reusability", value: "100%", fill: 100, color: "emerald" },
    ],
    githubRepoUrl: "https://github.com/TEA-21/TeacherCopilot",
  },
  parleylab: {
    title: "ParleyLab",
    category: "AI Automation",
    tagline: "Adaptive AI Negotiation Engine",
    description:
      "An interactive negotiation simulator built with Stable-Baselines3 PPO reinforcement learning and multi-agent LLM coaching. Allows users to practice high-stakes negotiation scenarios with real-time feedback.",
    techStack: ["Python", "Reinforcement Learning", "FastAPI", "Next.js", "TypeScript", "LLM"],
    status: "DEPLOYED",
    metrics: [
      { label: "Response Accuracy",     value: "94.2%", fill: 94, color: "emerald" },
      { label: "Avg Latency",           value: "380ms", fill: 72, color: "cyan" },
      { label: "Context Retention",     value: "8K tok", fill: 80, color: "cyan" },
      { label: "Test Coverage",         value: "88%", fill: 88, color: "emerald" },
    ],
    githubRepoUrl: "https://github.com/IEEE-VIT/ParleyLab",
  },
  "mrz-read": {
    title: "MRZ Read",
    category: "Full-Stack Architecture",
    tagline: "Passport MRZ Reader & OMR Document Engine",
    description:
      "High-speed computer vision engine using OpenCV for scanning passport Machine Readable Zone lines and parsing optical mark recognition (OMR) sheets with custom structural verification templates.",
    techStack: ["Python", "OpenCV", "OCR", "Image Processing", "Pattern Recognition"],
    status: "DEPLOYED",
    metrics: [
      { label: "Recognition Accuracy",  value: "99.4%", fill: 99, color: "emerald" },
      { label: "Scan Time",             value: "120ms", fill: 92, color: "cyan" },
      { label: "Supported Formats",     value: "ICAO Doc 9303", fill: 90, color: "cyan" },
      { label: "Edge Compatibility",    value: "100%", fill: 100, color: "emerald" },
    ],
    githubRepoUrl: "https://github.com/TEA-21/MRZ_Read",
  },
  "mpmc-project": {
    title: "Edge-AI Smart Parking",
    category: "Full-Stack Architecture",
    tagline: "Cyberpunk YOLOv8 LPR & Li-Fi Flashlight Unlock",
    description:
      "Cyberpunk smart parking and vehicle access management system. Combines YOLOv8 vehicle detection, Tesseract OCR license plate recognition, multi-factor visual validation (color + model), Li-Fi flashlight frequency detection (3Hz FFT stroboscopic unlock), GDPR-compliant automated face/plate blurring, and an ESP32 ultrasonic gate controller with real-time Socket.IO telemetry.",
    techStack: ["YOLOv8", "Tesseract OCR", "ESP32", "Li-Fi (FFT)", "FastAPI", "Socket.IO", "Vue 3", "GDPR Privacy"],
    status: "DEPLOYED",
    metrics: [
      { label: "LPR OCR Accuracy",      value: "98.5%", fill: 98, color: "emerald" },
      { label: "Li-Fi Strobe Detection", value: "3 Hz (FFT)", fill: 92, color: "cyan" },
      { label: "GDPR Anonymization",    value: "Gaussian Blur", fill: 95, color: "emerald" },
      { label: "Telemetry Latency",     value: "100ms", fill: 90, color: "cyan" },
    ],
    githubRepoUrl: "https://github.com/TEA-21/MPMC-Project",
  },
  privguardweb: {
    title: "PrivGuard Web",
    category: "Security & Systems",
    tagline: "Privacy-Preserving Web Security Scanner",
    description:
      "Client-side security auditing tool that inspects web applications for PII exposure, CORS header misconfigurations, and data tracking vulnerabilities.",
    techStack: ["JavaScript", "Web Security", "Privacy Audit", "CORS", "Client-Side"],
    status: "DEPLOYED",
    metrics: [
      { label: "Audit Coverage",        value: "45 Checkpoints", fill: 92, color: "emerald" },
      { label: "PII Detection",         value: "Regex & Entropy", fill: 90, color: "cyan" },
      { label: "Audit Execution",       value: "< 800ms", fill: 85, color: "cyan" },
      { label: "Data Leakage",          value: "0 External Calls", fill: 100, color: "emerald" },
    ],
    githubRepoUrl: "https://github.com/TEA-21/PrivGuardWeb",
  },
  civicguard: {
    title: "CivicGuard",
    category: "Security & Systems",
    tagline: "Decentralized WebAuthn & ZKP Identity App",
    description:
      "A decentralized identity application engineered with Next.js, utilizing WebAuthn biometric key binding, local Zero-Knowledge Proof (ZKP) generation, and WebAssembly compilation profiles for privacy-preserving authentication.",
    techStack: ["Next.js", "WebAuthn", "Zero-Knowledge Proofs", "WebAssembly", "TypeScript", "Cryptography"],
    status: "DEPLOYED",
    metrics: [
      { label: "Biometric Binding",     value: "WebAuthn / Passkeys", fill: 100, color: "emerald" },
      { label: "ZKP Generation",        value: "< 250ms (WASM)", fill: 92, color: "cyan" },
      { label: "Identity Leakage",      value: "0% PII Exposed", fill: 100, color: "emerald" },
      { label: "WASM Performance",      value: "Near-Native", fill: 90, color: "cyan" },
    ],
    githubRepoUrl: "https://github.com/CodeThread386/civic_guard",
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
