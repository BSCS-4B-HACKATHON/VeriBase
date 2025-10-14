"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Menu, Shield, ShieldX, X } from "lucide-react";
import Link from "next/link";
import ConnectWallet from "@/components/connect-wallet";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debounce the scroll handler to prevent flickering
  const handleScroll = useCallback(() => {
    const isScrolled = window.scrollY > 10;
    if (isScrolled !== scrolled) {
      setScrolled(isScrolled);
    }
  }, [scrolled]);

  useEffect(() => {
    // Initial check on mount
    handleScroll();

    // Add event listener with passive option for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Apply styles consistently
  const navStyle = {
    boxShadow: scrolled
      ? "0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0), 0 5px 18px 0 rgba(204,204,204,0.1)"
      : "none",
    border: scrolled ? "1px solid #1a1a1a" : "1px solid transparent",
    borderRadius: "16px",
    transition: "all 0.3s ease-in-out",
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 md:px-8 transition-all duration-300">
      <div className="w-[calc(100%-24px)] max-w-[1400px] mt-2">
        <nav
          className="flex items-center justify-between p-2 h-16 bg-black rounded-[16px] text-white"
          style={navStyle}
        >
          <div className="flex items-center ml-[15px]">
            <Shield className="size-5 mr-2 text-[#3ECF8E]" />
            <span
              className="logo-text"
              style={{
                fontFamily:
                  'var(--font-geist-sans), "GeistSans Fallback", sans-serif',
                fontSize: "18px",
                lineHeight: "1.1",
                fontWeight: "600",
                letterSpacing: "-0.04em",
                color: "#FFFFFF",
                width: "auto",
                height: "auto",
              }}
            >
              VeriBase
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <ConnectWallet />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex items-center justify-center mr-2 p-2 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <div
          className={`fixed top-[76px] right-6 w-[calc(100%-48px)] max-w-[400px] bg-black border border-[#1a1a1a] rounded-[16px] shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen
              ? "translate-y-0 opacity-100"
              : "translate-y-[-20px] opacity-0 pointer-events-none"
          }`}
        >
          <div className="p-4 flex flex-col gap-4">
            <div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md hover:bg-white/10 transition-colors p-2"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </div>
    </header>
  );
}
