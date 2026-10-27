# Implementation Plan - Dynamic Cosmic Nebula & Deep Space Background

## 1. Goal Description
Implement an ultra-high-performance, dynamic WebGL2 background canvas that provides:
1. **Hero Section (Interactive Nebula):** An organic, volumetric cosmic nebula (deep nebula violets `#8b5cf6`, pulsar indigos `#4338ca`, and starlight gold `#fbbf24` filaments) with continuous idle breathing and fluid cursor displacement (gravitational parting and magnetic ion excitation).
2. **Scroll Choreography (Volumetric Radial Fly-Through):** A smooth radial fly-through transition as the user scrolls through the Bio section into the Project Solar System, expanding the nebula outward beyond the viewport edges and dissolving its opacity into pure void.
3. **Deep Space Starfield (Project Solar System Context):** A 3-tiered procedural starfield (micro background stardust, sharp midground starlight, and softly twinkling foreground stars) that sits in high contrast behind the 3D Planetary Solar System.
4. **Performance Guarantee:** Rock-solid 60 FPS across desktop and mobile through DPR clamping (1.25x max on retina/mobile), delta-time normalized damping (60Hz vs 120Hz+), and early-exit shader branching when the user is viewing the 3D Solar System.

---

## 2. Mathematical & Architectural Rectifications

### 2.1 Inverted Radial Fly-Through Math
Dividing by the scale factor in UV sampling expands the visual nebula outward as scroll increases:
```glsl
float zoomScale = 1.0 + u_scroll * 2.2;
vec2 scrolledUV = (uv - 0.5) / zoomScale + 0.5;
float nebulaAlpha = smoothstep(0.85, 0.05, u_scroll);
```

### 2.2 Aspect Ratio Correction
Correcting coordinates by `aspect = u_resolution.x / u_resolution.y`:
```glsl
vec2 aspectDelta = vec2((uv.x - u_mouse.x) * aspect, uv.y - u_mouse.y);
float mouseDist = length(aspectDelta);
```
Ensures circular cursor repulsion and non-stretched procedural star cells across 16:9, ultrawide, and mobile viewports.

### 2.3 Safe Vector Normalization (Anti-NaN)
```glsl
vec2 dir = mouseDist > 0.0001 ? aspectDelta / mouseDist : vec2(0.0);
vec2 displacement = dir * smoothstep(0.45, 0.0, mouseDist) * 0.12;
// Unscale x before applying to UV
uv += vec2(displacement.x / aspect, displacement.y);
```
Guarantees zero `NaN` black pixel artifacts when the cursor rests directly on a fragment.

### 2.4 Early-Exit GPU Branching for 3D Solar System Coexistence
```glsl
vec3 color = starfieldColor;
if (nebulaAlpha > 0.001) {
    // Evaluate 4-octave domain-warped FBM nebula only when visible
    float f = domainWarpedFBM(scrolledUV, u_time);
    vec3 nebulaColor = computeNebulaPalette(f, u_time);
    color += nebulaColor * nebulaAlpha;
}
```
When user scrolls to the bottom section (`ProjectWebGraph`), the expensive FBM loop is skipped entirely, freeing 100% of GPU shader fill-rate for Three.js.

### 2.5 Frame-Rate Independent Damping & WebGL Coordinate Alignment
```ts
const dt = Math.min((now - lastTime) / 1000, 0.1);
const mouseFactor = 1.0 - Math.exp(-8.0 * dt);
const scrollFactor = 1.0 - Math.exp(-6.0 * dt);
currentMouse.x += (targetMouse.x - currentMouse.x) * mouseFactor;
currentMouse.y += (targetMouse.y - currentMouse.y) * mouseFactor;
currentScroll += (targetScroll - currentScroll) * scrollFactor;

// Mouse Y flipped to match WebGL's bottom-left origin
targetMouse.y = 1.0 - e.clientY / window.innerHeight;
```

---

## 4. Phase 4: Procedural Shader Planets & 100% Wireframe Eradication

### 4.1 Architectural Rationale & Aesthetic Vision
All wireframe meshes (icosahedrons, wireframe corona spheres, wireframe auras) are eliminated. In their place, a suite of custom procedural GLSL WebGL shaders running inside Three.js `@react-three/fiber` produces rich, photorealistic celestial bodies without requiring external heavy image textures.

### 4.2 Component Architecture
1. **`SolarPlasmaMaterial` & `SunCoronaMaterial`**:
   - Central Sun: Seamless 3D noise-driven convective granulation, starlight flares, and limb darkening (Golden amber `#b45309` to starlight gold `#fbbf24` to incandescent white `#ffffff`).
   - Corona: Volumetric soft additive Fresnel shell (`sphereGeometry args={[1.65, 32, 32]}`) with pulsating solar flare rays (`THREE.AdditiveBlending`, no wireframe).
