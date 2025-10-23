"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Wallet,
  MapPin,
  Download,
  Image as ImageIcon,
  Edit3,
  Send,
  Hash,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchAdminRequestById,
  approveRequest,
  rejectRequest,
} from "@/lib/admin-api";
import type { VerificationStatus, VerificationRequest } from "@/lib/types";
import { format } from "date-fns";
import Image from "next/image";

interface ExtendedRequest extends VerificationRequest {
  documentType?: "Land Title" | "National ID";
  email?: string;
  idNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  nftHash?: string;
  blockchainTxLink?: string;
  frontImage?: string;
  backImage?: string;
  accountCreatedOn?: string;
  previousRequestsCount?: number;
  adminRemarks?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  // Add decrypted data from API
  nationalIdData?: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    idNumber: string | null;
    issueDate: string | null;
    expiryDate: string | null;
  };
  landTitleData?: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    latitude: string | null;
    longitude: string | null;
    titleNumber: string | null;
    lotArea: string | null;
  };
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    by: string;
    remarks?: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

function getStatusBadge(status: VerificationStatus) {
  const variants: Record<
    VerificationStatus,
    {
      className: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }
  > = {
    verified: {
      className:
        "bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20",
      label: "Approved",
      icon: CheckCircle2,
    },
    pending: {
      className:
        "bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20",
      label: "Pending",
      icon: Clock,
    },
    rejected: {
      className:
        "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
      label: "Rejected",
      icon: XCircle,
    },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} text-sm px-3 py-1`}
    >
      <Icon className="w-4 h-4 mr-1.5" />
      {config.label}
    </Badge>
  );
}

function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function RequestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<ExtendedRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [_previewImage, setPreviewImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    // Fetch real request from API with decrypted data
    const fetchRequest = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAdminRequestById(requestId);

        if (!data) {
          toast.error("Request not found");
          router.push("/admin/requests");
          return;
        }

        // Map API response to UI format (same as user request page)
        const rawType = data.requestType;
        const canonicalType: "national-id" | "land-title" =
          rawType === "national_id" ? "national-id" : "land-title";

        const mapped: ExtendedRequest = {
          id: data.requestId,
          userId: data.requesterWallet,
          userName:
            data.minimalPublicLabel || shortenAddress(data.requesterWallet),
          assetType: "NFT",
          assetId: data.requestId,
          walletAddress: data.requesterWallet,
          description: `${
            canonicalType === "national-id" ? "National ID" : "Land Ownership"
          } verification request`,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          documentType:
            canonicalType === "national-id" ? "National ID" : "Land Title",
          // Use decrypted data from API
          email: undefined,
          idNumber: data.nationalIdData?.idNumber || undefined,
          issueDate: data.nationalIdData?.issueDate || undefined,
          expiryDate: data.nationalIdData?.expiryDate || undefined,
          nftHash: data.metadataHash || undefined,
          blockchainTxLink: undefined,
          // Get decrypted file URLs from API response
          frontImage: data.files?.find(
            (f) =>
              f.tag?.toLowerCase().includes("front") ||
              f.filename?.toLowerCase().includes("front")
          )?.decryptedUrl,
          backImage: data.files?.find(
            (f) =>
              f.tag?.toLowerCase().includes("back") ||
              f.filename?.toLowerCase().includes("back")
          )?.decryptedUrl,
          accountCreatedOn: data.createdAt,
          previousRequestsCount: 0,
          adminRemarks: "",
          lastUpdatedBy: "Admin",
          lastUpdatedAt: data.updatedAt,
          // Store full decrypted data
          nationalIdData: data.nationalIdData,
          landTitleData: data.landTitleData,
          statusHistory: [
            {
              status: "Request Submitted",
              timestamp: data.createdAt,
              by: data.minimalPublicLabel || "User",
              icon: Send,
              remarks: "Initial submission received",
            },
            ...(data.status === "verified"
              ? [
                  {
                    status: "Approved",
                    timestamp: data.updatedAt,
                    by: "Admin",
                    icon: CheckCircle2,
                    remarks: "Verification approved",
                  },
                ]
              : data.status === "rejected"
              ? [
                  {
                    status: "Rejected",
                    timestamp: data.updatedAt,
                    by: "Admin",
                    icon: XCircle,
                    remarks: "Verification rejected",
                  },
                ]
              : []),
          ],
        };

        setRequest(mapped);
      } catch (error) {
        console.error("Error fetching request:", error);
        toast.error("Failed to load request details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, router]);

  const handleApprove = async () => {
    if (!request) return;

    try {
      const result = await approveRequest(request.id);
      if (result.ok) {
        toast.success("Request approved successfully");
        router.push("/admin/requests");
      } else {
        toast.error(result.error || "Failed to approve request");
      }
    } catch (error) {
      toast.error("Failed to approve request");
      console.error("Approve error:", error);
    }
  };

  const handleReject = async () => {
    if (!request) return;

    if (!adminRemarks.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      const result = await rejectRequest(request.id, adminRemarks);
      if (result.ok) {
        toast.error(`Request rejected: ${adminRemarks}`);
        router.push("/admin/requests");
      } else {
        toast.error(result.error || "Failed to reject request");
      }
    } catch (error) {
      toast.error("Failed to reject request");
      console.error("Reject error:", error);
    }
  };

  const handleRequestResubmission = () => {
    if (!adminRemarks.trim()) {
      toast.error("Please provide feedback for resubmission");
      return;
    }
    toast.info(`Resubmission requested: ${adminRemarks}`);
    // TODO: Implement actual resubmission logic
  };

  const handleDownloadData = () => {
    toast.success("Downloading request data as JSON...");
    // TODO: Implement JSON export
  };

  const openImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setIsImageModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#3ECF8E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-surface-75 rounded-2xl border-border/40 p-8 max-w-md">
          <CardContent className="text-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold">Request Not Found</h2>
            <p className="text-muted-foreground">
              The verification request you&apos;re looking for doesn&apos;t
              exist.
            </p>
            <Button
              onClick={() => router.push("/admin/requests")}
              className="bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"
        >
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Request Details
            </h1>
            <p className="text-muted-foreground text-sm">
              View and manage this verification submission.
            </p>
          </div>
          <Button
            onClick={() => router.push("/admin/requests")}
            variant="outline"
            size="lg"
            className="w-full md:w-auto border-[#3ECF8E]/30 hover:bg-[#3ECF8E]/10 hover:border-[#3ECF8E]/50 transition-colors shrink-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </motion.div>

        {/* Top Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-foreground/5 rounded-2xl border-white/10 shadow-sm shadow-black/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#3ECF8E]/20 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-[#3ECF8E]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Submitted By
                    </p>
                    <p className="font-semibold">{request.userName}</p>
                    <code className="text-xs text-muted-foreground">
                      {shortenAddress(request.walletAddress)}
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Document Type
                    </p>
                    <p className="font-semibold">{request.documentType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Submitted On
                    </p>
                    <p className="font-semibold">
                      {format(new Date(request.createdAt), "MMM dd, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(request.createdAt), "HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Current Status
                    </p>
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Layout: 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Document Information (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-foreground/5 rounded-2xl border-white/10 shadow-sm shadow-black/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#3ECF8E]" />
                    Document Details
                  </CardTitle>
                  <CardDescription>
                    Official information from submitted documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-white/10 space-y-4">
                    {/* National ID Fields */}
                    {request.documentType === "National ID" &&
                      request.nationalIdData && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 first:pt-0">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-[#3ECF8E]" />
                                <p className="text-xs text-muted-foreground font-medium">
                                  First Name
                                </p>
                              </div>
                              <p className="text-sm font-semibold">
                                {request.nationalIdData.firstName || "N/A"}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-[#3ECF8E]" />
                                <p className="text-xs text-muted-foreground font-medium">
                                  Last Name
                                </p>
                              </div>
                              <p className="text-sm font-semibold">
                                {request.nationalIdData.lastName || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Hash className="w-4 h-4 text-[#3ECF8E]" />
                                <p className="text-xs text-muted-foreground font-medium">
                                  ID Number
                                </p>
                              </div>
                              <code className="text-sm font-mono">
                                {request.nationalIdData.idNumber || "N/A"}
                              </code>
                            </div>
                            {request.nationalIdData.middleName && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="w-4 h-4 text-[#3ECF8E]" />
                                  <p className="text-xs text-muted-foreground font-medium">
                                    Middle Name
                                  </p>
                                </div>
                                <p className="text-sm font-semibold">
                                  {request.nationalIdData.middleName}
                                </p>
                              </div>
                            )}
                          </div>

                          {(request.nationalIdData.issueDate ||
                            request.nationalIdData.expiryDate) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                              {request.nationalIdData.issueDate && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-[#3ECF8E]" />
                                    <p className="text-xs text-muted-foreground font-medium">
                                      Issue Date
                                    </p>
                                  </div>
                                  <p className="text-sm">
                                    {request.nationalIdData.issueDate}
                                  </p>
                                </div>
                              )}
                              {request.nationalIdData.expiryDate && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-red-400" />
                                    <p className="text-xs text-muted-foreground font-medium">
                                      Expiry Date
                                    </p>
                                  </div>
                                  <p className="text-sm">
                                    {request.nationalIdData.expiryDate}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                    {/* Land Title Fields */}
                    {request.documentType === "Land Title" &&
                      request.landTitleData && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 first:pt-0">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-[#3ECF8E]" />
                                <p className="text-xs text-muted-foreground font-medium">
                                  First Name
                                </p>
                              </div>
                              <p className="text-sm font-semibold">
                                {request.landTitleData.firstName || "N/A"}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-[#3ECF8E]" />
                                <p className="text-xs text-muted-foreground font-medium">
                                  Last Name
                                </p>
                              </div>
                              <p className="text-sm font-semibold">
                                {request.landTitleData.lastName || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Hash className="w-4 h-4 text-[#3ECF8E]" />
                                <p className="text-xs text-muted-foreground font-medium">
                                  Title Number
                                </p>
                              </div>
                              <code className="text-sm font-mono">
                                {request.landTitleData.titleNumber || "N/A"}
                              </code>
                            </div>
                            {request.landTitleData.middleName && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="w-4 h-4 text-[#3ECF8E]" />
                                  <p className="text-xs text-muted-foreground font-medium">
                                    Middle Name
                                  </p>
                                </div>
                                <p className="text-sm font-semibold">
                                  {request.landTitleData.middleName}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-[#3ECF8E]" />
                                <p className="text-xs text-muted-foreground font-medium">
                                  Latitude
                                </p>
                              </div>
                              <p className="text-sm">
                                {request.landTitleData.latitude || "N/A"}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-[#3ECF8E]" />
                                <p className="text-xs text-muted-foreground font-medium">
                                  Longitude
                                </p>
                              </div>
                              <p className="text-sm">
                                {request.landTitleData.longitude || "N/A"}
                              </p>
                            </div>
                          </div>

                          {request.landTitleData.lotArea && (
                            <div className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-[#3ECF8E]" />
                                <p className="text-xs text-muted-foreground font-medium">
                                  Lot Area (sqm)
                                </p>
                              </div>
                              <p className="text-sm">
                                {request.landTitleData.lotArea}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                    {request.nftHash && (
                      <div className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-[#3ECF8E]" />
                          <p className="text-xs text-muted-foreground font-medium">
                            Metadata Hash
                          </p>
                        </div>
                        <code className="text-sm font-mono bg-background/50 px-3 py-2 rounded-lg block break-all">
                          {request.nftHash}
                        </code>
                      </div>
                    )}

                    {request.description && (
                      <div className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-[#3ECF8E]" />
                          <p className="text-xs text-muted-foreground font-medium">
                            Description
                          </p>
                        </div>
                        <p className="text-sm">{request.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Uploaded Documents Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-foreground/5 rounded-2xl border-white/10 shadow-sm shadow-black/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#3ECF8E]" />
                    Uploaded Documents
                  </CardTitle>
                  <CardDescription>
                    Front and back images of the document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Front Image */}
                    {request.frontImage && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-4 h-4 text-[#3ECF8E]" />
                          <p className="text-xs text-muted-foreground font-medium">
                            Front Image
                          </p>
                        </div>
                        <div
                          onClick={() => openImagePreview(request.frontImage!)}
                          className="aspect-video bg-background/50 rounded-lg overflow-hidden border border-border/40 hover:border-[#3ECF8E]/50 transition-all cursor-pointer group"
                        >
                          <Image
                            src={request.frontImage}
                            alt="Front ID"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                              (
                                e.target as HTMLImageElement
                              ).parentElement!.innerHTML =
                                '<div class="w-full h-full flex items-center justify-center"><div class="text-center"><div class="w-12 h-12 text-muted-foreground mx-auto mb-2">📄</div><p class="text-xs text-muted-foreground">Failed to load image</p></div></div>';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Back Image */}
                    {request.backImage && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-4 h-4 text-[#3ECF8E]" />
                          <p className="text-xs text-muted-foreground font-medium">
                            Back Image
                          </p>
                        </div>
                        <div
                          onClick={() => openImagePreview(request.backImage!)}
                          className="aspect-video bg-background/50 rounded-lg overflow-hidden border border-border/40 hover:border-[#3ECF8E]/50 transition-all cursor-pointer group"
                        >
                          <Image
                            src={request.backImage}
                            alt="Back ID"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                              (
                                e.target as HTMLImageElement
                              ).parentElement!.innerHTML =
                                '<div class="w-full h-full flex items-center justify-center"><div class="text-center"><div class="w-12 h-12 text-muted-foreground mx-auto mb-2">📄</div><p class="text-xs text-muted-foreground">Failed to load image</p></div></div>';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Show placeholder if no images */}
                    {!request.frontImage && !request.backImage && (
                      <div className="col-span-2 text-center py-8">
                        <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No images available for this request
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Request History Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-foreground/5 rounded-2xl border-white/10 shadow-sm shadow-black/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#3ECF8E]" />
                    Verification History
                  </CardTitle>
                  <CardDescription>
                    Timeline of status changes and reviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {request.statusHistory?.map((item, index) => {
                      const Icon = item.icon;
                      const isLast =
                        index === request.statusHistory!.length - 1;
                      const isApproved = item.status === "Approved";
                      const isRejected = item.status === "Rejected";

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex gap-4"
                        >
                          <div className="relative flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                isApproved
                                  ? "bg-green-500/20 border-green-500"
                                  : isRejected
                                  ? "bg-red-500/20 border-red-500"
                                  : "bg-[#3ECF8E]/20 border-[#3ECF8E]"
                              }`}
                            >
                              <Icon
                                className={`w-5 h-5 ${
                                  isApproved
                                    ? "text-green-500"
                                    : isRejected
                                    ? "text-red-500"
                                    : "text-[#3ECF8E]"
                                }`}
                              />
                            </div>
                            {!isLast && (
                              <div className="w-px flex-1 bg-border/40 mt-2 min-h-[40px]" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <p className="text-sm font-semibold mb-1">
                              {item.status}
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {format(
                                new Date(item.timestamp),
                                "MMM dd, yyyy 'at' HH:mm"
                              )}{" "}
                              by {item.by}
                            </p>
                            {item.remarks && (
                              <p className="text-sm text-muted-foreground bg-background/50 px-3 py-2 rounded-lg border border-border/40">
                                {item.remarks}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: User Info + Admin Actions (1/3 width) */}
          <div className="space-y-6">
            {/* User Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-foreground/5 rounded-2xl border-white/10 shadow-sm shadow-black/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-[#3ECF8E]" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-[#3ECF8E]" />
                      <p className="text-xs text-muted-foreground font-medium">
                        Full Name
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{request.userName}</p>
                  </div>

                  <Separator className="bg-white/10" />

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-[#3ECF8E]" />
                      <p className="text-xs text-muted-foreground font-medium">
                        Email Address
                      </p>
                    </div>
                    <p className="text-sm break-all">{request.email}</p>
                  </div>

                  <Separator className="bg-white/10" />

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-[#3ECF8E]" />
                      <p className="text-xs text-muted-foreground font-medium">
                        Wallet Address
                      </p>
                    </div>
                    <code className="text-sm font-mono bg-background/50 px-3 py-2 rounded-lg block break-all">
                      {request.walletAddress}
                    </code>
                  </div>

                  <Separator className="bg-white/10" />

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-[#3ECF8E]" />
                      <p className="text-xs text-muted-foreground font-medium">
                        Account Created On
                      </p>
                    </div>
                    <p className="text-sm">
                      {format(
                        new Date(request.accountCreatedOn!),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  </div>

                  <Separator className="bg-white/10" />

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-[#3ECF8E]" />
                      <p className="text-xs text-muted-foreground font-medium">
                        Previous Requests
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {request.previousRequestsCount} request(s)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Admin Actions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-foreground/5 rounded-2xl border-white/10 shadow-sm shadow-black/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#3ECF8E]" />
                    Admin Actions
                  </CardTitle>
                  <CardDescription>
                    Review and update request status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Admin Remarks Text Area */}
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-2 block">
                      Admin Remarks / Feedback
                    </label>
                    <textarea
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      placeholder="Provide feedback or reason for decision..."
                      className="w-full min-h-[100px] px-3 py-2 bg-background/50 border border-border/40 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    />
                  </div>

                  {/* Action Buttons */}
                  {request.status === "pending" && (
                    <div className="space-y-3">
                      <Button
                        onClick={handleApprove}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve Request
                      </Button>
                      <Button
                        onClick={handleReject}
                        variant="outline"
                        className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Request
                      </Button>
                      <Button
                        onClick={handleRequestResubmission}
                        variant="outline"
                        className="w-full border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Request Resubmission
                      </Button>
                    </div>
                  )}

                  {request.status !== "pending" && (
                    <div className="bg-background/50 p-4 rounded-lg border border-border/40 text-center">
                      <p className="text-sm text-muted-foreground">
                        This request has been{" "}
                        <span className="font-semibold text-foreground">
                          {request.status}
                        </span>
                      </p>
                    </div>
                  )}

                  <Separator className="bg-white/10" />

                  {/* Download Button */}
                  <Button
                    onClick={handleDownloadData}
                    variant="outline"
                    className="w-full border-[#3ECF8E]/30 hover:bg-[#3ECF8E]/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Data (JSON)
                  </Button>

                  {/* Last Updated Info */}
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    <p>Last updated by {request.lastUpdatedBy}</p>
                    <p>
                      {format(
                        new Date(request.lastUpdatedAt!),
                        "MMM dd, yyyy 'at' HH:mm"
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl bg-surface-75 border-border/40 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-background/50 rounded-lg flex items-center justify-center border border-border/40">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Image preview placeholder
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Actual document image would be displayed here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
