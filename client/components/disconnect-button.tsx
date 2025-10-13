"use client";
import { useWallet } from "@/app/context/walletContext";
import React from "react";

export function DisconnectButton() {
    const { disconnectWallet } = useWallet();

    const handle = async () => {
        await disconnectWallet();
        // optional: refresh UI/server-rendered components if desired
        // window.location.reload();
    };

    return (
        <button
            type="button"
            onClick={handle}
            className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm transition"
        >
            Disconnect
        </button>
    );
}
