"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

/**
 * User Route Protection Component
 * Wrap user pages with this component to ensure only connected wallets can access
 */
export function UserGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting } = useAccount();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Wait for wallet reconnection to have time to start
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1500); // Give reconnection enough time to start, even on slow connections

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only check after initial delay and when not connecting
    if (isReady && !isConnecting) {
      setHasChecked(true);
      // Redirect to home if wallet is not connected
      if (!isConnected) {
        router.replace("/");
      }
    }
  }, [isConnected, isConnecting, isReady, router]);

  // Show loading while initializing, wallet is connecting, or checking
  if (!isReady || isConnecting || !hasChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isConnecting ? "Connecting wallet..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Redirect if wallet not connected (don't render anything)
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">
            Wallet not connected. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  // Render user content
  return <>{children}</>;
}
