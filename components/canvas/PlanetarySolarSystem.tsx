"use client";

/**
 * components/canvas/PlanetarySolarSystem.tsx
 *
 * True 3D Hierarchical Solar System Engine.
 * 100% Wireframe-Free with Custom Procedural GLSL Shaders:
 * - Central Sun: Convective Solar Plasma Core + Soft Volumetric Additive Corona
 * - 5 Topic Planets: Procedural Gas Giants, Volcanic Tectonics, Golden Rings, Oceanic Worlds, and Crystalline Ice Sheets
 * - Soft Additive Fresnel Atmospheres & Translucent Planetary Rings
 * - Lunar Moon Regolith with High-Frequency Craters
 * - Faint Celestial Pathways (Gravity Orbits)
 */

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { ALL_PROJECTS } from "@/lib/projects";
import { playHoverSound, playSelectSound, playTransitionSound } from "@/lib/audio";
import { usePortfolioStore, usePortfolioStoreApi } from "@/lib/store";

// ---------------------------------------------------------------------------
// 1. Data Definitions
// ---------------------------------------------------------------------------

export interface TopicSystemConfig {
  id: string;
  name: string;
  colorHex: string;
  orbitRadius: number;
  orbitSpeed: number;
  phase: number;
  planetType: number; // 0: Jovian, 1: Volcanic, 2: Golden Ringed, 3: Oceanic, 4: Crystalline Ice
  hasRing?: boolean;
}

export const TOPIC_SYSTEMS: TopicSystemConfig[] = [
  { id: "ai-agentic",            name: "AI & ML",        colorHex: "#8b5cf6", orbitRadius: 7.6, orbitSpeed: 0.09, phase: 0,                   planetType: 0 },
  { id: "systems-optimization",  name: "Systems",        colorHex: "#f43f5e", orbitRadius: 9.2, orbitSpeed: 0.09, phase: (2 * Math.PI) / 5, planetType: 1 },
  { id: "fullstack-web",         name: "Web Platforms",  colorHex: "#fbbf24", orbitRadius: 8.0, orbitSpeed: 0.09, phase: (4 * Math.PI) / 5, planetType: 2, hasRing: true },
  { id: "cybersecurity-privacy", name: "Zero-Trust",     colorHex: "#10b981", orbitRadius: 9.6, orbitSpeed: 0.09, phase: (6 * Math.PI) / 5, planetType: 3 },
  { id: "computer-vision",       name: "Applied Vision", colorHex: "#6366f1", orbitRadius: 8.6, orbitSpeed: 0.09, phase: (8 * Math.PI) / 5, planetType: 4, hasRing: true },
];

export interface ProjectMoonConfig {
  id: string;
  name: string;
  parentHubId: string;
  orbitRadius: number;
  orbitSpeed: number;
  inclination: number;
  phase: number;
  iconBadge: string;
  miniTags: string[];
}

export const PROJECT_MOONS: ProjectMoonConfig[] = [
  // AI & ML (Parent: ai-agentic, Color: Nebula Violet)
  { id: "teachercopilot",    name: "TeacherCopilot",        parentHubId: "ai-agentic",            orbitRadius: 1.4, orbitSpeed: 0.65, inclination: 0.15, phase: 0.2, iconBadge: "AI", miniTags: ["Next.js", "GPT"] },
  { id: "parleylab",         name: "ParleyLab",             parentHubId: "ai-agentic",            orbitRadius: 1.9, orbitSpeed: 0.50, inclination: -0.15, phase: 2.3, iconBadge: "RL", miniTags: ["PPO", "FastAPI"] },
  { id: "local-llm",         name: "Colibri MoE",           parentHubId: "ai-agentic",            orbitRadius: 2.4, orbitSpeed: 0.38, inclination: 0.20, phase: 4.4, iconBadge: "C++", miniTags: ["Qwen27B", "NVMe"] },

  // Systems (Parent: systems-optimization, Color: Cosmic Crimson)
  { id: "shadowos",          name: "ShadowOS",              parentHubId: "systems-optimization",  orbitRadius: 1.5, orbitSpeed: 0.60, inclination: 0.22, phase: 0.5, iconBadge: "RS", miniTags: ["MicroVM", "MCP"] },
  { id: "projectparrot",     name: "Project Parrot",        parentHubId: "systems-optimization",  orbitRadius: 2.1, orbitSpeed: 0.42, inclination: -0.20, phase: 3.5, iconBadge: "C", miniTags: ["ESP32", "SLM"] },

  // Web Platforms (Parent: fullstack-web, Color: Starlight Gold)
  { id: "mpmc-project",      name: "Edge-AI Smart Parking", parentHubId: "fullstack-web",         orbitRadius: 1.5, orbitSpeed: 0.58, inclination: 0.14, phase: 1.5, iconBadge: "PY", miniTags: ["YOLOv8", "Li-Fi"] },
  { id: "aela-security",     name: "AELA Cloud Security",   parentHubId: "fullstack-web",         orbitRadius: 2.1, orbitSpeed: 0.44, inclination: -0.18, phase: 4.0, iconBadge: "AWS", miniTags: ["IAM JIT", "LSTM"] },

  // Security (Parent: cybersecurity-privacy, Color: Celestial Emerald)
  { id: "civicguard",        name: "CivicGuard",            parentHubId: "cybersecurity-privacy", orbitRadius: 1.4, orbitSpeed: 0.65, inclination: -0.15, phase: 0.8, iconBadge: "ZK", miniTags: ["WebAuthn", "WASM"] },
  { id: "zerotrust-finance", name: "ZeroTrust Finance",     parentHubId: "cybersecurity-privacy", orbitRadius: 1.9, orbitSpeed: 0.48, inclination: 0.20, phase: 2.9, iconBadge: "FL", miniTags: ["Flutter", "Prisma"] },
  { id: "privguardweb",      name: "PrivGuard Web",         parentHubId: "cybersecurity-privacy", orbitRadius: 2.4, orbitSpeed: 0.36, inclination: -0.12, phase: 4.8, iconBadge: "JS", miniTags: ["CORS", "Audit"] },

  // Applied Vision (Parent: computer-vision, Color: Pulsar Indigo)
  { id: "dryaf",             name: "DryAF Oasis",           parentHubId: "computer-vision",       orbitRadius: 1.5, orbitSpeed: 0.58, inclination: 0.18, phase: 0.9, iconBadge: "CV", miniTags: ["Canvas CV", "Live"] },
  { id: "mrz-read",          name: "MRZ Read",              parentHubId: "computer-vision",       orbitRadius: 2.1, orbitSpeed: 0.44, inclination: -0.16, phase: 3.7, iconBadge: "OCR", miniTags: ["OpenCV", "OMR"] },
];

