import {
  genAesKey,
  encryptField,
  encryptAndUploadFile,
  buildAndUploadMetadata,
  SERVER_PUBLIC_KEY_PEM,
  wrapAesKeyForServer,
  type FileWithMeta,
} from "@/lib/helpers";
import type { WalletClient } from "viem";
import type { SignableMessage } from "viem";

type NationalIdForm = {
  firstName: string;
  lastName: string;
  idNumber: string;
  issueDate: string;
  expiryDate: string;
  frontPicture: File | null;
  backPicture: File | null;
  selfieWithId: File | null;
};

type LandTitleForm = {
  firstName: string;
  lastName: string;
  latitude: string;
  longitude: string;
  titleNumber: string;
  lotArea: string;
  deedUpload: File | null;
};

type SubmitOptions = {
  address: string | null;
  walletClient: WalletClient | null;
  BE_URL: string;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
  setIsSubmitting?: (b: boolean) => void;
  toast: { success: (s: string) => void; error: (s: string) => void };
};

export async function createSignWrapper(
  walletClient: WalletClient | null,
  address: string | null
) {
  if (!walletClient || !address) return undefined;
  return {
    signMessage: async (args: { message: string | Uint8Array }) => {
      return await walletClient.signMessage({
        message: args.message as SignableMessage,
        account: address as `0x${string}`,
      });
    },
  };
}

export async function submitNationalId(
  form: NationalIdForm,
  opts: SubmitOptions
) {
  const { address, walletClient, BE_URL, onError, setIsSubmitting, toast } =
    opts;
  try {
    if (setIsSubmitting) setIsSubmitting(true);

    // basic validation
    if (
      !form.firstName ||
      !form.lastName ||
      !form.idNumber ||
      !form.issueDate ||
      !form.expiryDate ||
      !form.frontPicture ||
      !form.backPicture ||
      !form.selfieWithId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet before submitting.");
      return;
    }

    const aesKey = await genAesKey();

    // Encrypt fields in parallel
    const [encFirst, encLast, encIssue, encExpiry, encId] = await Promise.all([
      encryptField(aesKey, form.firstName),
      encryptField(aesKey, form.lastName),
      encryptField(aesKey, form.issueDate),
      encryptField(aesKey, form.expiryDate),
      encryptField(aesKey, form.idNumber),
    ]);

    // Upload files in parallel
    const [frontMeta, backMeta, selfieMeta] = await Promise.all([
      encryptAndUploadFile(form.frontPicture!, aesKey, address),
      encryptAndUploadFile(form.backPicture!, aesKey, address),
      encryptAndUploadFile(form.selfieWithId!, aesKey, address),
    ]);

    frontMeta.tag = "front_id";
    backMeta.tag = "back_id";
    selfieMeta.tag = "selfie_with_id";

    const filesMeta: Array<FileWithMeta> = [frontMeta, backMeta, selfieMeta];

    const signWithViemWrapper = await createSignWrapper(walletClient, address);

    const wrappedKeyForServer = await wrapAesKeyForServer(
      aesKey,
      SERVER_PUBLIC_KEY_PEM
    );

    const { metadataCid, metadataHash, uploaderSignature } =
      await buildAndUploadMetadata({
        aesKey,
        encryptedFields: {
          firstName: encFirst,
          lastName: encLast,
          issueDate: encIssue,
          expiryDate: encExpiry,
          idNumber: encId,
        },
        filesMeta,
        signerAddress: address,
        signWithViemWalletClient: signWithViemWrapper,
        serverWrappedAesKey: wrappedKeyForServer,
      });

    const requestId =
      "0x" +
      Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    const payload = {
      requestId,
      requesterWallet: address,
      requestType: "national_id",
      minimalPublicLabel: `${form.firstName[0]}. ${form.lastName}`,
      metadataCid,
      metadataHash,
      uploaderSignature,
      files: filesMeta,
      consent: {
        textVersion: "v1",
        timestamp: new Date().toISOString(),
      },
      status: "pending",
    };

    const res = await fetch(`${BE_URL}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => null);
      throw new Error(`Create request failed: ${res.status} ${body ?? ""}`);
    }

    toast.success("National ID verification request submitted successfully");
    return requestId;
  } catch (err) {
    console.error("submitNationalId error:", err);
    toast.error("Failed to submit request. Please try again.");
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    if (setIsSubmitting) setIsSubmitting(false);
  }
}

export async function submitLandTitle(
  form: LandTitleForm,
  opts: SubmitOptions
) {
  const { address, walletClient, BE_URL, onError, setIsSubmitting, toast } =
    opts;
  try {
    if (setIsSubmitting) setIsSubmitting(true);

    if (
      !form.firstName ||
      !form.lastName ||
      !form.latitude ||
      !form.longitude ||
      !form.titleNumber ||
      !form.lotArea ||
      !form.deedUpload
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error("Latitude must be between -90 and 90");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error("Longitude must be between -180 and 180");
      return;
    }

    const area = parseFloat(form.lotArea);
    if (isNaN(area) || area <= 0) {
      toast.error("Lot area must be a positive number");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet before submitting.");
      return;
    }

    const aesKey = await genAesKey();

    // Encrypt fields and upload deed in parallel
    const [encFirst, encLast, encLat, encLng, encTitle, encArea, deedMeta] =
      await Promise.all([
        encryptField(aesKey, form.firstName),
        encryptField(aesKey, form.lastName),
        encryptField(aesKey, String(form.latitude)),
        encryptField(aesKey, String(form.longitude)),
        encryptField(aesKey, form.titleNumber),
        encryptField(aesKey, form.lotArea),
        encryptAndUploadFile(form.deedUpload!, aesKey, address),
      ]);

    deedMeta.tag = "land_deed";
    const filesMeta: Array<FileWithMeta> = [deedMeta];

    const signWithViemWrapper = await createSignWrapper(walletClient, address);

    const wrappedKeyForServer = await wrapAesKeyForServer(
      aesKey,
      SERVER_PUBLIC_KEY_PEM
    );

    const { metadataCid, metadataHash, uploaderSignature } =
      await buildAndUploadMetadata({
        aesKey,
        encryptedFields: {
          firstName: encFirst,
          lastName: encLast,
          latitude: encLat,
          longitude: encLng,
          titleNumber: encTitle,
          lotArea: encArea,
        },
        filesMeta,
        signerAddress: address,
        signWithViemWalletClient: signWithViemWrapper,
        serverWrappedAesKey: wrappedKeyForServer,
      });

    const requestId =
      "0x" +
      Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    const payload = {
      requestId,
      requesterWallet: address,
      requestType: "land_ownership",
      minimalPublicLabel: `${form.firstName[0]}. ${form.lastName}`,
      metadataCid,
      metadataHash,
      uploaderSignature,
      files: filesMeta,
      consent: {
        textVersion: "v1",
        timestamp: new Date().toISOString(),
      },
      status: "pending",
    };

    const res = await fetch(`${BE_URL}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => null);
      throw new Error(
        `Create land-title request failed: ${res.status} ${body ?? ""}`
      );
    }

    toast.success("Land title verification request submitted successfully");
    return requestId;
  } catch (err) {
    console.error("submitLandTitle error:", err);
    toast.error("Failed to submit request. Please try again.");
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    if (setIsSubmitting) setIsSubmitting(false);
  }
}

