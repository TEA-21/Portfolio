/**
 * lib/projects.ts
 *
 * Single source of truth for all portfolio projects and dynamically generated
 * technical categories extracted from GitHub repository analysis.
 */

export type TechTag = string;

export interface Project {
  id: string;
  name: string;
  repoName: string;
  shortDesc: string;
  longDesc: string;
  tags: TechTag[];
  repoUrl: string;
  demoUrl?: string;
  status: "live" | "wip" | "archived";
  /** Many-to-many relationship: IDs of categories this project connects to */
  categoryIds: string[];
}

export interface Category {
  id: string;
  label: string;
  accent: "cyan" | "emerald" | "amber" | "purple" | "rose";
  accentHex: string;
  description: string;
}

export const DYNAMIC_CATEGORIES: Category[] = [
  {
    id: "ai-agentic",
    label: "AI & Agentic Frameworks",
    accent: "cyan",
    accentHex: "#38bdf8",
    description: "LLM backbones, multi-agent debate swarms, RL simulation, and Model Context Protocol (MCP) agent tooling.",
  },
  {
    id: "cybersecurity-privacy",
    label: "Zero-Trust & Cloud Security",
    accent: "emerald",
    accentHex: "#10b981",
    description: "Autonomous zero-standing IAM leasing, encrypted ledgers, ZKP biometric passkeys, and GDPR anonymization.",
  },
  {
    id: "systems-optimization",
    label: "Systems & Low-Level Architecture",
    accent: "rose",
    accentHex: "#f43f5e",
    description: "Hardware-isolated MicroVM sandboxing, NVMe direct I/O MoE streaming, AVX2, and bare-metal microcontrollers.",
  },
  {
    id: "computer-vision",
    label: "Edge AI & Applied Vision",
    accent: "purple",
    accentHex: "#a855f7",
    description: "YOLOv8 license plate recognition, on-device water refraction CV, passport MRZ parsing, and bare-metal ESP32 SLMs.",
  },
  {
    id: "fullstack-web",
    label: "Full-Stack & Intelligent Platforms",
    accent: "amber",
    accentHex: "#f59e0b",
    description: "Production Next.js/Vue/Vite dashboards, real-time WebSockets/Socket.IO, Firebase, and live interactive applications.",
  },
];

