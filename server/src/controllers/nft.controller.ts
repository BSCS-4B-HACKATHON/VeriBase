/**
 * NFT Minting Controller
 * 
 * Handles user-initiated NFT minting after admin verification
 */

import RequestModel from "../models/DocMetaSchema";
import { Request, Response } from "express";
import { mintNFTForUser } from "../services/blockchain.service";

/**
 * Check if user can mint NFT for their request
 * GET /api/requests/:requestId/can-mint
 */
export const checkMintEligibility = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;

        const request = await RequestModel.findOne({ requestId });

        if (!request) {
            return res.status(404).json({
                success: false,
                error: "Request not found",
            });
        }

        // Determine button state and action
        let canMint = false;
        let buttonText = "View";
        let buttonAction = "view";
        let reason = "";

        if (request.status === "pending") {
            buttonText = "View";
            buttonAction = "view";
            reason = "Request is pending admin verification";
        } else if (request.status === "rejected") {
            buttonText = "View";
            buttonAction = "view";
            reason = "Request was rejected";
        } else if (request.status === "verified" && !request.nftMinted) {
            buttonText = "Mint";
            buttonAction = "mint";
            canMint = true;
            reason = "Request is verified and ready to mint";
        } else if (request.status === "verified" && request.nftMinted) {
            buttonText = "View NFT";
            buttonAction = "viewNFT";
            reason = "NFT already minted";
        }

        res.json({
            success: true,
            data: {
                requestId: request.requestId,
                status: request.status,
                canMint,
                buttonText,
                buttonAction,
                reason,
                nftMinted: request.nftMinted || false,
                nftTokenId: request.nftTokenId,
                nftTransactionHash: request.nftTransactionHash,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Mint NFT for verified request (user-initiated)
 * POST /api/requests/:requestId/mint
 */
export const mintNFT = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const { userWalletAddress } = req.body; // From authenticated user

        const request = await RequestModel.findOne({ requestId });

        if (!request) {
            return res.status(404).json({
                success: false,
                error: "Request not found",
            });
        }

        // Validation checks
        if (request.status !== "verified") {
            return res.status(400).json({
                success: false,
                error: `Cannot mint: Request status is "${request.status}". Must be "verified".`,
            });
        }

        if (request.nftMinted) {
            return res.status(400).json({
                success: false,
                error: "NFT already minted for this request",
                nftTokenId: request.nftTokenId,
                nftTransactionHash: request.nftTransactionHash,
            });
        }

        if (
            request.requesterWallet.toLowerCase() !==
            userWalletAddress.toLowerCase()
        ) {
            return res.status(403).json({
                success: false,
                error: "Wallet address does not match request owner",
            });
        }

        // ============================================
        // ACTUAL BLOCKCHAIN MINTING (Base Sepolia)
        // ============================================
        try {
            console.log(`🚀 Starting blockchain minting for request ${requestId}...`);

            // Prepare request data for blockchain minting
            const mintRequest = {
                requestId: request.requestId,
                requesterWallet: request.requesterWallet,
                requestType: request.requestType,
                files: request.files,
                status: request.status,
            };

            // Call blockchain minting service
            const mintResult = await mintNFTForUser(mintRequest);

            // Update request in database with blockchain data
            request.nftMinted = true;
            request.nftTokenId = mintResult.tokenIds[0]; // First token ID
            request.nftTransactionHash = mintResult.transactionHash;
            request.nftMintedAt = new Date();

            await request.save();

            console.log(`✅ NFT minted successfully!`);
            console.log(`   Token ID: ${mintResult.tokenIds[0]}`);
            console.log(`   Transaction: ${mintResult.transactionHash}`);

            res.json({
                success: true,
                message: "NFT minted successfully!",
                data: {
                    requestId: request.requestId,
                    tokenId: mintResult.tokenIds[0],
                    tokenIds: mintResult.tokenIds,
                    transactionHash: mintResult.transactionHash,
                    mintedAt: request.nftMintedAt,
                    totalTokensMinted: mintResult.tokenIds.length,
                    network: "Base Sepolia",
                    explorerUrl: `https://sepolia.basescan.org/tx/${mintResult.transactionHash}`,
                },
            });
        } catch (mintError: any) {
            console.error(`❌ Blockchain minting failed:`, mintError);

            // Return detailed error to frontend
            return res.status(500).json({
                success: false,
                error: "Blockchain minting failed",
                details: mintError.message,
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Get all requests for a wallet with mint status
 * GET /api/wallet/:address/requests
 */
export const getWalletRequests = async (req: Request, res: Response) => {
    try {
        const { address } = req.params;

        const requests = await RequestModel.find({
            requesterWallet: address,
        }).sort({ createdAt: -1 });

        const requestsWithMintStatus = requests.map((request) => {
            let buttonText = "View";
            let buttonAction = "view";
            let canMint = false;

            if (request.status === "pending") {
                buttonText = "View";
                buttonAction = "view";
            } else if (request.status === "rejected") {
                buttonText = "View";
                buttonAction = "view";
            } else if (
                request.status === "verified" &&
                !request.nftMinted
            ) {
                buttonText = "Mint";
                buttonAction = "mint";
                canMint = true;
            } else if (
                request.status === "verified" &&
                request.nftMinted
            ) {
                buttonText = "View NFT";
                buttonAction = "viewNFT";
            }

            return {
                requestId: request.requestId,
                requestType: request.requestType,
                status: request.status,
                createdAt: request.createdAt,
                canMint,
                buttonText,
                buttonAction,
                nftMinted: request.nftMinted || false,
                nftTokenId: request.nftTokenId,
                nftTransactionHash: request.nftTransactionHash,
                filesCount: request.files.length,
            };
        });

        res.json({
            success: true,
            data: requestsWithMintStatus,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
