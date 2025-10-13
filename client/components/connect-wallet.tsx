"use client";
import React, { useEffect, useState } from "react";
import { createWalletClient, custom } from "viem";
import { baseSepolia } from "viem/chains";

declare global {
    interface Window {
        ethereum?: any;
    }
}

export default function ConnectWallet() {
    const [address, setAddress] = useState<string | null>(() =>
        typeof window !== "undefined"
            ? localStorage.getItem("vb_address")
            : null
    );
    const [connecting, setConnecting] = useState(false);
    const [walletClient, setWalletClient] = useState<any | null>(null);

    useEffect(() => {
        // restore any persisted address
        if (!address && typeof window !== "undefined") {
            const saved = localStorage.getItem("vb_address");
            if (saved) setAddress(saved);
        }

        // listen for account changes from wallet extensions
        if (typeof window !== "undefined" && window.ethereum?.on) {
            const onAccounts = (accounts: string[]) => {
                if (accounts && accounts.length) {
                    setAddress(accounts[0]);
                    localStorage.setItem("vb_address", accounts[0]);
                } else {
                    setAddress(null);
                    localStorage.removeItem("vb_address");
                    localStorage.removeItem("vb_provider");
                }
            };
            window.ethereum.on("accountsChanged", onAccounts);
            window.ethereum.on("disconnect", () => {
                setAddress(null);
                localStorage.removeItem("vb_address");
                localStorage.removeItem("vb_provider");
            });
            return () => {
                window.ethereum.removeListener?.("accountsChanged", onAccounts);
            };
        }
    }, [address]);

    const connectUsingInjected = async (
        providerName: "metamask" | "coinbase"
    ) => {
        if (typeof window === "undefined" || !window.ethereum) {
            alert(
                `${
                    providerName === "metamask" ? "MetaMask" : "Coinbase Wallet"
                } not found`
            );
            return;
        }
        try {
            setConnecting(true);
            const accounts: string[] = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            const acc = accounts?.[0] ?? null;
            if (!acc) throw new Error("No account returned");

            // create a viem wallet client around the injected provider (optional, useful later)
            // keep it local — we don't persist the client instance to server.
            try {
                createWalletClient({
                    transport: custom(window.ethereum),
                    chain: baseSepolia,
                });
            } catch {
                // ignore client creation failures — connection still works via injected provider
            }

            setAddress(acc);
            localStorage.setItem("vb_address", acc);
            localStorage.setItem("vb_provider", providerName);
        } catch (err) {
            console.error("connect failed", err);
            alert("Connection failed");
        } finally {
            setConnecting(false);
        }
    };

    const disconnect = () => {
        // can't programmatically "disconnect" injected wallets — clear local state
        setAddress(null);
        localStorage.removeItem("vb_address");
        localStorage.removeItem("vb_provider");
        // trigger any listeners / page update
        window.dispatchEvent(new Event("vb_wallet_disconnect"));
    };

    return (
        <div className="flex items-center gap-3">
            {address ? (
                <>
                    <div className="px-3 py-1 rounded bg-background border border-border text-sm font-medium">
                        {address.slice(0, 6)}…{address.slice(-4)}
                    </div>
                    <button
                        type="button"
                        onClick={disconnect}
                        className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm transition"
                    >
                        Disconnect
                    </button>
                </>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => connectUsingInjected("metamask")}
                        disabled={connecting}
                        className="px-3 py-1 rounded-md bg-[#E8831D] hover:brightness-95 text-white text-sm transition"
                    >
                        MetaMask
                    </button>

                    <button
                        type="button"
                        onClick={() => connectUsingInjected("coinbase")}
                        disabled={connecting}
                        className="px-3 py-1 rounded-md bg-[#2D9CDB] hover:brightness-95 text-white text-sm transition"
                    >
                        Coinbase Wallet
                    </button>
                </>
            )}
        </div>
    );
}