export const ALL_PROJECTS: Project[] = [
  {
    id: "shadowos",
    name: "ShadowOS",
    repoName: "ShadowOS",
    shortDesc: "Sub-second hardware-isolated ephemeral MicroVM sandbox for autonomous AI agents in Rust.",
    longDesc:
      "Hardware-isolated microVM sandbox built with Rust, Firecracker, and libkrun. Features sub-100ms state snapshots and rollbacks via 4-layer OverlayFS, headless visual browser driving via raw Chrome DevTools Protocol (CDP), and an integrated Model Context Protocol (MCP) server for Google Antigravity IDE.",
    tags: ["Rust", "MicroVM", "Firecracker", "libkrun", "OverlayFS", "CDP", "MCP", "AF_VSOCK"],
    repoUrl: "https://github.com/TEA-21/ShadowOS",
    status: "live",
    categoryIds: ["systems-optimization", "ai-agentic", "cybersecurity-privacy"],
  },
  {
    id: "local-llm",
    name: "Colibri MoE Engine",
    repoName: "Local_LLM",
    shortDesc: "Ultra-low footprint C++ MoE inference engine streaming Qwen 27B within a strict 5GB RAM ceiling.",
    longDesc:
      "C++ Mixture-of-Experts inference runtime executing Qwen 27B (3.8B active) on consumer hardware by eliminating NVMe streaming latency. Utilizes asynchronous router-lookahead prefetching (O_DIRECT), speculative lookahead batching, dynamic SpikeBrain hot-expert pinning, and AVX2 vector optimization.",
    tags: ["C++", "MoE", "LLM Inference", "NVMe Streaming", "AVX2", "Quantization", "Systems"],
    repoUrl: "https://github.com/TEA-21/Local_LLM",
    status: "live",
    categoryIds: ["systems-optimization", "ai-agentic"],
  },
  {
    id: "aela-security",
    name: "AELA Cloud Security",
    repoName: "Cloud-Project",
    shortDesc: "Autonomous zero-standing privilege & Just-In-Time (JIT) IAM leasing engine.",
    longDesc:
      "Closed-loop cloud security framework that eliminates standing IAM permissions by autonomously scaling privileges to zero during inactivity. Features time-decay triggers, real-time sequence-based PyTorch LSTM anomaly detection over CloudTrail/CloudWatch streams, and automated JIT credential issuance via AWS STS.",
    tags: ["AWS Lambda", "CloudTrail", "DynamoDB", "PyTorch", "LSTM", "IAM", "Vite", "React"],
    repoUrl: "https://github.com/TEA-21/Cloud-Project",
    status: "live",
    categoryIds: ["cybersecurity-privacy", "fullstack-web"],
  },
  {
    id: "projectparrot",
    name: "Project Parrot",
    repoName: "ProjectParrot",
    shortDesc: "Custom ~1.97M parameter decoder-only Transformer micro-SLM running bare-metal C on ESP32 microcontrollers.",
    longDesc:
      "Trained from scratch on TinyStories with a custom 1,024-token SentencePiece BPE tokenizer and target-masked fine-tuning. INT8 quantized into a 2.0MB flash payload executing local conversational inference with zero dependencies on ESP32-S3 and WROVER hardware at 250+ tok/s.",
    tags: ["C", "ESP32", "Micro-SLM", "Transformers", "PyTorch", "Quantization", "Embedded Systems"],
    repoUrl: "https://github.com/TEA-21/ProjectParrot",
    status: "live",
    categoryIds: ["systems-optimization", "ai-agentic", "computer-vision"],
  },
  {
    id: "dryaf",
    name: "DryAF",
    repoName: "DryAF",
    shortDesc: "Hostel dehydration survival guide with on-device HTML5 canvas CV water refraction scanner & live app.",
    longDesc:
      "Neo-brutalist dorm utility app solving the hostel tragedy of the commons. Features client-side computer vision water refraction verification (analyzing cylindrical caustics & meniscus gradients without server uploads), mandatory Google OAuth, Web Audio API flapper physics for the Wheel of Sacrifice, and LRU fairness queues.",
    tags: ["JavaScript", "HTML5 Canvas", "Computer Vision", "Firebase", "Google OAuth", "Web Audio API"],
    repoUrl: "https://github.com/TEA-21/DryAF",
    demoUrl: "https://dryaf-oasis-65def.web.app/",
    status: "live",
    categoryIds: ["computer-vision", "fullstack-web"],
  },
  {
    id: "zerotrust-finance",
    name: "ZeroTrust Finance",
    repoName: "ZeroTrust-Finance-Tracker",
    shortDesc: "Zero-trust encrypted ledger and financial monitoring system in Flutter & Dart.",
    longDesc:
      "Zero-trust financial architecture featuring end-to-end encryption, cryptographic audit trails, role-based access control, and real-time transaction telemetry across Flutter and microservice backends.",
    tags: ["Dart", "Flutter", "Zero-Trust", "Cryptography", "REST API", "State Management"],
    repoUrl: "https://github.com/TEA-21/ZeroTrust-Finance-Tracker",
    status: "live",
    categoryIds: ["cybersecurity-privacy", "fullstack-web"],
  },
  {
    id: "teachercopilot",
    name: "TeacherCopilot",
    repoName: "TeacherCopilot",
    shortDesc: "AI copilot for educators providing automated lesson plans and grading rubrics.",
    longDesc:
      "A comprehensive AI dashboard designed to automate curriculum creation, lesson planning, and rubric generation for educators using modern LLM APIs and Next.js.",
    tags: ["TypeScript", "Next.js", "OpenAI API", "Tailwind CSS", "React"],
    repoUrl: "https://github.com/TEA-21/TeacherCopilot",
    status: "live",
    categoryIds: ["ai-agentic", "fullstack-web"],
  },
  {
    id: "parleylab",
    name: "ParleyLab",
    repoName: "ParleyLab",
    shortDesc: "AI negotiation simulator powered by PPO reinforcement learning and LLMs.",
    longDesc:
      "An interactive negotiation simulator built with Stable-Baselines3 PPO reinforcement learning and multi-agent LLM coaching. Allows users to practice high-stakes negotiation scenarios with real-time feedback.",
    tags: ["Python", "Reinforcement Learning", "FastAPI", "Next.js", "TypeScript", "LLM"],
    repoUrl: "https://github.com/IEEE-VIT/ParleyLab",
    status: "live",
    categoryIds: ["ai-agentic", "fullstack-web"],
  },
  {
    id: "mrz-read",
    name: "MRZ Read",
    repoName: "MRZ_Read",
    shortDesc: "Machine Readable Zone passport reader & OMR document engine.",
    longDesc:
      "High-speed computer vision engine using OpenCV for scanning passport MRZ lines and parsing optical mark recognition (OMR) sheets. Utilizes structural formatting templates for multi-format document verification.",
    tags: ["Python", "OpenCV", "OCR", "Image Processing", "Pattern Recognition"],
    repoUrl: "https://github.com/TEA-21/MRZ_Read",
    status: "live",
    categoryIds: ["computer-vision", "systems-optimization"],
  },
  {
    id: "mpmc-project",
    name: "Edge-AI Smart Parking",
    repoName: "MPMC-Project",
    shortDesc: "Cyberpunk smart parking system with YOLOv8 vehicle detection, Tesseract LPR, and Li-Fi flashlight unlock.",
    longDesc:
      "Edge-AI powered License Plate Recognition (LPR) and smart parking management platform. Features multi-factor visual authentication (YOLOv8 vehicle type + HSV color matching), Tesseract OCR with character normalization, Li-Fi 3Hz flashlight unlock via FFT, GDPR-compliant automated face/plate Gaussian blurring, and an ESP32 ultrasonic gate node streaming telemetry over Socket.IO.",
    tags: ["YOLOv8", "Tesseract OCR", "ESP32", "Li-Fi (FFT)", "FastAPI", "Socket.IO", "Vue 3", "GDPR Privacy"],
    repoUrl: "https://github.com/TEA-21/MPMC-Project",
    status: "live",
    categoryIds: ["computer-vision", "cybersecurity-privacy", "fullstack-web"],
  },
  {
    id: "privguardweb",
    name: "PrivGuard Web",
    repoName: "PrivGuardWeb",
    shortDesc: "Privacy-preserving web security scanner and PII audit suite.",
    longDesc:
      "Client-side security auditing tool that inspects web applications for PII exposure, CORS header misconfigurations, and data tracking vulnerabilities.",
    tags: ["JavaScript", "Web Security", "Privacy Audit", "CORS", "Client-Side"],
    repoUrl: "https://github.com/TEA-21/PrivGuardWeb",
    status: "live",
    categoryIds: ["cybersecurity-privacy", "fullstack-web"],
  },
  {
    id: "civicguard",
    name: "CivicGuard",
    repoName: "CodeThread386/civic_guard",
    shortDesc: "Decentralized identity app built with Next.js, WebAuthn biometric keys, ZKP, and WebAssembly.",
    longDesc:
      "A decentralized identity application engineered with Next.js, utilizing WebAuthn biometric key binding, local Zero-Knowledge Proof (ZKP) generation, and WebAssembly (WASM) compilation profiles for privacy-preserving authentication.",
    tags: ["Next.js", "WebAuthn", "Zero-Knowledge Proofs", "WebAssembly", "TypeScript", "Cryptography"],
    repoUrl: "https://github.com/CodeThread386/civic_guard",
    status: "live",
    categoryIds: ["cybersecurity-privacy", "fullstack-web"],
  },
];
