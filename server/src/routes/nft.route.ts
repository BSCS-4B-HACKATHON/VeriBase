/**
 * NFT Routes
 */

import express from "express";
import {
  getWalletRequests,
  decryptNFTMetadata,
  deleteRequestAfterMint,
} from "../controllers/nft.controller";

const router = express.Router();

/**
 * GET /api/wallet/:address/requests
 * Get all requests for a wallet (only unminted requests)
 */
router.get("/wallet/:address/requests", getWalletRequests);

/**
 * POST /api/nft/decrypt-metadata
 * Decrypt NFT metadata from IPFS (owner only)
 * Body: { metadataCid: string, ownerAddress: string }
 */
router.post("/nft/decrypt-metadata", decryptNFTMetadata);

/**
 * POST /api/nft/delete-request/:requestId
 * Delete request after successful client-side minting
 * Body: { userWalletAddress: string, transactionHash?: string }
 */
router.post("/nft/delete-request/:requestId", deleteRequestAfterMint);

export default router;
