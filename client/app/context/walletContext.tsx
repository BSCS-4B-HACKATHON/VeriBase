"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { createWalletClient, custom, type WalletClient } from "viem";
import { mainnet } from "viem/chains";

declare global {
    interface Window {
        ethereum?: any;
        walletClient?: any;
    }
}

type ProviderName = "metamask" | "coinbase" | "injected";

type WalletContextValue = {
    address: string | null;
    isConnected: boolean;
    provider?: any | null;
    walletClient: WalletClient | null;
    connecting: boolean;
    connect(providerName?: ProviderName): Promise<void>;
    disconnectWallet(): Promise<void>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [address, setAddress] = useState<string | null>(() =>
        typeof window !== "undefined"
            ? localStorage.getItem("vb_address")
            : null
    );
    const [provider, setProvider] = useState<any | null>(() =>
        typeof window !== "undefined" ? (window as any).ethereum ?? null : null
    );
    const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const providerInstance = (window as any).ethereum ?? null;
        setProvider(providerInstance);

        // initialize viem wallet client if provider and address exist
        (async () => {
            if (providerInstance) {
                try {
                    const wc = createWalletClient({
                        transport: custom(providerInstance),
                        chain: mainnet,
                    });
                    setWalletClient(wc as WalletClient);
                    // expose for other libs/debugging
                    (window as any).walletClient = wc;
                } catch (err) {
                    console.warn("viem createWalletClient failed:", err);
                }
            }
        })();
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const onAccounts = (accounts: string[] | string) => {
            const acc = Array.isArray(accounts) ? accounts[0] : accounts;
            if (acc) {
                setAddress(acc);
                localStorage.setItem("vb_address", acc);
                window.dispatchEvent(new CustomEvent("vb_wallet_connect"));
            } else {
                setAddress(null);
                localStorage.removeItem("vb_address");
                localStorage.removeItem("vb_provider");
                window.dispatchEvent(new CustomEvent("vb_wallet_disconnect"));
            }
        };

        const onDisconnect = async () => {
            await disconnectWallet();
            setAddress(null);
        };

        (window as any).ethereum?.on?.("accountsChanged", onAccounts);
        (window as any).ethereum?.on?.("disconnect", onDisconnect);

        const onStorage = (e: StorageEvent) => {
            if (e.key === "vb_address")
                setAddress(localStorage.getItem("vb_address"));
        };
        window.addEventListener("storage", onStorage);

        return () => {
            (window as any).ethereum?.removeListener?.(
                "accountsChanged",
                onAccounts
            );
            (window as any).ethereum?.removeListener?.(
                "disconnect",
                onDisconnect
            );
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    const connect = async (providerName: ProviderName = "injected") => {
        if (typeof window === "undefined") return;
        const injected = (window as any).ethereum;
        if (!injected) {
            alert("No injected wallet found (MetaMask/Coinbase).");
            return;
        }

        try {
            setConnecting(true);
            const accounts: string[] = await injected.request({
                method: "eth_requestAccounts",
            });
            const acc = accounts?.[0] ?? null;
            if (!acc) throw new Error("No account returned");

            // init viem client if not set
            try {
                const wc = createWalletClient({
                    transport: custom(injected),
                    chain: mainnet,
                });
                setWalletClient(wc as WalletClient);
                (window as any).walletClient = wc;
            } catch (err) {
                console.warn("viem createWalletClient failed:", err);
            }

            setAddress(acc);
            localStorage.setItem("vb_address", acc);
            localStorage.setItem("vb_provider", providerName);
            window.dispatchEvent(new CustomEvent("vb_wallet_connect"));
        } catch (err) {
            console.error("connect failed", err);
            throw err;
        } finally {
            setConnecting(false);
        }
    };

    const clearSiteData = async () => {
        try {
            if ("caches" in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
            }
        } catch (err) {
            console.warn("clearSiteData failed:", err);
        }
        try {
            localStorage.removeItem("vb_address");
            localStorage.removeItem("vb_provider");
        } catch {}
        try {
            sessionStorage.removeItem("connectedAccount");
        } catch {}
    };

    const disconnectWallet = async () => {
        try {
            await clearSiteData();

            // attempt to disconnect walletClient (walletconnect etc)
            try {
                const wc = (window as any).walletClient ?? walletClient;
                if (wc && typeof (wc as any).disconnect === "function") {
                    await (wc as any).disconnect();
                }
            } catch (err) {
                console.warn("walletClient.disconnect() failed:", err);
            }

            // provider explicit disconnect (rare for MetaMask)
            try {
                if (
                    provider?.disconnect &&
                    typeof provider.disconnect === "function"
                ) {
                    await provider.disconnect();
                }
            } catch (err) {
                console.warn("provider.disconnect() failed:", err);
            }

            // remove listeners
            try {
                if (provider?.removeListener) {
                    provider.removeListener("accountsChanged", () => {});
                    provider.removeListener("chainChanged", () => {});
                    provider.removeListener("disconnect", () => {});
                }
            } catch (err) {
                console.warn("removeListener failed:", err);
            }

            setAddress(null);
            setWalletClient(null);
            window.dispatchEvent(new CustomEvent("vb_wallet_disconnect"));
        } catch (err) {
            console.warn("disconnect error:", err);
        }
    };

    const value = useMemo(
        () => ({
            address,
            isConnected: !!address,
            provider,
            walletClient,
            connecting,
            connect,
            disconnectWallet,
        }),
        [address, provider, walletClient, connecting]
    );

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) {
        throw new Error("useWallet must be used within WalletProvider");
    }
    return ctx;
}
