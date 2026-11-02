# Phase 38 Walkthrough: Cinematic Warp Cutscenes & Authentic TotM Labyrinth

## Overview
Phase 38 delivers cinematic cutscenes connecting the portfolio galaxy to the arcade chamber, paired with an authentic Tomb of the Mask tight zigzag labyrinth engine:
1. **Audio Synthesis & Cleanup**: Web Audio API expansion in `lib/audio.ts` featuring black hole suction sweeps, stuttering panic reverse thruster bursts, Rick & Morty squishy fluid portal resonance, cartoon eject pop/whistle drop, and centralized 30ms linear gain fadeout cleanup (`stopCutsceneAudio()`).
2. **Cinematic Warp Cutscene Orchestration**: In `components/ui/FlyingMascotCompanion.tsx`:
   - **Warp-In Cutscene**: Smoothly scrolls the viewport to `#hero-section` without prematurely setting `overflow: hidden` (Safeguard 1: blocking manual scrolling via non-passive capture listeners), flies ARIA across hero section past monument name `TAANUSH` towards a cosmic black hole singularity, triggers reverse thruster panic with quip *"MAYDAY! GRAVITATIONAL ANOMALY—REVERSE THRUSTERS!"*, and spirals into the singularity to open the minigame.
   - **Warp-Out Cutscene (Rick & Morty Portal)**: Strictly gated by `wasMinigameOpenRef` on `true -> false` transition (prevents initial mount false-positives), rips open a sideways neon lime-green fluid portal, spews ARIA horizontally at high speed, tumbles 720°, displays dizzy spiral expression with quip *"Ugh... dimensional turbulence is the worst. Back in one piece!"*, and collapses the portal as ARIA resumes zero-G flight.
   - **Tap-To-Skip**: 150ms protection buffer prevents click bleed, consumes events, immediately halts audio, and completes cutscene transitions.
3. **Authentic TotM Labyrinth Engine**: In `components/ui/SpaceArcadeMinigame.tsx`:
   - Enforces a **strict 2–4 tile straight limit** on all vertical and horizontal corridors across infinite chunks (0 corridors > 4 tiles).
   - Winding S-curves, forced 90-degree cornering, and side alcoves for stardust dots and power-ups.
   - **Timed Retracting Spikes on Elbows**: Cycle of Retracted (1.6s) -> Telegraph Warning (0.8s pulsing yellow) -> Extended (1.2s crimson hazard).
   - **Decoy Static Spikes**: Placed ONLY on recessed dead-end alcove walls.
   - **Cross-Chunk Seam Alignment (Safeguard 3)**: Caps incoming straight corridors within `max(0, 4 - incomingRun)` rows and enforces >= 4 tile column separation on top exits.
   - **Stationary Player Protection (Safeguard 2)**: If player is resting stationary against an elbow wall when timed spikes extend, takes 1 shield damage, receives 1000ms invulnerability flashing, and immediately retracts that spike for 2s so the player isn't killed in consecutive frames.
   - 200ms input ignore buffer on mount prevents cutscene skip click bleed.

---

## Key Implementations

### 1. Web Audio FX in `lib/audio.ts`
- `playBlackHoleSuctionSound()`: Gravitational sub-bass drone (55Hz sine) combined with a rising suction sweep (sawtooth 70Hz -> 520Hz) through a resonant lowpass filter modulated by a 1.5Hz flanger LFO. Returns stopper callback.
- `playPanicThrusterSound()`: Stuttering reverse thruster engine bursts (110Hz square carrier) modulated by an 18Hz square pulse LFO through a 750Hz bandpass filter. Returns stopper callback.
- `playRickMortyPortalSound()`: Fluid dimensional portal opening sound with 240Hz -> 160Hz carrier, 24Hz wet bubbler FM vibrato (+/- 65Hz), and a resonant bandpass filter (Q = 6.5) sweeping 600Hz down to 180Hz. Returns stopper callback.
- `playComedicEjectSound()`: Cartoon pop transient (200Hz -> 880Hz upward chirp) paired with a comedic whistle drop (1250Hz -> 180Hz slide over 450ms). Returns stopper callback.
- `stopCutsceneAudio()`: Iterates through all registered active cutscene stoppers, applies a 30ms linear gain ramp to 0, halts oscillators, and disconnects nodes.

