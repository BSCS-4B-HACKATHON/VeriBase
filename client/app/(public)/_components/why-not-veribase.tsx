"use client";

import { Button } from "@/components/ui/button";
import { Wallet, Shield, Zap, Globe, Lock } from "lucide-react";

interface WhyNotGitSectionProps {
  onOpenInstall?: () => void;
}

export default function WhyNotVeriBaseSection({
  onOpenInstall,
}: WhyNotGitSectionProps) {
  const features = [
    {
      icon: Shield,
      title: "Blockchain-Backed Trust",
      description:
        "Every verification is securely recorded on-chain — transparent, tamper-proof, and permanent.",
    },
    {
      icon: Lock,
      title: "Government-Level Security",
      description:
        "Your documents are encrypted and verified under strict validation protocols.",
    },
    {
      icon: Zap,
      title: "Fast and Transparent Verification",
      description:
        "Track the progress of your verification in real time, from submission to approval.",
    },
    {
      icon: Wallet,
      title: "Wallet-Based Authentication",
      description:
        "No passwords. No accounts. Just connect your wallet to prove ownership instantly.",
    },
    {
      icon: Globe,
      title: "Decentralized and Borderless",
      description:
        "VeriBase operates globally, ensuring your ownership is recognized wherever you are.",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Subtle top gradient background */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#3ECF8E]/[0.03] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
          <h2
            className="mb-6 font-semibold"
            style={{
              backgroundImage:
                "linear-gradient(rgb(245, 245, 245), rgb(245, 245, 245) 29%, rgb(153, 153, 153))",
              color: "transparent",
              fontFamily: "GeistSans, sans-serif",
              fontSize: "clamp(32px, 6vw, 52px)",
              fontWeight: 600,
              letterSpacing: "clamp(-1.5px, -0.04em, -2.08px)",
              lineHeight: "1.15",
              textAlign: "center",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            Why Choose VeriBase?
          </h2>
          <p className="max-w-3xl mx-auto text-white/90 mb-4">
            Built for trust, powered by transparency — VeriBase ensures every
            identity and land title is verified securely through decentralized
            technology.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-white/10 hover:border-[#3ECF8E]/30 hover:scale-[1.02] transition-all duration-300 animate-fade-in-up"
              style={{
                animationDelay: `${index * 100 + 200}ms`,
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-[#3ECF8E]/10 border-2 border-[#3ECF8E]/30 rounded-xl flex items-center justify-center group-hover:bg-[#3ECF8E]/20 group-hover:border-[#3ECF8E]/50 group-hover:shadow-lg group-hover:shadow-[#3ECF8E]/20 transition-all duration-300">
                    <feature.icon
                      className="w-6 h-6 md:w-7 md:h-7 text-[#3ECF8E]"
                      strokeWidth={2}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h3
                    className="text-white font-semibold mb-3 group-hover:text-[#3ECF8E]/90 transition-colors duration-300"
                    style={{
                      fontFamily:
                        'var(--font-geist-sans), "GeistSans", sans-serif',
                      fontSize: "clamp(17px, 2vw, 20px)",
                      lineHeight: "1.3",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-white/70 group-hover:text-white/90 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center animate-fade-in-up delay-700">
          {onOpenInstall && (
            <Button
              onClick={onOpenInstall}
              className="bg-white hover:bg-gray-100 hover:scale-105 text-black font-mono text-sm font-semibold tracking-wider py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                fontFamily: "GeistMono, monospace",
                letterSpacing: "0.56px",
                height: "52px",
              }}
            >
              <Wallet className="mr-2 h-4 w-4 stroke-[2.5px]" />
              CONNECT WALLET
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
