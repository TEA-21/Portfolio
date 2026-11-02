import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PortfolioStoreProvider } from "@/lib/store";
import { HUDLayer } from "@/components/ui/HUDLayer";
import { CosmicBackground } from "@/components/canvas/CosmicBackground";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://taanush-portfolio.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Taanush Abraham — AI Architect & Celestial Technologist",
    template: "%s | Taanush Abraham",
  },
  description:
    "Portfolio of Taanush Abraham: AI/LLM Engineer & Researcher architecting scalable deep learning systems, agentic AI pipelines, edge intelligence, and zero-knowledge protocols.",
  keywords: [
    "Taanush Abraham",
    "AI Engineer",
    "Machine Learning",
    "LLM Systems",
    "Autonomous Agents",
    "Edge AI",
    "ESP32",
    "Zero-Knowledge Proofs",
    "Next.js",
    "Three.js",
    "Cyberpunk Portfolio",
  ],
  authors: [{ name: "Taanush Abraham", url: siteUrl }],
  creator: "Taanush Abraham",
  publisher: "Taanush Abraham",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Taanush Abraham — AI Architect & Celestial Technologist",
    description:
      "Interactive 3D celestial portfolio showcasing agentic AI workflows, high-throughput deep learning, micro-SLM edge quantization, and decentralized protocols.",
    siteName: "Taanush Abraham Portfolio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Taanush Abraham — AI Architect & Celestial Technologist Portfolio Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taanush Abraham — AI Architect & Celestial Technologist",
    description:
      "Interactive 3D celestial portfolio showcasing agentic AI, deep learning, micro-SLMs, and edge computing.",
    images: ["/og-image.png"],
    creator: "@taanush",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: "Taanush Abraham",
      url: siteUrl,
      image: `${siteUrl}/profile.jpg`,
      jobTitle: "AI Architect & Machine Learning Engineer",
      worksFor: {
        "@type": "Organization",
        name: "Sstudize",
      },
      alumniOf: {
        "@type": "EducationalOrganization",
        name: "Vellore Institute of Technology, Vellore",
      },
      sameAs: ["https://github.com/TEA-21"],
      knowsAbout: [
        "Artificial Intelligence",
        "Large Language Models",
        "Agentic AI Frameworks",
        "Deep Learning",
        "Zero-Knowledge Proofs",
        "Embedded Systems & ESP32",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Taanush Abraham Portfolio",
      publisher: {
        "@id": `${siteUrl}/#person`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="relative min-h-screen font-sans bg-void-black text-white overflow-x-hidden">
        <PortfolioStoreProvider>
          {/* Dynamic WebGL2 Interactive Nebula & Deep Space Canvas */}
          <CosmicBackground />

          {/* Primary scrollable page content */}
          {children}

          {/* Fixed ambient HUD — custom starlight magnetic cursor & observatory calipers */}
          <HUDLayer />
        </PortfolioStoreProvider>
      </body>
    </html>
  );
}