### 2. Cinematic Warp Cutscenes in `components/ui/FlyingMascotCompanion.tsx`
- **State Machine**:
  `CutscenePhase`: `"none" | "warp_in_scroll" | "warp_in_flyby" | "warp_in_panic" | "warp_in_swallowed" | "warp_out_portal" | "warp_out_spew" | "warp_out_dizzy"`.
- **Warp-In Execution**:
  1. `handleOpenMinigame` starts `"warp_in_scroll"`.
  2. Smooth scrolls to `top: 0` (`#hero-section`) while attaching non-passive `wheel` and `touchmove` listeners with `e.preventDefault()`, leaving `document.body.style.overflow = ""` so smooth scrolling is not aborted.
  3. When `window.scrollY <= 40` (or 500ms hard fallback), sets `document.body.style.overflow = "hidden"` and advances to `"warp_in_flyby"`.
  4. ARIA flies past monument name `TAANUSH` towards a cosmic black hole singularity at top-right.
  5. At proximity threshold, advances to `"warp_in_panic"`: pose changes to `poke`, stuttering reverse thruster bursts fire, speech bubble displays: *"MAYDAY! GRAVITATIONAL ANOMALY—REVERSE THRUSTERS!"*.
  6. Singularity overcomes thrusters: advances to `"warp_in_swallowed"`, ARIA spirals into event horizon with 1080° spin, scaling to 0 over 650ms.
  7. Opens minigame modal (`setMinigameOpen(true)`), restores `overflow: ""` and stops cutscene audio.
- **Warp-Out Execution**:
  1. Triggered strictly on `wasMinigameOpenRef.current && !isMinigameOpen` transition (0 initial mount false positives).
  2. Opens sideways neon lime-green fluid portal (*Rick and Morty* style with pulsating fluid rings and dripping green spark particles).
  3. ARIA is spewed out horizontally at high speed (`vx = 22, vy = -3`), tumbling 720° across the screen with bounce deceleration.
  4. Enters `"warp_out_dizzy"` with dizzy expression, spinning stars, and quip: *"Ugh... dimensional turbulence is the worst. Back in one piece!"*.
  5. Portal collapses with fizzle pop; ARIA shakes off dizziness and resumes zero-G companion flight.
- **Skip & Cleanup Handling**:
  - Fullscreen transparent capture overlay with `[ Click anywhere or press any key to skip ✕ ]`.
  - 150ms buffer before arming skip listeners.
  - Consumes events (`stopPropagation`, `preventDefault`), stops audio immediately via `stopCutsceneAudio()`, and cleanly transitions state.

### 3. Authentic TotM Labyrinth Engine in `components/ui/SpaceArcadeMinigame.tsx`
- **Strict 2–4 Tile Straight Limit**:
  - Replaced long vertical shafts with winding S-curves and forced 90-degree cornering.
  - Every vertical run is strictly bounded between 2 and 4 tiles (empirically tested across 50 chunks / 700 rows).
  - Horizontal runs bounded to 2–3 tiles.
- **Timed Retracting Spikes on Elbows**:
  - Attached to elbow walls at forced corners.
  - Dynamic 3-phase cycle:
    - Retracted (1.6s): Subtle dark recessed slots flush with wall edge (`#334155`).
    - Telegraph Warning (0.8s): 18Hz pulsing yellow hazard teeth (`#FBBF24` / `#F59E0B`).
    - Extended (1.2s): Full sharp 9px crimson hazard spikes (`#F43F5E`).
  - Arrival raycasting checks future spike state based on dash flight duration (`DASH_SPEED = 950 px/s`).
- **Safeguard 2 (Stationary Elbow Protection)**:
  - If a stationary player is resting adjacent to an elbow wall when timed spikes extend:
    - 1 shield damage applied.
    - 1000ms invulnerability flashing activated.
    - Spike is immediately force-retracted for 2.0s (`forceRetractedUntil`) to prevent consecutive frame kills.
- **Decoy Static Spikes**:
  - Placed ONLY on recessed dead-end alcove decoy walls.
