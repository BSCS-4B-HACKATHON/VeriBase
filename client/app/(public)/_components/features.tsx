"use client";

import { ShieldCheck, FileCheck, Lock, Search, Zap } from "lucide-react";
import { WobbleCard } from "@/components/ui/wobble-card";
import { motion } from "framer-motion";

export default function Features() {
  return (
    <section className="py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative mx-auto mb-12 max-w-2xl sm:text-center">
          <div className="relative z-10">
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
              Features
            </h2>
            <p className="font-geist text-foreground/60 text-center">
              VeriBase helps you verify your ownership securely and
              transparently.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
          <WobbleCard
            containerClassName="col-span-1 lg:col-span-2 min-h-[300px]"
            className=""
          >
            <div className="max-w-xs">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#3ECF8E]/10 backdrop-blur-sm border border-[#3ECF8E]/20 mb-4 transition-transform duration-300 hover:scale-110">
                <Lock className="w-6 h-6 text-[#3ECF8E]" />
              </div>
              <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                Proof Without Exposure
              </h2>
              <p className="mt-4 text-left text-base/6 text-white/90">
                We turn documents into cryptographic fingerprints — verifiable
                on-chain, invisible to everyone else.
              </p>
            </div>
          </WobbleCard>

          <WobbleCard containerClassName="col-span-1 min-h-[300px]">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#3ECF8E]/10 backdrop-blur-sm border border-[#3ECF8E]/20 mb-4 transition-transform duration-300 hover:scale-110">
              <FileCheck className="w-6 h-6 text-[#3ECF8E]" />
            </div>
            <h2 className="max-w-80 text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
              Minted by You, Verified Once
            </h2>
            <p className="mt-4 max-w-[26rem] text-left text-base/6 text-white/80">
              After a one-time verification, ownership becomes yours to mint —
              forever secured, forever verifiable.
            </p>
          </WobbleCard>

          <WobbleCard containerClassName="col-span-1 min-h-[300px]">
            <div className="max-w-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#3ECF8E]/10 backdrop-blur-sm border border-[#3ECF8E]/20 mb-4 transition-transform duration-300 hover:scale-110">
                <Zap className="w-6 h-6 text-[#3ECF8E]" />
              </div>
              <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                Smart Efficiency
              </h2>
              <p className="mt-4 max-w-[26rem] text-left text-base/6 text-white/80">
                Batch minting, optimized gas costs, and L2 performance — because
                security shouldn’t slow you down.
              </p>
            </div>
          </WobbleCard>
          <WobbleCard containerClassName="col-span-1 lg:col-span-2 min-h-[300px]">
            <div className="max-w-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#3ECF8E]/10 backdrop-blur-sm border border-[#3ECF8E]/20 mb-4 transition-transform duration-300 hover:scale-110">
                <Search className="w-6 h-6 text-[#3ECF8E]" />
              </div>
              <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                Tamper-Proof, Transparent, Traceable
              </h2>
              <p className="mt-4 max-w-[26rem] text-left text-base/6 text-white/80">
                No duplicates, no rewrites, no “lost files.” Every proof lives
                immutably on-chain — ready to be audited anytime.
              </p>
            </div>
          </WobbleCard>
        </div>
      </motion.div>
    </section>
  );
}
