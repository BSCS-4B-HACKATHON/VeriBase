"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/app/context/walletContext";
import { shorten } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  FolderOpen,
  Search,
  Activity,
  TrendingUp,
  Shield,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface RecentRequest {
  id: string;
  name: string;
  type: "Land Title" | "National ID";
  status: "pending" | "approved" | "rejected";
  date: string;
}

interface Activity {
  id: string;
  message: string;
  timestamp: string;
  type: "success" | "info" | "warning";
}

export default function DashboardHome() {
  const { address } = useWallet();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API calls
    setStats({
      total: 24,
      pending: 3,
      approved: 19,
      rejected: 2,
    });

    setRecentRequests([
      {
        id: "VRF-001",
        name: "Property Title - 123 Main St",
        type: "Land Title",
        status: "approved",
        date: "2025-10-14",
      },
      {
        id: "VRF-002",
        name: "National ID Verification",
        type: "National ID",
        status: "pending",
        date: "2025-10-13",
      },
      {
        id: "VRF-003",
        name: "Land Deed - Plot 456",
        type: "Land Title",
        status: "pending",
        date: "2025-10-12",
      },
      {
        id: "VRF-004",
        name: "Government ID Update",
        type: "National ID",
        status: "approved",
        date: "2025-10-11",
      },
    ]);

    setActivities([
      {
        id: "1",
        message: "Land Title #VRF-001 verified successfully",
        timestamp: "2 hours ago",
        type: "success",
      },
      {
        id: "2",
        message: "National ID verification request submitted",
        timestamp: "5 hours ago",
        type: "info",
      },
      {
        id: "3",
        message: "Wallet connected from new device",
        timestamp: "1 day ago",
        type: "info",
      },
    ]);
  }, [address]);

  const statsCards = [
    {
      title: "Total Verifications",
      value: stats.total,
      icon: FileCheck,
      color: "",
      iconColor: "text-[#3ECF8E]",
      change: "+12%",
    },
    {
      title: "Pending Requests",
      value: stats.pending,
      icon: Clock,
      color: "",
      iconColor: "text-yellow-500",
      change: null,
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      color: "",
      iconColor: "border-muted-foreground",
      change: "+8%",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "",
      iconColor: "",
      change: "-2%",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "bg-green-500/10 text-green-500 border-green-500/30",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      rejected: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              Welcome back{address ? `, ${shorten(address)}` : ""}{" "}
              <span className="text-3xl">👋</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Here's what's happening with your verifications today.
            </p>
          </div>
          {address && (
            <Badge
              variant="outline"
              className="w-fit bg-[#3ECF8E]/10 border-[#3ECF8E]/30 text-[#3ECF8E]"
            >
              <div className="w-2 h-2 rounded-full bg-[#3ECF8E] mr-2 animate-pulse" />
              Connected
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="bg-surface-75 group relative overflow-hidden transition-all duration-300 rounded-md">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-bold text-foreground">
                        {stat.value}
                      </h3>
                      {stat.change && (
                        <span className="text-xs text-[#3ECF8E] flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {stat.change}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-surface-300 flex items-center justify-center text-foreground`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Requests Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="bg-surface-75 rounded-md">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-semibold">
                Recent Requests
              </CardTitle>
              <Link href="/requests">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#3ECF8E] hover:text-[#3ECF8E]/80 hover:bg-[#3ECF8E]/10"
                >
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="font-semibold">
                        Document Name
                      </TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRequests.map((request) => (
                      <TableRow
                        key={request.id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <TableCell className="font-medium">
                          {request.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-background/50">
                            {request.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusBadge(request.status)}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Date(request.date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-surface-75 rounded-md h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#3ECF8E]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="relative">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === "success"
                            ? "bg-green-500"
                            : activity.type === "warning"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                      />
                      {index < activities.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-full bg-border/40" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <Link href="/requests/new" className="block">
          <Card className="bg-surface-75 rounded-md">
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#3ECF8E]/20 flex items-center justify-center group-hover:bg-[#3ECF8E]/30 transition-colors">
                  <Plus className="w-6 h-6 text-[#3ECF8E]" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    New Verification
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Submit a new request
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/requests" className="block">
          <Card className="bg-surface-75 rounded-md">
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <FolderOpen className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    My Documents
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View all requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/requests?status=pending" className="block">
          <Card className="bg-surface-75 rounded-md">
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Search className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Check Status
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Track verification
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </div>
  );
}
