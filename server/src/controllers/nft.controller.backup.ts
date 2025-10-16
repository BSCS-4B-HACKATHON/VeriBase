/**
 * NFT Minting Controller
 *
 * Handles NFT minting for verified requests
 * Once minted, the request is removed from DB (data now lives on blockchain)
 */

import RequestModel from "../models/DocMetaSchema";
import { Request, Response } from "express";
import {
  mintNFT as mintNFTService,
  areContractsInitialized,
  type DocMeta,
} from "../services/nft.service";
import * as storage from "../utils/pinataUtils";
import {
  unwrapAesKeyForServer,
  decryptField,
  decryptFileToSignedUrl,
} from "../utils/helpers";

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
        error: "Request not found or already minted (deleted from DB)",
      });
    }

    // Check if contracts are initialized
    if (!areContractsInitialized()) {
      return res.status(503).json({
        success: false,
        error: "NFT contracts not initialized. Please contact administrator.",
      });
    }

    // Only verified requests can be minted
    const canMint = request.status === "verified";

    res.json({
      success: true,
      data: {
        requestId: request.requestId,
        requestType: request.requestType,
        status: request.status,
        canMint,
        reason: canMint
          ? "Request is verified and ready to mint"
          : `Request status is "${request.status}". Must be "verified" to mint.`,
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
 * Mint NFT for verified request
 * POST /api/requests/:requestId/mint
 *
 * After successful minting, the request is DELETED from the database.
 * All data now lives on the blockchain as NFT metadata.
 */
export const mintNFT = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { userWalletAddress } = req.body;

    const request = await RequestModel.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found or already minted",
      });
    }

    // Validation checks
    if (request.status !== "verified") {
      return res.status(400).json({
        success: false,
        error: `Cannot mint: Request status is "${request.status}". Must be "verified".`,
      });
    }

    if (
      request.requesterWallet.toLowerCase() !== userWalletAddress.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        error: "Wallet address does not match request owner",
      });
    }

    // Check if contracts are initialized
    if (!areContractsInitialized()) {
      return res.status(503).json({
        success: false,
        error: "NFT contracts not initialized. Please contact administrator.",
      });
    }

    // ============================================
    // MINT NFT ON BLOCKCHAIN
    // ============================================
    try {
      console.log(
        `🚀 Minting ${request.requestType} NFT for request ${requestId}...`
      );

      // Prepare metadata from request files
      const metadata: DocMeta[] = request.files.map((file) => ({
        label: file.filename,
        value: file.ciphertextHash || file.cid,
        encrypted: !!file.ciphertextHash, // true if encrypted
      }));

      // Add additional metadata fields
      metadata.unshift({
        label: "document_type",
        value: request.requestType,
        encrypted: false,
      });

      metadata.push({
        label: "request_id",
        value: request.requestId,
        encrypted: false,
      });

      // Call NFT minting service
      const mintResult = await mintNFTService({
        requestId: request.requestId,
        requesterWallet: request.requesterWallet,
        requestType: request.requestType as "national_id" | "land_ownership",
        documents: metadata,
      });

      console.log(`✅ NFT minted successfully!`);
      console.log(`   Token ID: ${mintResult.tokenId}`);
      console.log(`   Transaction: ${mintResult.transactionHash}`);
      console.log(`   Contract: ${mintResult.contractAddress}`);

      // ============================================
      // DELETE REQUEST FROM DATABASE
      // ============================================
      // The data now lives on the blockchain, no need to keep it in DB
      await RequestModel.deleteOne({ requestId });
      console.log(
        `🗑️  Request ${requestId} deleted from database (data now on blockchain)`
      );

      res.json({
        success: true,
        message:
          "NFT minted successfully! Request data has been moved to blockchain.",
        data: {
          requestId: request.requestId,
          requestType: request.requestType,
          tokenId: mintResult.tokenId,
          transactionHash: mintResult.transactionHash,
          contractAddress: mintResult.contractAddress,
          network: mintResult.network,
          explorerUrl: mintResult.explorerUrl,
          note: "Request has been deleted from database. All data is now on blockchain.",
        },
      });
    } catch (mintError: any) {
      console.error(`❌ Blockchain minting failed:`, mintError);

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
 * Get all requests for a wallet
 * GET /api/wallet/:address/requests
 *
 * Note: Only returns requests that haven't been minted yet.
 * Minted requests are deleted from DB.
 */
export const getWalletRequests = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const requests = await RequestModel.find({
      requesterWallet: address,
    }).sort({ createdAt: -1 });

    const requestsWithStatus = requests.map((request) => ({
      requestId: request.requestId,
      requestType: request.requestType,
      status: request.status,
      createdAt: request.createdAt,
      canMint: request.status === "verified",
      filesCount: request.files.length,
      note:
        request.status === "verified"
          ? "Ready to mint - data will be moved to blockchain"
          : "Waiting for verification",
    }));

    res.json({
      success: true,
      data: requestsWithStatus,
      note: "Minted requests are not shown here (they're deleted after minting)",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Decrypt NFT metadata from IPFS
 * POST /api/nft/decrypt-metadata
 * Body: { metadataCid: string, ownerAddress: string }
 * 
 * Fetches metadata from IPFS and decrypts encrypted fields using server keys
 */
export const decryptNFTMetadata = async (req: Request, res: Response) => {
  try {
    const { metadataCid, ownerAddress } = req.body;

    if (!metadataCid) {
      return res.status(400).json({
        success: false,
        error: "metadataCid is required",
      });
    }

    // Fetch metadata from IPFS
    let metadata: any = null;
    try {
      metadata = await storage.fetchJsonByCid(metadataCid);
    } catch (err) {
      console.warn("failed to fetch metadata CID", metadataCid, err);
      return res.status(404).json({
        success: false,
        error: "Failed to fetch metadata from IPFS",
      });
    }

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: "Metadata not found",
      });
    }

    // Attempt to obtain AES key for server-side decryption
    let rawAesKey: Buffer | null = null;
    if (metadata?.encryptedAesKeyForServer) {
      try {
        rawAesKey = await unwrapAesKeyForServer(
          metadata.encryptedAesKeyForServer
        );
      } catch (err) {
        console.warn("failed to unwrap AES key for server", err);
        rawAesKey = null;
      }
    }

    const decryptedMetadata: any = { ...metadata };

    // Decrypt scalar encrypted fields if we have AES key
    if (
      rawAesKey &&
      metadata?.encryptedFields &&
      typeof metadata.encryptedFields === "object"
    ) {
      const entries = Object.entries(metadata.encryptedFields);
      const decryptPromises = entries.map(async ([k, v]) => {
        try {
          if (typeof v === "string") {
            const dec = await decryptField(rawAesKey, {
              ciphertextBase64: v,
              iv: metadata.iv ?? "",
            } as any);
            return [k, dec] as [string, any];
          } else {
            const dec = await decryptField(rawAesKey, v as any);
            return [k, dec] as [string, any];
          }
        } catch (err) {
          console.warn(`failed to decrypt field ${k}`, err);
          return [k, "[decryption_failed]"] as [string, any];
        }
      });

      const decryptedEntries = await Promise.all(decryptPromises);
      decryptedMetadata.decryptedFields = Object.fromEntries(decryptedEntries);
    }

    // Build normalized files array (same approach as request controller)
    const metaFiles = Array.isArray(metadata?.files) ? metadata.files : [];
    let fileEntries: any[] = [];
    
    if (metaFiles.length) {
      fileEntries = metaFiles.map((mf: any) => ({
        cid: mf.cid,
        filename: mf.filename ?? mf.name ?? mf.label,
        mime: mf.mime,
        size: mf.size,
        iv: mf.iv,
        tag: mf.tag,
        meta: mf,
      }));
    }

    console.log("📁 Files to decrypt:", fileEntries.length, fileEntries.map((f: any) => ({ 
      filename: f.filename,
      cid: f.cid,
      mime: f.mime 
    })));

    // Decrypt files if we have AES key (same approach as request controller)
    if (rawAesKey && fileEntries.length) {
      const decryptTasks = fileEntries.map(async (f: any) => {
        try {
          const encryptedStream = await storage.fetchFileStreamByCid(f.cid);
          const signedUrl = await decryptFileToSignedUrl(
            encryptedStream,
            rawAesKey,
            f
          );
          console.log(`✅ Decrypted ${f.filename}: ${signedUrl.substring(0, 50)}...`);
          return { ...f, decryptedUrl: signedUrl };
        } catch (err) {
          console.warn(`❌ Failed to decrypt file ${f.filename || f.cid}:`, err);
          return { ...f, decryptedUrl: null, decryptError: true };
        }
      });

      const filesOut = await Promise.all(decryptTasks);
      decryptedMetadata.files = filesOut;
      console.log("📦 Total decrypted files:", decryptedMetadata.files.length);
    } else {
      decryptedMetadata.files = fileEntries;
    }

    res.json({
      success: true,
      data: decryptedMetadata,
    });
  } catch (error: any) {
    console.error("Error decrypting NFT metadata:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
