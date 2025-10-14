/**
 * NFT Minting Routes
 */

import express from "express";
import {
    checkMintEligibility,
    mintNFT,
    getWalletRequests,
} from "../controllers/nft.controller";

const router = express.Router();

/**
 * GET /api/requests/:requestId/can-mint
 * Check if a request can be minted by the user
 */
router.get("/requests/:requestId/can-mint", checkMintEligibility);

/**
 * POST /api/requests/:requestId/mint
 * Mint NFT for a verified request
 * Body: { userWalletAddress: string }
 */
router.post("/requests/:requestId/mint", mintNFT);

/**
 * GET /api/wallet/:address/requests
 * Get all requests for a wallet with mint eligibility status
 */
router.get("/wallet/:address/requests", getWalletRequests);

export default router;
