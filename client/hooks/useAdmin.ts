import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

/**
 * Custom hook to check if the connected wallet is an admin
 * Fetches admin status from backend database
 */
export function useAdmin() {
  const { address, isConnected } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Reset states
      setIsLoading(true);
      setError(null);

      // If not connected or no address, user is not admin
      if (!isConnected || !address) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_BE_URL ||
          "http://localhost:6969";
        const response = await fetch(`${apiUrl}/api/admin/check/${address}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log("Admin check response:", data);

        if (data.success) {
          setIsAdmin(data.isAdmin);
        } else {
          setIsAdmin(false);
          setError(data.message || "Failed to check admin status");
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [address, isConnected]);

  return {
    isAdmin,
    isLoading,
    error,
    address,
  };
}
