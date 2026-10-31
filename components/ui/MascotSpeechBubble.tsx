"use client";

import React, { useState, useEffect } from "react";
import { DialogueItem } from "@/lib/mascot-dialogues";

interface MascotSpeechBubbleProps {
  dialogue: DialogueItem | null;
  visible: boolean;
  mascotX: number;
  mascotY: number;
  onCycle: () => void;
  onDismiss: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function MascotSpeechBubble({
  dialogue,
  visible,
  mascotX,
  mascotY,
  onCycle,
  onDismiss,
  onPointerEnter,
  onPointerLeave,
}: MascotSpeechBubbleProps) {
  const [viewportWidth, setViewportWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!dialogue) return null;

  // Determine vertical placement:
  // If mascot is within 170px of screen top, render bubble BELOW mascot.
  // Otherwise, default to ABOVE mascot.
  const isNearTop = mascotY < 170;

  // Bubble width and horizontal clamping relative to astronautRef (58px wide)
  const bubbleWidth = 276;
  const bubbleHalf = bubbleWidth / 2;

  // ARIA center is at 29px inside astronautRef
  // Natural centered left is 29 - bubbleHalf = -109px
  const defaultLeft = 29 - bubbleHalf;
  const minLeft = 16 - mascotX;
  const maxLeft = viewportWidth - 16 - bubbleWidth - mascotX;
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, defaultLeft));

  // Compute where the cartoon tail should be positioned inside the bubble to point at ARIA's center (29px)
  const tailPositionInBubble = 29 - clampedLeft;
  const clampedTailPosition = Math.max(22, Math.min(bubbleWidth - 22, tailPositionInBubble));

  return (
    <div
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={`absolute z-[100002] transition-all duration-200 ease-out select-none will-change-transform ${
        visible
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-95 pointer-events-none"
      }`}
      style={{
        left: clampedLeft,
        top: isNearTop ? "calc(100% + 12px)" : undefined,
        bottom: !isNearTop ? "calc(100% + 12px)" : undefined,
        width: bubbleWidth,
      }}
    >
      {/* ── Cartoon Speech Balloon Container ────────────────────────── */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onCycle();
        }}
        className="relative group rounded-2xl bg-[#090d16]/95 border-2 border-cyan-400/90 shadow-[0_0_30px_rgba(56,189,248,0.35)] backdrop-blur-xl p-3.5 cursor-pointer active:scale-[0.98] transition-transform"
      >
        {/* Top Header: Category Tag & Dismiss Button */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-cyan-400/20">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: dialogue.badgeColor }}
            />
            <span
              className="font-mono text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border"
              style={{
                color: dialogue.badgeColor,
                borderColor: `${dialogue.badgeColor}40`,
                backgroundColor: `${dialogue.badgeColor}15`,
              }}
            >
              {dialogue.categoryLabel}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            aria-label="Dismiss speech bubble"
            className="text-slate-400 hover:text-white px-1 font-mono text-[11px] leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Dialogue Main Text */}
        <p className="font-mono text-[11.5px] leading-relaxed text-cyan-50 font-medium tracking-normal select-none">
          "{dialogue.text}"
        </p>

        {/* Action Hint Footer */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 font-mono text-[8.5px] text-slate-400 uppercase tracking-wider">
          <span className="group-hover:text-cyan-300 transition-colors">
            ✦ Click to cycle
          </span>
          <span className="text-slate-500">
            ARIA Cadet
          </span>
        </div>

        {/* ── Dynamic Cartoon Tail Pointer ──────────────────────────── */}
        {isNearTop ? (
          // Tail pointing UPWARD to mascot above
          <div
            className="absolute -top-[10px] w-5 h-[10px] pointer-events-none"
            style={{
              left: clampedTailPosition - 10,
            }}
          >
            <svg
              width="20"
              height="10"
              viewBox="0 0 20 10"
              className="overflow-visible"
            >
              <polygon
                points="10,0 20,10 0,10"
                fill="#090d16"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <line x1="1" y1="10" x2="19" y2="10" stroke="#090d16" strokeWidth="2.5" />
            </svg>
          </div>
        ) : (
          // Tail pointing DOWNWARD to mascot below
          <div
            className="absolute -bottom-[10px] w-5 h-[10px] pointer-events-none"
            style={{
              left: clampedTailPosition - 10,
            }}
          >
            <svg
              width="20"
              height="10"
              viewBox="0 0 20 10"
              className="overflow-visible"
            >
              <polygon
                points="0,0 20,0 10,10"
                fill="#090d16"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <line x1="1" y1="0" x2="19" y2="0" stroke="#090d16" strokeWidth="2.5" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
