import { AboutMeHero } from "@/components/ui/AboutMeHero";
import { BioDetails } from "@/components/ui/BioDetails";
import { ProjectWebGraph } from "@/components/ui/ProjectWebGraph";

export default function Home() {
  return (
    <main className="relative w-full flex flex-col">
      {/* Tier 1 (Top): Hero Section (Title & Tags) */}
      <AboutMeHero />

      {/* Tier 2 (Middle): Bio Details (Text on left, Image on right) */}
      <BioDetails />

      {/* Tier 3 (Bottom): 2D Interactive Many-to-Many Web Graph */}
      <ProjectWebGraph />
    </main>
  );
}
