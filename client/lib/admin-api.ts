/**
 * Admin API helper functions
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.NEXT_PUBLIC_BE_URL ||
  "http://localhost:5000";

/**
 * Document metadata structure matching DB schema
 */
export interface DocMeta {
  cid: string;
  filename: string;
  mime?: string;
  size?: number;
  iv?: string;
  ciphertextHash?: string;
  tag?: string;
}

/**
 * Request interface matching DB schema (DocMetaSchema)
 */
export interface AdminRequest {
  _id: string;
  requestId: string;
  requesterWallet: string;
  requestType: "national_id" | "land_ownership";
  minimalPublicLabel?: string;
  metadataCid?: string;
  metadataHash?: string;
  uploaderSignature?: string;
  files: DocMeta[];
  consent: {
    textVersion: string;
    timestamp: string;
  };
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  updatedAt: string;
}

/**
 * Detailed request with decrypted data (from GetRequestByIdHandler)
 */
export interface DetailedAdminRequest extends AdminRequest {
  // Decrypted personal data for National ID
  nationalIdData?: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    idNumber: string | null;
    issueDate: string | null;
    expiryDate: string | null;
  };
  // Decrypted land data for Land Ownership
  landTitleData?: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    latitude: string | null;
    longitude: string | null;
    titleNumber: string | null;
    lotArea: string | null;
  };
  // Decrypted files with URLs
  files: Array<
    DocMeta & {
      decryptedUrl?: string;
      decryptError?: boolean;
      meta?: any;
    }
  >;
  // Generic decrypted fields
  decryptedFields?: Record<string, any>;
  encryptedFields?: Record<string, any>;
}

export interface AdminRequestsResponse {
  ok: boolean;
  requests: AdminRequest[];
  total: number;
  limit: number;
  skip: number;
}

export interface AdminStatsResponse {
  ok: boolean;
  stats: {
    totalUsers: number;
    totalRequests: number;
    pendingRequests: number;
    verifiedRequests: number;
    rejectedRequests: number;
    nationalIdRequests: number;
    landOwnershipRequests: number;
  };
}

/**
 * Fetch all admin requests with optional filters
 */
export async function fetchAdminRequests(params?: {
  status?: string;
  requestType?: string;
  limit?: number;
  skip?: number;
}): Promise<AdminRequestsResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.requestType)
      queryParams.append("requestType", params.requestType);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.skip) queryParams.append("skip", params.skip.toString());

    const url = `${API_BASE_URL}/api/admin/requests${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin requests: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching admin requests:", error);
    throw error;
  }
}

/**
 * Fetch a single admin request by ID with decrypted data
 * Uses the admin endpoint which doesn't require wallet check
 */
export async function fetchAdminRequestById(
  requestId: string
): Promise<DetailedAdminRequest | null> {
  try {
    // Call the ADMIN request endpoint which returns decrypted data without wallet check
    const response = await fetch(
      `${API_BASE_URL}/api/admin/requests/${requestId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch request: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok || !data.request) {
      throw new Error("Invalid response format");
    }

    return data.request as DetailedAdminRequest;
  } catch (error) {
    console.error("Error fetching admin request:", error);
    return null;
  }
}

/**
 * Approve a verification request
 */
export async function approveRequest(
  requestId: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/requests/${requestId}/approve`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to approve request");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error approving request:", error);
    return { ok: false, error: error.message };
  }
}

/**
 * Reject a verification request
 */
export async function rejectRequest(
  requestId: string,
  reason?: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/requests/${requestId}/reject`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to reject request");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error rejecting request:", error);
    return { ok: false, error: error.message };
  }
}

/**
 * Fetch admin dashboard statistics
 */
export async function fetchAdminStats(): Promise<AdminStatsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin stats: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw error;
  }
}
