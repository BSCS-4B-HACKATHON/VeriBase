import { BE_URL } from "./helpers";

export interface GlobalStats {
  totalRequests: number;
  pendingRequests: number;
  verifiedRequests: number;
  rejectedRequests: number;
  nationalIdRequests: number;
  landOwnershipRequests: number;
  totalUsers: number;
  totalNFTsMinted: number;
  nationalIdNFTsMinted: number;
  landOwnershipNFTsMinted: number;
  approvalRate: string;
  rejectionRate: string;
}

export interface UserStats {
  totalRequests: number;
  pendingRequests: number;
  verifiedRequests: number;
  rejectedRequests: number;
  nationalIdRequests: number;
  landOwnershipRequests: number;
  totalNFTsOwned: number;
  nationalIdNFTsOwned: number;
  landOwnershipNFTsOwned: number;
  recentRequests: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
    minimalPublicLabel?: string;
  }>;
}

/**
 * Fetch global statistics (all users, on-chain totals)
 */
export async function fetchGlobalStats(): Promise<GlobalStats | null> {
  try {
    const res = await fetch(`${BE_URL}/api/stats/global`);
    if (!res.ok) {
      throw new Error(`Failed to fetch global stats: ${res.status}`);
    }
    const data = await res.json();
    if (data.success) {
      return data.stats;
    }
    return null;
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return null;
  }
}

/**
 * Fetch user-specific statistics
 */
export async function fetchUserStats(
  walletAddress: string
): Promise<UserStats | null> {
  try {
    if (!walletAddress) {
      throw new Error("Wallet address is required");
    }
    const res = await fetch(`${BE_URL}/api/stats/user/${walletAddress}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch user stats: ${res.status}`);
    }
    const data = await res.json();
    if (data.success) {
      return data.stats;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return null;
  }
}
