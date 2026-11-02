"use client";

/**
 * components/ui/Footer.tsx
 *
 * Full-width minimalist contact and social footer bar.
 * Features high-contrast monochrome social icons with soft nebula hover glow,
 * one-click email copy with tactile status feedback, and audio micro-interactions.
 */

import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { playHoverSound, playSelectSound } from "@/lib/audio";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function XLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    playSelectSound();
    navigator.clipboard.writeText("taanushabrahm@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <footer className="relative w-full border-t border-white/10 bg-void-black/50 backdrop-blur-md py-8 px-4 sm:px-8 lg:px-16 z-20 transition-all">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
        {/* Left: Copyright & Mission statement */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left font-mono text-xs text-slate-400">
          <span className="text-slate-300 font-medium">
            © {new Date().getFullYear()} Taanush Abraham
          </span>
          <span className="hidden sm:inline-block text-slate-600">·</span>
          <span className="text-slate-400">
            Built across the digital cosmos
          </span>
        </div>

        {/* Right: Sleek Icon-only Buttons with Tooltips */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* GitHub */}
          <div className="relative group">
            <a
              href="https://github.com/TEA-21"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              onMouseEnter={() => playHoverSound()}
              onClick={() => playSelectSound()}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:border-nebula-violet/60 hover:bg-nebula-violet/20 hover:shadow-[0_0_15px_rgba(139,92,246,0.35)] transition-all active:scale-95"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-void-black border border-white/15 font-mono text-[10px] text-slate-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              GitHub
            </div>
          </div>

          {/* LinkedIn */}
          <div className="relative group">
            <a
              href="https://www.linkedin.com/in/taanush-abraham/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Profile"
              onMouseEnter={() => playHoverSound()}
              onClick={() => playSelectSound()}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all active:scale-95"
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-void-black border border-white/15 font-mono text-[10px] text-slate-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              LinkedIn
            </div>
          </div>

          {/* X (Twitter) */}
          <div className="relative group">
            <a
              href="https://x.com/TaanushEmmpnk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X Profile"
              onMouseEnter={() => playHoverSound()}
              onClick={() => playSelectSound()}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:border-white/40 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all active:scale-95"
            >
              <XLogo className="w-4 h-4" />
            </a>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-void-black border border-white/15 font-mono text-[10px] text-slate-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              X (Twitter)
            </div>
          </div>

          {/* Instagram */}
          <div className="relative group">
            <a
              href="https://www.instagram.com/_.tea_21_/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Profile"
              onMouseEnter={() => playHoverSound()}
              onClick={() => playSelectSound()}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:border-pink-500/60 hover:bg-pink-500/20 hover:shadow-[0_0_15px_rgba(236,72,153,0.35)] transition-all active:scale-95"
            >
              <InstagramIcon className="w-4 h-4" />
            </a>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-void-black border border-white/15 font-mono text-[10px] text-slate-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              Instagram
            </div>
          </div>

          {/* Email Copy Button */}
          <div className="relative group">
            <button
              type="button"
              onClick={handleCopyEmail}
              onMouseEnter={() => playHoverSound()}
              aria-label="Copy Email Address"
              className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                copied
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:border-starlight-gold/60 hover:bg-starlight-gold/20 hover:shadow-[0_0_15px_rgba(251,191,36,0.35)]"
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 animate-in zoom-in" /> : <Mail className="w-4 h-4" />}
            </button>
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md border font-mono text-[10px] pointer-events-none transition-all whitespace-nowrap shadow-lg ${
              copied
                ? "bg-slate-950 border-emerald-500/50 text-emerald-300 opacity-100"
                : "bg-void-black border-white/15 text-slate-200 opacity-0 group-hover:opacity-100"
            }`}>
              {copied ? "✓ Copied to clipboard!" : "Copy taanushabrahm@gmail.com"}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
