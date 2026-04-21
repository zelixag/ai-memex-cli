/*
 * Design: Knowledge Cartography — Single-page documentation site
 * Sections: Hero → Features → Architecture → Commands → Comparison → QuickStart → Footer
 */
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import CommandsSection from "@/components/CommandsSection";
import ComparisonSection from "@/components/ComparisonSection";
import QuickStartSection from "@/components/QuickStartSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />
      <main>
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