// Helper to generate circular line points in 3D
function createCirclePoints(radius: number, segments = 96): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
  }
  return pts;
}

// Helper to generate tilted elliptical moon orbit points
function createTiltedMoonOrbitPoints(radius: number, inclination: number, segments = 64): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta) * Math.sin(inclination);
    const z = radius * Math.sin(theta) * Math.cos(inclination);
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

// ---------------------------------------------------------------------------
// 2. GLSL Shaders & Procedural Materials
// ---------------------------------------------------------------------------

// Common Simplex 3D Noise GLSL Chunk
const NOISE_GLSL = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
`;

// A. Central Sun: Solar Plasma Core Shader
const SOLAR_CORE_VERTEX = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const SOLAR_CORE_FRAGMENT = `
uniform float u_time;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDir;
${NOISE_GLSL}

void main() {
  vec3 p = normalize(vPosition);
  
  // Convective multi-octave solar plasma granulation
  float n1 = snoise(p * 3.8 + vec3(0.0, u_time * 0.12, u_time * 0.06));
  float n2 = snoise(p * 8.0 - vec3(u_time * 0.18, 0.0, u_time * 0.10));
  float n3 = snoise(p * 16.0 + vec3(u_time * 0.28));

  float plasma = n1 * 0.52 + n2 * 0.33 + n3 * 0.15;
  plasma = plasma * 0.5 + 0.5;

  // Limb darkening (edges are deep solar amber, center is blinding incandescent white)
  float NdotV = max(dot(vNormal, vViewDir), 0.0);
  float limb = pow(NdotV, 0.65);

  vec3 deepAmber = vec3(0.85, 0.24, 0.02);
  vec3 starlightGold = vec3(0.99, 0.78, 0.18);
  vec3 coreWhite = vec3(1.0, 0.98, 0.92);

  vec3 col = mix(deepAmber, starlightGold, smoothstep(0.25, 0.62, plasma));
  col = mix(col, coreWhite, smoothstep(0.62, 0.90, plasma));

  // Front-facing radiant starlight bloom
  col += coreWhite * pow(limb, 3.5) * 0.45;

  gl_FragColor = vec4(col * (0.85 + 0.35 * limb), 1.0);
}
`;

// B. Central Sun: Volumetric Soft Additive Corona Shader
const SOLAR_CORONA_VERTEX = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const SOLAR_CORONA_FRAGMENT = `
uniform float u_time;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDir;
${NOISE_GLSL}

