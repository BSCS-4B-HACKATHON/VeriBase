"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eye,
  Check,
  X,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  User,
  MapPin,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockRequests } from "@/lib/mock-data";
import type { VerificationStatus, VerificationRequest } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

type FilterTab = "all" | "pending" | "verified" | "rejected";

interface ExtendedRequest extends VerificationRequest {
  documentType?: "Land Title" | "National ID";
  email?: string;
  issueDate?: string;
  expiryDate?: string;
  frontImage?: string;
  backImage?: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    by: string;
  }>;
}

function getStatusBadge(status: VerificationStatus) {
  const variants: Record<
    VerificationStatus,
    { className: string; label: string; icon: any }
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
    <Badge variant="outline" className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Request Details Modal Component
function RequestDetailsModal({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: {
  request: ExtendedRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (!request) return null;

  const statusHistory = request.statusHistory || [
    {
      status: "Submitted",
      timestamp: request.createdAt,
      by: "User",
    },
    {
      status: request.status,
      timestamp: new Date().toISOString(),
      by: "Admin",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-surface-75 border-border/40 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Request Details
          </DialogTitle>
          <DialogDescription>
            Review verification request information and take action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Section */}
          <Card className="bg-foreground/5 rounded-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-[#3ECF8E]" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Name</p>
                  <p className="text-sm font-medium">{request.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-medium">
                    {request.email || "Not provided"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Wallet Address
                  </p>
                  <code className="text-sm font-mono bg-background/50 px-2 py-1 rounded">
                    {request.walletAddress}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Details Section */}
          <Card className="bg-foreground/5 rounded-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3ECF8E]" />
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Document Type
                  </p>
                  <Badge variant="outline" className="bg-background/50">
                    {request.documentType || request.assetType}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Current Status
                  </p>
                  {getStatusBadge(request.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Asset ID</p>
                  <code className="text-sm font-mono">{request.assetId}</code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Submitted On
                  </p>
                  <p className="text-sm">
                    {format(new Date(request.createdAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
                {request.issueDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Issue Date
                    </p>
                    <p className="text-sm">{request.issueDate}</p>
                  </div>
                )}
                {request.expiryDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Expiry Date
                    </p>
                    <p className="text-sm">{request.expiryDate}</p>
                  </div>
                )}
              </div>
              {request.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm">{request.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uploaded Images Section */}
          <Card className="bg-foreground/5 rounded-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#3ECF8E]" />
                Uploaded Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Front Side</p>
                  <div className="aspect-video bg-background/50 rounded-lg flex items-center justify-center border border-border/40">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Back Side</p>
                  <div className="aspect-video bg-background/50 rounded-lg flex items-center justify-center border border-border/40">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status History Timeline */}
          <Card className="bg-foreground/5 rounded-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#3ECF8E]" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusHistory.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#3ECF8E]/20 flex items-center justify-center shrink-0 border-2 border-[#3ECF8E]">
                        <div className="w-2 h-2 rounded-full bg-[#3ECF8E]" />
                      </div>
                      {index < statusHistory.length - 1 && (
                        <div className="w-px flex-1 bg-border/40 mt-2 min-h-[20px]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{item.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.timestamp), "MMM dd, yyyy HH:mm")}{" "}
                        by {item.by}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          {request.status === "pending" && (
            <>
              <Button
                variant="outline"
                onClick={onReject}
                className="border-red-500/30 text-red-500 hover:bg-red-500/10"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={onApprove}
                className="bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve Request
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminRequestsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] =
    useState<ExtendedRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Enhanced mock data with document types
  const enhancedRequests: ExtendedRequest[] = useMemo(
    () =>
      mockRequests.map((req) => ({
        ...req,
        documentType: Math.random() > 0.5 ? "Land Title" : "National ID",
        email: `${req.userName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        issueDate: "Jan 15, 2020",
        expiryDate: "Jan 15, 2030",
      })),
    []
  );

  const filteredRequests = useMemo(() => {
    let requests = enhancedRequests;

    // Apply status filter
    if (activeFilter !== "all") {
      requests = requests.filter((req) => req.status === activeFilter);
    }

    // Apply document type filter
    if (documentTypeFilter !== "all") {
      requests = requests.filter(
        (req) => req.documentType === documentTypeFilter
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      requests = requests.filter(
        (req) =>
          req.id.toLowerCase().includes(query) ||
          req.userName.toLowerCase().includes(query) ||
          req.assetId.toLowerCase().includes(query) ||
          req.assetType.toLowerCase().includes(query) ||
          req.walletAddress.toLowerCase().includes(query) ||
          req.documentType?.toLowerCase().includes(query) ||
          req.description?.toLowerCase().includes(query)
      );
    }

    return requests;
  }, [searchQuery, activeFilter, documentTypeFilter, enhancedRequests]);

  const statusCounts = useMemo(() => {
    return {
      all: enhancedRequests.length,
      pending: enhancedRequests.filter((r) => r.status === "pending").length,
      verified: enhancedRequests.filter((r) => r.status === "verified").length,
      rejected: enhancedRequests.filter((r) => r.status === "rejected").length,
    };
  }, [enhancedRequests]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRequests.slice(startIndex, endIndex);
  }, [filteredRequests, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter, documentTypeFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast.success("Data refreshed successfully");
  };

  const handleViewDetails = (request: ExtendedRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleApprove = (id: string) => {
    toast.success(`Request ${id} approved successfully`);
    setIsModalOpen(false);
    // TODO: Implement actual approval logic
  };

  const handleReject = (id: string) => {
    toast.error(`Request ${id} rejected`);
    setIsModalOpen(false);
    // TODO: Implement actual rejection logic
  };

  const handleExportCSV = () => {
    toast.success("Exporting data to CSV...");
    // TODO: Implement CSV export
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header with Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"
        >
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Verification Requests
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage and review user-submitted verification documents.
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="lg"
            className="w-full md:w-auto border-[#3ECF8E]/30 hover:bg-[#3ECF8E]/10 hover:border-[#3ECF8E]/50 transition-colors shrink-0"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </motion.div>

        {/* Status Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-surface-75 rounded-2xl border-border/40 hover:border-[#3ECF8E]/30 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold">{statusCounts.all}</p>
                </div>
                <FileText className="w-8 h-8 text-[#3ECF8E]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-surface-75 rounded-2xl border-border/40 hover:border-yellow-500/30 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {statusCounts.pending}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-surface-75 rounded-2xl border-border/40 hover:border-green-500/30 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Approved</p>
                  <p className="text-2xl font-bold text-green-500">
                    {statusCounts.verified}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-surface-75 rounded-2xl border-border/40 hover:border-red-500/30 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-400">
                    {statusCounts.rejected}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs for Filtering */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v as FilterTab)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 h-12 bg-surface-75 rounded-xl">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-[#3ECF8E] data-[state=active]:text-black"
              >
                🗂️ All Requests
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
              >
                🕓 Pending
              </TabsTrigger>
              <TabsTrigger
                value="verified"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-black"
              >
                ✅ Approved
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                ❌ Rejected
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between"
        >
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by user, document type, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-surface-75 border-border/40 rounded-xl"
              />
            </div>

            {/* Document Type Filter */}
            <Select
              value={documentTypeFilter}
              onValueChange={setDocumentTypeFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-surface-75 border-border/40 rounded-xl">
                <FileText className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Land Title">Land Title</SelectItem>
                <SelectItem value="National ID">National ID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            {/* Export Button */}
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="flex-1 lg:flex-none border-border/40 hover:bg-[#3ECF8E]/10 hover:border-[#3ECF8E]/50 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-surface-75 rounded-2xl border-border/40 shadow-sm shadow-black/20">
            <CardContent className="p-6">
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40 bg-foreground/5">
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">
                        Document Type
                      </TableHead>
                      <TableHead className="font-semibold">
                        Submitted On
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="wait">
                      {paginatedRequests.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-muted-foreground"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Search className="w-8 h-8 opacity-50" />
                              <p>No requests found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRequests.map((request, index) => (
                          <motion.tr
                            key={request.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="border-border/40 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handleViewDetails(request)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#3ECF8E]/20 flex items-center justify-center">
                                  <User className="w-4 h-4 text-[#3ECF8E]" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {request.userName}
                                  </p>
                                  <code className="text-xs text-muted-foreground">
                                    {shortenAddress(request.walletAddress)}
                                  </code>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-background/50 text-xs"
                              >
                                {request.documentType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(
                                new Date(request.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(request.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(request);
                                  }}
                                  className="hover:bg-[#3ECF8E]/10 h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {request.status === "pending" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApprove(request.id);
                                      }}
                                      className="hover:bg-green-500/10 text-green-500 h-8 w-8 p-0"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReject(request.id);
                                      }}
                                      className="hover:bg-red-500/10 text-red-500 h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredRequests.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Rows per page:</span>
                    <Select
                      value={rowsPerPage.toString()}
                      onValueChange={(value) => {
                        setRowsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Request Details Modal */}
      <RequestDetailsModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={() => selectedRequest && handleApprove(selectedRequest.id)}
        onReject={() => selectedRequest && handleReject(selectedRequest.id)}
      />
    </div>
  );
}
