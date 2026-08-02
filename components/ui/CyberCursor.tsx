"use client";

/**
 * components/ui/CyberCursor.tsx
 *
 * Custom Cyberpunk Crosshair Cursor component with smooth trailing cyan dot.
 *
 * FEATURING
 * ─────────
 * • High-precision crosshair ring with 4 corner reticle ticks
 * • Smooth lerping cyan trailing dot (#38bdf8 / cyan-focus)
 * • Expands and rotates on hover over interactive elements (buttons, links, project nodes)
 * • Automatically hides standard system cursor and degrades gracefully on touch devices
 */

import { useEffect, useState, useRef } from "react";

export function CyberCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const requestRef = useRef<number | null>(null);
  const targetPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Add custom-cursor-active class to body to hide native browser cursor
    document.body.classList.add("custom-cursor-active");

    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      setPos({ x: e.clientX, y: e.clientY });

      if (!isVisible) setIsVisible(true);

      // Check if hovering interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive =
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT" ||
          target.closest("button") !== null ||
          target.closest("a") !== null ||
          target.getAttribute("role") === "button" ||
          target.classList.contains("interactive");

        setIsHovered(isInteractive);
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Smooth lerp loop for the trailing cyan dot
    const animateTrail = () => {
      setTrailPos((prev) => {
        const dx = targetPos.current.x - prev.x;
        const dy = targetPos.current.y - prev.y;
        return {
          x: prev.x + dx * 0.25, // 25% lerp speed
          y: prev.y + dy * 0.25,
        };
      });
      requestRef.current = requestAnimationFrame(animateTrail);
    };

    requestRef.current = requestAnimationFrame(animateTrail);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden font-mono">
      {/* Trailing Cyan Dot */}
      <div
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-focus/60 shadow-[0_0_12px_#38bdf8] transition-transform duration-75"
        style={{
          left: `${trailPos.x}px`,
          top: `${trailPos.y}px`,
          transform: `translate(-50%, -50%) scale(${isHovered ? 1.8 : 1})`,
        }}
      />

      {/* Main Crosshair Assembly at direct mouse coordinate */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
        }}
      >
        {/* Outer Reticle Ring */}
        <div
          className={`relative h-8 w-8 rounded-full border transition-all duration-200 ${
            isHovered
              ? "scale-125 border-emerald-highlight bg-emerald-highlight/10 rotate-45 shadow-[0_0_15px_#10b981]"
              : "border-cyan-focus/70 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
          }`}
        >
          {/* Top Ticks */}
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 h-1.5 w-0.5 bg-cyan-focus" />
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 h-1.5 w-0.5 bg-cyan-focus" />
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-0.5 bg-cyan-focus" />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-1.5 h-0.5 bg-cyan-focus" />

          {/* Center Precision Target Dot */}
          <span
            className={`absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              isHovered ? "bg-emerald-highlight" : "bg-cyan-focus"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
