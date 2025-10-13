import { Buffer } from "buffer";

const PINATA_GATEWAY =
    process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";
const PINATA_JWT = process.env.PINATA_JWT || null;
const PINATA_API_KEY = process.env.PINATA_API_KEY || null;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET || null;

function buildUrl(cidOrUrl: string) {
    if (!cidOrUrl) throw new Error("cidOrUrl required");
    // support ipfs://<cid>/path
    if (cidOrUrl.startsWith("ipfs://")) {
        return cidOrUrl.replace("ipfs://", `${PINATA_GATEWAY}/`);
    }
    // already a full url
    if (cidOrUrl.startsWith("http://") || cidOrUrl.startsWith("https://")) {
        return cidOrUrl;
    }
    // otherwise treat as CID/path
    return `${PINATA_GATEWAY}/${cidOrUrl}`;
}

function buildHeaders() {
    const headers: Record<string, string> = {};
    if (PINATA_JWT) {
        headers["Authorization"] = `Bearer ${PINATA_JWT}`;
    } else if (PINATA_API_KEY && PINATA_API_SECRET) {
        // Pinata legacy auth (not recommended) — include as header if present
        headers["pinata_api_key"] = PINATA_API_KEY;
        headers["pinata_secret_api_key"] = PINATA_API_SECRET;
    }
    return headers;
}

/**
 * Fetch JSON metadata by CID (or full URL) using Pinata gateway.
 */
export async function fetchJsonByCid(cidOrUrl: string): Promise<any> {
    const url = buildUrl(cidOrUrl);
    const res = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
            ...buildHeaders(),
        },
    });
    if (!res.ok)
        throw new Error(
            `fetchJsonByCid failed ${res.status} ${res.statusText} - ${url}`
        );
    return res.json();
}

/**
 * Fetch encrypted file bytes by CID (returns Buffer)
 */
export async function fetchFileStreamByCid(cidOrUrl: string): Promise<Buffer> {
    const url = buildUrl(cidOrUrl);
    const res = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "*/*",
            ...buildHeaders(),
        },
    });
    if (!res.ok)
        throw new Error(
            `fetchFileStreamByCid failed ${res.status} ${res.statusText} - ${url}`
        );
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
}
