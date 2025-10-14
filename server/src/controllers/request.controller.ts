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
        const filter = {};
        if (requesterWallet) {
            Object.assign(filter, {
                requesterWallet: String(requesterWallet).toLowerCase(),
            });
        }
        if (requestType) {
            Object.assign(filter, {
                requestType: String(requestType).toLowerCase(),
            });
        }
        if (status) {
            Object.assign(filter, {
                status: String(status).toLowerCase(),
            });
        }
        const docs = await RequestModel.find(filter).sort({ createdAt: -1 });
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

        // fetch request record from DB
        const recordDoc = await RequestModel.findOne({ requestId: requestId });
        if (!recordDoc) {
            return res
                .status(404)
                .json({ ok: false, error: "request not found" });
        }

        // if requesterWallet is provided, ensure it matches the record
        if (requesterWallet) {
            if (
                String(recordDoc.requesterWallet).toLowerCase() !==
                String(requesterWallet).toLowerCase()
            ) {
                return res
                    .status(403)
                    .json({ ok: false, error: "access denied" });
            }
        }

        // normalize output object
        const output: any =
            typeof recordDoc.toObject === "function"
                ? recordDoc.toObject()
                : JSON.parse(JSON.stringify(recordDoc));

        // fetch metadata blob if present
        let metadata: any = null;
        if (output.metadataCid) {
            try {
                metadata = await storage.fetchJsonByCid(output.metadataCid);
            } catch (err) {
                console.warn(
                    "failed to fetch metadata CID",
                    output.metadataCid,
                    err
                );
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

        // Decrypt scalar encrypted fields if we have AES key
        if (
            rawAesKey &&
            metadata?.encryptedFields &&
            typeof metadata.encryptedFields === "object"
        ) {
            output.decryptedFields = {};
            for (const [k, v] of Object.entries(metadata.encryptedFields)) {
                try {
                    // v can be an object { ciphertextBase64, iv } or a string (base64 ct with tag)
                    if (typeof v === "string") {
                        // try decrypting string form (assume ciphertext+tag base64 with iv stored elsewhere)
                        output.decryptedFields[k] = await decryptField(
                            rawAesKey,
                            {
                                ciphertextBase64: v,
                                iv: metadata.iv ?? "",
                            } as any
                        );
                    } else {
                        output.decryptedFields[k] = await decryptField(
                            rawAesKey,
                            v as any
                        );
                    }
                } catch (err) {
                    console.warn(
                        `failed to decrypt field ${k} for ${requestId}`,
                        err
                    );
                    output.decryptedFields[k] = null;
                }
            }
        } else if (metadata?.encryptedFields) {
            // expose encrypted fields so client (uploader) can attempt client-side decryption if it has the key
            output.encryptedFields = metadata.encryptedFields;
        }

        // Map decryptedFields into domain shapes if available
        if (output.decryptedFields) {
            const rt = String(
                output.requestType || output.requestType
            ).toLowerCase();
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

        // if DB didn't store files, use metadata files
        let fileEntries: any[] = [];
        if (dbFiles.length) {
            // attach metadata to db files where possible
            fileEntries = dbFiles.map((f: any) => ({
                ...f,
                meta:
                    metaFiles.find((mf: any) => mf.cid === f.cid) ?? undefined,
            }));
        } else if (metaFiles.length) {
            // use metadata files directly (ensure fields align with DB shape)
            fileEntries = metaFiles.map((mf: any) => ({
                cid: mf.cid,
                filename: mf.filename ?? mf.name,
                mime: mf.mime,
                size: mf.size,
                iv: mf.iv, // iv stored in metadata.json
                meta: mf,
            }));
        } else {
            fileEntries = [];
        }

        output.files = fileEntries;

        // If we have an AES key, attempt to decrypt each file and produce a usable URL (data: or signed)
        if (rawAesKey && output.files.length) {
            const filesOut: any[] = [];
            for (const f of output.files) {
                try {
                    const encryptedStream = await storage.fetchFileStreamByCid(
                        f.cid
                    );
                    // decryptFileToSignedUrl should use f.iv || f.meta?.iv to decrypt
                    const signedUrl = await decryptFileToSignedUrl(
                        encryptedStream,
                        rawAesKey,
                        f
                    );
                    filesOut.push({ ...f, decryptedUrl: signedUrl });
                } catch (err) {
                    console.warn("failed to decrypt file", f.cid, err);
                    filesOut.push({
                        ...f,
                        decryptedUrl: null,
                        decryptError: true,
                    });
                }
            }
            output.files = filesOut;
        }

        // Map decrypted file URLs into domain objects (deedUpload, front/back/selfie)
        if (Array.isArray(output.files) && output.files.length) {
            const findByPurpose = (purpose: string) =>
                output.files.find((f: any) => {
                    const p = (
                        f.tag ||
                        f.meta?.tag ||
                        f.purpose ||
                        f.meta?.purpose ||
                        ""
                    )
                        .toString()
                        .toLowerCase();
                    return p === purpose.toLowerCase();
                });

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
        const { metadataCid, metadataHash, uploaderSignature, files } =
            req.body;

        if (!requestId || !requesterWallet) {
            return res.status(400).json({ ok: false, error: "missing params" });
        }

        if (!metadataCid || !metadataHash || !uploaderSignature) {
            return res
                .status(400)
                .json({ ok: false, error: "missing body fields" });
        }

        // fetch existing record
        const recordDoc = await RequestModel.findOne({ requestId: requestId });
        if (!recordDoc)
            return res
                .status(404)
                .json({ ok: false, error: "request not found" });

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
            return res
                .status(401)
                .json({ ok: false, error: "signature mismatch" });
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
                        console.log(
                            `unpin success for ${r.cid} status=${r.status}`
                        );
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
            return res
                .status(404)
                .json({ ok: false, error: "request not found" });

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