// Update existing request (uploader edits). Requires requester wallet and requestId.
export async function updateNationalId(
  requestId: string,
  form: NationalIdForm,
  opts: SubmitOptions
) {
  const {
    address,
    walletClient,
    BE_URL,
    onSuccess,
    onError,
    setIsSubmitting,
    toast,
  } = opts;

  try {
    if (setIsSubmitting) setIsSubmitting(true);
    if (!address) {
      toast.error("Please connect your wallet before updating.");
      return;
    }

    const aesKey = await genAesKey();

    // Encrypt fields in parallel
    const [encFirst, encLast, encIssue, encExpiry, encId] = await Promise.all([
      encryptField(aesKey, form.firstName),
      encryptField(aesKey, form.lastName),
      encryptField(aesKey, form.issueDate),
      encryptField(aesKey, form.expiryDate),
      encryptField(aesKey, form.idNumber),
    ]);

    const filesMeta: Array<FileWithMeta> = [];

    // Upload any provided files in parallel
    const uploadTasks: Array<Promise<FileWithMeta>> = [];
    if (form.frontPicture) {
      uploadTasks.push(
        encryptAndUploadFile(form.frontPicture, aesKey, address).then((m) => {
          m.tag = "front_id";
          return m;
        })
      );
    }
    if (form.backPicture) {
      uploadTasks.push(
        encryptAndUploadFile(form.backPicture, aesKey, address).then((m) => {
          m.tag = "back_id";
          return m;
        })
      );
    }
    if (form.selfieWithId) {
      uploadTasks.push(
        encryptAndUploadFile(form.selfieWithId, aesKey, address).then((m) => {
          m.tag = "selfie_with_id";
          return m;
        })
      );
    }

    if (uploadTasks.length > 0) {
      const uploaded = await Promise.all(uploadTasks);
      filesMeta.push(...uploaded);
    }

    const signWithViemWrapper = await createSignWrapper(walletClient, address);
    const wrappedKeyForServer = await wrapAesKeyForServer(
      aesKey,
      SERVER_PUBLIC_KEY_PEM
    );

    const { metadataCid, metadataHash, uploaderSignature } =
      await buildAndUploadMetadata({
        aesKey,
        encryptedFields: {
          firstName: encFirst,
          lastName: encLast,
          issueDate: encIssue,
          expiryDate: encExpiry,
          idNumber: encId,
        },
        filesMeta,
        signerAddress: address,
        signWithViemWalletClient: signWithViemWrapper,
        serverWrappedAesKey: wrappedKeyForServer,
      });

    // PATCH backend to update record (server will verify signature)
    const updateUrl = `${BE_URL}/api/requests/${encodeURIComponent(
      address
    )}/${encodeURIComponent(requestId)}`;

    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metadataCid,
        metadataHash,
        uploaderSignature,
        files: filesMeta,
      }),
    });

    if (!updateRes.ok) {
      const txt = await updateRes.text().catch(() => null);
      throw new Error("update failed: " + txt);
    }

    toast.success("Request updated successfully");
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("updateNationalId error:", err);
    toast.error("Failed to update request. Please try again.");
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    if (setIsSubmitting) setIsSubmitting(false);
  }
}

