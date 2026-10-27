"use client";

/**
 * components/ui/CyberCursor.tsx
 *
 * Celestial Comet Cursor with Continuous Streaming Ion Tail:
 * - 100% Continuous Streak: Drawn on hardware-accelerated 2D canvas using smooth
 *   continuous tapered stroke segments (zero disjointed circles!).
 * - Sleek Starlight Nucleus (Head): Compact 2.5px starlight gold dot with pinpoint core,
 *   elegantly calibrated to avoid over-blown "light bulb" glare.
 * - Continuous Supersonic Ion & Dust Tail: Tapers from 4.2px down to 0.8px,
 *   streaming from incandescent cyan-white at the head into cosmic nebula violet and amber dust.
 * - Top-Level Stacking: z-[99999] pointer-events-none above all modals and viewports.
 */

import { useEffect, useRef } from "react";

interface TrailPoint {
  x: number;
  y: number;
}

const TRAIL_LENGTH = 10;

export function CyberCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const pointsRef = useRef<TrailPoint[]>(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }))
  );
  const isHoveredRef = useRef(false);
  const isVisibleRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Touch check: gracefully exit on touchscreens
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    document.body.classList.add("custom-cursor-active");

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisibleRef.current) isVisibleRef.current = true;

      const rawTarget = e.target;
      if (rawTarget && rawTarget instanceof Element) {
        const isInteractive =
          rawTarget.tagName === "BUTTON" ||
          rawTarget.tagName === "A" ||
          rawTarget.tagName === "INPUT" ||
          (typeof rawTarget.closest === "function" &&
            (rawTarget.closest("button") !== null || rawTarget.closest("a") !== null)) ||
          (typeof rawTarget.getAttribute === "function" &&
            rawTarget.getAttribute("role") === "button") ||
          (rawTarget.classList &&
            (rawTarget.classList.contains("interactive") ||
              rawTarget.classList.contains("cursor-pointer")));

        isHoveredRef.current = isInteractive;
      } else {
        isHoveredRef.current = false;
      }
    };

    const onMouseLeave = () => {
      isVisibleRef.current = false;
    };

    const onMouseEnter = () => {
      isVisibleRef.current = true;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Continuous 60/120 FPS Canvas Comet Render Loop
    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (isVisibleRef.current && targetPos.current.x > 0 && targetPos.current.y > 0) {
        const pts = pointsRef.current;
        const target = targetPos.current;

        // Cascade spring lerp: point 0 tracks target closely, subsequent points follow with agile lag
        pts[0].x += (target.x - pts[0].x) * 0.55;
        pts[0].y += (target.y - pts[0].y) * 0.55;

        for (let i = 1; i < pts.length; i++) {
          const lag = 0.44 - (i / pts.length) * 0.12;
          pts[i].x += (pts[i - 1].x - pts[i].x) * lag;
          pts[i].y += (pts[i - 1].y - pts[i].y) * lag;
        }

        ctx.save();

        // 1. Draw Continuous Outer Tapered Comet Streak (Cyan -> Violet -> Amber)
        for (let i = pts.length - 1; i > 0; i--) {
          const p1 = pts[i];
          const p0 = pts[i - 1];
          const progress = 1.0 - i / pts.length; // 0.0 at tail tip, 1.0 at head

          // Smooth quadratic taper in stroke width
          const width = 0.75 + progress * progress * 3.2;
          const alpha = Math.pow(progress, 1.2) * 0.75;

          // Seamless celestial color blending along the compact continuous streak
          let strokeColor: string;
          if (progress > 0.60) {
            // Electric cyan-white ion beam near head
            strokeColor = `rgba(125, 211, 252, ${alpha})`;
          } else if (progress > 0.25) {
            // Nebula violet coma in mid-trail
            strokeColor = `rgba(168, 85, 247, ${alpha * 0.85})`;
          } else {
            // Fading stardust amber at tail tip
            strokeColor = `rgba(245, 158, 11, ${alpha * 0.65})`;
          }

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p0.x, p0.y);
          ctx.lineWidth = width;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = strokeColor;
          ctx.shadowBlur = 5 * progress;
          ctx.shadowColor = progress > 0.5 ? "rgba(56, 189, 248, 0.5)" : "rgba(139, 92, 246, 0.4)";
          ctx.stroke();
        }

        // 2. Draw Continuous White-Hot Inner Ion Beam (Forefront 65% of tail)
        for (let i = Math.floor(pts.length * 0.65); i > 0; i--) {
          const p1 = pts[i];
          const p0 = pts[i - 1];
          const progress = 1.0 - i / Math.floor(pts.length * 0.65);

          const innerWidth = 0.5 + progress * 1.3;
          const innerAlpha = Math.pow(progress, 1.4) * 0.80;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p0.x, p0.y);
          ctx.lineWidth = innerWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = `rgba(255, 255, 255, ${innerAlpha})`;
          ctx.shadowBlur = 3;
          ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
          ctx.stroke();
        }

        // 3. Draw Refined Starlight Comet Head Nucleus (Compact, subtle, non-glaring)
        const head = pts[0];
        const isHov = isHoveredRef.current;
        const radius = isHov ? 3.2 : 2.4;

        // Soft outer starlight halo
        ctx.shadowBlur = isHov ? 6 : 4;
        ctx.shadowColor = "rgba(251, 191, 36, 0.65)";
        ctx.fillStyle = isHov ? "#fef08a" : "#fbbf24";
        ctx.beginPath();
        ctx.arc(head.x, head.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Pinpoint white core
        ctx.shadowBlur = 1;
        ctx.shadowColor = "#ffffff";
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(head.x, head.y, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
    />
  );
}
