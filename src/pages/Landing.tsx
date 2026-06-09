import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import QuickAccess from "@/components/landing/QuickAccess";
import Features from "@/components/landing/Features";
import Workflow from "@/components/landing/Workflow";
import Stats from "@/components/landing/Stats";
import RelatedSystemSection from "@/components/landing/RelatedSystemSection";
import Footer from "@/components/landing/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F3A] antialiased">
      <Navbar />
      <main>
        <Hero />
        <QuickAccess />
        <Features />
        <Workflow />
        <Stats />
        <RelatedSystemSection />
      </main>
      <Footer />
    </div>
  );
}