- **Safeguard 3 (Cross-Chunk Seam Alignment)**:
  - Tracks incoming vertical run lengths across chunk boundaries.
  - Caps first vertical run in new chunk within `max(0, 4 - incomingRun)` rows, ensuring cross-seam straight paths never exceed 4 tiles.
  - Top exits enforced to have `>= 4` tile column separation (e.g. left branch in cols 1-3, right branch in cols 7-9).
- **Mount Input Guard**:
  - 200ms input ignore buffer on modal open prevents cutscene skip click bleed into instant dashes.

---

# Phase 39 Walkthrough: Interstellar Gargantua, 3D Z-Axis Flyby & Comedic Portal Puke

## Overview
Phase 39 elevates the arcade transitions with an authentic Christopher Nolan *Interstellar* Gargantua black hole, a multi-stage 3D Z-axis camera dive past the monumental hero name "TAANUSH", and a hilarious cartoon portal puke sequence upon exiting the arcade chamber:
1. **Audio Synthesizer Expansion (`lib/audio.ts`)**:
   - `playComedicRetchSound()`: 8-bit comedic cartoon gag/retch sound (low-frequency bubbling carrier 90Hz -> 60Hz sawtooth with 22Hz AM squelch modulation through a resonant 420Hz -> 180Hz bandpass filter, followed by a cartoon splat noise burst). Returns stopper callback.
2. **Colossal Interstellar Gargantua Black Hole (`components/ui/FlyingMascotCompanion.tsx`)**:
   - Centered in cosmic hero backdrop (`x = window.innerWidth / 2, y = Math.max(130, window.innerHeight * 0.24)`).
   - Responsive dimensions: `w-[320px] h-[320px] md:w-[440px] md:h-[440px]`.
   - Authentic *Interstellar* Gravitational Lensing SVG Architecture:
     - Pitch-black central event horizon circle (`#000000`, `r=54`) with razor-sharp glowing starlight gold photon ring (`#FEF08A`, `r=55.5`).
     - Upper gravitational lens arc: brilliant starlight gold/amber plasma arc bending over the top of the event horizon (`M 75 220 C 75 105, 160 82, 220 82 C 280 82, 365 105, 365 220`).
     - Lower gravitational lens arc: glowing amber plasma arc bending underneath the bottom of the event horizon (`M 105 220 C 105 288, 170 322, 220 322 C 270 322, 335 288, 335 220`).
     - Equatorial accretion disk: luminous elliptical disk crossing directly in front of the black hole, tilted at -16 degrees, with relativistic Doppler asymmetry (left side brilliant starlight gold `#FFFFFF`/`#FEF08A`/`#FBBF24`, right side deep molten amber `#EA580C`/`#7C2D12`).
     - Swirling accretion plasma filaments (rotating 14s and 5s cycles) and deep cosmic gravitational distortion glow.
3. **3D Z-Axis Flyby Past "TAANUSH"`**:
   - In `startWarpInFlyby`:
     - Reads `#hero-section h1` bounding box (`nameRect`).
     - ARIA starts large in the foreground (`scale(2.2)`, `x = window.innerWidth / 2 - 130, y = window.innerHeight * 0.68`).
     - Stage 1: Zooms deep into screen depth right past the monument letters of "TAANUSH" (`scale: 2.2 -> 1.0`, `x = window.innerWidth / 2, y = nameRect.top + 35`).
     - Stage 2: Continues into deep space toward Gargantua (`scale: 1.0 -> 0.36`, `x = gX, y = gY + 40`).
     - Proximity to Gargantua triggers `startWarpInPanic`: wide shocked eyes (`pose="poke"`), frantic reverse thruster fire bursts, quip: *"MAYDAY! GRAVITATIONAL ANOMALY—REVERSE THRUSTERS!"*.
     - Gravitational suction pulls ARIA into the black hole singularity (1080° spin, scaling down from 0.36 to 0) into Gargantua's event horizon center.
