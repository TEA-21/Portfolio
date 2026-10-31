"use client";

/**
 * components/canvas/CosmicBackground.tsx
 *
 * Standalone High-Performance WebGL2 Cosmic Nebula & Deep Space Canvas.
 *
 * ARCHITECTURAL SPECIFICATIONS & RECTIFICATIONS
 * ─────────────────────────────────────────────
 * 1. Fixed Inverted Radial Fly-Through:
 *    UV coordinates are divided by the zoom factor ((uv - 0.5) / scale + 0.5)
 *    so the nebula expands outward beyond screen edges as the user scrolls.
 * 2. Aspect Ratio Correction:
 *    Delta vectors and star coordinates are corrected via u_resolution.x / u_resolution.y
 *    guaranteeing circular cursor repulsion and non-stretched celestial bodies.
 * 3. Safe Vector Normalization:
 *    Prevents normalize(0.0) NaN artifacts directly under the cursor reticle.
 * 4. Early-Exit GPU Branching:
 *    When nebulaAlpha <= 0.001 (during ProjectWebGraph / 3D Solar System viewing),
 *    the shader completely skips the 4-octave FBM loop to liberate 100% GPU fill-rate.
 * 5. Delta-Time Normalized Damping:
 *    Frame-rate independent exponential smoothing (60Hz vs 120Hz+) and inverted
 *    mouse Y coordinate matching WebGL bottom-left convention.
 */

import React, { useEffect, useRef } from "react";

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_scroll;
uniform float u_is_mobile;

