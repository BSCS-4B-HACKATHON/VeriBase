"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

/**
 * Admin Route Protection Component
 * Wrap admin pages with this component to ensure only admins can access
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, error } = useAdmin();
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
    // Only check after initial delay, when not connecting, and admin check complete
    if (isReady && !isConnecting && !isLoading) {
      setHasChecked(true);
      // Only redirect if wallet is connected but user is not admin
      if (isConnected && !isAdmin) {
        // Redirect non-admins to home page
        router.replace("/");
      } else if (!isConnected) {
        // Redirect if wallet is not connected
        router.replace("/");
      }
    }
  }, [isAdmin, isLoading, isConnected, isConnecting, isReady, router]);

  // Show loading while initializing, wallet is connecting, or checking admin status
  if (!isReady || isConnecting || isLoading || !hasChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isConnecting
              ? "Connecting wallet..."
              : "Verifying admin access..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error if check failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md">
          <p className="text-red-500 mb-4 text-lg font-semibold">
            Access Check Failed
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Redirect if wallet not connected or not admin (don't render anything)
  if (!isConnected || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">
            {!isConnected
              ? "Wallet not connected. Redirecting..."
              : "Redirecting..."}
          </p>
        </div>
      </div>
    );
  }

  // Render admin content
  return <>{children}</>;
}
