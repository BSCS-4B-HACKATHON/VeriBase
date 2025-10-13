"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FileText, CreditCard, Upload, Loader2 } from "lucide-react";

export default function NewRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("national-id");
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  // National ID form state
  const [nationalIdForm, setNationalIdForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    idNumber: "",
    issueDate: "",
    expiryDate: "",
    frontPicture: null as File | null,
    backPicture: null as File | null,
    selfieWithId: null as File | null,
  });

  // Land Title form state
  const [landTitleForm, setLandTitleForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    latitude: "",
    longitude: "",
    titleNumber: "",
    lotArea: "",
    deedUpload: null as File | null,
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    formType: "nationalId" | "landTitle",
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    // Simulate upload progress
    const progressKey = `${formType}-${fieldName}`;
    setUploadProgress((prev) => ({ ...prev, [progressKey]: 0 }));

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const current = prev[progressKey] || 0;
        if (current >= 100) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, [progressKey]: current + 10 };
      });
    }, 100);

    if (formType === "nationalId") {
      setNationalIdForm((prev) => ({ ...prev, [fieldName]: file }));
    } else {
      setLandTitleForm((prev) => ({ ...prev, [fieldName]: file }));
    }
  };

  const handleSubmitNationalId = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (
        !nationalIdForm.firstName ||
        !nationalIdForm.lastName ||
        !nationalIdForm.idNumber ||
        !nationalIdForm.issueDate ||
        !nationalIdForm.expiryDate ||
        !nationalIdForm.frontPicture ||
        !nationalIdForm.backPicture ||
        !nationalIdForm.selfieWithId
      ) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("National ID verification request submitted successfully");
      router.push("/requests");
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitLandTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (
        !landTitleForm.firstName ||
        !landTitleForm.lastName ||
        !landTitleForm.latitude ||
        !landTitleForm.longitude ||
        !landTitleForm.titleNumber ||
        !landTitleForm.lotArea ||
        !landTitleForm.deedUpload
      ) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      // Validate coordinates
      const lat = parseFloat(landTitleForm.latitude);
      const lng = parseFloat(landTitleForm.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        toast.error("Latitude must be between -90 and 90");
        setIsSubmitting(false);
        return;
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        toast.error("Longitude must be between -180 and 180");
        setIsSubmitting(false);
        return;
      }

      // Validate lot area
      const area = parseFloat(landTitleForm.lotArea);
      if (isNaN(area) || area <= 0) {
        toast.error("Lot area must be a positive number");
        setIsSubmitting(false);
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Land title verification request submitted successfully");
      router.push("/requests");
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileInputField = ({
    label,
    id,
    value,
    onChange,
    helperText,
  }: {
    label: string;
    id: string;
    value: File | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    helperText?: string;
  }) => {
    const progressKey = id;
    const progress = uploadProgress[progressKey];

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            id={id}
            type="file"
            accept="image/*"
            onChange={onChange}
            className="cursor-pointer file:mr-4 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {value && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 text-primary" />
              <span className="truncate">{value.name}</span>
              {progress !== undefined && progress < 100 && (
                <span className="ml-auto text-xs">({progress}%)</span>
              )}
            </div>
          )}
        </div>
        {helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        {progress !== undefined && progress < 100 && (
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Create New Verification Request
          </h1>
          <p className="text-muted-foreground text-lg">
            Verify your identity or ownership through Base
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg border-border/50 backdrop-blur-sm bg-card/95">
          <div className="p-6 md:p-10">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="national-id" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  National ID
                </TabsTrigger>
                <TabsTrigger value="land-title" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Land Title
                </TabsTrigger>
              </TabsList>

              {/* National ID Tab */}
              <TabsContent
                value="national-id"
                className="animate-in fade-in-50 duration-500"
              >
                <form onSubmit={handleSubmitNationalId} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      National ID Information
                    </h3>
                    <Separator className="mb-6" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        value={nationalIdForm.firstName}
                        onChange={(e) =>
                          setNationalIdForm((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="middleName">
                        Middle Name{" "}
                        <span className="text-muted-foreground text-xs">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="middleName"
                        placeholder="Enter your middle name"
                        value={nationalIdForm.middleName}
                        onChange={(e) =>
                          setNationalIdForm((prev) => ({
                            ...prev,
                            middleName: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        value={nationalIdForm.lastName}
                        onChange={(e) =>
                          setNationalIdForm((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idNumber">
                        ID Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="idNumber"
                        placeholder="Enter your ID number"
                        value={nationalIdForm.idNumber}
                        onChange={(e) =>
                          setNationalIdForm((prev) => ({
                            ...prev,
                            idNumber: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issueDate">
                        Issue Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="issueDate"
                        type="date"
                        value={nationalIdForm.issueDate}
                        onChange={(e) =>
                          setNationalIdForm((prev) => ({
                            ...prev,
                            issueDate: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">
                        Expiry Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={nationalIdForm.expiryDate}
                        onChange={(e) =>
                          setNationalIdForm((prev) => ({
                            ...prev,
                            expiryDate: e.target.value,
                          }))
                        }
                        required
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
                    <FileInputField
                      label="Front Picture/Scan of ID *"
                      id="nationalId-frontPicture"
                      value={nationalIdForm.frontPicture}
                      onChange={(e) =>
                        handleFileChange(e, "nationalId", "frontPicture")
                      }
                      helperText="Accepted formats: JPG, PNG (Max 5MB)"
                    />

                    <FileInputField
                      label="Back Picture/Scan of ID *"
                      id="nationalId-backPicture"
                      value={nationalIdForm.backPicture}
                      onChange={(e) =>
                        handleFileChange(e, "nationalId", "backPicture")
                      }
                      helperText="Accepted formats: JPG, PNG (Max 5MB)"
                    />

                    <FileInputField
                      label="Selfie with Front ID *"
                      id="nationalId-selfieWithId"
                      value={nationalIdForm.selfieWithId}
                      onChange={(e) =>
                        handleFileChange(e, "nationalId", "selfieWithId")
                      }
                      helperText="Please hold your ID next to your face. Accepted formats: JPG, PNG (Max 5MB)"
                    />
                  </div>

                  <Separator className="my-6" />

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push("/requests")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[150px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Land Title Tab */}
              <TabsContent
                value="land-title"
                className="animate-in fade-in-50 duration-500"
              >
                <form onSubmit={handleSubmitLandTitle} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Land Title Information
                    </h3>
                    <Separator className="mb-6" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landFirstName">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="landFirstName"
                        placeholder="Enter your first name"
                        value={landTitleForm.firstName}
                        onChange={(e) =>
                          setLandTitleForm((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="landMiddleName">
                        Middle Name{" "}
                        <span className="text-muted-foreground text-xs">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="landMiddleName"
                        placeholder="Enter your middle name"
                        value={landTitleForm.middleName}
                        onChange={(e) =>
                          setLandTitleForm((prev) => ({
                            ...prev,
                            middleName: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="landLastName">
                        Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="landLastName"
                        placeholder="Enter your last name"
                        value={landTitleForm.lastName}
                        onChange={(e) =>
                          setLandTitleForm((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="titleNumber">
                        Title Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="titleNumber"
                        placeholder="Enter the land title number"
                        value={landTitleForm.titleNumber}
                        onChange={(e) =>
                          setLandTitleForm((prev) => ({
                            ...prev,
                            titleNumber: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="latitude">
                        Latitude <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 14.5995"
                        value={landTitleForm.latitude}
                        onChange={(e) =>
                          setLandTitleForm((prev) => ({
                            ...prev,
                            latitude: e.target.value,
                          }))
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be between -90 and 90
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longitude">
                        Longitude <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 120.9842"
                        value={landTitleForm.longitude}
                        onChange={(e) =>
                          setLandTitleForm((prev) => ({
                            ...prev,
                            longitude: e.target.value,
                          }))
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be between -180 and 180
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lotArea">
                        Lot Area (sqm){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lotArea"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 1000.50"
                        value={landTitleForm.lotArea}
                        onChange={(e) =>
                          setLandTitleForm((prev) => ({
                            ...prev,
                            lotArea: e.target.value,
                          }))
                        }
                        required
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

                  <div className="grid grid-cols-1 gap-6">
                    <FileInputField
                      label="Land Title Deed (Scan/Photo) *"
                      id="landTitle-deedUpload"
                      value={landTitleForm.deedUpload}
                      onChange={(e) =>
                        handleFileChange(e, "landTitle", "deedUpload")
                      }
                      helperText="Upload a clear scan or photo of your land title deed. Accepted formats: JPG, PNG (Max 5MB)"
                    />
                  </div>

                  <Separator className="my-6" />

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push("/requests")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[150px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            All information is encrypted and securely stored on the blockchain.
          </p>
        </div>
      </div>
    </div>
  );
}
