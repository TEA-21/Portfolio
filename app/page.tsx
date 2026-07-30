export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-dark text-white">
      <div className="w-full max-w-4xl rounded-xl border border-cyan-focus/30 bg-slate-dark p-8 shadow-2xl shadow-cyan-focus/10">
        <header className="mb-8 border-b border-cyan-focus/20 pb-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-emerald-highlight uppercase tracking-widest">
              [ SYSTEM STATUS: ONLINE ]
            </span>
            <span className="font-mono text-xs text-amber-caution">
              TELEMETRY V1.0.4
            </span>
          </div>
          <h1 className="mt-2 font-mono text-4xl font-bold tracking-tight text-cyan-focus">
            CYBERPUNK // DASHBOARD
          </h1>
        </header>

        <section className="space-y-6 font-sans text-slate-300">
          <p className="text-lg leading-relaxed">
            Welcome to the Next.js 14 App Router environment configured with TypeScript and Tailwind CSS.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 font-mono">
            <div className="rounded-lg border border-cyan-focus/40 bg-slate-dark p-4">
              <span className="text-xs text-gray-400">FOCUS MATRIX</span>
              <p className="mt-1 text-2xl font-semibold text-cyan-focus">#38BDF8</p>
            </div>
            <div className="rounded-lg border border-emerald-highlight/40 bg-slate-dark p-4">
              <span className="text-xs text-gray-400">HIGHLGHT CORE</span>
              <p className="mt-1 text-2xl font-semibold text-emerald-highlight">#10B981</p>
            </div>
            <div className="rounded-lg border border-amber-caution/40 bg-slate-dark p-4">
              <span className="text-xs text-gray-400">CAUTION BEACON</span>
              <p className="mt-1 text-2xl font-semibold text-amber-caution">#F59E0B</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 p-6 bg-slate-dark/50">
            <h2 className="font-mono text-xl font-semibold text-cyan-focus mb-2">
              &gt; Typography Diagnostics
            </h2>
            <p className="font-sans text-slate-300 mb-2">
              Body Copy (Sans-serif - Inter): Crisp and legible body copy for primary interface elements.
            </p>
            <p className="font-mono text-emerald-highlight text-sm">
              Telemetry Headers (Monospace - JetBrains Mono): 0x4A8F90 // PROTOCOL_READY
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
