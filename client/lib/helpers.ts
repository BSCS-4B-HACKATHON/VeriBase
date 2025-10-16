import { RequestType } from "./types";

export const BE_URL = process.env.NEXT_PUBLIC_BE_URL || "http://localhost:6969";
export const SERVER_PUBLIC_KEY_PEM =
  process.env.NEXT_PUBLIC_SERVER_PUBKEY_PEM ||
  `-----BEGIN PUBLIC KEY-----\n...base64...\n-----END PUBLIC KEY-----`;

// browser helpers
export async function sha256Hex(buf: ArrayBuffer) {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return (
    "0x" +
    Array.from(new Uint8Array(h))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
function toBase64(u8: Uint8Array) {
  return btoa(String.fromCharCode(...u8));
}
function fromBase64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

export async function genAesKey() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptBuffer(key: CryptoKey, data: ArrayBuffer) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { ciphertext: new Uint8Array(ct), ivBase64: toBase64(iv) };
}

// POST encrypted bytes to your server which holds Pinata key and returns CID
async function uploadToServer(
  filename: string,
  data: Uint8Array,
  signerAddress: string
) {
  const copy = data instanceof Uint8Array ? data.slice() : new Uint8Array(data);
  const base64 = toBase64(copy);
  const res = await fetch(`${BE_URL}/api/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename,
      contentBase64: base64,
      requesterWallet: signerAddress,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error("Upload failed: " + res.status + " " + txt);
  }
  const json = await res.json();
  return json.cid as string;
}

/**
 * Encrypt a File and upload ciphertext to backend. Returns file metadata for metadata.json
 */
export async function encryptAndUploadFile(
  file: File,
  aesKey: CryptoKey,
  signerAddress: string
) {
  const ab = await file.arrayBuffer();
  const { ciphertext, ivBase64 } = await encryptBuffer(aesKey, ab);
  const ciphertextHash = await sha256Hex(ciphertext.buffer);
  const cid = await uploadToServer(
    `${file.name}.enc`,
    ciphertext,
    signerAddress
  );
  return {
    tag: undefined as string | undefined,
    filename: `${file.name}.enc`,
    mime: file.type,
    size: file.size,
    cid,
    iv: ivBase64,
    ciphertextHash,
  };
}

/**
 * Encrypt a plain text field (string) with AES key and return base64 ciphertext
 */
export async function encryptField(key: CryptoKey, value: string) {
  const enc = new TextEncoder().encode(value);
  const { ciphertext, ivBase64 } = await encryptBuffer(key, enc.buffer);
  return { ciphertextBase64: toBase64(ciphertext), iv: ivBase64 };
}

/**
 * Build encrypted metadata JSON, compute metadataHash, sign it with wallet,
 * then POST metadata bytes to backend which pins to Pinata and returns CID.
 */
export async function buildAndUploadMetadata({
  aesKey,
  encryptedFields,
  filesMeta,
  signerAddress,
  signWithViemWalletClient,
  serverWrappedAesKey, // new optional
}: {
  aesKey: CryptoKey;
  encryptedFields: Record<string, { ciphertextBase64: string; iv: string }>;
  filesMeta: Array<any>;
  signerAddress: string;
  signWithViemWalletClient?: {
    signMessage: (args: { message: Uint8Array | string }) => Promise<string>;
  } | null;
  serverWrappedAesKey?: string;
}) {
  const metadata: any = {
    version: "1",
    encryptedFields,
    files: filesMeta,
    createdAt: new Date().toISOString(),
  };

  if (serverWrappedAesKey) {
    // include wrapped AES key for server to be able to decrypt
    metadata.encryptedAesKeyForServer = serverWrappedAesKey;
  }

  const json = JSON.stringify(metadata);
  const bytes = new TextEncoder().encode(json);
  const metadataHash = await sha256Hex(bytes.buffer);

  // sign metadataHash
  let signature: string;
  if (
    signWithViemWalletClient &&
    typeof signWithViemWalletClient.signMessage === "function"
  ) {
    signature = await signWithViemWalletClient.signMessage({
      message: metadataHash,
    } as any);
  } else if ((window as any).ethereum) {
    signature = await (window as any).ethereum.request({
      method: "personal_sign",
      params: [metadataHash, signerAddress],
    });
  } else {
    throw new Error("No signer available");
  }

  // upload metadata JSON to your backend for pinning (avoid exposing pinata keys client-side)
  const base64 = toBase64(new Uint8Array(bytes));
  const res = await fetch(`${BE_URL}/api/upload/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: "metadata.json",
      contentBase64: base64,
      requesterWallet: signerAddress,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error("Metadata upload failed: " + res.status + " " + txt);
  }
  const jsonResp = await res.json();
  const metadataCid = jsonResp.cid as string;

  return {
    metadataCid,
    metadataHash,
    uploaderSignature: signature,
    metadata,
  };
}

// walletClient: your connected viem WalletClient instance
export async function signMetadataWithViem(
  walletClient: any,
  metadataHash: string
): Promise<{ signerAddress: string; signature: string }> {
  // get the connected address from your app state / connector (example assumes you already have it)
  const signerAddress = (await walletClient.getAddresses?.()) || []; // adapt to your connector
  const address = Array.isArray(signerAddress)
    ? signerAddress[0]
    : signerAddress;
  const signature = await walletClient.signMessage({ message: metadataHash });
  return { signerAddress: address, signature };
}

export function shorten(addr: string) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
}

