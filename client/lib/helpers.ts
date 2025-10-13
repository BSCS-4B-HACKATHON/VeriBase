export const BE_URL = process.env.NEXT_PUBLIC_BE_URL || "http://localhost:6969";

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
    const copy =
        data instanceof Uint8Array ? data.slice() : new Uint8Array(data);
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
}: {
    aesKey: CryptoKey;
    encryptedFields: Record<string, { ciphertextBase64: string; iv: string }>;
    filesMeta: Array<any>;
    signerAddress: string;
    signWithViemWalletClient?: {
        signMessage: (args: {
            message: Uint8Array | string;
        }) => Promise<string>;
    } | null;
}) {
    const metadata = {
        version: "1",
        encryptedFields,
        files: filesMeta,
        createdAt: new Date().toISOString(),
    };

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

async function clearSiteData() {
    try {
        // Clear caches if available
        if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
        }
        // Clear storage
        try {
            localStorage.clear();
        } catch {}
        try {
            sessionStorage.clear();
        } catch {}
    } catch (err) {
        console.warn("clearSiteData failed:", err);
    }
}

export async function disconnectWallet() {
    try {
        const provider = (window as any).ethereum;

        await clearSiteData();

        // Try to disconnect any wallet client (WalletConnect / viem) if available
        try {
            const wc =
                (window as any).walletClient ||
                (globalThis as any).walletClient;
            if (wc && typeof (wc as any).disconnect === "function") {
                try {
                    await (wc as any).disconnect();
                } catch (err) {
                    console.warn("walletClient.disconnect() failed:", err);
                }
            }
        } catch (err) {
            // ignore if access fails
        }

        // If provider supports an explicit disconnect (e.g. WalletConnect), call it.
        if (provider?.disconnect && typeof provider.disconnect === "function") {
            try {
                await provider.disconnect();
            } catch (err) {
                console.warn("provider.disconnect() failed:", err);
            }
        }

        // Remove common listeners you may have added elsewhere
        try {
            if (provider?.removeListener) {
                provider.removeListener("accountsChanged", () => {});
                provider.removeListener("chainChanged", () => {});
                provider.removeListener("disconnect", () => {});
            }
        } catch (err) {
            console.warn("removeListener failed:", err);
        }

        // Clear app-local connection state (keys used elsewhere)
        try {
            localStorage.removeItem("vb_address");
            localStorage.removeItem("vb_provider");
            localStorage.removeItem("connectedAccount");
            sessionStorage.removeItem("connectedAccount");
        } catch {}

        // Notify app/UI to update (emit both events used in your codebase)
        window.dispatchEvent(new CustomEvent("vb_wallet_disconnect"));
        window.dispatchEvent(new CustomEvent("wallet-disconnected"));

        // Note: MetaMask doesn't support forcing a full disconnect; user must revoke in wallet UI.
        return;
    } catch (err) {
        console.warn("disconnectWallet error:", err);
    }
}
