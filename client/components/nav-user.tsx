"use client";

import React, { use, useEffect, useState } from "react";
import { IconDotsVertical, IconLogout, IconWallet } from "@tabler/icons-react";

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

import { useRouter } from "next/dist/client/components/navigation";
import { useWallet } from "@/app/context/walletContext";

function shorten(addr?: string | null) {
    if (!addr) return "";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function NavUser() {
    const { disconnectWallet } = useWallet();
    const router = useRouter();
    const [address, setAddress] = useState<string | null>(() =>
        typeof window !== "undefined"
            ? localStorage.getItem("vb_address")
            : null
    );
    const avatarSrc = null; // replace with ENS/avatar fetch if you add it later

    // perform redirect when address becomes null
    useEffect(() => {
        if (!address) {
            router.replace("/");
        }
    }, [address, router]);

    useEffect(() => {
        const onDisconnect = () => setAddress(null);
        const onStorage = (e: StorageEvent) => {
            if (e.key === "vb_address")
                setAddress(localStorage.getItem("vb_address"));
        };
        const onConnectEvent = () =>
            setAddress(localStorage.getItem("vb_address"));

        window.addEventListener(
            "vb_wallet_disconnect",
            onDisconnect as EventListener
        );
        window.addEventListener(
            "vb_wallet_connect",
            onConnectEvent as EventListener
        );
        window.addEventListener("storage", onStorage);

        return () => {
            window.removeEventListener(
                "vb_wallet_disconnect",
                onDisconnect as EventListener
            );
            window.removeEventListener(
                "vb_wallet_connect",
                onConnectEvent as EventListener
            );
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    const handleDisconnect = async () => {
        await disconnectWallet();
        setAddress(null);

        // Redirect to home page after disconnecting
        router.replace("/");
        return;
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
                                    <AvatarImage
                                        src={avatarSrc}
                                        alt={address ?? "wallet"}
                                    />
                                ) : (
                                    <AvatarFallback className="rounded-lg">
                                        {address
                                            ? address.slice(2, 4).toUpperCase()
                                            : "WL"}
                                    </AvatarFallback>
                                )}
                            </Avatar>

                            <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                <span className="truncate font-medium">
                                    {address
                                        ? shorten(address)
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
