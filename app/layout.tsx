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

export const metadata: Metadata = {
  title: "Taanush Abraham — Portfolio",
  description:
    "AI/LLM Engineer & B.Tech CS student building scalable machine learning systems, deep learning models, and agentic AI architectures.",
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