export async function getAllUsersMintRequests(requesterWallet: string) {
  try {
    if (!requesterWallet || requesterWallet === "") {
      throw new Error("Missing requester wallet");
    }
    const res = await fetch(
      `${BE_URL}/api/requests?requesterWallet=${requesterWallet}`
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error("Fetch failed: " + res.status + " " + txt);
    }
    const data = await res.json();
    return data.requests as RequestType[];
  } catch (error) {
    console.error("Error fetching user mint requests:", error);
    return [];
  }
}

export async function mintNFT(requestId: string) {
  try {
    if (!requestId) {
      throw new Error("Missing request ID");
    }
    const res = await fetch(
      `${BE_URL}/api/requests/${encodeURIComponent(requestId)}/mint`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error("Mint failed: " + res.status + " " + txt);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
}

export async function pemToArrayBuffer(pem: string) {
  // strip header/footer and decode base64
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Wrap AES CryptoKey with server RSA public key (PEM). Returns base64 wrapped key.
 */
export async function wrapAesKeyForServer(
  aesKey: CryptoKey,
  serverPublicKeyPem: string
) {
  // export raw AES key bytes
  const raw = await crypto.subtle.exportKey("raw", aesKey); // ArrayBuffer

  // import server public key (SPKI)
  const spki = await pemToArrayBuffer(serverPublicKeyPem);
  const pubKey = await crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  // encrypt (wrap) raw AES key with RSA-OAEP
  const wrapped = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    pubKey,
    raw
  );
  return toBase64(new Uint8Array(wrapped));
}

export function findFileUrl(files: any[] | undefined, keywords: string[]) {
  if (!Array.isArray(files) || files.length === 0) return null;
  const lower = (s?: any) => (s ? String(s).toLowerCase() : "");

  // 1) exact purpose/purpose in meta/tag
  for (const f of files) {
    const p = lower(f.purpose) || lower(f.meta?.purpose) || lower(f.meta?.tag);
    if (keywords.some((k) => p === k.toLowerCase()))
      return f.decryptedUrl ?? f.meta?.url ?? null;
  }

  // 2) contains in filename or meta name or cid
  for (const f of files) {
    const name =
      lower(f.filename) || lower(f.meta?.filename) || lower(f.meta?.name);
    const cid = lower(f.cid);
    if (
      keywords.some(
        (k) => name.includes(k.toLowerCase()) || cid.includes(k.toLowerCase())
      )
    )
      return f.decryptedUrl ?? f.meta?.url ?? null;
  }

  // 3) fallback to first decryptedUrl if any
  const any = files.find((f) => f.decryptedUrl);
  return any ? any.decryptedUrl : null;
}
