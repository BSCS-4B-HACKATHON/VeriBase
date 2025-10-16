"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  FileCheck2,
  XCircle,
  Clock,
  FileText,
  RefreshCw,
  TrendingUp,
  Search,
  Eye,
  Activity,
  Bell,
  UserPlus,
  Settings,
  ExternalLink,
  Blocks,
  Send,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface StatCard {
  title: string;
  value: number;
  change: string;
  icon: any;
  color: string;
}

interface VerificationRequest {
  id: string;
  user: string;
  type: "Land Title" | "National ID";
  date: string;
  status: "pending" | "approved" | "rejected";
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  type: "approved" | "rejected" | "transfer" | "added";
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
}

export default function AdminDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<StatCard[]>([]);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [blockchainData, setBlockchainData] = useState({
    network: "Ethereum Mainnet",
    nftsMinted: 1247,
    totalTransfers: 384,
    lastBlockSynced: 19234567,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // TODO: Replace with actual API calls
    setStats([
      {
        title: "Total Users",
        value: 2845,
        change: "+12 this week",
        icon: Users,
        color: "text-blue-500",
      },
      {
        title: "Pending Requests",
        value: 47,
        change: "+5 today",
        icon: Clock,
        color: "text-yellow-500",
      },
      {
        title: "Approved Verifications",
        value: 1893,
        change: "+23 this week",
        icon: CheckCircle2,
        color: "text-green-500",
      },
      {
        title: "Rejected Verifications",
        value: 124,
        change: "-3 this week",
        icon: XCircle,
        color: "text-red-500",
      },
      {
        title: "Total NFT Documents",
        value: 1247,
        change: "+18 this week",
        icon: FileText,
        color: "text-[#3ECF8E]",
      },
    ]);

    setRequests([
      {
        id: "VRF-1093",
        user: "0x742d...f0bEb",
        type: "Land Title",
        date: "2025-10-16",
        status: "pending",
      },
      {
        id: "VRF-1092",
        user: "0x8a3f...9c2D",
        type: "National ID",
        date: "2025-10-16",
        status: "pending",
      },
      {
        id: "VRF-1091",
        user: "0x5b2e...8f1A",
        type: "Land Title",
        date: "2025-10-15",
        status: "approved",
      },
      {
        id: "VRF-1090",
        user: "0x9f6c...3d4E",
        type: "National ID",
        date: "2025-10-15",
        status: "approved",
      },
      {
        id: "VRF-1089",
        user: "0x2d8a...7b5F",
        type: "Land Title",
        date: "2025-10-14",
        status: "rejected",
      },
    ]);

    setActivities([
      {
        id: "1",
        action: "Admin approved request #1093",
        timestamp: "2 minutes ago",
        type: "approved",
      },
      {
        id: "2",
        action: "Verifier @marie added new authority",
        timestamp: "15 minutes ago",
        type: "added",
      },
      {
        id: "3",
        action: "User wallet 0xA3D... transferred NFT #432",
        timestamp: "1 hour ago",
        type: "transfer",
      },
      {
        id: "4",
        action: "Admin rejected request #1087",
        timestamp: "2 hours ago",
        type: "rejected",
      },
      {
        id: "5",
        action: "System updated verification criteria",
        timestamp: "3 hours ago",
        type: "added",
      },
    ]);

    setAnnouncements([
      {
        id: "1",
        title: "System Maintenance Scheduled",
        description:
          "Blockchain syncing will be temporarily unavailable on Oct 20.",
        date: "2025-10-15",
      },
      {
        id: "2",
        title: "New Verification Authority Added",
        description:
          "Land Registry Office now available for instant verification.",
        date: "2025-10-14",
      },
    ]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "bg-green-500/10 text-green-500 border-green-500/30",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      rejected: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "transfer":
        return <Send className="w-4 h-4 text-blue-500" />;
      case "added":
        return <UserPlus className="w-4 h-4 text-[#3ECF8E]" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              System overview and real-time verification stats.
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

        {/* Stats Grid - Auto-fill for even distribution */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full"
            >
              <Card className="bg-surface-75 rounded-2xl border-border/40 hover:border-[#3ECF8E]/30 transition-all duration-300 cursor-pointer h-full shadow-sm shadow-black/20">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl bg-surface-300 ${stat.color}`}
                    >
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl lg:text-3xl font-bold">
                      {stat.value}
                    </h3>
                    <p className="text-xs text-[#3ECF8E] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid - Requests Table + Blockchain/Activity */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Recent Verification Requests - Spans 2 columns on large screens */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="lg:col-span-2 h-full"
          >
            <Card className="bg-surface-75 rounded-2xl border-border/40 shadow-sm shadow-black/20 h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-lg font-semibold">
                    Recent Verification Requests
                  </CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/40">
                        <TableHead className="font-semibold text-xs">
                          Request ID
                        </TableHead>
                        <TableHead className="font-semibold text-xs">
                          User
                        </TableHead>
                        <TableHead className="font-semibold text-xs">
                          Type
                        </TableHead>
                        <TableHead className="font-semibold text-xs">
                          Date
                        </TableHead>
                        <TableHead className="font-semibold text-xs">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-xs text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow
                          key={request.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium font-mono text-xs">
                            {request.id}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{request.user}</code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-background/50 text-xs"
                            >
                              {request.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(request.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getStatusBadge(
                                request.status
                              )} text-xs`}
                            >
                              {request.status.charAt(0).toUpperCase() +
                                request.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="hover:bg-[#3ECF8E]/10 h-7 w-7 p-0"
                            >
                              <Link href={`/admin/requests/${request.id}`}>
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Blockchain & Activities - Spans 1 column */}
          <div className="flex flex-col gap-6 h-full">
            {/* Blockchain Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex-1"
            >
              <Card className="bg-surface-75 rounded-2xl border-border/40 shadow-sm shadow-black/20 h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Blocks className="w-5 h-5 text-[#3ECF8E]" />
                    Blockchain Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">
                      Network
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs"
                    >
                      {blockchainData.network}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">
                      NFTs Minted
                    </span>
                    <span className="font-semibold text-sm">
                      {blockchainData.nftsMinted}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">
                      Total Transfers
                    </span>
                    <span className="font-semibold text-sm">
                      {blockchainData.totalTransfers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">
                      Last Block Synced
                    </span>
                    <code className="text-xs font-mono">
                      {blockchainData.lastBlockSynced}
                    </code>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-[#3ECF8E]/30 hover:bg-[#3ECF8E]/10 mt-auto"
                  >
                    <a
                      href="https://etherscan.io"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      View on Explorer
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity Log */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex-1"
            >
              <Card className="bg-surface-75 rounded-2xl border-border/40 shadow-sm shadow-black/20 h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#3ECF8E]" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="flex gap-3 group">
                        <div className="relative flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-surface-300 flex items-center justify-center group-hover:bg-[#3ECF8E]/20 transition-colors shrink-0">
                            {getActivityIcon(activity.type)}
                          </div>
                          {index < activities.length - 1 && (
                            <div className="w-px flex-1 bg-border/40 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <p className="text-xs text-foreground leading-relaxed">
                            {activity.action}
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
        </div>

        {/* Bottom Row - Announcements & Quick Actions - Equal Height */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Announcements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="h-full"
          >
            <Card className="bg-surface-75 rounded-2xl border-border/40 shadow-sm shadow-black/20 h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#3ECF8E]" />
                    Announcements
                  </CardTitle>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-[#3ECF8E] hover:bg-[#3ECF8E]/10 h-8 text-xs"
                  >
                    <Link href="/admin/announcements">Manage</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="border-l-2 border-[#3ECF8E] bg-surface-300/50 rounded-r-lg p-3 hover:bg-surface-300 transition-colors cursor-pointer"
                  >
                    <h4 className="font-semibold text-sm mb-1">
                      {announcement.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                      {announcement.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(announcement.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="h-full"
          >
            <Card className="bg-surface-75 rounded-2xl border-border/40 shadow-sm shadow-black/20 h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#3ECF8E]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center">
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    asChild
                    variant="outline"
                    className="h-24 flex-col gap-2 hover:bg-[#3ECF8E]/10 hover:border-[#3ECF8E]/50 transition-all"
                  >
                    <Link href="/admin/users">
                      <Users className="w-6 h-6 text-[#3ECF8E]" />
                      <span className="text-xs font-medium">
                        View All Users
                      </span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-24 flex-col gap-2 hover:bg-[#3ECF8E]/10 hover:border-[#3ECF8E]/50 transition-all"
                  >
                    <Link href="/admin/requests">
                      <FileCheck2 className="w-6 h-6 text-[#3ECF8E]" />
                      <span className="text-xs font-medium">
                        Manage Requests
                      </span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-24 flex-col gap-2 hover:bg-[#3ECF8E]/10 hover:border-[#3ECF8E]/50 transition-all"
                  >
                    <Link href="/admin/nfts">
                      <FileText className="w-6 h-6 text-[#3ECF8E]" />
                      <span className="text-xs font-medium">
                        Review NFT Records
                      </span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-24 flex-col gap-2 hover:bg-[#3ECF8E]/10 hover:border-[#3ECF8E]/50 transition-all"
                  >
                    <Link href="/admin/authorities">
                      <Shield className="w-6 h-6 text-[#3ECF8E]" />
                      <span className="text-xs font-medium">Add Authority</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
