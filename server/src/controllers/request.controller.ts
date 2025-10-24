import { Request, Response } from "express";
import { recoverMessageAddress } from "viem";
import RequestModel, { IRequest } from "../models/DocMetaSchema";
import * as storage from "../utils/pinataUtils";
import {
  unwrapAesKeyForServer,
  decryptField,
  decryptFileToSignedUrl,
} from "../utils/helpers";

export async function CreateRequestHandler(req: Request, res: Response) {
  try {
    const {
      requestId,
      requesterWallet,
      requestType,
      minimalPublicLabel,
      metadataCid,
      metadataHash,
      uploaderSignature,
      files,
      consent,
      status,
    } = req.body;

    if (
      !requestId ||
      !requesterWallet ||
      !requestType ||
      !metadataCid ||
      !metadataHash ||
      !uploaderSignature
    ) {
      return res
        .status(400)
        .json({ ok: false, error: "missing required fields" });
    }

    // Verify signature (we expect the signer to have signed the metadataHash)
    let recovered: string;
    try {
      recovered = (await recoverMessageAddress({
        message: metadataHash,
        signature: uploaderSignature,
      })) as string;
    } catch (err) {
      console.error("Signature recovery error:", err);
      return res
        .status(400)
        .json({ ok: false, error: "invalid signature format" });
    }

    if (recovered.toLowerCase() !== String(requesterWallet).toLowerCase()) {
      console.error("Signature mismatch:", {
        recovered,
        requesterWallet,
      });
      return res.status(401).json({
        ok: false,
        error: "signature does not match requesterWallet",
      });
    }

    // sanitize files array
    const sanitizedFiles = Array.isArray(files)
      ? files.map((f: any) => ({
          cid: String(f.cid),
          filename: f.filename ? String(f.filename) : undefined,
          mime: f.mime ? String(f.mime) : undefined,
          size: f.size ? Number(f.size) : undefined,
          iv: f.iv ? String(f.iv) : undefined,
          ciphertextHash: f.ciphertextHash
            ? String(f.ciphertextHash)
            : undefined,
          tag: f.tag ? String(f.tag) : undefined,
        }))
      : [];

    const doc = await RequestModel.create({
      requestId,
      requesterWallet,
      requestType,
      minimalPublicLabel,
      metadataCid,
      metadataHash,
      uploaderSignature,
      files: sanitizedFiles,
      consent: {
        textVersion: consent?.textVersion ?? "v1",
        timestamp: consent?.timestamp
          ? new Date(consent.timestamp)
          : new Date(),
      },
      status: status ?? "pending",
    });

    return res
      .status(201)
      .json({ ok: true, id: doc._id, requestId: doc.requestId });
  } catch (err) {
    console.error("CreateRequestHandler error:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function GetRequestsHandler(req: Request, res: Response) {
  try {
    const { requesterWallet, requestType, status } = req.query;

    if (!requesterWallet) {
      return res
        .status(400)
        .json({ ok: false, error: "missing requesterWallet parameter" });
    }

    if (requestType) {
      // validate requestType if provided
      const rt = String(requestType).toLowerCase();
      if (rt !== "national_id" && rt !== "land_ownership") {
        return res
          .status(400)
          .json({ ok: false, error: "invalid requestType parameter" });
      }
    }
    if (status) {
      // validate status if provided
      const validStatuses = ["pending", "verified", "rejected"];
      const st = String(status).toLowerCase();
      if (!validStatuses.includes(st)) {
        return res
          .status(400)
          .json({ ok: false, error: "invalid status parameter" });
      }
    }

    const docs = await RequestModel.find({
      requesterWallet: String(requesterWallet),
      ...(requestType ? { requestType: String(requestType) } : {}),
      ...(status ? { status: String(status) } : {}),
    }).sort({ createdAt: -1 });
    console.log(`Fetched ${docs.length} requests from DB`);
    return res.status(200).json({ ok: true, requests: docs });
  } catch (err) {
    console.error("GetRequestsHandler error:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function GetRequestByIdHandler(req: Request, res: Response) {
  try {
    const { requestId, requesterWallet } = req.params;
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

    // if requesterWallet is provided, ensure it matches the record (compare lowercased once)
    if (requesterWallet) {
      const recordWallet = String(recordDoc.requesterWallet).toLowerCase();
      if (recordWallet !== String(requesterWallet).toLowerCase()) {
        return res.status(403).json({ ok: false, error: "access denied" });
      }
    }

    // recordDoc is already a plain object due to lean()
    const output: any = recordDoc;

    // Fetch metadata and prepare for parallel AES key unwrapping
    let metadata: any = null;
    let rawAesKey: Buffer | null = null;

    if (output.metadataCid) {
      try {
        metadata = await storage.fetchJsonByCid(output.metadataCid);

        // Immediately start unwrapping AES key if available (don't wait for other operations)
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
      } catch (err) {
        console.warn("failed to fetch metadata CID", output.metadataCid, err);
      }
    }

    // Decrypt scalar encrypted fields in parallel if we have AES key
    // AND prepare file entries in parallel (both are independent operations)
    const [decryptedFieldsResult, fileEntries] = await Promise.all([
      // Task 1: Decrypt fields
      (async () => {
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
              console.warn(
                `failed to decrypt field ${k} for ${requestId}`,
                err
              );
              return [k, null] as [string, any];
            }
          });

          const decryptedPairs = await Promise.all(decryptPromises);
          return Object.fromEntries(decryptedPairs);
        }
        return null;
      })(),

      // Task 2: Prepare file entries
      (async () => {
        const dbFiles = Array.isArray(output.files) ? output.files : [];
        const metaFiles = Array.isArray(metadata?.files) ? metadata.files : [];

        // Build a map for metadata files keyed by CID for O(1) lookup
        const metaByCid = new Map<string, any>();
        for (const mf of metaFiles) {
          if (mf && mf.cid) metaByCid.set(String(mf.cid), mf);
        }

        // if DB stored files, attach metadata via the map; otherwise, normalize metadata files
        if (dbFiles.length) {
          return dbFiles.map((f: any) => ({
            ...f,
            meta: metaByCid.get(String(f.cid)) ?? undefined,
          }));
        } else if (metaFiles.length) {
          return metaFiles.map((mf: any) => ({
            cid: mf.cid,
            filename: mf.filename ?? mf.name,
            mime: mf.mime,
            size: mf.size,
            iv: mf.iv,
            meta: mf,
          }));
        }
        return [];
      })(),
    ]);

    // Apply decrypted fields result
    if (decryptedFieldsResult) {
      output.decryptedFields = decryptedFieldsResult;
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

    // Assign prepared file entries to output
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

      output.files = await Promise.all(decryptTasks);
    }

    // Map decrypted file URLs and decrypted fields into domain objects in parallel
    // This section can run independently after files and fields are ready
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
    console.error("GetRequestByIdHandler error:", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function UpdateRequestHandler(req: Request, res: Response) {
  try {
    const { requesterWallet, requestId } = req.params;
    const { metadataCid, metadataHash, uploaderSignature, files } = req.body;

    if (!requestId || !requesterWallet) {
      return res.status(400).json({ ok: false, error: "missing params" });
    }

    if (!metadataCid || !metadataHash || !uploaderSignature) {
      return res.status(400).json({ ok: false, error: "missing body fields" });
    }

    // fetch existing record
    const recordDoc = await RequestModel.findOne({ requestId: requestId });
    if (!recordDoc)
      return res.status(404).json({ ok: false, error: "request not found" });

    // check wallet matches
    if (
      String(recordDoc.requesterWallet).toLowerCase() !==
      String(requesterWallet).toLowerCase()
    ) {
      return res.status(403).json({ ok: false, error: "access denied" });
    }

    // verify signature matches requester and metadataHash
    let recovered: string;
    try {
      recovered = (await recoverMessageAddress({
        message: metadataHash,
        signature: uploaderSignature,
      })) as string;
    } catch (err) {
      console.error("Signature recovery error:", err);
      return res
        .status(400)
        .json({ ok: false, error: "invalid signature format" });
    }

    if (recovered.toLowerCase() !== String(requesterWallet).toLowerCase()) {
      return res.status(401).json({ ok: false, error: "signature mismatch" });
    }

    // sanitize files
    const sanitizedFiles = Array.isArray(files)
      ? files.map((f: any) => ({
          cid: String(f.cid),
          filename: f.filename ? String(f.filename) : undefined,
          mime: f.mime ? String(f.mime) : undefined,
          size: f.size ? Number(f.size) : undefined,
          iv: f.iv ? String(f.iv) : undefined,
          ciphertextHash: f.ciphertextHash
            ? String(f.ciphertextHash)
            : undefined,
          tag: f.tag ? String(f.tag) : undefined,
        }))
      : [];

    // capture previous CIDs to delete AFTER successful update
    const previousCids = Array.isArray(recordDoc.files)
      ? recordDoc.files.map((f: any) => f.cid).filter(Boolean)
      : [];
    // include previous metadataCid as well (if present and different)
    if (recordDoc.metadataCid && recordDoc.metadataCid !== metadataCid) {
      previousCids.push(recordDoc.metadataCid);
    }

    // update record
    recordDoc.metadataCid = metadataCid;
    recordDoc.metadataHash = metadataHash;
    recordDoc.uploaderSignature = uploaderSignature;
    // coerce to any to avoid strict schema typing issues for optional filename fields
    recordDoc.files = sanitizedFiles as any;
    await recordDoc.save();

    // attempt to delete previous files from Pinata if configured (best-effort)
    try {
      const delResults = await storage.deleteCidsBestEffort(
        previousCids as any
      );
      if (Array.isArray(delResults)) {
        for (const r of delResults) {
          if (r.ok) {
            console.log(`unpin success for ${r.cid} status=${r.status}`);
          } else {
            console.warn(
              `unpin failed for ${r.cid}`,
              r.error ?? r.body ?? r.status
            );
          }
        }
      }
    } catch (err) {
      console.warn("failed to delete previous cids (best-effort)", err);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("UpdateRequestHandler error:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function DeleteRequestHandler(req: Request, res: Response) {
  try {
    const { requesterWallet, requestId } = req.params;
    if (!requestId || !requesterWallet) {
      return res.status(400).json({ ok: false, error: "missing params" });
    }

    const recordDoc = await RequestModel.findOne({ requestId: requestId });
    if (!recordDoc)
      return res.status(404).json({ ok: false, error: "request not found" });

    // ensure wallet matches
    if (
      String(recordDoc.requesterWallet).toLowerCase() !==
      String(requesterWallet).toLowerCase()
    ) {
      return res.status(403).json({ ok: false, error: "access denied" });
    }

    // build list of cids to delete (files + metadata)
    const cids: string[] = [];
    if (Array.isArray(recordDoc.files)) {
      for (const f of recordDoc.files) {
        if (f && f.cid) cids.push(String(f.cid));
      }
    }
    if (recordDoc.metadataCid) cids.push(String(recordDoc.metadataCid));

    // attempt to unpin/delete from pinata (best-effort)
    let delResults: any = [];
    try {
      delResults = await storage.deleteCidsBestEffort(cids);
    } catch (err) {
      console.warn("DeleteRequestHandler: pinata delete error", err);
    }

    // remove DB record
    try {
      await RequestModel.deleteOne({ requestId: requestId });
    } catch (err) {
      console.error("failed to delete DB record", err);
      return res
        .status(500)
        .json({ ok: false, error: "failed_delete_db", delResults });
    }

    return res.status(200).json({ ok: true, delResults });
  } catch (err) {
    console.error("DeleteRequestHandler error:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
