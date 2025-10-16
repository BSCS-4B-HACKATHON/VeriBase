import { Request, Response } from "express";
import RequestModel from "../models/DocMetaSchema";
import * as storage from "../utils/pinataUtils";
import {
  unwrapAesKeyForServer,
  decryptField,
  decryptFileToSignedUrl,
} from "../utils/helpers";

/**
 * Get all requests (for admin dashboard)
 * Optional filters: status, requestType
 */
export async function GetAllRequestsHandler(req: Request, res: Response) {
  try {
    const { status, requestType, limit = "50", skip = "0" } = req.query;

    const filter: any = {};

    if (status) {
      const validStatuses = ["pending", "verified", "rejected"];
      if (validStatuses.includes(String(status).toLowerCase())) {
        filter.status = String(status).toLowerCase();
      }
    }

    if (requestType) {
      const rt = String(requestType).toLowerCase();
      if (rt === "national_id" || rt === "land_ownership") {
        filter.requestType = rt;
      }
    }

    const requests = await RequestModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(String(limit)))
      .skip(parseInt(String(skip)))
      .lean();

    const total = await RequestModel.countDocuments(filter);

    return res.status(200).json({
      ok: true,
      requests,
      total,
      limit: parseInt(String(limit)),
      skip: parseInt(String(skip)),
    });
  } catch (error) {
    console.error("GetAllRequestsHandler error:", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

/**
 * Approve a request (change status to "verified")
 * Updates both DB and IPFS metadata
 */
export async function ApproveRequestHandler(req: Request, res: Response) {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({ ok: false, error: "missing requestId" });
    }

    const request = await RequestModel.findOne({ requestId });

    if (!request) {
      return res.status(404).json({ ok: false, error: "request not found" });
    }

    // Capture old metadataCid for potential cleanup
    const oldMetadataCid = request.metadataCid;

    // Update status to verified
    request.status = "verified";

    // Update metadata on IPFS if metadataCid exists
    if (oldMetadataCid) {
      try {
        // Fetch existing metadata from IPFS
        const existingMetadata = await storage.fetchJsonByCid(oldMetadataCid);

        // Create updated metadata with verification info
        const updatedMetadata = {
          ...existingMetadata,
          status: "verified",
          verifiedAt: new Date().toISOString(),
          verifiedBy: "admin",
        };

        // Pin updated metadata to IPFS (similar to UpdateRequestHandler pattern)
        const pinResult = await storage.pinJson(updatedMetadata);

        if (pinResult?.IpfsHash) {
          // Update metadataCid in request record
          request.metadataCid = pinResult.IpfsHash;

          console.log(
            `✅ IPFS metadata updated: ${oldMetadataCid} → ${pinResult.IpfsHash}`
          );

          // Optionally delete old metadata CID (best-effort, like UpdateRequestHandler does)
          try {
            await storage.deleteCidsBestEffort([oldMetadataCid]);
          } catch (delErr) {
            console.warn(
              `⚠️  Failed to delete old metadata CID ${oldMetadataCid}:`,
              delErr
            );
          }
        }
      } catch (ipfsError) {
        console.warn(
          `⚠️  Failed to update IPFS metadata for ${requestId}:`,
          ipfsError
        );
        // Continue even if IPFS update fails - DB status will still be updated
      }
    }

    // Save updated request to DB
    await request.save();

    console.log(`✅ Request ${requestId} approved by admin`);

    return res.status(200).json({
      ok: true,
      message: "Request approved successfully",
      request: {
        requestId: request.requestId,
        status: request.status,
        requesterWallet: request.requesterWallet,
        requestType: request.requestType,
        metadataCid: request.metadataCid,
      },
    });
  } catch (error) {
    console.error("ApproveRequestHandler error:", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

/**
 * Reject a request (change status to "rejected")
 * Updates both DB and IPFS metadata
 */
export async function RejectRequestHandler(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!requestId) {
      return res.status(400).json({ ok: false, error: "missing requestId" });
    }

    const request = await RequestModel.findOne({ requestId });

    if (!request) {
      return res.status(404).json({ ok: false, error: "request not found" });
    }

    // Capture old metadataCid for potential cleanup
    const oldMetadataCid = request.metadataCid;

    // Update status to rejected
    request.status = "rejected";

    // Update metadata on IPFS if metadataCid exists
    if (oldMetadataCid) {
      try {
        // Fetch existing metadata from IPFS
        const existingMetadata = await storage.fetchJsonByCid(oldMetadataCid);

        // Create updated metadata with rejection info
        const updatedMetadata = {
          ...existingMetadata,
          status: "rejected",
          rejectedAt: new Date().toISOString(),
          rejectedBy: "admin",
          rejectionReason: reason || "Not specified",
        };

        // Pin updated metadata to IPFS (similar to UpdateRequestHandler pattern)
        const pinResult = await storage.pinJson(updatedMetadata);

        if (pinResult?.IpfsHash) {
          // Update metadataCid in request record
          request.metadataCid = pinResult.IpfsHash;

          console.log(
            `✅ IPFS metadata updated: ${oldMetadataCid} → ${pinResult.IpfsHash}`
          );

          // Optionally delete old metadata CID (best-effort, like UpdateRequestHandler does)
          try {
            await storage.deleteCidsBestEffort([oldMetadataCid]);
          } catch (delErr) {
            console.warn(
              `⚠️  Failed to delete old metadata CID ${oldMetadataCid}:`,
              delErr
            );
          }
        }
      } catch (ipfsError) {
        console.warn(
          `⚠️  Failed to update IPFS metadata for ${requestId}:`,
          ipfsError
        );
        // Continue even if IPFS update fails - DB status will still be updated
      }
    }

    // Save updated request to DB
    await request.save();

    console.log(
      `❌ Request ${requestId} rejected by admin${reason ? `: ${reason}` : ""}`
    );

    return res.status(200).json({
      ok: true,
      message: "Request rejected successfully",
      request: {
        requestId: request.requestId,
        status: request.status,
        requesterWallet: request.requesterWallet,
        requestType: request.requestType,
        metadataCid: request.metadataCid,
      },
    });
  } catch (error) {
    console.error("RejectRequestHandler error:", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

/**
 * Get statistics for admin dashboard
 */
export async function GetStatsHandler(req: Request, res: Response) {
  try {
    const [
      totalUsers,
      totalRequests,
      pendingRequests,
      verifiedRequests,
      rejectedRequests,
      nationalIdRequests,
      landOwnershipRequests,
    ] = await Promise.all([
      RequestModel.distinct("requesterWallet").then(
        (wallets) => wallets.length
      ),
      RequestModel.countDocuments(),
      RequestModel.countDocuments({ status: "pending" }),
      RequestModel.countDocuments({ status: "verified" }),
      RequestModel.countDocuments({ status: "rejected" }),
      RequestModel.countDocuments({ requestType: "national_id" }),
      RequestModel.countDocuments({ requestType: "land_ownership" }),
    ]);

    return res.status(200).json({
      ok: true,
      stats: {
        totalUsers,
        totalRequests,
        pendingRequests,
        verifiedRequests,
        rejectedRequests,
        nationalIdRequests,
        landOwnershipRequests,
      },
    });
  } catch (error) {
    console.error("GetStatsHandler error:", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

/**
 * Get detailed request by ID (for admin - no wallet check)
 * Returns fully decrypted data with images
 */
export async function GetAdminRequestByIdHandler(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    if (!requestId) {
      return res
        .status(400)
        .json({ ok: false, error: "missing requestId parameter" });
    }

    // fetch request record from DB using `lean()` for a faster plain object
    const recordDoc = await RequestModel.findOne({
      requestId: requestId,
    }).lean();
    if (!recordDoc) {
      return res.status(404).json({ ok: false, error: "request not found" });
    }

    // NO WALLET CHECK - admins can access any request

    // recordDoc is already a plain object due to lean()
    const output: any = recordDoc;

    // fetch metadata blob if present (only when needed)
    let metadata: any = null;
    if (output.metadataCid) {
      try {
        metadata = await storage.fetchJsonByCid(output.metadataCid);
      } catch (err) {
        console.warn("failed to fetch metadata CID", output.metadataCid, err);
      }
    }

    // Attempt to obtain AES key for server-side decryption (server-wrapped key)
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

    // Decrypt scalar encrypted fields in parallel if we have AES key
    if (
      rawAesKey &&
      metadata?.encryptedFields &&
      typeof metadata.encryptedFields === "object"
    ) {
      const entries = Object.entries(metadata.encryptedFields);
      // run all decrypts concurrently with Promise.all and build an object
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
          console.warn(`failed to decrypt field ${k} for ${requestId}`, err);
          return [k, null] as [string, any];
        }
      });

      const decryptedPairs = await Promise.all(decryptPromises);
      output.decryptedFields = Object.fromEntries(decryptedPairs);
    } else if (metadata?.encryptedFields) {
      // expose encrypted fields so client (uploader) can attempt client-side decryption if it has the key
      output.encryptedFields = metadata.encryptedFields;
    }

    // Map decryptedFields into domain shapes if available
    if (output.decryptedFields) {
      const rt = String(output.requestType || output.requestType).toLowerCase();
      if (
        (rt === "national_id" || rt === "national-id") &&
        !output.nationalIdData
      ) {
        output.nationalIdData = {
          firstName: output.decryptedFields.firstName ?? null,
          middleName: output.decryptedFields.middleName ?? null,
          lastName: output.decryptedFields.lastName ?? null,
          idNumber: output.decryptedFields.idNumber ?? null,
          issueDate: output.decryptedFields.issueDate ?? null,
          expiryDate: output.decryptedFields.expiryDate ?? null,
        };
      } else if (
        (rt === "land_title" ||
          rt === "land-title" ||
          rt === "land_ownership") &&
        !output.landTitleData
      ) {
        output.landTitleData = {
          firstName: output.decryptedFields.firstName ?? null,
          middleName: output.decryptedFields.middleName ?? null,
          lastName: output.decryptedFields.lastName ?? null,
          latitude: output.decryptedFields.latitude ?? null,
          longitude: output.decryptedFields.longitude ?? null,
          titleNumber: output.decryptedFields.titleNumber ?? null,
          lotArea: output.decryptedFields.lotArea ?? null,
        };
      }
    }

    // Files: prefer files stored in the DB record; if missing, fall back to metadata.files
    // Build a normalized files array:
    // - prefer DB saved files (record may include cid, iv, filename)
    // - otherwise fall back to metadata.files (from metadataCid on IPFS)
    const dbFiles = Array.isArray(output.files) ? output.files : [];
    const metaFiles = Array.isArray(metadata?.files) ? metadata.files : [];

    // Build a map for metadata files keyed by CID for O(1) lookup
    const metaByCid = new Map<string, any>();
    for (const mf of metaFiles) {
      if (mf && mf.cid) metaByCid.set(String(mf.cid), mf);
    }

    // if DB stored files, attach metadata via the map; otherwise, normalize metadata files
    let fileEntries: any[] = [];
    if (dbFiles.length) {
      fileEntries = dbFiles.map((f: any) => ({
        ...f,
        meta: metaByCid.get(String(f.cid)) ?? undefined,
      }));
    } else if (metaFiles.length) {
      fileEntries = metaFiles.map((mf: any) => ({
        cid: mf.cid,
        filename: mf.filename ?? mf.name,
        mime: mf.mime,
        size: mf.size,
        iv: mf.iv,
        meta: mf,
      }));
    } else {
      fileEntries = [];
    }

    output.files = fileEntries;

    // If we have an AES key, attempt to decrypt each file and produce a usable URL (data: or signed)
    if (rawAesKey && output.files.length) {
      // decrypt files in parallel (best-effort per file). Note: this may open multiple streams concurrently.
      const decryptTasks = output.files.map(async (f: any) => {
        try {
          const encryptedStream = await storage.fetchFileStreamByCid(f.cid);
          const signedUrl = await decryptFileToSignedUrl(
            encryptedStream,
            rawAesKey,
            f
          );
          return { ...f, decryptedUrl: signedUrl };
        } catch (err) {
          console.warn("failed to decrypt file", f.cid, err);
          return { ...f, decryptedUrl: null, decryptError: true };
        }
      });

      const filesOut = await Promise.all(decryptTasks);
      output.files = filesOut;
    }

    // Map decrypted file URLs into domain objects (deedUpload, front/back/selfie)
    if (Array.isArray(output.files) && output.files.length) {
      // build a fast lookup map for file purpose tags
      const purposeMap = new Map<string, any>();
      for (const f of output.files) {
        const candidates = [
          f.tag,
          f.meta?.tag,
          f.purpose,
          f.meta?.purpose,
        ].filter(Boolean);
        for (const c of candidates) {
          try {
            purposeMap.set(String(c).toLowerCase(), f);
          } catch {}
        }
      }

      const findByPurpose = (purpose: string) =>
        purposeMap.get(String(purpose).toLowerCase()) ?? null;

      if (output.landTitleData) {
        const deed = findByPurpose("land_deed");
        output.landTitleData.deedUpload =
          output.landTitleData.deedUpload ??
          deed?.decryptedUrl ??
          deed?.meta?.url ??
          null;
      }

      if (output.nationalIdData) {
        const front = findByPurpose("front_id");
        const back = findByPurpose("back_id");
        const selfie = findByPurpose("selfie_with_id");

        output.nationalIdData.frontPicture =
          output.nationalIdData.frontPicture ??
          front?.decryptedUrl ??
          front?.meta?.url ??
          null;
        output.nationalIdData.backPicture =
          output.nationalIdData.backPicture ??
          back?.decryptedUrl ??
          back?.meta?.url ??
          null;
        output.nationalIdData.selfieWithId =
          output.nationalIdData.selfieWithId ??
          selfie?.decryptedUrl ??
          selfie?.meta?.url ??
          null;
      }
    }

    // sanitize metadata before returning
    if (metadata) {
      delete metadata.encryptedAesKeys;
      delete metadata.encryptedAesKeyForServer;
      output.metadata = metadata;
    }

    return res.status(200).json({ ok: true, request: output });
  } catch (error) {
    console.error("GetAdminRequestByIdHandler error:", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