4. **Comedic Portal Puke in Warp-Out**:
   - After spewing out of the Rick & Morty portal and tumbling across the screen, ARIA lands with a bounce wobble.
   - Enters `"warp_out_puke"`:
     - Queasy wobble with nauseous green tint (`hue-rotate(75deg)`, `queasyJitter` keyframe).
     - Plays `playComedicRetchSound()`.
     - Renders an animated spray of cartoon/pixel neon green and starlight yellow puke droplets (`#4ade80`, `#a3e635`, `#facc15`) erupting forward/downward in a parabolic arc from her helmet onto the ground.
     - Expanding cartoon splat puddle with concentric ripples (`pukePuddleExpand`, `pukeRipplePulse`).
     - Quip: *"BLEAAARGH! 🤮 Ugh... dimensional turbulence is the worst. Never eating zero-G burritos before warping again..."*.
   - After 1.8s, ARIA shakes her helmet, snaps back to `idle`, and resumes normal zero-G companion flight.

---

## Verification Results

- **TypeScript Compilation**: 0 errors (`npx tsc --noEmit`).
- **Next.js Production Build**: Compiled cleanly with exit code 0 (`npm run build`).
- **Automated Browser Verification (`chrome-devtools-mcp`)**:
  - Gargantua Black Hole: verified authentic upper/lower gravitational lens arcs, Doppler-boosted equatorial accretion disk, and photon ring.
  - 3D Z-Axis Flyby: verified scale transitions from 2.2 foreground -> 1.0 past `TAANUSH` letters -> 0.36 deep space proximity to Gargantua.
  - Panic & Singularity: verified reverse thruster bursts, panic quip, and 1080° spin suction down to scale 0 at event horizon center.
  - Minigame Launch: verified seamless transition to Space Arcade modal.
  - Warp-Out Portal & Puke: verified horizontal spew across screen, wobble landing, `warp_out_puke` state with nauseous green hue, retch audio trigger, green/yellow droplet spray particles, expanding splat puddle ripples, and comedic burrito quip.
  - Zero console errors during all cutscenes.


### 1. Static Type Checking
- `npx tsc --noEmit` passed with 0 errors.

### 2. Production Build
- `npm run build` compiled cleanly with exit code 0 (`Compiled successfully`, static pages 6/6 generated).

### 3. Automated Browser Verification (`chrome-devtools-mcp` on `http://localhost:3000/`)
1. **Initial Mount**:
   - Confirmed `hasSkipOverlay: false`, `hasBlackHole: false`, `hasRickMortyPortal: false`.
   - Verified 0 false-positive cutscenes on mount.
2. **Warp-In Cutscene from Bottom of Page**:
   - Scrolled to `scrollY = 1500`, launched "MINI GAME" from Command HUD.
   - Verified smooth scroll to `#hero-section` without body overflow cancellation (`bodyOverflow: ""`).
   - Verified hero flyby past `TAANUSH` towards cosmic black hole singularity (`hasBlackHole: true`).
   - Verified proximity trigger for panic reverse thruster jitter, flame bursts, and speech quip (`"🚨MAYDAY! GRAVITATIONAL ANOMALY—REVERSE THRUSTERS!"`).
   - Verified singularity dive and minigame modal open.
3. **TotM Labyrinth Corridor Bounds**:
   - Automated simulation across 50 chunks (700 rows) verified `maxObservedStraight: 4` (`passedStrictLimit: true`).
   - Verified timed elbow spikes (86 placed) and static alcove decoy spikes.
4. **Minigame Kinematics & Gameplay**:
   - Initiated launch, performed 4-way kinematic dashes (UP, RIGHT, UP).
   - Verified dot trail illumination and shield health tracking.
5. **Warp-Out Cutscene (Rick & Morty Portal)**:
   - Closed minigame (`[ CLOSE ✕ ]`).
   - Verified sideways neon lime-green fluid portal spawned (`hasPortalGrad: true`, `hasSkipOverlay: true`).
   - Verified horizontal high-speed spew and tumble across screen.
   - Verified dizzy spiral eyes, dizzy stars overlay, and speech quip (`"Ugh... dimensional turbulence is the worst. Back in one piece!"`).
   - Verified portal collapse and recovery into zero-G roaming flight.
6. **Tap-To-Skip & Audio Cleanup**:
   - Verified 150ms buffer prevents click bleed.
   - Verified Space key and click immediately skip cutscene, stop Web Audio nodes via `stopCutsceneAudio()`, and open minigame or restore zero-G roaming.
7. **Console Health**:
   - 0 script errors in browser console.
