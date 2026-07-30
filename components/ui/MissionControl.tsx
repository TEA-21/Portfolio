"use client";

/**
 * components/ui/MissionControl.tsx
 *
 * A 2D HUD overlay component positioned in the top-right corner.
 * Features a Cyberpunk terminal aesthetic using slate-dark background,
 * cyan-focus text, and glowing neon borders.
 *
 * Connected to the Zustand store to toggle category filters.
 * Explicitly sets `pointer-events-auto` so it captures interactions inside
 * the pointer-events-none HUDLayer container.
 */

import { usePortfolioStore, type ProjectCategory } from "@/lib/store";

const CATEGORIES: ProjectCategory[] = [
  "AI Automation",
  "Security & Systems",
  "Full-Stack Architecture",
];

export function MissionControl() {
  const activeCategories = usePortfolioStore((s) => s.activeCategories);
  const toggleCategory = usePortfolioStore((s) => s.toggleCategory);

  return (
    <aside className="pointer-events-auto absolute top-6 right-6 z-20 w-80 rounded-xl border border-cyan-focus/40 bg-slate-dark/90 p-5 shadow-[0_0_20px_rgba(56,189,248,0.2)] backdrop-blur-md">
      {/* Header */}
      <div className="mb-4 border-b border-cyan-focus/20 pb-3">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-emerald-highlight">
          <span>[ SYS // FILTER_MATRIX ]</span>
          <span className="h-2 w-2 rounded-full bg-emerald-highlight animate-pulse" />
        </div>
        <h2 className="mt-1 font-mono text-xl font-bold tracking-wider text-cyan-focus drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
          MISSION CONTROL
        </h2>
      </div>

      {/* Filter Toggle Buttons */}
      <div className="flex flex-col gap-2.5">
        <span className="font-mono text-xs text-slate-400">
          SELECT CATEGORIES:
        </span>
        {CATEGORIES.map((category) => {
          const isActive = activeCategories.includes(category);
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 font-mono text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "border-cyan-focus bg-cyan-focus/15 text-cyan-focus shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                  : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-cyan-focus/40 hover:text-slate-200"
              }`}
            >
              <span>{category}</span>
              <span
                className={`font-mono text-[10px] ${
                  isActive ? "text-cyan-focus font-bold" : "text-slate-600"
                }`}
              >
                {isActive ? "[ ACTIVE ]" : "[ OFF ]"}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
