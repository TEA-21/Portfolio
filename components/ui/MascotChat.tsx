"use client";

/**
 * components/ui/MascotChat.tsx
 *
 * Cyberpunk Mascot Assistant (ARIA) HUD Chat interface.
 *
 * BRIDGE ARCHITECTURE
 * ───────────────────
 * Acts as the interactive bridge between the LLM chat agent (/api/chat)
 * and the 3D canvas world state.
 *
 * Using the Vercel AI SDK `useChat` hook, it listens for AI stream responses
 * and tool invocations. When the AI calls `focusProjectNode`, it extracts the
 * `nodeId` payload and dispatches actions to the global Zustand store:
 *  1. `setCamera(nodeCoords)` - moves target camera position to the 3D node.
 *  2. `setZoom(2.5)` - zooms camera close into the node.
 *  3. `setFocusedNodeId(nodeId)` - sets active node focus.
 *  4. `setInspection()` - switches global interaction state mode to 'inspection'.
 *
 * SPEED RUN ZERO-LATENCY HARDCODED TOUR GUIDE
 * ────────────────────────────────────────────
 * When a Speed Run tour is active, this component watches `currentStepIndex`
 * and `focusedNodeId` from the Zustand store. Each time the step index changes,
 * it automatically appends a pre-defined hardcoded system message to the chat UI
 * INSTANTLY (0ms latency, zero LLM API calls) as the camera begins panning.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { usePortfolioStore } from "@/lib/store";

// ---------------------------------------------------------------------------
// Camera pan position lookup
// NOTE: Uses {x: worldX, y: worldZ} convention matching IsometricCamera.tsx
// ---------------------------------------------------------------------------
const NODE_POSITIONS: Record<string, { x: number; y: number; z: number }> = {
  shadowos:        { x: -3.5, y:  2.0, z: 0 },
  "local-llm":     { x:  0.0, y:  3.5, z: 0 },
  projectparrot:   { x:  3.5, y:  2.0, z: 0 },
  zerotrust:       { x:  3.5, y: -2.0, z: 0 },
  "aela-security": { x:  0.0, y: -3.5, z: 0 },
  dryaf:           { x: -3.5, y: -2.0, z: 0 },
  // Web Graph fallbacks
  parleylab:       { x: -3.0, y:  3.0, z: 0 },
  "mpmc-project":  { x:  3.0, y: -3.0, z: 0 },
  mpmc:            { x:  3.0, y: -3.0, z: 0 },
  civicguard:      { x: -3.0, y: -3.0, z: 0 },
};

const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mt-2 mb-1 border-b border-cyan-500/20 pb-0.5">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xs font-bold text-starlight-gold uppercase tracking-wider mt-2 mb-1">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-[11px] font-semibold text-emerald-400 uppercase mt-1.5 mb-0.5">
      {children}
    </h3>
  ),
  p: ({ children }: any) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }: any) => <strong className="font-bold text-white tracking-wide">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-cyan-200">{children}</em>,
  ul: ({ children }: any) => <ul className="space-y-1 my-1.5 pl-3 list-disc marker:text-cyan-400">{children}</ul>,
  ol: ({ children }: any) => <ol className="space-y-1 my-1.5 pl-3 list-decimal marker:text-starlight-gold">{children}</ol>,
  li: ({ children }: any) => <li className="pl-0.5 leading-relaxed">{children}</li>,
  code: ({ children }: any) => (
    <code className="font-mono text-[10px] bg-void-black/80 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/30">
      {children}
    </code>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-400 hover:text-cyan-200 underline decoration-cyan-400/50 hover:decoration-cyan-200"
    >
      {children}
    </a>
  ),
};

export function MascotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedToolCalls = useRef<Set<string>>(new Set());

  // Store state & actions
  const setCamera = usePortfolioStore((s) => s.setCamera);
  const setZoom = usePortfolioStore((s) => s.setZoom);
  const setFocusedNodeId = usePortfolioStore((s) => s.setFocusedNodeId);
  const setSelectedProjectId = usePortfolioStore((s) => s.setSelectedProjectId);
  const setInspection = usePortfolioStore((s) => s.setInspection);
  const focusedNodeId = usePortfolioStore((s) => s.focusedNodeId);
  const isSpeedRunActive = usePortfolioStore((s) => s.isSpeedRunActive);
  const speedRunStepIndex = usePortfolioStore((s) => s.speedRunStepIndex);
  const speedRunProjects = usePortfolioStore((s) => s.speedRunProjects);

  /**
   * Helper to dispatch store actions when focusProjectNode is invoked
   */
  const executeFocusProjectNode = useCallback(
    (rawNodeId: string) => {
      let nodeId = rawNodeId;
      const lower = rawNodeId.toLowerCase();
      if (lower.includes("shadow")) nodeId = "shadowos";
      else if (lower.includes("colibri") || lower.includes("llm") || lower.includes("moe")) nodeId = "local-llm";
      else if (lower.includes("parrot") || lower.includes("esp32")) nodeId = "projectparrot";
      else if (lower.includes("zerotrust") || lower.includes("finance")) nodeId = "zerotrust";
      else if (lower.includes("aela") || lower.includes("cloud")) nodeId = "aela-security";
      else if (lower.includes("dryaf") || lower.includes("water") || lower.includes("oasis")) nodeId = "dryaf";
      else if (lower.includes("parking") || lower.includes("mpmc") || lower.includes("yolo")) nodeId = "mpmc-project";
      else if (lower.includes("civic") || lower.includes("guard")) nodeId = "civicguard";
      else if (lower.includes("parley")) nodeId = "parleylab";
      else if (lower.includes("copilot") || lower.includes("teacher")) nodeId = "TeacherCopilot";

      console.log(`[MascotChat] Opening relevant project node for recruiter: ${nodeId}`);
      setSelectedProjectId(nodeId);
      setFocusedNodeId(nodeId);
      const targetPos = NODE_POSITIONS[nodeId];
      if (targetPos) {
        setCamera(targetPos);
        setZoom(2.5);
        setInspection();
      }
      const el = document.getElementById("interactive-project-web");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    },
    [setSelectedProjectId, setFocusedNodeId, setCamera, setZoom, setInspection]
  );

  // Initialize Vercel AI SDK useChat
  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onToolCall({ toolCall }) {
      console.log("[MascotChat] onToolCall received:", toolCall);
      const name = (toolCall as any).toolName ?? (toolCall as any).name;
      if (name === "focusProjectNode") {
        const inputArgs = (toolCall as any).input ?? (toolCall as any).args;
        if (inputArgs?.nodeId) {
          executeFocusProjectNode(inputArgs.nodeId);
        }
      }
    },
    onError(error) {
      console.warn("[MascotChat] Stream dropped mid-flight or request failed:", error);
      const fallbackText =
        "⚡ [LOCAL RELAY FALLBACK]\n" +
        "Telemetry gateway disconnected. Local terminal is operational:\n\n" +
        "• Ask about ShadowOS, Colibri MoE, or Project Parrot\n" +
        "• Or click [INITIATE TOUR] to auto-navigate the 3D Solar System!";
      setMessages((prev) => [
        ...prev,
        {
          id: `fallback-err-${Date.now()}`,
          role: "assistant",
          content: fallbackText,
          parts: [{ type: "text", text: fallbackText }],
        } as any,
      ]);
    },
  });

  // Listen for open requests from FlyingMascotCompanion
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("open-mascot-chat", handleOpen);
    window.addEventListener("toggle-mascot-chat", handleToggle);
    return () => {
      window.removeEventListener("open-mascot-chat", handleOpen);
      window.removeEventListener("toggle-mascot-chat", handleToggle);
    };
  }, []);

  // Broadcast transmitting state to FlyingMascotCompanion
  useEffect(() => {
    const isTransmitting = status === "submitted" || status === "streaming";
    window.dispatchEvent(
      new CustomEvent("mascot-transmitting", { detail: isTransmitting })
    );
  }, [status]);

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    sendMessage({ text });
  };

  // Secondary effect watching streamed message parts for tool invocations or inline [FOCUS:id] tags
  useEffect(() => {
    if (!messages.length) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant") return;

    // Check for inline [FOCUS:id] tag from free model fallback
    const rawContent = (lastMsg as any).content ?? (lastMsg.parts ? lastMsg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") : "");
    if (typeof rawContent === "string") {
      const match = rawContent.match(/\[FOCUS:([a-zA-Z0-9_-]+)\]/);
      if (match && match[1] && !processedToolCalls.current.has(`inline-${lastMsg.id}-${match[1]}`)) {
        processedToolCalls.current.add(`inline-${lastMsg.id}-${match[1]}`);
        executeFocusProjectNode(match[1]);
      }
    }

    if (!lastMsg.parts) return;

    for (const part of lastMsg.parts) {
      const partType = (part as any).type;
      const isToolCall =
        partType === "tool-call" ||
        partType === "dynamic-tool" ||
        (typeof partType === "string" && partType.startsWith("tool-"));

      if (isToolCall) {
        const toolName =
          (part as any).toolName ?? (part as any).name ?? partType.replace("tool-", "");
        const toolCallId =
          (part as any).toolCallId ?? (part as any).id ?? `${lastMsg.id}-${toolName}`;

        if (
          toolName === "focusProjectNode" &&
          !processedToolCalls.current.has(toolCallId)
        ) {
          const inputArgs = (part as any).input ?? (part as any).args;
          if (inputArgs?.nodeId) {
            processedToolCalls.current.add(toolCallId);
            executeFocusProjectNode(inputArgs.nodeId);
          }
        }
      }
    }
  }, [messages, executeFocusProjectNode]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const isLoading = status === "submitted" || status === "streaming";

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 left-6 z-30 pointer-events-auto flex flex-col items-start font-mono">
      {/* Expanded Chat Box */}
      <div className="mb-3 w-80 sm:w-96 rounded-xl border border-cyan-focus/40 bg-slate-dark/95 p-4 shadow-2xl shadow-cyan-focus/20 backdrop-blur-md flex flex-col max-h-[420px] transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-focus/20 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-focus opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-focus"></span>
              </span>
              <span className="text-xs font-bold text-cyan-focus tracking-wider uppercase">
                ARIA // MASCOT ASSISTANT
              </span>
            </div>
            {/* Tour progress badge */}
            {isSpeedRunActive && speedRunProjects.length > 0 && (
              <span className="text-[10px] text-amber-caution font-mono border border-amber-caution/40 bg-amber-950/40 px-2 py-0.5 rounded">
                TOUR {speedRunStepIndex + 1}/{speedRunProjects.length}
              </span>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-cyan-focus transition-colors px-1.5 py-0.5 rounded border border-slate-700 hover:border-cyan-focus/50"
            >
              [X]
            </button>
          </div>

          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3 text-slate-200 scrollbar-thin scrollbar-thumb-cyan-focus/30">
            {messages.length === 0 ? (
              <div className="text-slate-400 italic text-[11px] bg-slate-900/50 p-2.5 rounded border border-slate-800">
                &gt; ARIA System online. Ask me about ShadowOS, Colibri MoE, Project Parrot, DryAF, or any portfolio project to inspect nodes!
              </div>
            ) : (
              messages.map((m) => {
                // Extract text content from parts or fallback to content field
                const rawTextContent = m.parts
                  ? m.parts
                      .filter((p) => p.type === "text")
                      .map((p: any) => p.text)
                      .join("")
                  : (m as any).content;

                const textContent = typeof rawTextContent === "string"
                  ? rawTextContent.replace(/\[FOCUS:[a-zA-Z0-9_-]+\]/g, "").trim()
                  : rawTextContent;

                // Don't render empty messages (e.g. pure tool-call assistant turns)
                if (
                  !textContent &&
                  !m.parts?.some(
                    (p: any) =>
                      p.type === "tool-call" ||
                      p.type === "dynamic-tool" ||
                      (typeof p.type === "string" && p.type.startsWith("tool-"))
                  )
                ) {
                  return null;
                }

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5">
                      {m.role === "user" ? "YOU" : "ARIA"}
                    </span>
                    <div
                      className={`p-2.5 rounded-lg max-w-[88%] text-xs ${
                        m.role === "user"
                          ? "bg-cyan-focus/20 text-cyan-100 border border-cyan-focus/40 whitespace-pre-line leading-relaxed"
                          : "bg-slate-900/90 text-slate-200 border border-emerald-highlight/30"
                      }`}
                    >
                      {/* Message text content */}
                      {m.role === "user" ? (
                        textContent
                      ) : (
                        <div className="prose prose-invert max-w-none text-xs">
                          <ReactMarkdown components={markdownComponents}>
                            {textContent}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Tool invocation badges */}
                      {m.parts?.map((part, pIdx) => {
                        const pType = (part as any).type;
                        if (
                          pType === "tool-call" ||
                          pType === "dynamic-tool" ||
                          (typeof pType === "string" && pType.startsWith("tool-"))
                        ) {
                          const tName =
                            (part as any).toolName ??
                            (part as any).name ??
                            pType.replace("tool-", "");
                          const tInput = (part as any).input ?? (part as any).args;
                          return (
                            <div
                              key={pIdx}
                              className="mt-1.5 text-[10px] text-emerald-highlight bg-emerald-950/60 p-1.5 rounded border border-emerald-500/40 flex items-center gap-1.5"
                            >
                              <span className="animate-pulse">🎯</span>
                              <span>
                                Focused 3D Node:{" "}
                                <strong className="underline">
                                  {tInput?.nodeId ?? tName}
                                </strong>
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                );
              })
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-cyan-focus text-[11px] animate-pulse py-1">
                <span>⚡ Processing query...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={onSubmitForm} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                focusedNodeId
                  ? "Ask ARIA about this node..."
                  : "Ask ARIA about Taanush or projects..."
              }
              className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-cyan-focus rounded px-2.5 py-1.5 text-xs text-white outline-none transition-colors placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-cyan-focus/20 hover:bg-cyan-focus/40 border border-cyan-focus/60 text-cyan-focus font-bold px-3 py-1.5 rounded text-xs transition-colors disabled:opacity-40"
            >
              SEND
            </button>
          </form>
        </div>
    </div>
  );
}