void main() {
  // Pure limb-darkened transparent center with radiant edge
  float NdotV = abs(dot(vNormal, vViewDir));
  float rim = pow(1.0 - NdotV, 3.2);

  // Dynamic solar flare pulsations
  vec3 p = normalize(vPosition);
  float flares = snoise(p * 5.0 + vec3(0.0, u_time * 0.28, 0.0)) * 0.3 + 0.7;

  // Starlight gold near core transitioning to soft cosmic violet at outermost edge
  vec3 innerGold = vec3(0.99, 0.78, 0.22);
  vec3 outerViolet = vec3(0.65, 0.38, 0.98);

  vec3 coronaCol = mix(outerViolet, innerGold, pow(rim, 0.6));
  float alpha = rim * flares * 0.72;

  gl_FragColor = vec4(coronaCol * 1.8, alpha);
}
`;

// C. Topic Planet Procedural Shaders
const PLANET_VERTEX = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDir;
varying vec3 vWorldNormal;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const PLANET_FRAGMENT = `
uniform float u_time;
uniform vec3 u_color;
uniform float u_type; // 0: Jovian, 1: Volcanic, 2: Golden, 3: Oceanic, 4: Ice
uniform float u_hover;
uniform vec3 u_planetWorldPos;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDir;
varying vec3 vWorldNormal;
${NOISE_GLSL}

void main() {
  vec3 p = normalize(vPosition);

  // Direction to central starlight at world [0, 0, 0]
  vec3 lightDir = normalize(-u_planetWorldPos);
  float NdotL = max(dot(vWorldNormal, lightDir), 0.0);
  // Soft ambient cosmic starlight fill so night side remains visible
  float diffuse = NdotL * 0.75 + 0.28;

  vec3 surfaceColor = u_color;

  // Type 0: AI & ML (Jovian Gas Giant with turbulent latitudinal cloud belts)
  if (u_type < 0.5) {
    float bands = sin(p.y * 24.0 + snoise(p * 4.2 + vec3(u_time * 0.06, 0.0, 0.0)) * 3.2);
    float storms = snoise(p * 9.0 + vec3(0.0, u_time * 0.04, 0.0));
    
    vec3 deepViolet = vec3(0.18, 0.05, 0.38);
    vec3 midViolet = u_color;
    vec3 mistIvory = vec3(0.92, 0.85, 1.0);

    surfaceColor = mix(deepViolet, midViolet, smoothstep(-0.6, 0.4, bands));
    surfaceColor = mix(surfaceColor, mistIvory, smoothstep(0.4, 0.85, storms * bands));
  }
  // Type 1: Systems (Volcanic / Tectonic Planet with glowing molten magma rifts)
  else if (u_type < 1.5) {
    float rifts = abs(snoise(p * 6.5));
    float pulse = sin(u_time * 2.2 + p.x * 8.0) * 0.2 + 0.8;
    
    vec3 darkBasalt = vec3(0.09, 0.09, 0.11);
    vec3 magmaCrimson = u_color * 1.3;
    vec3 whiteHotCore = vec3(1.0, 0.95, 0.7);

    // Dark tectonic continental crust
    surfaceColor = darkBasalt;
    // Glowing lava fractures
    if (rifts < 0.22) {
      float lavaIntensity = smoothstep(0.22, 0.02, rifts) * pulse;
      vec3 lavaColor = mix(magmaCrimson, whiteHotCore, lavaIntensity * 0.6);
      surfaceColor = mix(surfaceColor, lavaColor, lavaIntensity);
      // Magma emits light regardless of sun shadow
      diffuse = max(diffuse, lavaIntensity * 1.5);
    }
  }
  // Type 2: Web Platforms (Saturnian Gas Giant with silky golden laminar bands)
  else if (u_type < 2.5) {
    float latBands = sin(p.y * 28.0 + snoise(p * 3.0 + vec3(0.0, u_time * 0.03, 0.0)) * 1.8);
    vec3 deepAmber = vec3(0.55, 0.24, 0.05);
    vec3 gold = u_color;
    vec3 paleCream = vec3(1.0, 0.96, 0.82);

    surfaceColor = mix(deepAmber, gold, smoothstep(-0.8, 0.3, latBands));
    surfaceColor = mix(surfaceColor, paleCream, smoothstep(0.3, 0.9, latBands));
  }
  // Type 3: Zero-Trust Security (Oceanic Cyber World with deep sapphire seas & emerald continents)
  else if (u_type < 3.5) {
    float landNoise = snoise(p * 3.2);
    float clouds = snoise(p * 6.0 + vec3(u_time * 0.08, 0.0, 0.0));
    
    vec3 oceanBlue = vec3(0.02, 0.22, 0.32);
    vec3 landEmerald = u_color;
    vec3 cloudWhite = vec3(0.95, 0.98, 1.0);

    if (landNoise > 0.05) {
      surfaceColor = mix(landEmerald * 0.7, landEmerald * 1.2, smoothstep(0.05, 0.5, landNoise));
    } else {
      surfaceColor = oceanBlue;
    }

    // Swirling translucent atmospheric clouds
    if (clouds > 0.25) {
      surfaceColor = mix(surfaceColor, cloudWhite, smoothstep(0.25, 0.65, clouds) * 0.65);
    }
  }
  // Type 4: Applied Vision (Crystalline Ice World with polar ice caps & azure rift valleys)
  else {
    float iceNoise = snoise(p * 4.8);
    vec3 deepAzure = vec3(0.12, 0.15, 0.45);
    vec3 iceIndigo = u_color;
    vec3 polarFrost = vec3(0.9, 0.95, 1.0);

    surfaceColor = mix(deepAzure, iceIndigo, smoothstep(-0.4, 0.5, iceNoise));
    // Polar ice caps
    if (abs(p.y) > 0.48) {
      surfaceColor = mix(surfaceColor, polarFrost, smoothstep(0.48, 0.78, abs(p.y)));
    }
  }

  // Specular starlight glint
  vec3 halfVec = normalize(lightDir + vViewDir);
  float spec = pow(max(dot(vWorldNormal, halfVec), 0.0), 18.0) * 0.35;

  // Integrated surface Fresnel limb glow
  float NdotV = abs(dot(vNormal, vViewDir));
  float surfaceRim = pow(1.0 - NdotV, 3.2) * 0.45;

  vec3 finalColor = surfaceColor * diffuse + vec3(spec) + u_color * surfaceRim;

  // Hover illumination boost
  finalColor *= (1.0 + u_hover * 0.45);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// D. Soft Additive Fresnel Atmosphere Shader
const ATMOSPHERE_VERTEX = `
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const ATMOSPHERE_FRAGMENT = `
uniform vec3 u_color;
uniform float u_hover;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float NdotV = abs(dot(vNormal, vViewDir));
  // Additive limb rim halo: 0 in center, bright on rim
  float rim = pow(1.0 - NdotV, 3.6);

  vec3 glowColor = u_color * (1.3 + u_hover * 0.7);
  float alpha = rim * (0.65 + u_hover * 0.35);

  gl_FragColor = vec4(glowColor, alpha);
}
`;

// E. Translucent Planetary Rings Shader
const RING_VERTEX = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const RING_FRAGMENT = `
uniform vec3 u_color;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  // Center radial distance in UV space
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;

  // Multi-band concentric structure
  float bands = sin(r * 50.0) * 0.5 + 0.5;
  // Cassini division gap
  float cassini = smoothstep(0.015, 0.05, abs(r - 0.68));
  // Smooth inner and outer rim boundary falloffs
  float edge = smoothstep(0.38, 0.48, r) * smoothstep(1.0, 0.88, r);

  float alpha = bands * cassini * edge * 0.72;
  vec3 ringCol = mix(u_color, vec3(1.0, 0.95, 0.88), bands * 0.45);

  gl_FragColor = vec4(ringCol * 1.3, alpha);
}
`;

// F. Moon Surface Crater Shader
const MOON_VERTEX = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const MOON_FRAGMENT = `
uniform vec3 u_parentColor;
uniform float u_hover;
uniform vec3 u_moonWorldPos;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
${NOISE_GLSL}

