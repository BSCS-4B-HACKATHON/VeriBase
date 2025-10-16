import { Request, Response } from "express";
import RequestModel from "../models/DocMetaSchema";
import * as storage from "../utils/pinataUtils";
import {
  unwrapAesKeyForServer,
  decryptField,
  decryptFileToSignedUrl,
} from "../utils/helpers";

/**
 * Delete request after successful client-side minting
 * POST /api/nft/delete-request/:requestId
 *
 * Called by client after NFT is minted on-chain
 * Removes the request from database since data now lives on blockchain
 */
export const deleteRequestAfterMint = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { userWalletAddress, transactionHash } = req.body;

    if (!requestId || !userWalletAddress) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
    }

    const request = await RequestModel.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found or already deleted",
      });
    }

    // Verify the wallet matches
    if (
      request.requesterWallet.toLowerCase() !== userWalletAddress.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        error: "Wallet address does not match request owner",
      });
    }

    // Delete the request
    await RequestModel.deleteOne({ requestId });

    console.log(`🗑️  Request ${requestId} deleted after successful mint`);
    console.log(`   Transaction: ${transactionHash || "N/A"}`);
    console.log(`   Data now lives on blockchain and IPFS`);

    res.json({
      success: true,
      message: "Request deleted successfully. Data is now on blockchain.",
    });
  } catch (error: any) {
    console.error("Error deleting request:", error);
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
 * Minted requests are deleted from DB after minting.
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
      metadataCid: request.metadataCid,
      canMint: request.status === "verified",
      filesCount: request.files.length,
    }));

    res.json({
      success: true,
      data: requestsWithStatus,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Decrypt NFT metadata (owner only)
 * POST /api/nft/decrypt-metadata
 *
 * Decrypts metadata stored on IPFS for the NFT owner
 */
export const decryptNFTMetadata = async (req: Request, res: Response) => {
  try {
    const { metadataCid, ownerAddress } = req.body;

    if (!metadataCid || !ownerAddress) {
      return res.status(400).json({
        success: false,
        error: "Missing metadataCid or ownerAddress",
      });
    }

    // Fetch metadata from IPFS
    let metadata: any;
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

    console.log(
      "📁 Files to decrypt:",
      fileEntries.length,
      fileEntries.map((f: any) => ({
        filename: f.filename,
        cid: f.cid,
        mime: f.mime,
      }))
    );

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
          console.log(
            `✅ Decrypted ${f.filename}: ${signedUrl.substring(0, 50)}...`
          );
          return { ...f, decryptedUrl: signedUrl };
        } catch (err) {
          console.warn(
            `❌ Failed to decrypt file ${f.filename || f.cid}:`,
            err
          );
          return { ...f, decryptedUrl: null, decryptError: true };
        }
      });

      const filesOut = await Promise.all(decryptTasks);
      decryptedMetadata.decryptedFiles = filesOut;
      console.log(
        "📦 Total decrypted files:",
        decryptedMetadata.decryptedFiles.length
      );
    } else {
      decryptedMetadata.decryptedFiles = fileEntries;
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
