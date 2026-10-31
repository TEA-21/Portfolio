# Project Graph & Portfolio Redesign Progress

## Current Active Phase
Phase 32: 100+ Mega Dialogue Pool, 1:1 Attached Follow Bubble & Long Ambient Breaks (Complete & Verified)

## Completed Steps & Exact Techniques/Libraries Used
- **100+ Mega Dialogue Pool Expansion (`lib/mascot-dialogues.ts`)**:
  - Expanded dialogue deck to 106 unique entries across 7 categories:
    - `ai_agentic` (16 entries): Multi-agent debate swarms, MCP tools, token context caching, schema grounding, RL simulation, speculative decoding, FlashAttention-3, hybrid BM25/vector RAG, MoE layer routing, Chain-of-Thought scratchpads, AWQ quantization, DPO preference tuning, prompt injection defenses, RoPE positional angles.
    - `systems_security` (16 entries): MicroVM isolation, Zero-standing IAM leasing, NVMe MoE direct streaming, bare-metal ESP32 SLMs, ZKP passkeys, eBPF kernel tracing, cache line false sharing, Raft consensus, AVX-512 SIMD, memory barriers, Linux cgroups v2/namespaces, Rowhammer DRAM crosstalk, Copy-On-Write paging, TCP BBR, ASLR memory randomization, zero-copy `sendfile()`.
    - `astrophysics_science` (16 entries): Hawking radiation, quantum entanglement bounds, CMB 2.725K Big Bang echo, gravitational time dilation, black hole event horizon tidal gentleness, dark energy acceleration, quantum eraser delayed-choice, neutron star density, LIGO proton-fraction laser arms, cosmic horizon recession, JWST L2 Lagrange orbit, frame-dragging Lense-Thirring effect, Heisenberg Fourier transforms, pulsars, thermodynamic entropy arrow of time, quantum tunneling.
    - `gaming_lore` (16 entries): Quake bunny hopping vector projection, Mario 64 BLJ, Minecraft 32-bit floating-point Far Lands, Geometry Dash 240Hz ticks, DOOM 1993 BSP trees, Half-Life 2 Accelerated Back Hopping, Zelda OoT RAM ACE exploits, Celeste 5 coyote frames, Street Fighter II combo bug, GoldenEye audio spheres, Portal 9-depth recursion, Space Invaders CPU load, Melee wavedashing, Pac-Man ghost personalities, Skyrim intro cart helmet NPC, WoW Corrupted Blood plague.
    - `math_computing_history` (16 entries): Quake III `0x5f3759df` fast inverse square root, Collatz conjecture (3n+1), Gödel's Incompleteness, Apollo 11 hand-woven core rope memory, P vs NP $1M prize, Claude Shannon boolean relays, Alan Turing Entscheidungsproblem, Euler's identity e^(iπ)+1=0, Grace Hopper's 1947 moth bug, RSA prime factorization, Banach-Tarski paradox, Ada Lovelace Bernoulli numbers, Shannon Entropy data compression, Halting Problem, Birthday paradox, Mandelbrot fractals.
    - `retro_scifi_lore` (12 entries): HAL 9000 mission conflict, Hitchhiker's Guide 42, Neuromancer consensual cyberspace, Interstellar Gargantua GR ray tracing, Blade Runner tears in rain, Asimov's Three Laws paradoxes, Stanislaw Lem Solaris cosmos boundaries, 2001 monolith 1:4:9 integer proportions, Dune Butlerian Jihad, Matrix sushi recipe digital rain, Contact prime number transmission, tachyon imaginary coordinates.
    - `cadet_quips` (14 entries): Zero-G espresso disasters, bit-flips in thrusters, inspecting CSS DOM nodes, cursor teasing, cyber-plasma caffeine, orbital summon tether, project graph constellations, Speed Run tour promo, 60 FPS visor, physics fling stress test, CRT phosphor scanlines, orbital cursor tracking, WebGL shader health, cadet navigation wings.
  - Non-repeating `DialogueShuffleBag` (Fisher-Yates) ensures zero repeats across the entire 106-dialogue cycle.
- **1:1 Parent-Attached Speech Bubble Kinematics (`components/ui/MascotSpeechBubble.tsx`)**:
  - Moved `MascotSpeechBubble` directly inside `div ref={astronautRef}` (outside rotating `spriteWrapperRef`).
  - Stays 100% attached to ARIA with 0 frame latency: tracks zero-G sinusoidal hover waves and dragging identically (`constantAttachment: true`).
  - Viewport-clamped positioning prevents horizontal overflow off screen borders with dynamic cartoon tail alignment.
- **Slow Ambient Mascot & Break-Only Speech Timing (`components/ui/FlyingMascotCompanion.tsx`)**:
  - All breaks lengthened to **$8\text{s} - 20\text{s}$** (`roam.restDuration = 8.0 + Math.random() * 12.0`).
  - Speech bubbles **only appear during resting breaks**.
  - Break duration guarantees the full dialogue duration ($8\text{s} - 12\text{s}$) so ARIA hovers calmly while chatting.
  - Speech bubbles auto-hide when ARIA launches into a flight, or when dragged/summoned.
- **In-Browser Verification via Chrome DevTools MCP**:
  - TypeScript: 0 errors (`npx tsc --noEmit`).
  - Next.js Production Build: Compiled cleanly with 0 errors (`npm run build`).
  - Live Browser Testing (`http://localhost:3000/`):
    - Verified `insideMascot: true` with locked 1:1 delta Y tracking during hover.
    - Verified diverse categories delivered from 106 pool (Solaris, Copy-On-Write, Apollo 11 rope memory, Frame-dragging).
    - Verified instant click-to-cycle and break-only speech triggering.

## Files Created or Modified
- `d:/Projects/Portfolio/lib/mascot-dialogues.ts` (MODIFIED: Expanded from 24 to 106 dialogues across 7 categories)
- `d:/Projects/Portfolio/components/ui/MascotSpeechBubble.tsx` (MODIFIED: Refactored for direct parent attachment inside astronautRef with edge clamping)
- `d:/Projects/Portfolio/components/ui/FlyingMascotCompanion.tsx` (MODIFIED: Direct parent bubble nesting, break-only speech scheduler, 8s–20s ambient breaks)
- `d:/Projects/Portfolio/PROGRESS.md` (MODIFIED: Documented Phase 32 completion)

## Next Immediate Action
All features verified live in production build on `http://localhost:3000/`.
