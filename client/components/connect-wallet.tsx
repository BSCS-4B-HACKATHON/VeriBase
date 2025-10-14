"use client";

import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "./ui/button";
import MetamaskIcon from "@/public/metamask-logo.png";
import CoinBaseIcon from "@/public/cbw.svg";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, LogOut, CheckCircle2, Wallet } from "lucide-react";
import { IconDashboard } from "@tabler/icons-react";
import Link from "next/link";
import { shorten } from "@/lib/helpers";

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const handleConnect = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (connector) {
      connect({ connector });
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
    } catch (err) {
      console.error("disconnect failed", err);
    }
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const openInExplorer = () => {
    if (address) {
      // Base Sepolia explorer
      window.open(`https://sepolia.basescan.org/address/${address}`, "_blank");
    }
  };

  return (
    <div className="flex items-center gap-3">
      {isConnected && address ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group relative flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-[#3ECF8E]/10 to-emerald-500/10 border border-[#3ECF8E]/30 hover:border-[#3ECF8E]/50 hover:from-[#3ECF8E]/15 hover:to-emerald-500/15 transition-all duration-300 hover:scale-105">
              {/* Wallet Icon */}
              <div className="w-8 h-8 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/40 flex items-center justify-center group-hover:bg-[#3ECF8E]/30 transition-colors">
                <Wallet className="w-4 h-4 text-[#3ECF8E]" />
              </div>

              {/* Address */}
              <div className="flex flex-col items-start">
                <span className="text-xs text-white/60 font-mono uppercase tracking-wider">
                  Connected
                </span>
                <span className="text-sm font-mono font-semibold text-white">
                  {shorten(address)}
                </span>
              </div>

              {/* Chevron indicator */}
              <svg
                className="w-4 h-4 text-white/60 group-hover:text-[#3ECF8E] transition-colors ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>

              {/* Subtle glow on hover */}
              <div className="absolute inset-0 rounded-lg bg-[#3ECF8E]/0 group-hover:bg-[#3ECF8E]/5 blur-xl transition-all duration-300 -z-10" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 bg-[#0B1215] border-[#3ECF8E]/30 rounded-xl p-2"
          >
            {/* Wallet Info Header */}
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3ECF8E]/20 to-emerald-500/20 border border-[#3ECF8E]/40 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#3ECF8E]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/60 font-mono uppercase tracking-wider">
                    Wallet Address
                  </p>
                  <p className="text-sm font-mono text-white font-medium mt-0.5">
                    {shorten(address)}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-white/10 my-2" />

            {/* Copy Address */}
            <DropdownMenuItem
              onClick={handleCopyAddress}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 focus:bg-white/5 transition-colors"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-[#3ECF8E]" />
              ) : (
                <Copy className="w-4 h-4 text-white/60 group-hover:text-[#3ECF8E] transition-colors" />
              )}
              <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                {copied ? "Copied!" : "Copy Address"}
              </span>
            </DropdownMenuItem>

            {/* View on Explorer */}
            <DropdownMenuItem
              onClick={openInExplorer}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 focus:bg-white/5 transition-colors"
            >
              <IconDashboard className="w-4 h-4 text-white/60 group-hover:text-[#3ECF8E] transition-colors" />
              <Link
                href="/requests"
                className="text-sm text-white/80 group-hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10 my-2" />

            {/* Disconnect */}
            <DropdownMenuItem
              onClick={handleDisconnect}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4 text-white/60 group-hover:text-red-400 transition-colors" />
              <span className="text-sm text-white/80 group-hover:text-red-400 transition-colors font-medium">
                Disconnect Wallet
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button
            onClick={() => handleConnect("metaMaskSDK")}
            disabled={isPending}
            className="bg-transparent hover:bg-white/10 border border-white/30 rounded-lg cursor-pointer font-mono"
            style={{
              fontSize: "14px",
              lineHeight: "18px",
              fontWeight: "600",
              letterSpacing: "0.32px",
              color: "#FFFFFF",
              height: "48px",
            }}
          >
            <Image src={MetamaskIcon} alt="MetaMask" width={28} height={28} />
            METAMASK
          </Button>

          <Button
            type="button"
            onClick={() => handleConnect("coinbaseWalletSDK")}
            disabled={isPending}
            className="bg-white text-black hover:bg-gray-200 px-6 h-12 rounded-lg cursor-pointer font-mono"
          >
            <Image
              src={CoinBaseIcon}
              alt="Coinbase"
              width={28}
              height={28}
              className="rounded-lg"
            />
            COINBASE WALLET
          </Button>
        </>
      )}
    </div>
  );
}