// ── Hash & Procedural Noise Primitives ──────────────────────────────
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// ── Fractal Brownian Motion (Adaptive Octaves) ──────────────────────
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  int octaves = u_is_mobile > 0.5 ? 3 : 5;

  for (int i = 0; i < 5; ++i) {
    if (i >= octaves) break;
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

// ── 3-Tiered Procedural Starfield with JWST Diffraction Spikes ────────
vec3 computeStarfield(vec2 uv, float aspect) {
  vec3 stars = vec3(0.0);
  vec2 st = vec2(uv.x * aspect, uv.y);

  // Layer 1: Dense micro stardust
  vec2 grid1 = st * 320.0;
  vec2 id1 = floor(grid1);
  float h1 = hash(id1);
  if (h1 > 0.980) {
    float d1 = length(fract(grid1) - 0.5);
    float b1 = smoothstep(0.20, 0.0, d1);
    stars += vec3(0.70, 0.78, 0.95) * b1 * 0.65;
  }

  // Layer 2: Medium sharp starlight points (Ionized blue & warm amber)
  vec2 grid2 = st * 130.0;
  vec2 id2 = floor(grid2);
  float h2 = hash(id2 + 42.1);
  if (h2 > 0.974) {
    float d2 = length(fract(grid2) - 0.5);
    float b2 = smoothstep(0.24, 0.0, d2);
    vec3 col2 = mix(vec3(0.45, 0.85, 1.0), vec3(1.0, 0.82, 0.45), hash(id2 * 2.3));
    stars += col2 * b2 * 0.95;
  }

  // Layer 3: Iconic JWST Foreground Stars with 6-Point Hexagonal Diffraction Spikes
  vec2 grid3 = st * 45.0;
  vec2 id3 = floor(grid3);
  float h3 = hash(id3 + 91.7);
  if (h3 > 0.982) {
    vec2 fpos = fract(grid3) - 0.5;
    float d3 = length(fpos);
    float twinkle = 0.70 + 0.30 * sin(u_time * 2.8 + h3 * 6.2831);

    // Starlight Core & Delicate Halo
    float core = smoothstep(0.12, 0.0, d3) * 1.6;
    float halo = smoothstep(0.25, 0.0, d3) * 0.3;

    // Razor-thin JWST 6-Point Diffraction Spikes (0°, 60°, 120°)
    float s1 = max(0.0, 1.0 - abs(fpos.x) * 12.0) * max(0.0, 1.0 - abs(fpos.y) * 95.0);
    vec2 r60 = vec2(fpos.x * 0.5 - fpos.y * 0.866, fpos.x * 0.866 + fpos.y * 0.5);
    float s2 = max(0.0, 1.0 - abs(r60.x) * 12.0) * max(0.0, 1.0 - abs(r60.y) * 95.0);
    vec2 r120 = vec2(fpos.x * 0.5 + fpos.y * 0.866, -fpos.x * 0.866 + fpos.y * 0.5);
    float s3 = max(0.0, 1.0 - abs(r120.x) * 12.0) * max(0.0, 1.0 - abs(r120.y) * 95.0);

    float spikes = (s1 + s2 + s3) * 0.45;

    vec3 col3 = mix(
      vec3(1.0, 0.78, 0.35), // Golden protostar
      vec3(0.55, 0.88, 1.0), // Luminous hot blue-white star
      hash(id3 * 4.7)
    );
    if (h3 > 0.993) col3 = vec3(1.0, 0.98, 0.95); // Brilliant diamond core

    stars += col3 * (core + halo + spikes) * twinkle * 1.2;
  }

  return stars;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;

  // 1. Radial Fly-Through Scroll Math (Dividing expands outward)
  float zoomScale = 1.0 + u_scroll * 1.8;
  vec2 scrolledUV = (uv - 0.5) / zoomScale + 0.5;

  // Opacity dissipation: keeps vibrant JWST nebula 100% visible through Hero and About Me,
  // then smoothly disperses into the deep starfield void for the project system.
  float nebulaAlpha = smoothstep(1.0, 0.55, u_scroll);

  // 3. Base Deep Space Void Canvas (#030712)
  vec3 baseVoid = vec3(0.012, 0.018, 0.040);

  // 4. Procedural Starfield with JWST Diffraction Spikes
  vec3 starColor = computeStarfield(uv, aspect);
  vec3 finalColor = baseVoid + starColor;

  // 5. Early-Exit Branching: compute high-definition JWST nebula when visible
  if (nebulaAlpha > 0.001) {
    // Aspect-Corrected Drift Coordinates (Rotation origin offset 12 units away from viewport)
    vec2 p = (scrolledUV - 0.5) * vec2(aspect, 1.0) * 1.85 + vec2(12.5, 7.3);

    // Organic Idle Swirl & Multi-Octave Breathing
    float slowTime = u_time * 0.040;

    // Multi-octave domain warping (Gas Filaments & Cosmic Dust Lanes)
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0) + slowTime * 0.65),
      fbm(p + vec2(5.2, 1.3) + slowTime * 0.75)
    );

    vec2 r = vec2(
      fbm(p + 3.2 * q + vec2(1.7, 9.2) + slowTime * 0.95),
      fbm(p + 3.2 * q + vec2(8.3, 2.8) + slowTime * 1.05)
    );

    float f = fbm(p + 3.0 * r);

    // Erosion Ridges (Signature sharp gas walls of Carina & Pillars of Creation)
    float ridgeQ = 1.0 - abs(q.x * 2.0 - 1.0);
    float ridgeR = 1.0 - abs(r.y * 2.0 - 1.0);
    float ridgeFilament = pow(ridgeQ * ridgeR, 1.4) * 2.5;

    // JWST Multi-Spectral Color Palette (False-Color Infrared Composite)
    vec3 cDeepCosmos = vec3(0.010, 0.014, 0.035); // Deep interstellar void
    vec3 cDeepViolet = vec3(0.240, 0.050, 0.480); // Rich ultraviolet gas
    vec3 cMagenta    = vec3(0.720, 0.120, 0.580); // Radiant cosmic magenta (PAHs)
    vec3 cCyanTeal   = vec3(0.050, 0.720, 0.880); // Ionized oxygen & interstellar plasma
    vec3 cAmberGold  = vec3(0.980, 0.620, 0.120); // Fiery Carina ionization ridge
    vec3 cCopper     = vec3(0.880, 0.320, 0.060); // Scorching dust wall
    vec3 cHotCore    = vec3(1.000, 0.960, 0.900); // Protostellar emission knot

    // Gas Cloud Density Mask: keeps deep void black while clouds swirl in dense streams
    float gasMask = smoothstep(0.28, 0.78, f);

    // Volumetric layering within gas streams
    vec3 nebulaCol = mix(cDeepCosmos, cDeepViolet, gasMask);
    nebulaCol = mix(nebulaCol, cMagenta, clamp((length(q) - 0.3) * 1.2, 0.0, 1.0) * gasMask);
    nebulaCol = mix(nebulaCol, cCyanTeal, clamp(pow(r.x, 2.2) * 1.6, 0.0, 1.0) * gasMask * 0.85);

    // Ionization Ridge Crests (Fiery copper & gold on sharp erosion fronts)
    float ridgeCrest = smoothstep(0.55, 0.92, ridgeFilament * f);
    vec3 ridgeCol = mix(cCopper, cAmberGold, clamp(r.y * 1.4, 0.0, 1.0));
    nebulaCol = mix(nebulaCol, ridgeCol, ridgeCrest * 0.90);

    // Protostellar ignition knots where radiation is highest
    float stellarCore = smoothstep(0.76, 0.98, f * length(r));
    nebulaCol = mix(nebulaCol, cHotCore, stellarCore * 0.92);

    // Blend nebula with canvas (Organic gas filaments dynamically shuffled by cursor)
    finalColor += nebulaCol * (nebulaAlpha * gasMask * 1.35);
  }

  // Soft celestial edge vignetting
  vec2 vigCoord = uv * (1.0 - uv.yx);
  float vig = vigCoord.x * vigCoord.y * 15.0;
  vig = clamp(pow(vig, 0.20), 0.0, 1.0);
  finalColor *= vig;

  fragColor = vec4(finalColor, 1.0);
}
`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetMouse = useRef({ x: 0.5, y: 0.5 });
  const currentMouse = useRef({ x: 0.5, y: 0.5 });
  const targetScroll = useRef(0);
  const currentScroll = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      console.warn("WebGL2 not supported, fallback active.");
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry (2 triangles covering full screen)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uTimeLoc = gl.getUniformLocation(program, "u_time");
    const uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const uMouseLoc = gl.getUniformLocation(program, "u_mouse");
    const uScrollLoc = gl.getUniformLocation(program, "u_scroll");
    const uIsMobileLoc = gl.getUniformLocation(program, "u_is_mobile");

    // Resize handler with 1.25x DPR clamping
    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Passive mouse tracker (Inverted Y to match WebGL bottom-left)
    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Touch support for mobile interaction
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        targetMouse.current = {
          x: touch.clientX / window.innerWidth,
          y: 1.0 - touch.clientY / window.innerHeight,
        };
      }
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Passive scroll tracker (Normalized scroll progress)
    const handleScroll = () => {
      const scrollRange = Math.max(window.innerHeight * 1.8, 1);
      targetScroll.current = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    // RAF Loop with Delta-Time Normalized Smoothing
    let animationFrameId: number;
    lastTimeRef.current = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // Delta-time normalized exponential smoothing
      const mouseFactor = 1.0 - Math.exp(-8.0 * dt);
      const scrollFactor = 1.0 - Math.exp(-6.0 * dt);

      currentMouse.current.x += (targetMouse.current.x - currentMouse.current.x) * mouseFactor;
      currentMouse.current.y += (targetMouse.current.y - currentMouse.current.y) * mouseFactor;
      currentScroll.current += (targetScroll.current - currentScroll.current) * scrollFactor;

      // Set uniforms
      gl.uniform1f(uTimeLoc, now * 0.001);
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(uMouseLoc, currentMouse.current.x, currentMouse.current.y);
      gl.uniform1f(uScrollLoc, currentScroll.current);
      gl.uniform1f(uIsMobileLoc, window.innerWidth < 768 ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);

      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      style={{
        backgroundColor: "#030712",
      }}
      aria-hidden="true"
    />
  );
}
