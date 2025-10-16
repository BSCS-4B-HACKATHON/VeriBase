"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Github, Twitter, Linkedin, MessageSquare, Shield } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const navigation = {
    product: [
      { name: "About", href: "#about" },
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Documentation", href: "#docs" },
    ],
    company: [
      { name: "Verify Land Title", href: "#verify" },
      { name: "Verify National ID", href: "#verify-id" },
      { name: "API Access", href: "#api" },
      { name: "Contact", href: "#contact" },
    ],
    resources: [
      { name: "Blog", href: "#blog" },
      { name: "Support", href: "#support" },
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Terms of Service", href: "#terms" },
    ],
  };

  const socials = [
    {
      name: "Twitter",
      href: "https://x.com/jackjack_eth",
      icon: Twitter,
    },
    {
      name: "GitHub",
      href: "https://github.com",
      icon: Github,
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com",
      icon: Linkedin,
    },
    {
      name: "Discord",
      href: "https://discord.com",
      icon: MessageSquare,
    },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-[#0B1215]/50 to-[#0E161A]/50 border-t border-[#3ECF8E]/20">
      {/* Gradient divider at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3ECF8E]/40 to-transparent" />

      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-[0.015]">
        <div className="absolute inset-0 grid-pattern" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12"
        >
          {/* Left: Logo + Tagline */}
          <div className="space-y-4 lg:col-span-4">
            <Link href="/" className="group flex items-center gap-2">
              <div className="relative">
                <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-[#3ECF8E] group-hover:text-[#3ECF8E]/80 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(62,207,142,0.5)]" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#3ECF8E] transition-colors duration-300">
                VeriBase
              </span>
            </Link>
            <p className="text-sm sm:text-base text-gray-400 max-w-xs leading-relaxed">
              Proof of Ownership, Secured on the Blockchain.
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse" />
              <span>Blockchain-verified & decentralized</span>
            </div>
          </div>

          {/* Right: Navigation Links Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:col-span-8">
            {/* Product Column */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-[#3ECF8E] transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-0 h-px bg-[#3ECF8E] group-hover:w-4 transition-all duration-300" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Column */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Services
              </h3>
              <ul className="space-y-3">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-[#3ECF8E] transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-0 h-px bg-[#3ECF8E] group-hover:w-4 transition-all duration-300" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Resources
              </h3>
              <ul className="space-y-3">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-[#3ECF8E] transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-0 h-px bg-[#3ECF8E] group-hover:w-4 transition-all duration-300" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter Column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Stay Updated
              </h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Get the latest updates on blockchain verification.
              </p>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50 transition-all min-h-[40px]"
                  aria-label="Email address"
                />
                <button
                  className="px-4 py-2 bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 rounded-lg text-sm text-[#3ECF8E] hover:bg-[#3ECF8E]/20 transition-all duration-200 font-medium min-h-[40px] whitespace-nowrap"
                  aria-label="Subscribe to newsletter"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom: Social + Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 border-t border-white/10 pt-8"
        >
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* Social Icons - Top on mobile, centered */}
            <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 order-first sm:order-last">
              {socials.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                  aria-label={social.name}
                >
                  <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#3ECF8E]/10 group-hover:border-[#3ECF8E]/30 transition-all duration-300 group-hover:scale-110 active:scale-95">
                    <social.icon className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-[#3ECF8E] transition-colors duration-300" />
                  </div>
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-lg bg-[#3ECF8E]/0 group-hover:bg-[#3ECF8E]/5 blur-xl transition-all duration-300 -z-10" />
                </Link>
              ))}
            </div>

            {/* Copyright Section - Centered on mobile */}
            <div className="flex flex-col items-center sm:items-start gap-3 sm:gap-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                <p className="text-xs sm:text-sm">
                  © {currentYear} VeriBase. All rights reserved.
                </p>
                <span className="hidden sm:inline text-gray-600">•</span>
                <p className="text-xs text-gray-500/80">
                  Powered by decentralized verification technology.
                </p>
              </div>

              {/* Additional info for mobile clarity */}
              <p className="text-xs text-gray-600 sm:hidden">
                Built on Base • Secured by Blockchain
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