2. **`ProceduralPlanetMaterial`**:
   - Geometry: Smooth `sphereGeometry args={[0.62, 32, 32]}` (replaces faceted `icosahedronGeometry args={[0.58, 2]}`).
   - 5 Distinct Morphologies based on `u_planetType`:
     - **0 (AI & ML, #8b5cf6)**: Jovian Gas Giant with turbulent latitudinal cloud belts and vortex storm spots.
     - **1 (Systems, #f43f5e)**: Volcanic Tectonic Planet with fractured basalt crust and pulsing crimson magma rifts.
     - **2 (Web Platforms, #fbbf24)**: Saturnian Gas Giant with silky golden clouds and tilted translucent planetary rings.
     - **3 (Zero-Trust, #10b981)**: Oceanic Cyber World with deep cyan oceans, emerald continents, and soft cloud swirls.
     - **4 (Applied Vision, #6366f1)**: Crystalline Ice Super-Earth with azure glacial oceans and polar vortex caps.
3. **`PlanetAtmosphereMaterial`**:
   - Smooth outer shell (`args={[0.76, 32, 32]}`) running an additive Fresnel limb shader (`pow(1.0 - max(dot(normal, viewDir), 0.0), 3.2)`).
   - Produces a cinematic, soft planetary atmospheric glow that reacts dynamically to hover states.
4. **`PlanetaryRing`**:
   - Thin tilted disc (`ringGeometry args={[0.85, 1.45, 64]}`) with procedural concentric ring bands and Cassini divisions for Web Platforms and Applied Vision.
5. **`MoonSurfaceMaterial`**:
   - Smooth `sphereGeometry args={[0.26, 24, 24]}` with high-frequency procedural lunar crater texturing and subtle parent hue tinting.
6. **Faint Celestial Pathways**:
   - Fine-tuned orbit line opacity (0.15 resting, 0.65 active) for delicate celestial gravity trails rather than wireframe grids.

### 4.3 Verification Criteria
- Zero wireframe geometry remaining in the entire solar system.
- Rock-solid 60 FPS maintained.
- Verified in Chrome DevTools with screenshots from the side-wise view.

---

## 5. Phase 5: Minimalist Starlight Cursor & Glassmorphic Modal Redesign

### 5.1 Architectural Objectives
1. **Minimalist Luminous Starlight Dot & Smooth Magnetic Ring**:
   - Replace the clunky crosshair reticle and single chunky purple blob in [`components/ui/CyberCursor.tsx`](file:///d:/Projects/Portfolio/components/ui/CyberCursor.tsx) with:
     - Exact pinpoint center dot: 4px glowing starlight dot (`#fbbf24`).
     - Outer lagging aura ring: 28px ring with fluid lerp inertia damping (`border-nebula-violet/70 bg-nebula-violet/10`).
     - Interactive state: ring smoothly expands to 42px and glows in starlight gold with magnetic pull when hovering over clickable elements (`button`, `a`, `[role="button"]`, `.interactive`, `canvas`).
     - Delicate stardust trail: multi-sample decaying micro-stardust particles trailing smoothly with exponential opacity decay.
2. **Stacking Context Fix (`z-[99999]`)**:
   - Elevate [`components/ui/HUDLayer.tsx`](file:///d:/Projects/Portfolio/components/ui/HUDLayer.tsx) and [`components/ui/CyberCursor.tsx`](file:///d:/Projects/Portfolio/components/ui/CyberCursor.tsx) to `z-[99999] pointer-events-none`.
   - Mount `<HUDLayer />` at the end of the root layout stack in [`app/layout.tsx`](file:///d:/Projects/Portfolio/app/layout.tsx), ensuring the custom cursor permanently floats above all modals, overlays, and 3D scenes.
3. **Deep Translucent Obsidian Glass Modal**:
   - In [`components/ui/ProjectWebGraph.tsx`](file:///d:/Projects/Portfolio/components/ui/ProjectWebGraph.tsx), replace opaque backdrop (`bg-black/80`) with `bg-void-black/45 backdrop-blur-xl`, letting the 3D rotating planetary system shimmer through softly.
   - Refactor modal container to frosted translucent obsidian (`bg-[#0a0f1e]/65 backdrop-blur-2xl border border-nebula-violet/35 shadow-[0_0_50px_rgba(139,92,246,0.25)]`).
4. **Intuitive Modal Dismissal UX**:
   - Click-outside on the backdrop closes the modal.
   - Global `Escape` key listener dismisses the modal.
   - Enlarged, luminous, high-contrast `[ CLOSE ✕ ]` button with interactive hover magnetic response.

---

## 6. Phase 6: Comet Cursor & Tail, Canvas Luminescence, and Crisp Modal Backdrop

### 6.1 Architectural Objectives
1. **Comet Cursor & Streamlined Radiant Ion & Dust Tail**:
   - Completely eliminate the outer magnetic ring in [`components/ui/CyberCursor.tsx`](file:///d:/Projects/Portfolio/components/ui/CyberCursor.tsx).
   - Comet Head (Nucleus): Brilliant 6px starlight gold & incandescent white core with radiant dual-layer bloom (`shadow-[0_0_10px_#fbbf24,0_0_20px_rgba(251,191,36,0.6)]`), scaling smoothly on hover.
   - Comet Tail: Streamlined 8-point decaying ion & dust tail with velocity-aware cascade lag. Tapered from 5px down to 1px with electric cyan (`#38bdf8`) fading into cosmic violet (`#8b5cf6`) and starlight amber (`#f59e0b`).
2. **Cosmic Background: Replace Gravitational Pinch with Soft Starlight Luminescence**:
   - In [`components/canvas/CosmicBackground.tsx`](file:///d:/Projects/Portfolio/components/canvas/CosmicBackground.tsx), remove the geometric UV pinch warp (`displacement = dir * mouseRepel * 0.14`).
   - Implement soft radial starlight luminescence (`ionGlow = exp(-mouseDist * 6.5) * 0.45`), gently illuminating cosmic gas filaments and exciting nearby background stars into diamond diffraction sparkle without warping space.
3. **Project Modal Backdrop: Crisp Planetary View with Minimal Frost**:
   - In [`components/ui/ProjectWebGraph.tsx`](file:///d:/Projects/Portfolio/components/ui/ProjectWebGraph.tsx), reduce backdrop blur from `backdrop-blur-xl` to `backdrop-blur-[2px] bg-void-black/40`.
   - The 3D rotating planetary solar system, glowing central sun, rings, and stars remain completely crisp and visible in the background, while the modal card retains its frosted obsidian styling for high text legibility.


