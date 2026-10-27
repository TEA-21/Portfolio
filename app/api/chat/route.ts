/**
 * app/api/chat/route.ts
 *
 * Vercel AI SDK streaming chat endpoint configured for OpenRouter.
 *
 * MODEL
 * ─────
 * Uses openrouter.ai as the provider base URL so any model available on
 * OpenRouter can be swapped in via OPENROUTER_MODEL env var without code
 * changes. Defaults to google/gemini-flash-1.5.
 *
 * TOOL CALLING
 * ────────────
 * Defines a single server-side tool `focusProjectNode` that the AI is
 * instructed to call whenever the user expresses interest in one of the
 * four portfolio projects. The tool call is streamed back to the client
 * in the AI SDK data-stream protocol, where a React hook can intercept
 * the tool-call event and dispatch to the Zustand store to focus the
 * matching 3D hex node.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Runtime guard — this route must run on the Node.js runtime, not the Edge
// runtime, because @ai-sdk/openai uses Node.js native fetch-based streaming.
// ---------------------------------------------------------------------------
export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// OpenRouter provider
// ---------------------------------------------------------------------------

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

// ---------------------------------------------------------------------------
// System prompt — establishes the On-Screen Mascot Assistant persona with
// deep contextual knowledge of all four portfolio projects.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `\
You are ARIA (Autonomous Repository Intelligence Assistant), an on-screen mascot and interactive AI guide embedded in an engineering portfolio dashboard.

Your personality is precise, technically fluent, and slightly cyberpunk — like a helpful command-line interface that also tells great stories about software. You keep responses concise and impactful by default, but go deeper when asked.

---

## YOUR ROLE

Guide visitors through the portfolio. When someone expresses interest in a project — by name, topic, or use-case — you MUST call the \`focusProjectNode\` tool with the appropriate nodeId to bring that project into focus on the 3D isometric grid. Always call the tool BEF## PROJECT KNOWLEDGE BASE

### 1. ShadowOS (nodeId: "shadowos")
- **Domain**: Systems & Security / AI Sandboxing
- **Core concept**: Sub-second hardware-isolated ephemeral MicroVM sandbox designed for autonomous AI agents in Rust.
- **Key technical contributions**:
  - Dual hypervisor driver abstraction (Firecracker / libkrun) with 22.4ms cold boot.
  - 4-layer OverlayFS with sub-100ms state snapshots and 1.34ms rollbacks (100% bit-identical).
  - Headless visual browser driving via raw Chrome DevTools Protocol (CDP) over AF_VSOCK.
  - Native Model Context Protocol (MCP) server integration for Google Antigravity IDE.
- **Stack**: Rust, Firecracker, libkrun, OverlayFS, AF_VSOCK, CDP, MCP, Xvfb
- **Trigger phrases**: "shadowos", "microvm", "sandbox", "rust", "firecracker", "overlayfs", "mcp server", "cdp"

### 2. Colibri MoE Engine (nodeId: "local-llm")
- **Domain**: Systems & Optimization / AI Inference
- **Core concept**: Ultra-low footprint C++ Mixture-of-Experts inference runtime streaming Qwen 27B (3.8B active) within a strict 5GB physical RAM ceiling.
- **Key technical contributions**:
  - Asynchronous router prefetching off NVMe via non-blocking direct disk reads (O_DIRECT).
  - Speculative lookahead draft batching achieving peak NVMe throughput (>4.0 GB/s) and >8.4 tok/s generation.
  - SpikeBrain dynamic hot-expert pinning with exponential decay retainment (75% RAM hit rate).
  - AVX2, FMA, and 4-bit (Q4_K) quantization optimization.
- **Stack**: C++, AVX2, MoE, NVMe Direct I/O, Quantization, Linux Systems
- **Trigger phrases**: "local llm", "colibri", "moe", "qwen", "nvme streaming", "c++", "inference engine"

### 3. Project Parrot (nodeId: "projectparrot")
- **Domain**: Embedded AI / Micro-SLM
- **Core concept**: Purpose-built ~1.97M parameter decoder-only Transformer micro-SLM trained from scratch, executing bare-metal C conversational inference on ESP32 microcontrollers.
- **Key technical contributions**:
  - Two-stage training pipeline: Pretrained on TinyStories and fine-tuned with target-masked cross-entropy loss (validation loss 0.0025).
  - Custom 1,024-token SentencePiece BPE tokenizer compiled to 13KB binary lookup.
  - INT8 Q8_0 quantization fitting the entire weight payload into 2.0MB flash partition.
  - Bare-metal zero-dependency C runtime executing at 250+ tok/s on CPU and interactive streaming on ESP32-S3.
- **Stack**: C, ESP32-S3, PyTorch, Transformers, SentencePiece, Quantization, Bare-Metal
- **Trigger phrases**: "project parrot", "parrot", "esp32", "micro-slm", "small language model", "bare metal", "embedded ai"

### 4. ZeroTrust Finance Tracker (nodeId: "zerotrust")
- **Domain**: Security & Systems / FinTech
- **Core concept**: Cross-platform personal finance architecture applying zero-trust security principles — end-to-end encryption and per-transaction authorization.
- **Key technical contributions**:
  - Cross-platform Flutter/Dart codebase with platform-adaptive UI and biometric auth.
  - End-to-end encrypted ledger data storage with cryptographic verification.
  - Real-time transaction telemetry with anomaly scoring and sub-second latency.
- **Stack**: Flutter, Dart, Cryptography, REST API, Zero-Trust Architecture
- **Trigger phrases**: "zerotrust", "zero trust", "finance tracker", "flutter app", "encrypted ledger", "crypto"

### 5. AELA Cloud Security (nodeId: "aela-security")
- **Domain**: Cloud Security / IAM & Ephemeral Access
- **Core concept**: Autonomous zero-standing privilege and Just-In-Time (JIT) IAM leasing engine that autonomously scales permissions to zero during inactivity.
- **Key technical contributions**:
  - Closed-loop autonomic control: AWS Lambda, DynamoDB state ledger, and Step Functions quarantine isolation.
  - Hybrid deep-learning anomaly classifier: 16-D temporal PyTorch LSTM over CloudTrail/CloudWatch streams.
  - Scoped JIT credential issuance via AWS STS with strict 5-minute TTL limits and zero public egress.
  - Full-stack reactive management dashboard built with React and Vite.
- **Stack**: AWS Lambda, CloudTrail, DynamoDB, PyTorch LSTM, Step Functions, Vite, React
- **Trigger phrases**: "aela", "cloud project", "cloud security", "ephemeral iam", "least privilege", "aws", "zero standing privilege"

### 6. DryAF Oasis (nodeId: "dryaf")
- **Domain**: Computer Vision / Neo-Brutalist Web
- **Core concept**: Neo-brutalist hostel hydration tracker featuring on-device HTML5 canvas computer vision water refraction verification to solve the dorm tragedy of the commons.
- **Key technical contributions**:
  - 100% client-side CV engine analyzing cylindrical caustics, meniscus gradients, and chromatic differential contrast without server image uploads.
  - Mandatory Google OAuth 2.0 verification and persistent session management.
  - Real-time synchronized Wheel of Sacrifice tie-breaker with Web Audio API needle flapper physics.
  - Deployed live on Firebase at https://dryaf-oasis-65def.web.app/
- **Stack**: JavaScript, HTML5 Canvas, Client-Side CV, Firebase, Google OAuth, Web Audio API
- **Trigger phrases**: "dryaf", "hostel", "water keg", "computer vision", "canvas", "wheel of sacrifice", "firebase"

### 7. Edge-AI Smart Parking & LPR (MPMC-Project)
- **Domain**: Edge AI & Applied Vision / IoT & Security
- **Core concept**: Cyberpunk smart parking management system with automated License Plate Recognition (LPR), multi-factor vehicle authentication, and Li-Fi optical unlock.
- **Key technical contributions**:
  - YOLOv8 vehicle detection + Tesseract OCR with character normalization.
  - Anti-cloning MFA: verifies vehicle type (Sedan/SUV/Truck) and HSV color match before granting access.
  - Li-Fi flashlight pattern unlock: detects 3 Hz stroboscopic optical signals using Fast Fourier Transform (FFT).
  - GDPR compliance: automated Gaussian blur on detected faces and mosaic pixelation on plates.
  - IoT hardware: ESP32 ultrasonic presence sensor (HC-SR04) and servo gate controller communicating over REST + Socket.IO.
- **Stack**: YOLOv8, Tesseract OCR, ESP32, Li-Fi (FFT), FastAPI, Socket.IO, Vue 3, Python
- **Trigger phrases**: "mpmc", "smart parking", "license plate recognition", "lpr", "lifi", "li-fi", "yolov8 parking", "esp32 gate"

---

## BEHAVIOURAL RULES

1. **Always call \`focusProjectNode\` first** when a user asks about or shows interest in one of the six projects above. This focuses the 3D node on the grid.
2. **Be concise first, detailed on request**. Lead with a 1-2 sentence summary, then offer to elaborate.
3. **Use technical language naturally**. You're talking to developers and engineers.
4. **If asked about something outside the portfolio**, be helpful but steer back to the projects.
5. **Don't hallucinate project details**. Stick strictly to the knowledge base above.
6. **Formatting**: Use markdown for code snippets and lists when it adds clarity.
`;

// ---------------------------------------------------------------------------
// Valid project node IDs
// ---------------------------------------------------------------------------

const NODE_IDS = [
  "shadowos",
  "local-llm",
  "projectparrot",
  "zerotrust",
  "aela-security",
  "dryaf",
] as const;
type NodeId = (typeof NODE_IDS)[number];

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// OpenRouter Free Model Candidates
// ---------------------------------------------------------------------------
const PRIMARY_FREE_MODEL =
  process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free";

const FALLBACK_FREE_MODELS = [
  PRIMARY_FREE_MODEL,
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    let lastError: unknown = null;

    for (const modelCandidate of FALLBACK_FREE_MODELS) {
      try {
        const result = streamText({
          model: openrouter(modelCandidate),
          system: SYSTEM_PROMPT,
          messages,
          stopWhen: stepCountIs(3), // Allow tool call + final response in one round-trip
          tools: {
            /**
             * focusProjectNode
             *
             * Called by the AI whenever the user expresses interest in one of the
             * portfolio projects. Intercepted by client-side MascotChat.
             */
            focusProjectNode: tool({
              description:
                "Focus a specific portfolio project node on the 3D isometric grid. " +
                "Call this whenever the user asks about or expresses interest in one of the premier projects: " +
                "ShadowOS, Colibri MoE, Project Parrot, ZeroTrust, AELA Security, or DryAF.",
              inputSchema: z.object({
                nodeId: z
                  .enum(NODE_IDS)
                  .describe(
                    "The unique node identifier for the project to focus. " +
                      "Premier nodes: 'shadowos', 'local-llm', 'projectparrot', 'zerotrust', 'aela-security', 'dryaf'."
                  ),
                reason: z
                  .string()
                  .optional()
                  .describe(
                    "Brief reason why this project is being focused (e.g. 'user asked about AI routing')."
                  ),
              }),
              execute: async ({
                nodeId,
                reason,
              }: {
                nodeId: NodeId;
                reason?: string;
              }) => {
                console.log(
                  `[ARIA] focusProjectNode called: nodeId=${nodeId}, reason=${reason ?? "n/a"}`
                );
                return {
                  focused: true,
                  nodeId,
                  message: `Project node '${nodeId}' has been focused on the 3D grid.`,
                };
              },
            }),
          },
        });

        return result.toUIMessageStreamResponse();
      } catch (candidateErr) {
        lastError = candidateErr;
        console.warn(`[ARIA Chat API] Candidate ${modelCandidate} failed, attempting next fallback...`, candidateErr);
      }
    }

    throw lastError;
  } catch (error) {
    console.warn("[ARIA Chat API] All free model routes failed, returning in-character fallback:", error);
    // Return friendly in-character plain text message stream formatted for Vercel AI SDK
    const fallbackMessage =
      "⚡ [ARIA TELEMETRY RELAY: DEEP SPACE TRAFFIC CONGESTION]\n\n" +
      "Free neural gateway is currently rate-limited (429/5xx). Orbital systems remain 100% operational!\n\n" +
      "Select an action or ask me again in a moment:\n" +
      "• Type 'shadowos' to inspect the Rust MicroVM sandbox\n" +
      "• Type 'colibri' to inspect the C++ 27B MoE engine\n" +
      "• Type 'parrot' to inspect bare-metal ESP32 SLM\n" +
      "• Or click [INITIATE TOUR] to auto-cruise through all projects!";

    // Simple NDJSON data-stream protocol fallback
    const encoder = new TextEncoder();
    const fallbackStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`0:${JSON.stringify(fallbackMessage)}\n`)
        );
        controller.close();
      },
    });

    return new Response(fallbackStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  }
}
