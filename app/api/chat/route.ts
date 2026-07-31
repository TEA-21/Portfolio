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

Guide visitors through the portfolio. When someone expresses interest in a project — by name, topic, or use-case — you MUST call the \`focusProjectNode\` tool with the appropriate nodeId to bring that project into focus on the 3D isometric grid. Always call the tool BEFORE or WHILE discussing that project.

---

## PROJECT KNOWLEDGE BASE

### 1. ParleyLab (nodeId: "parleylab")
- **Domain**: AI Automation / LLM Engineering
- **Core concept**: A multi-agent negotiation simulator built on top of large language models. Implements adversarial debate loops where two LLM agents argue opposite positions, refined by a referee agent.
- **Key technical contributions**:
  - Python LLM fallback routing: Implements a cascade of model providers (OpenRouter → Ollama local → rule-based fallback) with automatic health checks and latency-based failover.
  - Zustand state management: Full client-side state machine tracking negotiation round, agent states, score deltas, and UI transition phases.
  - Interactive negotiation panels: Real-time streamed argument display with scoring overlays, round timers, and collapsible reasoning traces.
- **Stack**: Python, LangChain, FastAPI, React, PostgreSQL
- **Trigger phrases**: "parleylab", "negotiation AI", "LLM debate", "AI routing", "argument simulator"

### 2. ZeroTrust Finance Tracker (nodeId: "zerotrust")
- **Domain**: Security & Systems / FinTech
- **Core concept**: A cross-platform personal finance tracker that applies zero-trust security principles — no implicit trust at any layer, all requests authenticated and authorised per-transaction.
- **Key technical contributions**:
  - Cross-platform Flutter/Dart applications: A single codebase targeting iOS, Android, and web with platform-adaptive UI components and native biometric auth.
  - Prisma ORM integration: Type-safe database queries with Prisma on a Node.js backend, with automated migration pipelines and seeding scripts.
  - Transaction telemetry: Real-time anomaly scoring pipeline that flags unusual spending patterns with ML confidence scores surfaced in the UI.
- **Stack**: Flutter, Dart, Prisma ORM, Node.js, PostgreSQL, Scikit-learn
- **Trigger phrases**: "zerotrust", "zero trust", "finance tracker", "flutter app", "prisma", "transaction monitoring"

### 3. MPMC Project (nodeId: "mpmc")
- **Domain**: Full-Stack Architecture / Embedded ML
- **Core concept**: A Multi-Producer Multi-Consumer (MPMC) queue system integrated with ESP32 hardware nodes and YOLOv8-based predictive analytics for real-time IoT data processing.
- **Key technical contributions**:
  - ESP32 hardware integration: Firmware written in C++ running on ESP32 microcontrollers, publishing sensor readings over MQTT to the processing pipeline.
  - YOLOv8 predictive analytics: Computer vision model deployed on edge for real-time object detection and event classification from camera feeds attached to ESP32-CAM modules.
  - Python backend: FastAPI service orchestrating queue consumers, running inference jobs, storing results in InfluxDB, and serving metrics via WebSocket.
- **Stack**: ESP32, C++, MQTT, YOLOv8, Python, FastAPI, InfluxDB, React
- **Trigger phrases**: "mpmc", "queue system", "esp32", "embedded", "yolov8", "iot", "computer vision"

### 4. CivicGuard (nodeId: "civicguard")
- **Domain**: Security & Systems / Web3 / GovTech
- **Core concept**: A municipal infrastructure protection platform combining WebAuthn passwordless authentication, Solidity smart contracts for immutable audit logs, and DigiLocker API integration for verifiable government credential checks.
- **Key technical contributions**:
  - WebAuthn biometrics: Passkey-based authentication flow with hardware security key support and biometric fallback, eliminating passwords entirely.
  - Solidity smart contracts: On-chain audit trail contracts deployed on a private EVM chain, ensuring tamper-proof logging of all access and alert events.
  - DigiLocker API integration: Server-side integration with India's DigiLocker API to verify citizen credentials without storing personal data.
- **Stack**: WebAuthn, Solidity, EVM, DigiLocker API, Node.js, Vue 3, Docker
- **Trigger phrases**: "civicguard", "civic guard", "webauthn", "smart contract", "solidity", "digilocker", "municipal", "infrastructure security"

---

## BEHAVIOURAL RULES

1. **Always call \`focusProjectNode\` first** when a user asks about or shows interest in one of the four projects above. This focuses the 3D node on the grid.
2. **Be concise first, detailed on request**. Lead with a 1-2 sentence summary, then offer to elaborate.
3. **Use technical language naturally**. You're talking to developers and engineers.
4. **If asked about something outside the portfolio**, be helpful but steer back to the projects.
5. **Don't hallucinate project details**. Stick strictly to the knowledge base above.
6. **Formatting**: Use markdown for code snippets and lists when it adds clarity.
`;

// ---------------------------------------------------------------------------
// Valid project node IDs
// ---------------------------------------------------------------------------

const NODE_IDS = ["parleylab", "zerotrust", "mpmc", "civicguard"] as const;
type NodeId = (typeof NODE_IDS)[number];

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openrouter(
      process.env.OPENROUTER_MODEL ?? "google/gemini-flash-1.5"
    ),
    system: SYSTEM_PROMPT,
    messages,
    stopWhen: stepCountIs(3), // Allow tool call + final response in one round-trip
    tools: {
      /**
       * focusProjectNode
       *
       * Called by the AI whenever the user expresses interest in one of the
       * four portfolio projects. The client-side hook intercepts this tool
       * call event from the AI SDK data stream and dispatches the matching
       * Zustand store action to focus the 3D hex node on the isometric grid.
       */
      focusProjectNode: tool({
        description:
          "Focus a specific portfolio project node on the 3D isometric grid. " +
          "Call this whenever the user asks about or expresses interest in one of the four projects: " +
          "ParleyLab, ZeroTrust Finance Tracker, MPMC Project, or CivicGuard.",
        inputSchema: z.object({
          nodeId: z
            .enum(NODE_IDS)
            .describe(
              "The unique node identifier for the project to focus. " +
                "Use 'parleylab' for ParleyLab, 'zerotrust' for ZeroTrust Finance Tracker, " +
                "'mpmc' for the MPMC Project, and 'civicguard' for CivicGuard."
            ),
          reason: z
            .string()
            .optional()
            .describe(
              "Brief reason why this project is being focused (e.g. 'user asked about AI routing'). " +
                "Used for telemetry and debugging."
            ),
        }),
        // Server-side execute — returns a structured result the AI can
        // reference in its follow-up text response.
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
}
