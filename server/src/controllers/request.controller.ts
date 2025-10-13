import { Request, Response } from "express";
import { recoverMessageAddress } from "viem";
import RequestModel from "../models/DocMetaSchema";

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
