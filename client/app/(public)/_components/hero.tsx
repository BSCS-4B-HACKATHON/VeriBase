"use client";

import { Button } from "@/components/ui/button";
import {
  Wallet,
  ChevronDown,
  FileCheck,
  Upload,
  Link2,
  CheckCircle2,
  Mouse,
  ShieldCheck,
  MapPin,
  IdCard,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative rounded-2xl mt-2 mb-6 md:min-h-[calc(100vh-144px)] overflow-hidden">
      {/* Enhanced animated grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-50 animate-grid-float" />

      {/* Accent grid overlay with parallax effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3ECF8E]/10 via-transparent to-[#3ECF8E]/5" />
      </div>

      {/* Top gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-[1]" />

      {/* Bottom gradient overlay - enhanced */}
      <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none z-[1]" />

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 text-center pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-16">
        {/* yung stack dapat pag ka mobile text -> image -> cta buttons? */}
        <div className="flex flex-col md:hidden">
          <div className="mb-4">
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-balance text-foreground mb-2"
              aria-label="VeriBase"
            >
              Verify your ownership securely and transparently.
            </h1>
            <p className="mx-auto h-auto select-text mb-3 text-foreground/80 text-sm md:text-xs">
              VeriBase allows individuals and organizations to verify land
              titles and national IDs with trust, and blockchain-backed
              transparency.
            </p>
          </div>

          {/* Image in the middle for mobile */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-full"></div>
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:gap-4 mb-4">
              <Button className="bg-white hover:bg-gray-100 flex items-center justify-center px-4 sm:px-6 w-full rounded-lg shadow-lg font-mono text-xs sm:text-sm md:text-base font-semibold tracking-wider text-black h-[50px] sm:h-[60px]">
                <Wallet className="mr-2 h-4 w-4" /> CONNECT WALLET
              </Button>
              <Link
                href="https://x.com/jackjack_eth"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black hover:bg-black/80 flex items-center justify-center px-4 sm:px-6 w-full rounded-lg shadow-lg font-mono text-xs sm:text-sm md:text-base font-semibold tracking-wider text-white h-[50px] sm:h-[60px] border border-white/10"
              >
                LEARN MORE
              </Link>
            </div>

            {/* Mini Verification Stats Row - Mobile */}
            <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
              {/* Total Verifications */}
              <div className="group relative bg-gradient-to-br from-[#3ECF8E]/5 to-emerald-500/10 backdrop-blur-sm border border-[#3ECF8E]/20 rounded-xl p-3 hover:border-[#3ECF8E]/40 hover:scale-105 transition-all duration-300 animate-fade-in-up delay-100">
                <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-30 transition-opacity">
                  <ShieldCheck className="w-5 h-5 text-[#3ECF8E]" />
                </div>
                <div className="text-[#3ECF8E] font-bold text-lg sm:text-xl font-mono">
                  12,480+
                </div>
                <div className="text-white/80 text-xs font-semibold mt-1">
                  Total Verifications
                </div>
                <div className="text-white/50 text-[10px] mt-0.5">
                  Documents secured on-chain
                </div>
              </div>

              {/* Land Title Owners */}
              <div className="group relative bg-gradient-to-br from-[#3ECF8E]/5 to-emerald-500/10 backdrop-blur-sm border border-[#3ECF8E]/20 rounded-xl p-3 hover:border-[#3ECF8E]/40 hover:scale-105 transition-all duration-300 animate-fade-in-up delay-200">
                <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-30 transition-opacity">
                  <MapPin className="w-5 h-5 text-[#3ECF8E]" />
                </div>
                <div className="text-[#3ECF8E] font-bold text-lg sm:text-xl font-mono">
                  7,250+
                </div>
                <div className="text-white/80 text-xs font-semibold mt-1">
                  Land Title Owners
                </div>
                <div className="text-white/50 text-[10px] mt-0.5">
                  Legally validated holders
                </div>
              </div>

              {/* National ID Verifications */}
              <div className="group relative bg-gradient-to-br from-[#3ECF8E]/5 to-emerald-500/10 backdrop-blur-sm border border-[#3ECF8E]/20 rounded-xl p-3 hover:border-[#3ECF8E]/40 hover:scale-105 transition-all duration-300 animate-fade-in-up delay-300">
                <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-30 transition-opacity">
                  <IdCard className="w-5 h-5 text-[#3ECF8E]" />
                </div>
                <div className="text-[#3ECF8E] font-bold text-lg sm:text-xl font-mono">
                  5,300+
                </div>
                <div className="text-white/80 text-xs font-semibold mt-1">
                  ID Verifications
                </div>
                <div className="text-white/50 text-[10px] mt-0.5">
                  Trusted by institutions
                </div>
              </div>

              {/* Avg Verification Time */}
              <div className="group relative bg-gradient-to-br from-[#3ECF8E]/5 to-emerald-500/10 backdrop-blur-sm border border-[#3ECF8E]/20 rounded-xl p-3 hover:border-[#3ECF8E]/40 hover:scale-105 transition-all duration-300 animate-fade-in-up delay-400">
                <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-30 transition-opacity">
                  <Zap className="w-5 h-5 text-[#3ECF8E]" />
                </div>
                <div className="text-[#3ECF8E] font-bold text-lg sm:text-xl font-mono">
                  &lt; 2 mins
                </div>
                <div className="text-white/80 text-xs font-semibold mt-1">
                  Avg. Verification
                </div>
                <div className="text-white/50 text-[10px] mt-0.5">
                  On-chain validation speed
                </div>
              </div>
            </div>

            {/* Animated Verification Flow - Mobile */}
            <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in-up delay-500">
              <div className="flex flex-col items-center animate-fade-in-up delay-600">
                <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/40 flex items-center justify-center mb-2">
                  <FileCheck className="w-4 h-4 text-[#3ECF8E]" />
                </div>
                <span className="text-white/60 text-[10px] font-mono">
                  Submit
                </span>
              </div>
              <div className="w-4 h-[2px] bg-gradient-to-r from-[#3ECF8E]/40 to-[#3ECF8E]/20 animate-pulse-slow" />
              <div className="flex flex-col items-center animate-fade-in-up delay-700">
                <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/40 flex items-center justify-center mb-2">
                  <Upload className="w-4 h-4 text-[#3ECF8E]" />
                </div>
                <span className="text-white/60 text-[10px] font-mono">
                  Upload
                </span>
              </div>
              <div className="w-4 h-[2px] bg-gradient-to-r from-[#3ECF8E]/40 to-[#3ECF8E]/20 animate-pulse-slow" />
              <div className="flex flex-col items-center animate-fade-in-up delay-800">
                <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/40 flex items-center justify-center mb-2">
                  <Link2 className="w-4 h-4 text-[#3ECF8E]" />
                </div>
                <span className="text-white/60 text-[10px] font-mono">
                  Verify
                </span>
              </div>
              <div className="w-4 h-[2px] bg-gradient-to-r from-[#3ECF8E]/40 to-[#3ECF8E]/20 animate-pulse-slow" />
              <div className="flex flex-col items-center animate-fade-in-up delay-900">
                <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/40 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3ECF8E]" />
                </div>
                <span className="text-white/60 text-[10px] font-mono">
                  Confirm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout (Original) */}
        <div className="hidden md:flex md:flex-col md:flex-grow">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-balance text-foreground mb-2"
            aria-label="Verify your ownership securely and transparently"
          >
            Verify your ownership securely
            <br />
            and transparently.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance mb-6">
            Securely and transparently with blockchain-backed trust.
          </p>
          <div className="flex flex-row justify-center gap-3 md:gap-4 mb-8">
            <Button className="bg-white hover:bg-gray-100 flex items-center justify-center px-4 md:px-6 lg:px-8 rounded-lg shadow-lg font-mono text-sm md:text-base font-semibold tracking-wider text-black h-[50px] md:h-[60px] min-w-[180px] md:min-w-[220px]">
              <Wallet className="mr-2 h-4 w-4" /> CONNECT WALLET
            </Button>
            <Link
              href="https://x.com/jackjack_eth"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black hover:bg-black/80 flex items-center justify-center px-4 md:px-6 lg:px-8 rounded-lg shadow-lg font-mono text-sm md:text-base font-semibold tracking-wider text-white h-[50px] md:h-[60px] min-w-[180px] md:min-w-[220px] border border-white/10"
            >
              LEARN MORE
            </Link>
          </div>

          {/* Mini Verification Stats Row - Desktop */}
          <div className="relative mb-10">
            {/* Optional section label */}
            <div className="text-center mb-6 animate-fade-in-up">
              <p className="text-xs uppercase tracking-wider text-[#3ECF8E]/70 font-mono">
                Trusted by thousands — verified on-chain
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto">
              {/* Total Verifications */}
              <div className="group relative bg-gradient-to-br from-[#3ECF8E]/5 to-emerald-500/10 backdrop-blur-sm border border-[#3ECF8E]/20 rounded-xl p-5 hover:border-[#3ECF8E]/50 hover:scale-105 hover:shadow-lg hover:shadow-[#3ECF8E]/20 transition-all duration-300 animate-fade-in-up delay-100">
                <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                  <ShieldCheck className="w-6 h-6 text-[#3ECF8E]" />
                </div>
                <div className="text-[#3ECF8E] font-bold text-3xl font-mono mb-2">
                  12,480+
                </div>
                <div className="text-white/90 text-sm font-semibold">
                  Total Verifications
                </div>
                <div className="text-white/50 text-xs mt-1.5 leading-tight">
                  Documents verified and secured on-chain
                </div>
              </div>

              {/* Land Title Owners */}
              <div className="group relative bg-gradient-to-br from-[#3ECF8E]/5 to-emerald-500/10 backdrop-blur-sm border border-[#3ECF8E]/20 rounded-xl p-5 hover:border-[#3ECF8E]/50 hover:scale-105 hover:shadow-lg hover:shadow-[#3ECF8E]/20 transition-all duration-300 animate-fade-in-up delay-200">
                <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                  <MapPin className="w-6 h-6 text-[#3ECF8E]" />
                </div>
                <div className="text-[#3ECF8E] font-bold text-3xl font-mono mb-2">
                  7,250+
                </div>
                <div className="text-white/90 text-sm font-semibold">
                  Active Land Title Owners
                </div>
                <div className="text-white/50 text-xs mt-1.5 leading-tight">
                  Legally validated property holders
                </div>
              </div>

              {/* National ID Verifications */}
              <div className="group relative bg-gradient-to-br from-[#3ECF8E]/5 to-emerald-500/10 backdrop-blur-sm border border-[#3ECF8E]/20 rounded-xl p-5 hover:border-[#3ECF8E]/50 hover:scale-105 hover:shadow-lg hover:shadow-[#3ECF8E]/20 transition-all duration-300 animate-fade-in-up delay-300">
                <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                  <IdCard className="w-6 h-6 text-[#3ECF8E]" />
                </div>
                <div className="text-[#3ECF8E] font-bold text-3xl font-mono mb-2">
                  5,300+
                </div>
                <div className="text-white/90 text-sm font-semibold">
                  National ID Verifications
                </div>
                <div className="text-white/50 text-xs mt-1.5 leading-tight">
                  Trusted by citizens and institutions
                </div>
              </div>
            </div>

            {/* Subtle divider gradient lines between cards (optional decorative element) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-[#3ECF8E]/10 to-transparent pointer-events-none" />
          </div>

          {/* Animated Verification Flow - Desktop */}
          <div className="flex items-center justify-center gap-4 mb-12 max-w-2xl mx-auto animate-fade-in-up delay-500">
            <div className="flex flex-col items-center animate-fade-in-up delay-600">
              <div className="w-14 h-14 rounded-full bg-[#3ECF8E]/20 border-2 border-[#3ECF8E]/40 flex items-center justify-center mb-3 hover:scale-110 transition-transform duration-300">
                <FileCheck className="w-6 h-6 text-[#3ECF8E]" />
              </div>
              <span className="text-white/70 text-xs font-mono uppercase tracking-wider">
                Submit
              </span>
            </div>
            <div className="w-12 h-[2px] bg-gradient-to-r from-[#3ECF8E]/40 to-[#3ECF8E]/20 animate-pulse-slow" />
            <div className="flex flex-col items-center animate-fade-in-up delay-700">
              <div className="w-14 h-14 rounded-full bg-[#3ECF8E]/20 border-2 border-[#3ECF8E]/40 flex items-center justify-center mb-3 hover:scale-110 transition-transform duration-300">
                <Upload className="w-6 h-6 text-[#3ECF8E]" />
              </div>
              <span className="text-white/70 text-xs font-mono uppercase tracking-wider">
                Upload
              </span>
            </div>
            <div className="w-12 h-[2px] bg-gradient-to-r from-[#3ECF8E]/40 to-[#3ECF8E]/20 animate-pulse-slow" />
            <div className="flex flex-col items-center animate-fade-in-up delay-800">
              <div className="w-14 h-14 rounded-full bg-[#3ECF8E]/20 border-2 border-[#3ECF8E]/40 flex items-center justify-center mb-3 hover:scale-110 transition-transform duration-300">
                <Link2 className="w-6 h-6 text-[#3ECF8E]" />
              </div>
              <span className="text-white/70 text-xs font-mono uppercase tracking-wider">
                Verify
              </span>
            </div>
            <div className="w-12 h-[2px] bg-gradient-to-r from-[#3ECF8E]/40 to-[#3ECF8E]/20 animate-pulse-slow" />
            <div className="flex flex-col items-center animate-fade-in-up delay-900">
              <div className="w-14 h-14 rounded-full bg-[#3ECF8E]/20 border-2 border-[#3ECF8E]/40 flex items-center justify-center mb-3 hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-6 h-6 text-[#3ECF8E]" />
              </div>
              <span className="text-white/70 text-xs font-mono uppercase tracking-wider">
                Confirm
              </span>
            </div>
          </div>

          {/* Image */}
          <div className="relative w-full flex-row flex items-center justify-center rounded-md overflow-hidden">
            <div className="w-full sm:w-[85%] md:max-w-[1200px] mx-auto"></div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 animate-bounce-slow">
          <button
            onClick={() => {
              const nextSection = document.querySelector(
                "section:nth-of-type(2)"
              );
              nextSection?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex flex-col items-center gap-2 text-white/50 hover:text-[#3ECF8E] transition-colors duration-300 group"
            aria-label="Scroll to next section"
          >
            <Mouse className="size-6" />
            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </section>
  );
}
