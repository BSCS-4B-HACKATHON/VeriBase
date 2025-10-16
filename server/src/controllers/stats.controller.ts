import { Request, Response } from "express";
import RequestModel from "../models/DocMetaSchema";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import NationalIdNFTABI from "../abis/NationalIdNFT.json";
import LandOwnershipNFTABI from "../abis/LandOwnershipNFT.json";

const NATIONAL_ID_NFT_ADDRESS = process.env
  .NATIONAL_ID_NFT_ADDRESS as `0x${string}`;
const LAND_OWNERSHIP_NFT_ADDRESS = process.env
  .LAND_OWNERSHIP_NFT_ADDRESS as `0x${string}`;
const BLOCKCHAIN_RPC_URL =
  process.env.BLOCKCHAIN_RPC_URL || "https://sepolia.base.org";

// Create public client for reading from blockchain
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(BLOCKCHAIN_RPC_URL),
});

/**
 * Get global statistics including database and on-chain data
 */
export const GetGlobalStatsHandler = async (req: Request, res: Response) => {
  try {
    // Database stats
    const [
      totalRequests,
      pendingRequests,
      verifiedRequests,
      rejectedRequests,
      nationalIdRequests,
      landOwnershipRequests,
      totalUsers,
    ] = await Promise.all([
      RequestModel.countDocuments(),
      RequestModel.countDocuments({ status: "pending" }),
      RequestModel.countDocuments({ status: "verified" }),
      RequestModel.countDocuments({ status: "rejected" }),
      RequestModel.countDocuments({ requestType: "national_id" }),
      RequestModel.countDocuments({ requestType: "land_ownership" }),
      RequestModel.distinct("requesterWallet").then(
        (wallets) => wallets.length
      ),
    ]);

    // On-chain stats - total minted NFTs
    let nationalIdNFTsMinted = 0;
    let landOwnershipNFTsMinted = 0;

    try {
      if (NATIONAL_ID_NFT_ADDRESS) {
        const totalSupply = await publicClient.readContract({
          address: NATIONAL_ID_NFT_ADDRESS,
          abi: NationalIdNFTABI.abi,
          functionName: "totalSupply",
        });
        nationalIdNFTsMinted = Number(totalSupply);
      }
    } catch (error) {
      console.error("Error fetching National ID NFT total supply:", error);
    }

    try {
      if (LAND_OWNERSHIP_NFT_ADDRESS) {
        const totalSupply = await publicClient.readContract({
          address: LAND_OWNERSHIP_NFT_ADDRESS,
          abi: LandOwnershipNFTABI.abi,
          functionName: "totalSupply",
        });
        landOwnershipNFTsMinted = Number(totalSupply);
      }
    } catch (error) {
      console.error("Error fetching Land Ownership NFT total supply:", error);
    }

    const totalNFTsMinted = nationalIdNFTsMinted + landOwnershipNFTsMinted;

    res.json({
      success: true,
      stats: {
        // Database stats
        totalRequests,
        pendingRequests,
        verifiedRequests,
        rejectedRequests,
        nationalIdRequests,
        landOwnershipRequests,
        totalUsers,

        // On-chain stats
        totalNFTsMinted,
        nationalIdNFTsMinted,
        landOwnershipNFTsMinted,

        // Calculated stats
        approvalRate:
          totalRequests > 0
            ? ((verifiedRequests / totalRequests) * 100).toFixed(1)
            : "0.0",
        rejectionRate:
          totalRequests > 0
            ? ((rejectedRequests / totalRequests) * 100).toFixed(1)
            : "0.0",
      },
    });
  } catch (error) {
    console.error("Error fetching global stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch global statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get user-specific statistics
 */
export const GetUserStatsHandler = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    // Database stats for this user
    const [
      totalRequests,
      pendingRequests,
      verifiedRequests,
      rejectedRequests,
      nationalIdRequests,
      landOwnershipRequests,
      recentRequests,
    ] = await Promise.all([
      RequestModel.countDocuments({ requesterWallet: walletAddress }),
      RequestModel.countDocuments({
        requesterWallet: walletAddress,
        status: "pending",
      }),
      RequestModel.countDocuments({
        requesterWallet: walletAddress,
        status: "verified",
      }),
      RequestModel.countDocuments({
        requesterWallet: walletAddress,
        status: "rejected",
      }),
      RequestModel.countDocuments({
        requesterWallet: walletAddress,
        requestType: "national_id",
      }),
      RequestModel.countDocuments({
        requesterWallet: walletAddress,
        requestType: "land_ownership",
      }),
      RequestModel.find({ requesterWallet: walletAddress })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // On-chain stats - NFTs owned by this user
    let nationalIdNFTsOwned = 0;
    let landOwnershipNFTsOwned = 0;

    try {
      if (NATIONAL_ID_NFT_ADDRESS) {
        const balance = await publicClient.readContract({
          address: NATIONAL_ID_NFT_ADDRESS,
          abi: NationalIdNFTABI.abi,
          functionName: "balanceOf",
          args: [walletAddress as `0x${string}`],
        });
        nationalIdNFTsOwned = Number(balance);
      }
    } catch (error) {
      console.error("Error fetching user National ID NFT balance:", error);
    }

    try {
      if (LAND_OWNERSHIP_NFT_ADDRESS) {
        const balance = await publicClient.readContract({
          address: LAND_OWNERSHIP_NFT_ADDRESS,
          abi: LandOwnershipNFTABI.abi,
          functionName: "balanceOf",
          args: [walletAddress as `0x${string}`],
        });
        landOwnershipNFTsOwned = Number(balance);
      }
    } catch (error) {
      console.error("Error fetching user Land Ownership NFT balance:", error);
    }

    const totalNFTsOwned = nationalIdNFTsOwned + landOwnershipNFTsOwned;

    res.json({
      success: true,
      stats: {
        // Database stats
        totalRequests,
        pendingRequests,
        verifiedRequests,
        rejectedRequests,
        nationalIdRequests,
        landOwnershipRequests,

        // On-chain stats
        totalNFTsOwned,
        nationalIdNFTsOwned,
        landOwnershipNFTsOwned,

        // Recent activity
        recentRequests: recentRequests.map((req: any) => ({
          id: req.requestId,
          type: req.requestType,
          status: req.status,
          createdAt: req.createdAt,
          minimalPublicLabel: req.minimalPublicLabel,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
