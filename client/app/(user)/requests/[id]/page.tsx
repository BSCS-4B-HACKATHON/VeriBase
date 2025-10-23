"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Upload,
  Loader2,
  Edit2,
  Save,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Hash,
} from "lucide-react";
import { getRequestById } from "@/lib/request";
import { useWallet } from "@/hooks/useWallet";
import { useParams } from "next/navigation";
import { createWalletClient, custom, WalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { BE_URL, findFileUrl } from "@/lib/helpers";
import { updateLandTitle, updateNationalId } from "@/lib/request-submit";
import Image from "next/image";

type RequestStatus = "pending" | "verified" | "rejected";
type RequestType = "national-id" | "land-title";

interface NationalIdData {
  firstName: string;
  lastName: string;
  idNumber: string;
  issueDate: string;
  expiryDate: string;
  frontPicture: string | null;
  backPicture: string | null;
  selfieWithId: string | null;
}

interface LandTitleData {
  firstName: string;
  lastName: string;
  latitude: string;
  longitude: string;
  titleNumber: string;
  lotArea: string;
  deedUpload: string | null;
}

interface RequestData {
  id: string;
  type: RequestType;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  nationalIdData?: NationalIdData;
  landTitleData?: LandTitleData;
}

export default function RequestPage() {
  const { address: walletAddress } = useWallet();
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [editedData, setEditedData] = useState<RequestData | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [address] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("vb_address") : null
  );
  const [walletCheckComplete, setWalletCheckComplete] = useState(false);

  // Initialize viem wallet client manually (same as new page)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const init = async () => {
      const provider = (window as { ethereum?: unknown }).ethereum;
      if (!provider) {
        setWalletCheckComplete(true);
        return;
      }

      try {
        const c = createWalletClient({
          transport: custom(window.ethereum),
          chain: baseSepolia,
        });
        setWalletClient(c);
      } catch (e) {
        console.warn("viem wallet client creation failed", e);
      }

      // Give wallet a moment to connect/restore session
      setTimeout(() => {
        setWalletCheckComplete(true);
      }, 1000);
    };

    init();
  }, []);

  console.log("Params ID:", id);

  // Fetch request data
  useEffect(() => {
    // Don't fetch until wallet check is complete
    if (!walletCheckComplete) {
      return;
    }

    const fetchRequest = async () => {
      setIsLoading(true);
      try {
        const fetchAddress = walletAddress ?? address;

        // Don't fetch if we don't have an address yet (wallet still connecting)
        if (!fetchAddress) {
          setIsLoading(false);
          return;
        }

        const r = await getRequestById(
          fetchAddress,
          Array.isArray(id) ? id[0] : id ?? ""
        ); // uses your helper
        if (!r) throw new Error("Request not found");

        // prefer decrypted files / metadata urls from server response
        const files = Array.isArray(r.files) ? r.files : r.request?.files ?? [];

        const rawType = (r.requestType ?? r.type ?? "national-id") as string;
        const normalized = rawType.replace(/_/g, "-").toLowerCase();
        const canonicalType: RequestType =
          normalized === "national-id" || normalized === "national_id"
            ? "national-id"
            : // map other synonyms to land-title
            normalized === "land-title" ||
              normalized === "land_title" ||
              normalized === "land-ownership" ||
              normalized === "land_ownership"
            ? "land-title"
            : ("national-id" as RequestType);

        const mapped: RequestData = {
          id: r.requestId ?? r.id ?? (Array.isArray(id) ? id[0] : id ?? ""),
          type: canonicalType,
          status: (r.status ?? "pending") as RequestStatus,
          createdAt: r.createdAt ?? new Date().toISOString(),
          updatedAt: r.updatedAt ?? r.createdAt ?? new Date().toISOString(),
          nationalIdData: r.nationalIdData
            ? {
                firstName: r.nationalIdData.firstName ?? "",
                lastName: r.nationalIdData.lastName ?? "",
                idNumber: r.nationalIdData.idNumber ?? "",
                issueDate: r.nationalIdData.issueDate ?? "",
                expiryDate: r.nationalIdData.expiryDate ?? "",
                // robustly find decrypted URL using purpose/tag/filename
                frontPicture:
                  r.nationalIdData.frontPicture ??
                  findFileUrl(files, ["front_id"]) ??
                  null,
                backPicture:
                  r.nationalIdData.backPicture ??
                  findFileUrl(files, ["back_id"]) ??
                  null,
                selfieWithId:
                  r.nationalIdData.selfieWithId ??
                  findFileUrl(files, ["selfie_with_id"]) ??
                  null,
              }
            : undefined,
          landTitleData: r.landTitleData
            ? {
                firstName: r.landTitleData.firstName ?? "",
                lastName: r.landTitleData.lastName ?? "",
                latitude: r.landTitleData.latitude ?? "",
                longitude: r.landTitleData.longitude ?? "",
                titleNumber: r.landTitleData.titleNumber ?? "",
                lotArea: r.landTitleData.lotArea ?? "",
                deedUpload:
                  r.landTitleData.deedUpload ??
                  findFileUrl(files, ["land_deed"]) ??
                  null,
              }
            : undefined,
        };

        setRequestData(mapped);
        setEditedData(mapped);
      } catch (error) {
        toast.error("Failed to load request details");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [id, address, walletAddress, walletCheckComplete]);

  console.log("Request Data:", requestData);
  console.log("Edited Data:", editedData);

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit
      setEditedData(requestData);
      setIsEditMode(false);
    } else {
      // Enter edit mode
      setIsEditMode(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!editedData || !requestData) {
        toast.error("No changes to save");
        return;
      }
      const submitAddress = walletAddress ?? address;
      if (!submitAddress) {
        toast.error("Wallet not connected");
        return;
      }
      if (requestData.status !== "pending") {
        toast.error("Only pending requests can be edited");
        return;
      }

      // Convert a data URL, remote URL or File into a File object (or null)
      const convertToFile = async (
        val: string | File | null | undefined,
        filename: string
      ): Promise<File | null> => {
        if (!val) return null;
        if (val instanceof File) return val;
        if (typeof val === "string") {
          // data URL (base64)
          if (val.startsWith("data:")) {
            const arr = val.split(",");
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, { type: mime });
          } else {
            // try to fetch remote url and convert to blob
            try {
              const res = await fetch(val);
              const blob = await res.blob();
              return new File([blob], filename, {
                type: blob.type || "application/octet-stream",
              });
            } catch (err) {
              console.warn("convertToFile: failed to fetch remote url", err);
              return null;
            }
          }
        }
        return null;
      };

      if (editedData.type === "national-id") {
        const nid = editedData.nationalIdData!;
        const form = {
          firstName: nid.firstName,
          lastName: nid.lastName,
          issueDate: nid.issueDate,
          expiryDate: nid.expiryDate,
          idNumber: nid.idNumber,
          frontPicture: await convertToFile(nid.frontPicture, "front.jpg"),
          backPicture: await convertToFile(nid.backPicture, "back.jpg"),
          selfieWithId: await convertToFile(nid.selfieWithId, "selfie.jpg"),
        };

        await updateNationalId(id as string, form, {
          address: submitAddress,
          walletClient,
          BE_URL,
          toast: {
            success: function (s: string): void {
              toast.success(s);
            },
            error: function (s: string): void {
              toast.error(s);
            },
          },
          onSuccess: () => {
            setIsEditMode(false);
            setIsSaving(false);
            // Refetch the data instead of hard reload
            const fetchAddress = walletAddress ?? address;
            getRequestById(
              fetchAddress || "",
              Array.isArray(id) ? id[0] : id ?? ""
            )
              .then((r) => {
                if (r) {
                  const files = Array.isArray(r.files)
                    ? r.files
                    : r.request?.files ?? [];
                  const rawType = (r.requestType ??
                    r.type ??
                    "national-id") as string;
                  const normalized = rawType.replace(/_/g, "-").toLowerCase();
                  const canonicalType: RequestType =
                    normalized === "national-id" || normalized === "national_id"
                      ? "national-id"
                      : "land-title";

                  const mapped: RequestData = {
                    id:
                      r.requestId ??
                      r.id ??
                      (Array.isArray(id) ? id[0] : id ?? ""),
                    type: canonicalType,
                    status: (r.status ?? "pending") as RequestStatus,
                    createdAt: r.createdAt ?? new Date().toISOString(),
                    updatedAt:
                      r.updatedAt ?? r.createdAt ?? new Date().toISOString(),
                    nationalIdData: r.nationalIdData
                      ? {
                          firstName: r.nationalIdData.firstName ?? "",
                          lastName: r.nationalIdData.lastName ?? "",
                          idNumber: r.nationalIdData.idNumber ?? "",
                          issueDate: r.nationalIdData.issueDate ?? "",
                          expiryDate: r.nationalIdData.expiryDate ?? "",
                          frontPicture:
                            r.nationalIdData.frontPicture ??
                            findFileUrl(files, ["front_id"]) ??
                            null,
                          backPicture:
                            r.nationalIdData.backPicture ??
                            findFileUrl(files, ["back_id"]) ??
                            null,
                          selfieWithId:
                            r.nationalIdData.selfieWithId ??
                            findFileUrl(files, ["selfie_with_id"]) ??
                            null,
                        }
                      : undefined,
                    landTitleData: r.landTitleData
                      ? {
                          firstName: r.landTitleData.firstName ?? "",
                          lastName: r.landTitleData.lastName ?? "",
                          latitude: r.landTitleData.latitude ?? "",
                          longitude: r.landTitleData.longitude ?? "",
                          titleNumber: r.landTitleData.titleNumber ?? "",
                          lotArea: r.landTitleData.lotArea ?? "",
                          deedUpload:
                            r.landTitleData.deedUpload ??
                            findFileUrl(files, ["land_deed"]) ??
                            null,
                        }
                      : undefined,
                  };
                  setRequestData(mapped);
                  setEditedData(mapped);
                }
              })
              .catch((err) => {
                console.error("Refetch error:", err);
              });
          },
        });
        return;
      } else if (editedData.type === "land-title") {
        const ltd = editedData.landTitleData!;
        const form = {
          firstName: ltd.firstName,
          lastName: ltd.lastName,
          latitude: ltd.latitude,
          longitude: ltd.longitude,
          titleNumber: ltd.titleNumber,
          lotArea: ltd.lotArea,
          deedUpload: await convertToFile(ltd.deedUpload, "deed.jpg"),
        };
        await updateLandTitle(id as string, form, {
          address: submitAddress,
          walletClient,
          BE_URL,
          toast: {
            success: function (s: string): void {
              toast.success(s);
            },
            error: function (s: string): void {
              toast.error(s);
            },
          },
          onSuccess: () => {
            setIsEditMode(false);
            setIsSaving(false);
            // Refetch the data instead of hard reload
            const fetchAddress = walletAddress ?? address;
            getRequestById(
              fetchAddress || "",
              Array.isArray(id) ? id[0] : id ?? ""
            )
              .then((r) => {
                if (r) {
                  const files = Array.isArray(r.files)
                    ? r.files
                    : r.request?.files ?? [];
                  const rawType = (r.requestType ??
                    r.type ??
                    "national-id") as string;
                  const normalized = rawType.replace(/_/g, "-").toLowerCase();
                  const canonicalType: RequestType =
                    normalized === "national-id" || normalized === "national_id"
                      ? "national-id"
                      : "land-title";

                  const mapped: RequestData = {
                    id:
                      r.requestId ??
                      r.id ??
                      (Array.isArray(id) ? id[0] : id ?? ""),
                    type: canonicalType,
                    status: (r.status ?? "pending") as RequestStatus,
                    createdAt: r.createdAt ?? new Date().toISOString(),
                    updatedAt:
                      r.updatedAt ?? r.createdAt ?? new Date().toISOString(),
                    nationalIdData: r.nationalIdData
                      ? {
                          firstName: r.nationalIdData.firstName ?? "",
                          lastName: r.nationalIdData.lastName ?? "",
                          idNumber: r.nationalIdData.idNumber ?? "",
                          issueDate: r.nationalIdData.issueDate ?? "",
                          expiryDate: r.nationalIdData.expiryDate ?? "",
                          frontPicture:
                            r.nationalIdData.frontPicture ??
                            findFileUrl(files, ["front_id"]) ??
                            null,
                          backPicture:
                            r.nationalIdData.backPicture ??
                            findFileUrl(files, ["back_id"]) ??
                            null,
                          selfieWithId:
                            r.nationalIdData.selfieWithId ??
                            findFileUrl(files, ["selfie_with_id"]) ??
                            null,
                        }
                      : undefined,
                    landTitleData: r.landTitleData
                      ? {
                          firstName: r.landTitleData.firstName ?? "",
                          lastName: r.landTitleData.lastName ?? "",
                          latitude: r.landTitleData.latitude ?? "",
                          longitude: r.landTitleData.longitude ?? "",
                          titleNumber: r.landTitleData.titleNumber ?? "",
                          lotArea: r.landTitleData.lotArea ?? "",
                          deedUpload:
                            r.landTitleData.deedUpload ??
                            findFileUrl(files, ["land_deed"]) ??
                            null,
                        }
                      : undefined,
                  };
                  setRequestData(mapped);
                  setEditedData(mapped);
                }
              })
              .catch((err) => {
                console.error("Refetch error:", err);
              });
          },
        });
        return;
      } else {
        toast.error("Unknown request type");
        return;
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    // Simulate file upload
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;

      setEditedData((prev) => {
        if (!prev) return prev;

        if (prev.type === "national-id" && prev.nationalIdData) {
          return {
            ...prev,
            nationalIdData: {
              ...prev.nationalIdData,
              [fieldName]: imageUrl,
            },
          };
        } else if (prev.type === "land-title" && prev.landTitleData) {
          return {
            ...prev,
            landTitleData: {
              ...prev.landTitleData,
              [fieldName]: imageUrl,
            },
          };
        }
        return prev;
      });

      toast.success("Image uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const getStatusBadge = (status: RequestStatus) => {
    const variants = {
      pending: {
        variant: "secondary" as const,
        icon: Clock,
        text: "Pending",
        className:
          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      },
      verified: {
        variant: "default" as const,
        icon: CheckCircle2,
        text: "Verified",
        className:
          "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      },
      rejected: {
        variant: "destructive" as const,
        icon: XCircle,
        text: "Rejected",
        className:
          "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading while checking wallet or fetching data
  if (isLoading || !walletCheckComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-[600px] w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if wallet is connected after wallet check is complete
  const currentAddress = walletAddress ?? address;
  if (!currentAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Card className="p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Wallet Not Connected</h1>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view this request.
            </p>
            <Button onClick={() => router.push("/requests")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!requestData || !editedData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Request Not Found</h1>
          <Button onClick={() => router.push("/requests")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = requestData.status === "pending";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/requests")}
              className="hover:bg-muted/50 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(requestData.status)}
            {canEdit && !isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                className="transition-all duration-200"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Verification Request Details
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            View and manage your verification request
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-border/50 backdrop-blur-sm bg-card/95 rounded-2xl overflow-hidden transition-all duration-200">
              <div className="p-6 md:p-10">
                <Tabs
                  value={requestData.type}
                  className="w-full"
                  onValueChange={(value) => {
                    if (!isEditMode) return;
                    setEditedData({
                      ...editedData,
                      type: value as RequestType,
                    });
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger
                      value="national-id"
                      className="gap-2"
                      disabled={!isEditMode}
                    >
                      <CreditCard className="h-4 w-4" />
                      National ID
                    </TabsTrigger>
                    <TabsTrigger
                      value="land-title"
                      className="gap-2"
                      disabled={!isEditMode}
                    >
                      <FileText className="h-4 w-4" />
                      Land Title
                    </TabsTrigger>
                  </TabsList>

                  {/* National ID Tab */}
                  <TabsContent
                    value="national-id"
                    className="animate-in fade-in-50 duration-500"
                  >
                    {editedData.nationalIdData && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            National ID Information
                          </h3>
                          <Separator className="mb-6" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={editedData.nationalIdData.firstName}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  nationalIdData: {
                                    ...editedData.nationalIdData!,
                                    firstName: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={editedData.nationalIdData.lastName}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  nationalIdData: {
                                    ...editedData.nationalIdData!,
                                    lastName: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="idNumber">ID Number</Label>
                            <Input
                              id="idNumber"
                              value={editedData.nationalIdData.idNumber}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  nationalIdData: {
                                    ...editedData.nationalIdData!,
                                    idNumber: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="issueDate">Issue Date</Label>
                            <Input
                              id="issueDate"
                              type="date"
                              value={editedData.nationalIdData.issueDate}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  nationalIdData: {
                                    ...editedData.nationalIdData!,
                                    issueDate: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input
                              id="expiryDate"
                              type="date"
                              value={editedData.nationalIdData.expiryDate}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  nationalIdData: {
                                    ...editedData.nationalIdData!,
                                    expiryDate: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </div>
                        </div>

                        <Separator className="my-6" />

                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            Document Uploads
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          {/* Front Picture */}
                          <div className="space-y-2">
                            <Label>Front Picture/Scan of ID</Label>
                            {editedData.nationalIdData.frontPicture && (
                              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30 aspect-video">
                                <Image
                                  src={editedData.nationalIdData.frontPicture}
                                  alt="Front ID"
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3EID Front Preview%3C/text%3E%3C/svg%3E";
                                  }}
                                />
                              </div>
                            )}
                            {isEditMode && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleFileUpload(e, "frontPicture")
                                  }
                                  className="cursor-pointer file:mr-4 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                />
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Accepted formats: JPG, PNG (Max 5MB)
                            </p>
                          </div>

                          {/* Back Picture */}
                          <div className="space-y-2">
                            <Label>Back Picture/Scan of ID</Label>
                            {editedData.nationalIdData.backPicture && (
                              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30 aspect-video">
                                <Image
                                  src={editedData.nationalIdData.backPicture}
                                  alt="Back ID"
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3EID Back Preview%3C/text%3E%3C/svg%3E";
                                  }}
                                />
                              </div>
                            )}
                            {isEditMode && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleFileUpload(e, "backPicture")
                                  }
                                  className="cursor-pointer file:mr-4 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                />
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Accepted formats: JPG, PNG (Max 5MB)
                            </p>
                          </div>

                          {/* Selfie */}
                          <div className="space-y-2">
                            <Label>Selfie with Front ID</Label>
                            {editedData.nationalIdData.selfieWithId && (
                              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30 aspect-video">
                                <Image
                                  src={editedData.nationalIdData.selfieWithId}
                                  alt="Selfie with ID"
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ESelfie Preview%3C/text%3E%3C/svg%3E";
                                  }}
                                />
                              </div>
                            )}
                            {isEditMode && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleFileUpload(e, "selfieWithId")
                                  }
                                  className="cursor-pointer file:mr-4 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                />
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Hold your ID next to your face. Accepted formats:
                              JPG, PNG (Max 5MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Land Title Tab */}
                  <TabsContent
                    value="land-title"
                    className="animate-in fade-in-50 duration-500"
                  >
                    {editedData.landTitleData && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Land Title Information
                          </h3>
                          <Separator className="mb-6" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="landFirstName">First Name</Label>
                            <Input
                              id="landFirstName"
                              value={editedData.landTitleData.firstName}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  landTitleData: {
                                    ...editedData.landTitleData!,
                                    firstName: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="landLastName">Last Name</Label>
                            <Input
                              id="landLastName"
                              value={editedData.landTitleData.lastName}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  landTitleData: {
                                    ...editedData.landTitleData!,
                                    lastName: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="titleNumber">Title Number</Label>
                            <Input
                              id="titleNumber"
                              value={editedData.landTitleData.titleNumber}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  landTitleData: {
                                    ...editedData.landTitleData!,
                                    titleNumber: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                              id="latitude"
                              type="number"
                              step="any"
                              value={editedData.landTitleData.latitude}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  landTitleData: {
                                    ...editedData.landTitleData!,
                                    latitude: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Must be between -90 and 90
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                              id="longitude"
                              type="number"
                              step="any"
                              value={editedData.landTitleData.longitude}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  landTitleData: {
                                    ...editedData.landTitleData!,
                                    longitude: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Must be between -180 and 180
                            </p>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="lotArea">Lot Area (sqm)</Label>
                            <Input
                              id="lotArea"
                              type="number"
                              step="0.01"
                              value={editedData.landTitleData.lotArea}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  landTitleData: {
                                    ...editedData.landTitleData!,
                                    lotArea: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditMode}
                              className={
                                !isEditMode
                                  ? "bg-muted/50 cursor-not-allowed"
                                  : ""
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Total area in square meters
                            </p>
                          </div>
                        </div>

                        <Separator className="my-6" />

                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            Document Upload
                          </h3>
                        </div>

                        <div className="space-y-2">
                          <Label>Land Title Deed (Scan/Photo)</Label>
                          {editedData.landTitleData.deedUpload && (
                            <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30 aspect-video">
                              <Image
                                src={editedData.landTitleData.deedUpload}
                                alt="Land Title Deed"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ELand Title Preview%3C/text%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                          )}
                          {isEditMode && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleFileUpload(e, "deedUpload")
                                }
                                className="cursor-pointer file:mr-4 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Upload a clear scan or photo of your land title
                            deed. Accepted formats: JPG, PNG (Max 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                {isEditMode && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="ghost"
                        onClick={handleEditToggle}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="min-w-[140px]"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right: Summary Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-border/50 backdrop-blur-sm bg-card/95 rounded-2xl overflow-hidden sticky top-6 transition-all duration-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-6">Request Summary</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 pb-4 border-b border-border/50">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        Request ID
                      </p>
                      <p className="font-mono text-sm font-medium truncate">
                        #{requestData.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pb-4 border-b border-border/50">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        Verification Type
                      </p>
                      <p className="text-sm font-medium">
                        {requestData.type === "national-id"
                          ? "National ID"
                          : "Land Title"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pb-4 border-b border-border/50">
                    <div className="rounded-lg bg-primary/10 p-2">
                      {requestData.status === "pending" && (
                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      )}
                      {requestData.status === "verified" && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                      {requestData.status === "rejected" && (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        Current Status
                      </p>
                      {getStatusBadge(requestData.status)}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pb-4 border-b border-border/50">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        Submission Date
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(requestData.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        Last Updated
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(requestData.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Verification Timeline */}
                <div>
                  <h4 className="text-sm font-semibold mb-4">
                    Verification Timeline
                  </h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-primary p-1.5">
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <div className="w-0.5 h-full bg-border mt-2" />
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">Submitted</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(requestData.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`rounded-full p-1.5 ${
                            requestData.status === "pending"
                              ? "bg-yellow-500/20 animate-pulse"
                              : "bg-primary"
                          }`}
                        >
                          <Clock
                            className={`h-3 w-3 ${
                              requestData.status === "pending"
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-primary-foreground"
                            }`}
                          />
                        </div>
                        {requestData.status !== "pending" && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">In Review</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {requestData.status === "pending"
                            ? "Waiting for verification"
                            : "Under review"}
                        </p>
                      </div>
                    </div>

                    {requestData.status !== "pending" && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`rounded-full p-1.5 ${
                              requestData.status === "verified"
                                ? "bg-green-500/20"
                                : "bg-red-500/20"
                            }`}
                          >
                            {requestData.status === "verified" ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium">
                            {requestData.status === "verified"
                              ? "Verified"
                              : "Rejected"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(requestData.updatedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!canEdit && (
                  <>
                    <Separator className="my-6" />
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="text-xs text-muted-foreground">
                        {requestData.status === "verified"
                          ? "This request has been verified and cannot be edited."
                          : "This request has been rejected and cannot be edited."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
