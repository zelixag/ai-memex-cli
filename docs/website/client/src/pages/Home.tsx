/*
 * Landing — page shell switches tech vs classic background via ThemeContext
 */
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import CommandsSection from "@/components/CommandsSection";
import ComparisonSection from "@/components/ComparisonSection";
import QuickStartSection from "@/components/QuickStartSection";
import Footer from "@/components/Footer";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export default function Home() {
  const { preset } = useTheme();

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col bg-background relative",
        preset === "tech" ? "tech-page" : "classic-page",
      )}
    >
      <Navbar />
      <main className="relative z-[1]">
        <HeroSection />
        <FeaturesSection />
        <ArchitectureSection />
        <CommandsSection />
        <ComparisonSection />
        <QuickStartSection />
      </main>
      <Footer />
    </div>
  );
}
