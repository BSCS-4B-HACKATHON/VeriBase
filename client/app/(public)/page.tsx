import Image from "next/image";
import Navbar from "./_components/navbar";
import Hero from "./_components/hero";

export default function Home() {
  return (
    <div className="min-h-screen w-full relative bg-background">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(226, 232, 240, 0.12), transparent 60%), #000000",
        }}
      />

      <Navbar />

      <Hero />
    </div>
  );
}
