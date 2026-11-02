# Deployment & Production Blueprint: Vercel, SEO, OpenGraph & API Security

## Objective
Prepare the celestial 3D portfolio for high-performance, secure production deployment on Vercel via GitHub CI/CD (`TEA-21/Portfolio`), with comprehensive SEO metadata, static OpenGraph banner, sitemap/robots routes, and `/api/chat` abuse protection.

---

## 1. Metadata & OpenGraph Architecture
- **Base URL**: Configured via `process.env.NEXT_PUBLIC_SITE_URL ?? "https://taanush-portfolio.vercel.app"`.
- **OpenGraph Graphic (`public/og-image.png`)**:
  - Crisp $1200 \times 630$ pixel cyberpunk banner.
  - Features celestial styling: deep void background, nebula glow, cyan/gold telemetry calipers, and title: *"Taanush Abraham — AI Architect & Celestial Technologist"*.
- **Comprehensive Next.js Metadata (`app/layout.tsx`)**:
  - `metadataBase: new URL(...)`
  - Canonical URL, title template, description, keywords, author metadata.
  - `openGraph`: title, description, url, siteName, type: "website", images: `[{ url: "/og-image.png", width: 1200, height: 630, alt: "..." }]`.
  - `twitter`: card: "summary_large_image", creator: "@taanush", images: `["/og-image.png"]`.
  - `robots`: index: true, follow: true, googleBot: { index: true, follow: true }.
  - Favicon & Apple Web App icons.

---

## 2. Structured Data (JSON-LD Schema)
- **Person & WebSite Schema (`app/layout.tsx`)**:
  - Embedded as `<script type="application/ld+json">`.
  - Names: Taanush Abraham.
  - Job Title: AI/LLM Engineer & Celestial Technologist.
  - Affiliation: VIT Vellore, Sstudize.
  - Known For: Deep Learning, Autonomous Agents, Edge AI (ESP32), Zero-Knowledge Proofs.
  - Social Links: GitHub (`https://github.com/TEA-21`), LinkedIn.

---

## 3. SEO Dynamic Routes
- **`app/sitemap.ts`**:
  - Returns `MetadataRoute.Sitemap`.
  - Lists root `/` with `lastModified: new Date()`, `changeFrequency: "monthly"`, `priority: 1.0`.
- **`app/robots.ts`**:
  - Returns `MetadataRoute.Robots`.
  - Allows all user agents (`rules: { userAgent: "*", allow: "/", disallow: ["/api/"] }`).
  - Points to `${siteUrl}/sitemap.xml`.

---

## 4. API Route Protection & Rate Limiting (`app/api/chat/route.ts`)
- **Origin Verification**:
  - Reject requests with foreign `origin` or `referer` headers to prevent third-party website embedding of your OpenRouter quota.
- **In-Memory Token-Bucket / Sliding-Window Rate Limiter**:
  - Track client IP from headers (`x-forwarded-for` / `x-real-ip`).
  - Cap at 15 requests per minute per IP.
  - Return HTTP 429 (`Too Many Requests`) with descriptive error message if exceeded.

---

## 5. Production Config & Security Headers (`next.config.mjs`)
- Add standard production security headers:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 6. Environment & Deployment Template
- **`.env.example`**:
  - Document required environment variables:
    - `OPENROUTER_API_KEY`: OpenRouter API key for the AI companion.
    - `OPENROUTER_MODEL`: Model identifier (default: `nvidia/nemotron-3.5-lightning:free` or `google/gemini-2.0-flash-001`).
    - `NEXT_PUBLIC_SITE_URL`: Production URL (e.g. `https://taanush-portfolio.vercel.app`).
- **Git & GitHub CI/CD**:
  - Stage changes, commit with clear message, and provide instructions to push to `origin main` for Vercel deployment.

---

## Verification Plan
1. **Type Check**: `npx tsc --noEmit` $\implies$ 0 errors.
2. **Build Verification**: `npm run build` $\implies$ verifies `/sitemap.xml`, `/robots.txt`, and static rendering with 0 errors.
3. **OpenGraph & Schema Verification**: Inspect metadata and JSON-LD markup in generated output.
4. **Rate Limit Verification**: Test `/api/chat` with simulated burst requests to confirm HTTP 429 response.
