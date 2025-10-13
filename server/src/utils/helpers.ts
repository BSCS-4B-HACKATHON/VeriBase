import crypto from "crypto";

/**
 * Unwrap AES key that was RSA-OAEP encrypted (base64).
 * Expects process.env.SERVER_RSA_PRIVATE_KEY (PEM). Supports escaped \n.
 */
export async function unwrapAesKeyForServer(
    wrappedBase64: string
): Promise<Buffer> {
    const rawPem = process.env.SERVER_RSA_PRIVATE_KEY;
    if (!rawPem) throw new Error("SERVER_RSA_PRIVATE_KEY not configured");
    const privatePem = rawPem.replace(/\\n/g, "\n");
    const wrapped = Buffer.from(wrappedBase64, "base64");
    const rawKey = crypto.privateDecrypt(
        {
            key: privatePem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        wrapped
    );
    return rawKey; // Buffer (raw AES key bytes)
}

/**
 * Decrypt an AES-GCM encrypted field.
 * field: { ciphertextBase64: string, iv: string }
 * Assumes ciphertextBase64 includes auth tag appended (WebCrypto default).
 */
export async function decryptField(
    rawAesKey: Buffer,
    field: { ciphertextBase64: string; iv: string }
): Promise<string> {
    const iv = Buffer.from(field.iv, "base64");
    const ctAndTag = Buffer.from(field.ciphertextBase64, "base64");
    if (ctAndTag.length < 16) throw new Error("ciphertext too short");
    const tag = ctAndTag.subarray(ctAndTag.length - 16);
    const ciphertext = ctAndTag.subarray(0, ctAndTag.length - 16);
    const decipher = crypto.createDecipheriv("aes-256-gcm", rawAesKey, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return out.toString("utf8");
}

/**
 * Decrypt an encrypted file buffer using AES-GCM and return a data URL (short dev-friendly).
 * - encryptedBuffer: encrypted bytes (ciphertext+tag) fetched from IPFS/storage
 * - rawAesKey: Buffer (AES key bytes)
 * - f: file metadata object; expects f.iv (base64) and optionally f.mime
 *
 * NOTE: returning data URLs is convenient for dev/testing. For production, decrypt to secure storage
 * and return a signed URL instead.
 */
export async function decryptFileToSignedUrl(
    encryptedBuffer: Buffer,
    rawAesKey: Buffer,
    f: any
): Promise<string> {
    const ivBase64 = f?.iv ?? f?.meta?.iv ?? null;
    if (!ivBase64) throw new Error("missing iv for file decryption");
    const iv = Buffer.from(ivBase64, "base64");

    if (encryptedBuffer.length < 16)
        throw new Error("encrypted file too short");
    const tag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
    const ciphertext = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", rawAesKey, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    const mime = f?.mime || "application/octet-stream";
    const dataUrl = `data:${mime};base64,${decrypted.toString("base64")}`;
    return dataUrl;
}
