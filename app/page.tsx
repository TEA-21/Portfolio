import { AboutMeHero } from "@/components/ui/AboutMeHero";
import { BioDetails } from "@/components/ui/BioDetails";
import { ProjectWebGraph } from "@/components/ui/ProjectWebGraph";
import { Footer } from "@/components/ui/Footer";

export default function Home() {
  return (
    <main className="relative w-full flex flex-col">
      {/* Tier 1 (Top): Hero Section (Title & Tags) */}
      <AboutMeHero />

      {/* Tier 2 (Middle): Bio Details (Text on left, Image on right) */}
      <BioDetails />

      {/* Tier 3 (Bottom): 3D Planetary Hierarchy & Solar System */}
      <ProjectWebGraph />

      {/* Tier 4 (Footer): Full-width Minimalist Contact Bar */}
      <Footer />
    </main>
  );
}
