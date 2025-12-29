import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import ListingsSection from "@/components/ListingsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturedCarousel />
      <ListingsSection />
      {/* Additional sections like interactive map would go here */}
      <Footer />
    </main>
  );
}