void main() {
  vec3 p = normalize(vPosition);
  
  // High-frequency crater regolith depressions
  float craters = abs(snoise(p * 11.0)) * 0.6 + snoise(p * 22.0) * 0.25;
  
  // Regolith basalt base tinted with subtle parent starlight hue
  vec3 basalt = vec3(0.32, 0.34, 0.38);
  vec3 regolith = mix(basalt, u_parentColor * 0.7, 0.25);
  regolith -= craters * 0.18;

  // Starlight illumination from galactic origin [0,0,0]
  vec3 lightDir = normalize(-u_moonWorldPos);
  float NdotL = max(dot(vWorldNormal, lightDir), 0.0);
  float diffuse = NdotL * 0.82 + 0.25;

  vec3 col = regolith * diffuse;
  
  // Soft rim highlight
  float NdotV = max(dot(vNormal, vViewDir), 0.0);
  float rim = pow(1.0 - NdotV, 2.5) * 0.35;
  col += u_parentColor * rim;

  // Hover brightening
  col *= (1.0 + u_hover * 0.6);

  gl_FragColor = vec4(col, 1.0);
}
`;

// ---------------------------------------------------------------------------
// 3. React Three Fiber Custom Component Implementations
// ---------------------------------------------------------------------------

// A. Central Sun Component
function CentralGalacticSun() {
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const coronaMeshRef = useRef<THREE.Mesh>(null);

  const coreUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
    }),
    []
  );

  const coronaUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    coreUniforms.u_time.value = t;
    coronaUniforms.u_time.value = t;

    if (sunMeshRef.current) {
      sunMeshRef.current.rotation.y = t * 0.08;
    }
    if (coronaMeshRef.current) {
      coronaMeshRef.current.rotation.z = -t * 0.05;
      coronaMeshRef.current.rotation.y = t * 0.03;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Luminous Convective Solar Core */}
      <mesh ref={sunMeshRef}>
        <sphereGeometry args={[1.28, 36, 36]} />
        <shaderMaterial
          vertexShader={SOLAR_CORE_VERTEX}
          fragmentShader={SOLAR_CORE_FRAGMENT}
          uniforms={coreUniforms}
        />
      </mesh>

      {/* 2. Soft Volumetric Additive Corona (100% Wireframe Free) */}
      <mesh ref={coronaMeshRef}>
        <sphereGeometry args={[1.72, 32, 32]} />
        <shaderMaterial
          vertexShader={SOLAR_CORONA_VERTEX}
          fragmentShader={SOLAR_CORONA_FRAGMENT}
          uniforms={coronaUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. HTML Title Badge: Developer Portfolio Galactic Core */}
      <Html position={[0, 2.15, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div className="flex flex-col items-center pointer-events-none select-none">
          <span className="font-mono text-[11px] font-extrabold text-white tracking-widest px-3 py-1 rounded-full bg-void-black/90 border border-starlight-gold/60 shadow-[0_0_20px_rgba(251,191,36,0.35)] whitespace-nowrap">
            DEVELOPER PORTFOLIO
          </span>
          <span className="font-mono text-[8px] text-starlight-gold tracking-widest uppercase mt-0.5">
            GALACTIC CORE // SUPERNOVA
          </span>
        </div>
      </Html>
    </group>
  );
}

// B. Topic Planet Component (Mesh + Atmosphere + Rings)
interface TopicPlanetProps {
  hub: TopicSystemConfig;
  isHovered: boolean;
  onHover: () => void;
  onHoverOut: () => void;
  topicRef: (el: THREE.Group | null) => void;
  children?: React.ReactNode;
}

function TopicPlanet({
  hub,
  isHovered,
  onHover,
  onHoverOut,
  topicRef,
  children,
}: TopicPlanetProps) {
  const planetMeshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  const planetUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_color: { value: new THREE.Color(hub.colorHex) },
      u_type: { value: hub.planetType },
      u_hover: { value: 0 },
      u_planetWorldPos: { value: new THREE.Vector3() },
    }),
    [hub.colorHex, hub.planetType]
  );

  const atmosphereUniforms = useMemo(
    () => ({
      u_color: { value: new THREE.Color(hub.colorHex) },
      u_hover: { value: 0 },
    }),
    [hub.colorHex]
  );

  const ringUniforms = useMemo(
    () => ({
      u_color: { value: new THREE.Color(hub.colorHex) },
    }),
    [hub.colorHex]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    planetUniforms.u_time.value = t;

    // Smooth hover transition
    const targetHover = isHovered ? 1.0 : 0.0;
    planetUniforms.u_hover.value += (targetHover - planetUniforms.u_hover.value) * 0.12;
    atmosphereUniforms.u_hover.value += (targetHover - atmosphereUniforms.u_hover.value) * 0.12;

    if (groupRef.current) {
      groupRef.current.getWorldPosition(planetUniforms.u_planetWorldPos.value);
    }

    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y = t * 0.15;
    }
  });

  return (
    <group
      ref={(el) => {
        groupRef.current = el;
        topicRef(el);
      }}
    >
      {/* 1. Procedural Planet Solid Sphere (Smooth 32-seg sphere, no wireframe) */}
      <mesh
        ref={planetMeshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          playHoverSound();
          onHover();
        }}
        onPointerOut={onHoverOut}
      >
        <sphereGeometry args={[0.62, 32, 32]} />
        <shaderMaterial
          vertexShader={PLANET_VERTEX}
          fragmentShader={PLANET_FRAGMENT}
          uniforms={planetUniforms}
        />
      </mesh>

      {/* 2. Soft Additive Fresnel Atmospheric Halo (Smooth glowing rim, no wireframe) */}
      <mesh>
        <sphereGeometry args={[0.76, 32, 32]} />
        <shaderMaterial
          vertexShader={ATMOSPHERE_VERTEX}
          fragmentShader={ATMOSPHERE_FRAGMENT}
          uniforms={atmosphereUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Translucent Saturnian Planetary Rings for Web Platforms & Applied Vision */}
      {hub.hasRing && (
        <mesh rotation={[Math.PI * 0.38, 0, Math.PI * 0.12]}>
          <ringGeometry args={[0.82, 1.48, 64]} />
          <shaderMaterial
            vertexShader={RING_VERTEX}
            fragmentShader={RING_FRAGMENT}
            uniforms={ringUniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 4. Topic Star HTML Title Badge */}
      <Html position={[0, 1.08, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div
          className="font-mono text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border bg-void-black/90 backdrop-blur-md shadow-lg whitespace-nowrap pointer-events-none select-none transition-all"
          style={{
            color: hub.colorHex,
            borderColor: `${hub.colorHex}99`,
            boxShadow: `0 0 15px ${hub.colorHex}55`,
          }}
        >
          {hub.name}
        </div>
      </Html>

      {/* Moons & Orbit Tracks Container */}
      {children}
    </group>
  );
}

// C. Project Moon Component
interface MoonOrbProps {
  moon: ProjectMoonConfig;
  parentHub: TopicSystemConfig;
  isHovered: boolean;
  onHover: () => void;
  onHoverOut: () => void;
  onSelect: () => void;
  moonRef: (el: THREE.Group | null) => void;
}

function MoonOrb({
  moon,
  parentHub,
  isHovered,
  onHover,
  onHoverOut,
  onSelect,
  moonRef,
}: MoonOrbProps) {
  const groupRef = useRef<THREE.Group | null>(null);

  const moonUniforms = useMemo(
    () => ({
      u_parentColor: { value: new THREE.Color(parentHub.colorHex) },
      u_hover: { value: 0 },
      u_moonWorldPos: { value: new THREE.Vector3() },
    }),
    [parentHub.colorHex]
  );

  useFrame(() => {
    const target = isHovered ? 1.0 : 0.0;
    moonUniforms.u_hover.value += (target - moonUniforms.u_hover.value) * 0.15;
    if (groupRef.current) {
      groupRef.current.getWorldPosition(moonUniforms.u_moonWorldPos.value);
    }
  });

  return (
    <group
      ref={(el) => {
        groupRef.current = el;
        moonRef(el);
      }}
    >
      {/* Smooth Cratered Lunar Regolith Sphere */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          playHoverSound();
          onHover();
        }}
        onPointerOut={onHoverOut}
        onClick={(e) => {
          e.stopPropagation();
          playSelectSound();
          playTransitionSound();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.26, 24, 24]} />
        <shaderMaterial
          vertexShader={MOON_VERTEX}
          fragmentShader={MOON_FRAGMENT}
          uniforms={moonUniforms}
        />
      </mesh>

      {/* 3D Billboarded Project Capsule HTML Card */}
      <Html position={[0, 0.48, 0]} center distanceFactor={13} zIndexRange={[120, 0]}>
        <div
          data-project-moon={moon.id}
          onMouseEnter={() => {
            playHoverSound();
            onHover();
          }}
          onMouseLeave={onHoverOut}
          onClick={(e) => {
            e.stopPropagation();
            playSelectSound();
            playTransitionSound();
            onSelect();
          }}
          className="cursor-pointer transition-all duration-300 transform hover:scale-110 inline-flex min-w-[110px] min-h-[32px] items-center gap-2 px-3 py-1.5 rounded-full border bg-void-black/90 backdrop-blur-xl shadow-xl select-none"
          style={{
            borderColor: isHovered ? parentHub.colorHex : `${parentHub.colorHex}77`,
            boxShadow: isHovered
              ? `0 0 25px ${parentHub.colorHex}cc, inset 0 0 12px ${parentHub.colorHex}44`
              : `0 0 10px ${parentHub.colorHex}44`,
          }}
        >
          {/* Tech Badge */}
          <span
            className="flex items-center justify-center w-4 h-4 rounded-full font-mono text-[8px] font-bold text-white shadow-sm"
            style={{
              backgroundColor: `${parentHub.colorHex}44`,
              border: `1px solid ${parentHub.colorHex}`,
            }}
          >
            {moon.iconBadge}
          </span>

          {/* Project Title */}
          <span className="font-mono text-[10px] font-bold text-white whitespace-nowrap tracking-wide">
            {moon.name}
          </span>

          {/* Mini Tag */}
          {moon.miniTags[0] && (
            <span
              className="font-mono text-[8px] px-1.5 py-0.5 rounded text-white/90 font-medium"
              style={{
                backgroundColor: `${parentHub.colorHex}25`,
              }}
            >
              {moon.miniTags[0]}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 4. SolarScene Orchestrator
// ---------------------------------------------------------------------------

interface SolarSceneProps {
  speedMultiplier: number;
  hoveredHubId: string | null;
  setHoveredHubId: (id: string | null) => void;
  hoveredProjectId: string | null;
  setHoveredProjectId: (id: string | null) => void;
  onSelectProject: (id: string) => void;
}

function SolarScene({
  speedMultiplier,
  hoveredHubId,
  setHoveredHubId,
  hoveredProjectId,
  setHoveredProjectId,
  onSelectProject,
}: SolarSceneProps) {
  const topicRefs = useRef<Record<string, THREE.Group | null>>({});
  const moonRefs = useRef<Record<string, THREE.Group | null>>({});

  // Pre-generate faint celestial orbit line geometries
  const topicOrbitGeometries = useMemo(() => {
    return TOPIC_SYSTEMS.map((hub) => {
      const geom = new THREE.BufferGeometry().setFromPoints(createCirclePoints(hub.orbitRadius, 96));
      return { id: hub.id, geom, color: hub.colorHex };
    });
  }, []);

  const moonOrbitGeometries = useMemo(() => {
    return PROJECT_MOONS.map((moon) => {
      const geom = new THREE.BufferGeometry().setFromPoints(
        createTiltedMoonOrbitPoints(moon.orbitRadius, moon.inclination, 64)
      );
      return { id: moon.id, parentHubId: moon.parentHubId, geom };
    });
  }, []);

  // Animate the celestial bodies each frame
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speedMultiplier;

    // 1. Orbit Topic Stars around Central Sun
    TOPIC_SYSTEMS.forEach((hub) => {
      const grp = topicRefs.current[hub.id];
      if (grp) {
        const theta = t * hub.orbitSpeed + hub.phase;
        grp.position.x = hub.orbitRadius * Math.cos(theta);
        grp.position.z = hub.orbitRadius * Math.sin(theta);
        grp.position.y = 0;
      }
    });

    // 2. Orbit Project Moons around their parent Topic Star
    PROJECT_MOONS.forEach((moon) => {
      const moonGrp = moonRefs.current[moon.id];
      if (moonGrp) {
        const theta = t * moon.orbitSpeed + moon.phase;
        const lx = moon.orbitRadius * Math.cos(theta);
        const ly = moon.orbitRadius * Math.sin(theta) * Math.sin(moon.inclination);
        const lz = moon.orbitRadius * Math.sin(theta) * Math.cos(moon.inclination);
        moonGrp.position.set(lx, ly, lz);
      }
    });
  });

  return (
    <>
      {/* Ambient & Directional Space Lighting */}
      <ambientLight intensity={0.85} />
      <pointLight position={[0, 0, 0]} intensity={4.5} color="#fbbf24" distance={40} decay={1.2} />
      <directionalLight position={[12, 16, 12]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-12, -12, -12]} intensity={0.5} color="#8b5cf6" />

      {/* ── LEVEL 1: CENTRAL SUPERNOVA CORE & SOFT CORONA ── */}
      <CentralGalacticSun />

      {/* Primary Celestial Orbit Pathways of the 5 Topic Planets */}
      {topicOrbitGeometries.map(({ id, geom, color }) => {
        const isHubActive = hoveredHubId === id;
        return (
          <primitive
            key={`orbit-track-${id}`}
            object={
              new THREE.Line(
                geom,
                new THREE.LineBasicMaterial({
                  color: new THREE.Color(color),
                  transparent: true,
                  opacity: isHubActive ? 0.65 : 0.14,
                  depthWrite: false,
                })
              )
            }
          />
        );
      })}

      {/* ── LEVEL 2 & 3: TOPIC PLANETS AND ORBITING PROJECT MOONS ── */}
      {TOPIC_SYSTEMS.map((hub) => {
        const isHovered = hoveredHubId === hub.id;

        return (
          <TopicPlanet
            key={hub.id}
            hub={hub}
            isHovered={isHovered}
            onHover={() => setHoveredHubId(hub.id)}
            onHoverOut={() => setHoveredHubId(null)}
            topicRef={(el) => {
              topicRefs.current[hub.id] = el;
            }}
          >
            {/* ── LEVEL 3: DELICATE ORBIT TRACKS FOR THIS PLANET'S MOONS ── */}
            {moonOrbitGeometries
              .filter((m) => m.parentHubId === hub.id)
              .map(({ id, geom }) => (
                <primitive
                  key={`moon-orbit-track-${id}`}
                  object={
                    new THREE.Line(
                      geom,
                      new THREE.LineBasicMaterial({
                        color: new THREE.Color(hub.colorHex),
                        transparent: true,
                        opacity: isHovered ? 0.55 : 0.18,
                        depthWrite: false,
                      })
                    )
                  }
                />
              ))}

            {/* ── LEVEL 3: THE ORBITING PROJECT MOONS ── */}
            {PROJECT_MOONS.filter((moon) => moon.parentHubId === hub.id).map((moon) => {
              const isMoonHovered = hoveredProjectId === moon.id;

              return (
                <MoonOrb
                  key={moon.id}
                  moon={moon}
                  parentHub={hub}
                  isHovered={isMoonHovered}
                  onHover={() => setHoveredProjectId(moon.id)}
                  onHoverOut={() => setHoveredProjectId(null)}
                  onSelect={() => onSelectProject(moon.id)}
                  moonRef={(el) => {
                    moonRefs.current[moon.id] = el;
                  }}
                />
              );
            })}
          </TopicPlanet>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 5. 360° Orbital Tour Camera Orchestrator
// ---------------------------------------------------------------------------

function TourCameraOrchestrator({
  isTourActive,
}: {
  isTourActive: boolean;
}) {
  const storeApi = usePortfolioStoreApi();
  const thetaRef = useRef(0);
  const lastProjectAnnounced = useRef<string | null>(null);

  useFrame((state, delta) => {
    if (isTourActive) {
      // 30 seconds per full 360° orbital revolution
      thetaRef.current += (delta * (Math.PI * 2)) / 30;
      if (thetaRef.current >= Math.PI * 2) {
        thetaRef.current -= Math.PI * 2;
      }

      const R = 21;
      const targetX = R * Math.sin(thetaRef.current);
      const targetY = 5.0 + 1.4 * Math.cos(thetaRef.current * 2);
      const targetZ = R * Math.cos(thetaRef.current);

      state.camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), Math.min(1.0, 4.5 * delta));
      state.camera.lookAt(0, 0, 0);

      // Announce premier projects sequentially across the four orbital quadrants
      const quad = Math.floor(((thetaRef.current % (Math.PI * 2)) / (Math.PI * 2)) * 4);
      const premierProjects = ["shadowos", "local-llm", "projectparrot", "zerotrust"];
      const activeProjId = premierProjects[quad];

      if (activeProjId && activeProjId !== lastProjectAnnounced.current) {
        lastProjectAnnounced.current = activeProjId;
        const proj = ALL_PROJECTS.find((p) => p.id === activeProjId);
        if (proj) {
          storeApi.getState().setActiveTourProject(proj);
          storeApi.getState().setSelectedProjectId(proj.id);
        }
      }
    } else {
      thetaRef.current = 0;
      lastProjectAnnounced.current = null;
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// 6. Exported PlanetarySolarSystem Component
// ---------------------------------------------------------------------------

export interface PlanetarySolarSystemProps {
  onSelectProject: (id: string) => void;
  speedMultiplier?: number;
}

export function PlanetarySolarSystem({
  onSelectProject,
  speedMultiplier = 1,
}: PlanetarySolarSystemProps) {
  const [hoveredHubId, setHoveredHubId] = React.useState<string | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = React.useState<string | null>(null);

  const isSolarTourActive = usePortfolioStore((s) => s.isSolarTourActive);
  const stopSolarTour = usePortfolioStore((s) => s.stopSolarTour);
  const activeTourProject = usePortfolioStore((s) => s.activeTourProject);
  const isMinigameOpen = usePortfolioStore((s) => s.isMinigameOpen);

  const tourStartTimeRef = useRef(0);
  const controlsRef = useRef<any>(null);

  React.useEffect(() => {
    if (isSolarTourActive) {
      tourStartTimeRef.current = performance.now();
    }
  }, [isSolarTourActive]);

  // Safeguard 3: Trackpad wheel grace period on tour start (~800ms)
  const handleWheel = () => {
    if (isSolarTourActive && performance.now() - tourStartTimeRef.current > 800) {
      stopSolarTour();
    }
  };

  const handlePointerDown = () => {
    if (isSolarTourActive) {
      stopSolarTour();
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSolarTourActive && e.key === "Escape") {
        stopSolarTour();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSolarTourActive, stopSolarTour]);

  return (
    <div
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
    >
      {/* 360 Tour Active HUD Indicator */}
      {isSolarTourActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-2xl border border-starlight-gold/60 bg-void-card/90 shadow-[0_0_25px_rgba(251,191,36,0.4)] backdrop-blur-xl animate-fade-in pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-starlight-gold animate-ping" />
          <span className="font-mono text-xs font-black uppercase tracking-widest text-starlight-gold">
            360° CELESTIAL ORBIT IN PROGRESS
            {activeTourProject ? ` // PASSING: ${activeTourProject.name}` : ""}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              stopSolarTour();
            }}
            className="font-mono text-xs px-2.5 py-1 rounded-lg border border-white/20 bg-white/10 text-slate-300 hover:text-white hover:border-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            [ EXIT TOUR ✕ ]
          </button>
        </div>
      )}

      <Canvas
        frameloop={isMinigameOpen ? "never" : "always"}
        camera={{ position: [0, 4.8, 20], fov: 46 }}
        gl={{ antialias: true, alpha: true }}
      >
        <OrbitControls
          ref={controlsRef}
          enabled={!isSolarTourActive}
          enablePan={false}
          enableRotate={true}
          enableZoom={true}
          minDistance={6}
          maxDistance={38}
          minPolarAngle={0.05}
          maxPolarAngle={Math.PI * 0.95}
          dampingFactor={0.06}
        />
        <TourCameraOrchestrator isTourActive={isSolarTourActive} />
        <SolarScene
          speedMultiplier={speedMultiplier}
          hoveredHubId={hoveredHubId}
          setHoveredHubId={setHoveredHubId}
          hoveredProjectId={hoveredProjectId}
          setHoveredProjectId={setHoveredProjectId}
          onSelectProject={onSelectProject}
        />
      </Canvas>
    </div>
  );
}
