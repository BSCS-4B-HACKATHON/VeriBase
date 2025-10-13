export type VerificationStatus = "pending" | "verified" | "rejected";

export type AssetType = "NFT" | "Token" | "Domain" | "Contract" | "Other";

export interface VerificationRequest {
    id: string;
    userId: string;
    userName: string;
    assetType: AssetType;
    assetId: string;
    walletAddress: string;
    description?: string;
    status: VerificationStatus;
    createdAt: string;
    updatedAt: string;
    verifiedAt?: string;
    rejectedAt?: string;
    adminNotes?: string;
}

export interface Asset {
    id: string;
    name: string;
    type: AssetType;
    assetId: string;
    verifiedAt: string;
    verificationRequestId: string;
}

export interface AdminStats {
    totalRequests: number;
    pendingRequests: number;
    verifiedRequests: number;
    rejectedRequests: number;
}

export interface RequestHistory {
    id: string;
    action: string;
    timestamp: string;
    actor: string;
    notes?: string;
}

export interface DocType {
    cid: string;
    filename: string;
    mime?: string;
    size?: number;
    iv?: string;
    ciphertextHash?: string;
    tag?: string;
}

export interface RequestType {
    requestId: string;
    requesterWallet: string;
    requestType: "national_id" | "land_ownership";
    minimalPublicLabel?: string;
    metadataCid?: string;
    metadataHash?: string;
    uploaderSignature?: string;
    files: DocType[];
    consent: {
        textVersion: string;
        timestamp: Date;
    };
    status: "pending" | "verified" | "rejected";
    createdAt: Date;
    updatedAt: Date;
}
