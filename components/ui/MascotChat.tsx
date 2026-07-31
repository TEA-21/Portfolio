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
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePortfolioStore } from "@/lib/store";

/** 3D isometric node position lookup matching SceneContent.tsx coordinates */
const NODE_POSITIONS: Record<string, { x: number; y: number; z: number }> = {
  parleylab: { x: -3, y: 0, z: 3 },
  zerotrust: { x: 3, y: 0, z: 3 },
  mpmc: { x: 3, y: 0, z: -3 },
  civicguard: { x: -3, y: 0, z: -3 },
};

export function MascotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedToolCalls = useRef<Set<string>>(new Set());

  // Store actions
  const setCamera = usePortfolioStore((s) => s.setCamera);
  const setZoom = usePortfolioStore((s) => s.setZoom);
  const setFocusedNodeId = usePortfolioStore((s) => s.setFocusedNodeId);
  const setInspection = usePortfolioStore((s) => s.setInspection);

  /**
   * Helper to dispatch store actions when focusProjectNode is invoked
   */
  const executeFocusProjectNode = useCallback(
    (nodeId: string) => {
      const targetPos = NODE_POSITIONS[nodeId];
      if (!targetPos) {
        console.warn(`[MascotChat] Unknown nodeId received: ${nodeId}`);
        return;
      }

      console.log(`[MascotChat] Executing 3D focus on node: ${nodeId}`, targetPos);

      // Dispatch exact state machine updates requested
      setCamera(targetPos);
      setZoom(2.5);
      setFocusedNodeId(nodeId);
      setInspection();
    },
    [setCamera, setZoom, setFocusedNodeId, setInspection]
  );

  const [input, setInput] = useState("");

  // Initialize Vercel AI SDK useChat
  const { messages, sendMessage, status } = useChat({
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
  });

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    sendMessage({ text });
  };


  // Secondary effect watching streamed message parts for tool invocations
  useEffect(() => {
    if (!messages.length) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant" || !lastMsg.parts) return;

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

  return (
    <div className="fixed bottom-6 left-6 z-30 pointer-events-auto flex flex-col items-start font-mono">
      {/* Expanded Chat Box */}
      {isOpen && (
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
                &gt; ARIA System online. Ask me about ParleyLab, ZeroTrust, MPMC System, or CivicGuard to focus 3D nodes!
              </div>
            ) : (
              messages.map((m) => (
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
                    className={`p-2.5 rounded-lg max-w-[88%] leading-relaxed ${
                      m.role === "user"
                        ? "bg-cyan-focus/20 text-cyan-100 border border-cyan-focus/40"
                        : "bg-slate-900/90 text-slate-200 border border-emerald-highlight/30"
                    }`}
                  >
                    {/* Message content text */}
                    {m.parts
                      ? m.parts
                          .filter((p) => p.type === "text")
                          .map((p: any) => p.text)
                          .join("")
                      : (m as any).content}

                    {/* Render tool invocation badges if present */}
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
              ))
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
              placeholder="Ask ARIA about projects..."
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
      )}

      {/* Floating Mascot Trigger Badge Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-cyan-focus/50 bg-slate-dark/90 text-cyan-focus shadow-lg shadow-cyan-focus/20 hover:border-cyan-focus hover:shadow-cyan-focus/40 transition-all active:scale-95"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-highlight opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-highlight"></span>
        </span>
        <span className="text-xs font-bold tracking-wider uppercase drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
          {isOpen ? "CLOSE ARIA AI" : "ARIA AI MASCOT"}
        </span>
      </button>
    </div>
  );
}
