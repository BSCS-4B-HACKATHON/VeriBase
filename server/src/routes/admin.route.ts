import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { Admin } from "../models/Admin";

const adminRouter = Router();

// ============ Admin Wallet Management ============

/**
 * Check if a wallet address is an admin
 * GET /api/admin/check/:walletAddress
 */
adminRouter.get("/check/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    // console.log("🔍 Checking admin status for:", walletAddress);

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address format",
      });
    }

    const isAdmin = await (Admin as any).isAdmin(walletAddress);
    // console.log("✅ Admin check result:", { walletAddress, isAdmin });

    return res.json({
      success: true,
      isAdmin,
      walletAddress: walletAddress,
    });
  } catch (error) {
    console.error("❌ Error checking admin status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check admin status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get all active admin wallets
 * GET /api/admin/list
 */
adminRouter.get("/list", async (req, res) => {
  try {
    const admins = await (Admin as any).getActiveAdmins();

    return res.json({
      success: true,
      admins,
      count: admins.length,
    });
  } catch (error) {
    console.error("Error fetching admin list:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin list",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============ Admin Request Management ============

// Get all requests (with optional filters)
adminRouter.get("/requests", adminController.GetAllRequestsHandler);

// Get detailed request by ID (admin access - no wallet check)
adminRouter.get(
  "/requests/:requestId",
  adminController.GetAdminRequestByIdHandler
);

// Get statistics
adminRouter.get("/stats", adminController.GetStatsHandler);

// Approve a request
adminRouter.put(
  "/requests/:requestId/approve",
  adminController.ApproveRequestHandler
);

// Reject a request
adminRouter.put(
  "/requests/:requestId/reject",
  adminController.RejectRequestHandler
);

export default adminRouter;
