"use client";
import React from "react";
import { useWallet } from "@/app/context/walletContext";

export default function ConnectWallet() {
    const { address, connecting, connect, disconnectWallet } = useWallet();

    const handleConnect = async (providerName: "metamask" | "coinbase") => {
        try {
            await connect(providerName);
        } catch (err) {
            console.error("connect failed", err);
            alert("Connection failed");
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnectWallet();
        } catch (err) {
            console.error("disconnect failed", err);
            alert("Disconnect failed");
        }
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
                        onClick={handleDisconnect}
                        className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm transition"
                    >
                        Disconnect
                    </button>
                </>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => handleConnect("metamask")}
                        disabled={connecting}
                        className="px-3 py-1 rounded-md bg-[#E8831D] hover:brightness-95 text-white text-sm transition disabled:opacity-60"
                    >
                        MetaMask
                    </button>

                    <button
                        type="button"
                        onClick={() => handleConnect("coinbase")}
                        disabled={connecting}
                        className="px-3 py-1 rounded-md bg-[#2D9CDB] hover:brightness-95 text-white text-sm transition disabled:opacity-60"
                    >
                        Coinbase Wallet
                    </button>
                </>
            )}
        </div>
    );
}
