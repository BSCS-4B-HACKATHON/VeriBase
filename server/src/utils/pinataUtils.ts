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

/**
 * Best-effort deletion of CIDs using Pinata API if API credentials are configured.
 * This will attempt to call Pinata's unpin endpoint for each CID. If no API
 * credentials exist, this function resolves without doing anything.
 */
export async function deleteCidsBestEffort(cids: string[] | undefined) {
  if (!Array.isArray(cids) || cids.length === 0) return [];

  const results: Array<{
    cid: string;
    ok: boolean;
    status?: number;
    body?: any;
    error?: any;
  }> = [];

  for (const cid of cids) {
    try {
      const url = `https://api.pinata.cloud/pinning/unpin/${cid}`;
      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (PINATA_JWT) {
        headers["Authorization"] = `Bearer ${PINATA_JWT}`;
      } else if (PINATA_API_KEY && PINATA_API_SECRET) {
        headers["pinata_api_key"] = PINATA_API_KEY;
        headers["pinata_secret_api_key"] = PINATA_API_SECRET;
      } else {
        // no credentials available — nothing we can do
        results.push({
          cid,
          ok: false,
          error: "no_pinata_credentials",
        });
        continue;
      }

      const res = await fetch(url, { method: "DELETE", headers });
      let body: any = null;
      try {
        body = await res.text();
      } catch (e) {
        body = null;
      }
      results.push({ cid, ok: res.ok, status: res.status, body });
    } catch (err) {
      results.push({ cid, ok: false, error: err });
    }
  }

  return results;
}

/**
 * Pin JSON data to IPFS via Pinata API
 * @returns { IpfsHash: string, PinSize: number, Timestamp: string }
 */
export async function pinJson(
  jsonData: any,
  pinataMetadata?: { name?: string; keyvalues?: Record<string, any> }
) {
  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_API_SECRET)) {
    throw new Error("Pinata credentials not configured");
  }

  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (PINATA_JWT) {
    headers["Authorization"] = `Bearer ${PINATA_JWT}`;
  } else if (PINATA_API_KEY && PINATA_API_SECRET) {
    headers["pinata_api_key"] = PINATA_API_KEY;
    headers["pinata_secret_api_key"] = PINATA_API_SECRET;
  }

  const body: any = {
    pinataContent: jsonData,
  };

  if (pinataMetadata) {
    body.pinataMetadata = pinataMetadata;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `pinJson failed ${res.status} ${res.statusText} - ${errorText}`
    );
  }

  return res.json();
}
