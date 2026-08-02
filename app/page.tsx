export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-end p-8 bg-transparent text-white pointer-events-none">
      <div className="w-full max-w-4xl rounded-xl border border-cyan-focus/30 bg-slate-dark/80 p-6 shadow-2xl shadow-cyan-focus/10 backdrop-blur-sm pointer-events-auto mb-4">
        <header className="border-b border-cyan-focus/20 pb-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-emerald-highlight uppercase tracking-widest flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-highlight animate-pulse" />
              [ SYSTEM STATUS: ONLINE ]
            </span>
            <span className="font-mono text-xs text-amber-caution">
              TELEMETRY V1.0.4
            </span>
          </div>
          <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-cyan-focus drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]">
            CYBERPUNK // 3D PORTFOLIO MATRIX
          </h1>
        </header>

        <p className="mt-3 font-sans text-xs text-slate-300">
          Click any 3D node on the isometric grid to enter Inspection mode, or use Mission Control filters to filter by domain.
        </p>
      </div>
    </main>
  );
}
