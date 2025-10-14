"use client";

import { set } from "date-fns";
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { createWalletClient, custom, http, type WalletClient } from "viem";
import { baseSepolia, mainnet } from "viem/chains";

declare global {
    interface Window {
        ethereum?: any;
        walletClient?: any;
    }
}

type ProviderName = "metamask" | "coinbase wallet" | "injected";

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
            console.error("No injected ethereum provider found");
            return;
        }

        // If multiple wallets are injected, choose the one the user requested.
        // Use a deterministic scoring function so the requested wallet wins.
        let chosenProvider = injected;
        try {
            const providers = Array.isArray(injected.providers)
                ? injected.providers
                : null;
            if (providers && providers.length) {
                console.debug(
                    "detected injected.providers (brief):",
                    providers.map((p: any) => ({
                        ctor: p?.constructor?.name,
                        flags: {
                            isMetaMask: !!p.isMetaMask,
                            _isMetaMask: !!p._isMetaMask,
                            isCoinbaseWallet: !!p.isCoinbaseWallet,
                            isCoinbaseBrowser: !!p.isCoinbaseBrowser,
                            isPhantom: !!p.isPhantom,
                        },
                    }))
                );

                const scoreProvider = (
                    p: any,
                    target: "metamask" | "coinbase" | "any"
                ) => {
                    let score = 0;
                    const ctor = String(
                        p?.constructor?.name || ""
                    ).toLowerCase();
                    const keys = String(Object.keys(p || [])).toLowerCase();
                    const hasRequest = typeof p.request === "function";

                    // positive signals
                    if (p.isMetaMask) score += 100;
                    if (p._isMetaMask) score += 80;
                    if (ctor.includes("metamask") || keys.includes("metamask"))
                        score += 40;
                    if (p.isCoinbaseWallet) score += 100;
                    if (p.isCoinbaseBrowser) score += 80;
                    if (ctor.includes("coinbase") || keys.includes("coinbase"))
                        score += 40;
                    if (hasRequest) score += 10;

                    // negative signals (avoid Phantom/Solana/non-EVM)
                    if (p.isPhantom) score -= 200;
                    if (p.isSolana) score -= 200;
                    if (ctor.includes("phantom") || keys.includes("phantom"))
                        score -= 150;

                    // bias for target: boost target positive, penalize competing wallet
                    if (target === "metamask") {
                        if (p.isCoinbaseWallet || p.isCoinbaseBrowser)
                            score -= 80;
                    } else if (target === "coinbase") {
                        if (p.isMetaMask || p._isMetaMask) score -= 80;
                    }
                    return score;
                };

                const target = providerName.toLowerCase().includes("coinbase")
                    ? "coinbase"
                    : providerName.toLowerCase().includes("metamask")
                    ? "metamask"
                    : "any";

                // score all providers and pick highest
                let best: any = null;
                let bestScore = -Infinity;
                for (const p of providers) {
                    const s = scoreProvider(p, target as any);
                    console.debug("provider score", {
                        ctor: p?.constructor?.name,
                        score: s,
                    });
                    if (s > bestScore) {
                        bestScore = s;
                        best = p;
                    }
                }

                if (best && bestScore > -100) {
                    chosenProvider = best;
                } else {
                    chosenProvider = injected;
                }

                console.debug("chosenProvider final:", {
                    ctor: chosenProvider?.constructor?.name,
                    bestScore,
                    isMetaMask:
                        !!chosenProvider?.isMetaMask ||
                        !!chosenProvider?._isMetaMask,
                    isCoinbaseWallet:
                        !!chosenProvider?.isCoinbaseWallet ||
                        !!chosenProvider?.isCoinbaseBrowser,
                });
            }
        } catch (e) {
            console.warn(
                "provider selection failed, falling back to injected",
                e
            );
            chosenProvider = injected;
        }

        try {
            setConnecting(true);

            // optional try to request permissions (may be unsupported)
            try {
                await chosenProvider.request?.({
                    method: "wallet_requestPermissions",
                    params: [{ eth_accounts: {} }],
                });
            } catch (error) {
                console.warn("wallet_requestPermissions (ignored):", error);
            }

            // ask the chosen provider for accounts (this will open the right wallet UI)
            const accounts: string[] = await chosenProvider.request({
                method: "eth_requestAccounts",
            });

            const acc = accounts?.[0] ?? null;
            if (!acc) throw new Error("No account returned");

            // init viem client if not set
            try {
                const wc = createWalletClient({
                    transport: custom(chosenProvider),
                    chain: baseSepolia,
                });
                setWalletClient(wc as WalletClient);
                (window as any).walletClient = wc;
                // persist which specific injected provider we selected so future actions use it
                setProvider(chosenProvider);
            } catch (err) {
                console.warn("viem createWalletClient failed:", err);
            }

            setAddress(acc);
            localStorage.setItem("vb_address", acc);
            localStorage.setItem("vb_provider", providerName);
            window.dispatchEvent(new CustomEvent("vb_wallet_connect"));
        } catch (err) {
            console.error("connect failed", err);
            setAddress(null);
            localStorage.removeItem("vb_address");
            localStorage.removeItem("vb_provider");
            window.dispatchEvent(new CustomEvent("vb_wallet_disconnect"));
            throw err;
        } finally {
            setConnecting(false);
        }
    };

    const clearSiteData = async () => {
        // remove all cookies and local storage and cache
        try {
            if ("clearSiteData" in navigator) {
                // @ts-ignore
                await navigator.clearSiteData({
                    cache: true,
                    cookies: true,
                    storage: true,
                    executionContexts: true,
                });
            }
        } catch (err) {
            console.warn("clearSiteData failed:", err);
        }
        try {
            // best-effort clear cookies
            const cookies = document.cookie.split(";");
            for (const cookie of cookies) {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie =
                    name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
            console.log("Cookies cleared");
        } catch {}
        try {
            localStorage.clear();
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
            window.location.reload();
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
