import Navbar from "./_components/navbar";
import Hero from "./_components/hero";
import Features from "./_components/features";
import WhyNotVeriBaseSection from "./_components/why-not-veribase";
import Pricing from "./_components/pricing";
import { FAQSection } from "./_components/faq-sections";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white transition-all duration-300 pt-20">
      <Navbar />

      <div className="max-w-[1920px] mx-auto relative px-6 md:px-8">
        {/* Hero Section */}
        <Hero />

        {/* Features Section */}
        <Features />

        {/* Why Not VeriBase Section */}
        <WhyNotVeriBaseSection />

        {/* Pricing Section */}
        <Pricing />

        <FAQSection />
      </div>
    </div>
  );
}
