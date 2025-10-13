import { Request, Response } from "express";
import PinataSDK from "@pinata/sdk";
import { Readable } from "stream";

const pinataKey = process.env.PINATA_API_KEY || "";
const pinataSecret = process.env.PINATA_API_SECRET || "";
if (!pinataKey || !pinataSecret) {
    console.error(
        "Pinata API key and secret must be set in environment variables."
    );
}

const pinata = new PinataSDK(pinataKey, pinataSecret);

// Ensure Pinata is authenticated
// pinata
//     .testAuthentication()
//     .then(() => {
//         console.log("Pinata authentication successful");
//     })
//     .catch((error) => {
//         console.error("Pinata authentication failed:", error);
//     });

// Handler for uploading a file to Pinata
/**
 * Expects a JSON body with:
 * {
 *   "filename": "example.png",
 *   "contentBase64": "skibidiskibidi",
 *   "requesterWallet": "0xabc123..."
 * }
 *
 * Returns:
 * { "cid": "Qm..." }
 */
export async function UploadHandler(req: Request, res: Response) {
    try {
        // check for requester wallet first
        const requesterWallet = req.body.requesterWallet;
        if (!requesterWallet || requesterWallet === "") {
            return res.status(400).json({ error: "Missing requester wallet" });
        }

        const { filename, contentBase64 } = req.body;
        const buffer = Buffer.from(contentBase64, "base64");
        const stream = Readable.from(buffer);
        const result = await pinata.pinFileToIPFS(stream, {
            pinataMetadata: { name: filename },
            pinataOptions: { cidVersion: 1 },
        });
        return res.json({ cid: result.IpfsHash });
    } catch (error: unknown) {
        console.error("Pinata metadata upload error:", error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

// Handler for uploading JSON metadata to Pinata
/**
 * Expects a JSON body with:
 * {
 *   "contentBase64": "skibidiskibidi",
 *   "requesterWallet": "0xabc123..."
 * }
 * Returns:
 * { "cid": "Qm..." }
 */
export async function UploadMetadataHandler(req: Request, res: Response) {
    try {
        // check for requester wallet first
        const requesterWallet = req.body.requesterWallet;
        if (!requesterWallet || requesterWallet === "") {
            return res.status(400).json({ error: "Missing requester wallet" });
        }

        const { contentBase64 } = req.body;
        const jsonStr = Buffer.from(contentBase64, "base64").toString("utf8");
        const jsonObj = JSON.parse(jsonStr);
        const result = await pinata.pinJSONToIPFS(jsonObj, {
            pinataMetadata: { name: "metadata.json" },
            pinataOptions: { cidVersion: 1 },
        });
        return res.json({ cid: result.IpfsHash || result.IpfsHash });
    } catch (error) {
        console.error("Pinata metadata upload error:", error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
