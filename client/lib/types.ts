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
