"use client";

import React, { useEffect, useState } from "react";
import { IconDotsVertical, IconLogout } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";

function shorten(addr?: string | null) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function NavUser() {
  const { address, isConnected, disconnectWallet } = useWallet();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("NavUser state:", {
      mounted,
      isConnected,
      address: address?.slice(0, 10),
    });
  }, [mounted, isConnected, address]);

  const avatarSrc = null; // replace with ENS/avatar fetch if you add it later

  // Only redirect if mounted AND definitively not connected
  // Wagmi's isConnected will be true if wallet is reconnected
  useEffect(() => {
    if (mounted && !isConnected) {
      console.log("NavUser: Not connected after mount, redirecting...");
      router.replace("/");
    }
  }, [isConnected, mounted, router]);

  const handleDisconnect = async () => {
    await disconnectWallet();
    // Wagmi will handle the state update, just redirect
    router.replace("/");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt={address ?? "wallet"} />
                ) : (
                  <AvatarFallback className="rounded-lg">
                    {address ? address.slice(2, 4).toUpperCase() : "WL"}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <span className="truncate font-medium">
                  {mounted
                    ? address
                      ? shorten(address)
                      : "Connect Wallet"
                    : "Connect Wallet"}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {address ? "Connected" : "Not connected"}
                </span>
              </div>

              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-44 rounded-lg"
            side="right"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem onClick={handleDisconnect}>
              <IconLogout className="mr-2" />
              Disconnect Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