export async function updateLandTitle(
  requestId: string,
  form: LandTitleForm,
  opts: SubmitOptions
) {
  const {
    address,
    walletClient,
    BE_URL,
    onSuccess,
    onError,
    setIsSubmitting,
    toast,
  } = opts;

  try {
    if (setIsSubmitting) setIsSubmitting(true);
    if (!address) {
      toast.error("Please connect your wallet before updating.");
      return;
    }

    const aesKey = await genAesKey();

    // Start encrypting fields and (optionally) deed upload in parallel
    const encFieldsPromise = Promise.all([
      encryptField(aesKey, form.firstName),
      encryptField(aesKey, form.lastName),
      encryptField(aesKey, String(form.latitude)),
      encryptField(aesKey, String(form.longitude)),
      encryptField(aesKey, form.titleNumber),
      encryptField(aesKey, form.lotArea),
    ]);

    const deedUploadPromise = form.deedUpload
      ? encryptAndUploadFile(form.deedUpload, aesKey, address)
      : Promise.resolve(null as FileWithMeta | null);

    const [encResults, deedMeta] = await Promise.all([
      encFieldsPromise,
      deedUploadPromise,
    ] as const);

    const [encFirst, encLast, encLat, encLng, encTitle, encArea] =
      encResults as any;

    const filesMeta: Array<FileWithMeta> = [];
    if (deedMeta) {
      deedMeta.tag = "land_deed";
      filesMeta.push(deedMeta);
    }

    const signWithViemWrapper = await createSignWrapper(walletClient, address);
    const wrappedKeyForServer = await wrapAesKeyForServer(
      aesKey,
      SERVER_PUBLIC_KEY_PEM
    );

    const { metadataCid, metadataHash, uploaderSignature } =
      await buildAndUploadMetadata({
        aesKey,
        encryptedFields: {
          firstName: encFirst,
          lastName: encLast,
          latitude: encLat,
          longitude: encLng,
          titleNumber: encTitle,
          lotArea: encArea,
        },
        filesMeta,
        signerAddress: address,
        signWithViemWalletClient: signWithViemWrapper,
        serverWrappedAesKey: wrappedKeyForServer,
      });

    const updateUrl = `${BE_URL}/api/requests/${encodeURIComponent(
      address
    )}/${encodeURIComponent(requestId)}`;

    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metadataCid,
        metadataHash,
        uploaderSignature,
        files: filesMeta,
      }),
    });

    if (!updateRes.ok) {
      const txt = await updateRes.text().catch(() => null);
      throw new Error("update failed: " + txt);
    }

    toast.success("Request updated successfully");
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("updateLandTitle error:", err);
    toast.error("Failed to update request. Please try again.");
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    if (setIsSubmitting) setIsSubmitting(false);
  }
}
