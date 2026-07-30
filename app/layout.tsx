import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PortfolioStoreProvider } from "@/lib/store";
import { CanvasLayer } from "@/components/canvas/CanvasLayer";
import { SceneContent } from "@/components/canvas/SceneContent";
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
  title: "Cyberpunk Portfolio",
  description: "Next.js 14 Cyberpunk Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-dark text-white">
        <PortfolioStoreProvider>
          {/* Full-screen 3D canvas — sits at z-0 behind all page content */}
          <CanvasLayer>
            <SceneContent />
          </CanvasLayer>
          {/* Page content — must establish a stacking context above z-0 */}
          <div className="relative z-10 flex flex-col flex-1">
            {children}
          </div>
        </PortfolioStoreProvider>
      </body>
    </html>
  );
}
