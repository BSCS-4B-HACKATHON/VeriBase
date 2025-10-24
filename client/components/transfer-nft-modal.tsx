"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Send,
  Copy,
  AlertTriangle,
  Info,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Hash,
  Fuel,
  Network,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useTransferNFT } from "@/hooks/useTransferNFT";
import Image from "next/image";

interface NFTDocument {
  id: string;
  tokenId: string;
  title: string;
  type: "Land Title" | "National ID";
  contractAddress: string;
  ownerAddress: string;
  imageUrl?: string;
  network: string;
}

interface TransferNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFTDocument;
}

export function TransferNFTModal({
  isOpen,
  onClose,
  nft,
}: TransferNFTModalProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [confirmAddress, setConfirmAddress] = useState("");
  const [note, setNote] = useState("");
  const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);
  const [addressesMatch, setAddressesMatch] = useState<boolean | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Use the transfer hook
  const { transferNFT, isTransferring, isConfirmed, hash, error } =
    useTransferNFT();

  // Estimated gas fee (mock data - replace with actual blockchain call)
  const [estimatedGas] = useState("~0.0001 ETH");

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setRecipientAddress("");
        setConfirmAddress("");
        setNote("");
        setIsValidAddress(null);
        setAddressesMatch(null);
        setShowConfirmation(false);
        setIsSuccess(false);
      }, 300);
    }
  }, [isOpen]);

  // Validate recipient address
  useEffect(() => {
    if (recipientAddress.length === 0) {
      setIsValidAddress(null);
      return;
    }

    const isValid =
      recipientAddress.startsWith("0x") &&
      recipientAddress.length === 42 &&
      /^0x[a-fA-F0-9]{40}$/.test(recipientAddress);

    setIsValidAddress(isValid);
  }, [recipientAddress]);

  // Check if addresses match
  useEffect(() => {
    if (confirmAddress.length === 0) {
      setAddressesMatch(null);
      return;
    }

    setAddressesMatch(recipientAddress === confirmAddress);
  }, [recipientAddress, confirmAddress]);

  const handleCopyAddress = (address: string, label: string) => {
    navigator.clipboard.writeText(address);
    toast.success(`${label} copied!`);
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConfirmTransfer = () => {
    if (!isValidAddress || !addressesMatch) {
      toast.error("Please fix validation errors before continuing");
      return;
    }

    setShowConfirmation(true);
  };

  const handleSendTransfer = async () => {
    try {
      await transferNFT(nft.tokenId, recipientAddress as `0x${string}`, note);
      // Success will be handled by useEffect watching isConfirmed
    } catch {
      console.error("Transfer error:", error);
      // Error toast is handled by the hook
    }
  };

  // Watch for transfer confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      setIsSuccess(true);
      toast.success("NFT transferred successfully!");

      // Close modal after success
      setTimeout(() => {
        onClose();
        // Refresh the page to show updated NFT ownership
        window.location.reload();
      }, 2000);
    }
  }, [isConfirmed, hash, onClose]);

  // Show error toast if transfer fails
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Transfer failed. Please try again.");
    }
  }, [error]);

  const handleClose = useCallback(() => {
    if (isTransferring) return;
    onClose();
  }, [isTransferring, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isTransferring) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, isTransferring, handleClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original body overflow
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Get scrollbar width to prevent layout shift
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // Lock scroll and compensate for scrollbar
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      return () => {
        // Restore original values
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-lg bg-surface-200 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Content */}
            <div className="relative max-h-[90vh] overflow-y-auto">
              {!showConfirmation ? (
                // Main Transfer Form
                <>
                  {/* Header */}
                  <div className="sticky top-0 bg-surface-200 backdrop-blur-sm border-b border-white/10 p-6 pb-4 z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">
                          Transfer NFT Document
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Transfer ownership of this verified NFT to another
                          wallet.
                        </p>
                      </div>
                      <Button
                        onClick={handleClose}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-white/10 -mr-2"
                        disabled={isTransferring}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* NFT Summary */}
                  <div className="p-6 pt-4">
                    <div className="border border-foreground/10 rounded-xl p-4 bg-surface-75/50 space-y-3">
                      <div className="flex gap-3">
                        {/* NFT Thumbnail */}
                        <div className="relative w-20 h-20 flex-shrink-0 bg-surface-200 rounded-lg overflow-hidden border border-border/40">
                          {nft.imageUrl ? (
                            <Image
                              src={nft.imageUrl}
                              alt={nft.title}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>

                        {/* NFT Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {nft.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                nft.type === "Land Title"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                  : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              }`}
                            >
                              {nft.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Hash className="w-3 h-3" />
                            <code className="font-mono">{nft.tokenId}</code>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-border/40" />

                      {/* Current Owner */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Current Owner
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-foreground">
                            {shortenAddress(nft.ownerAddress)}
                          </code>
                          <Button
                            onClick={() =>
                              handleCopyAddress(nft.ownerAddress, "Address")
                            }
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Transfer Form */}
                    <div className="mt-6 space-y-5">
                      {/* Recipient Address */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="recipient"
                          className="text-sm font-medium"
                        >
                          Recipient Wallet Address
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Input
                          id="recipient"
                          type="text"
                          placeholder="0x..."
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          className={`font-mono text-sm ${
                            isValidAddress === false
                              ? "border-red-500/50 focus:border-red-500"
                              : isValidAddress === true
                              ? "border-green-500/50 focus:border-green-500"
                              : ""
                          }`}
                        />
                        {isValidAddress === false && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Invalid Ethereum address format
                          </p>
                        )}
                        {isValidAddress === true && (
                          <p className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Valid address format
                          </p>
                        )}
                      </div>

                      {/* Confirm Address */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="confirm"
                          className="text-sm font-medium"
                        >
                          Confirm Recipient Address
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Input
                          id="confirm"
                          type="text"
                          placeholder="Re-enter recipient address"
                          value={confirmAddress}
                          onChange={(e) => setConfirmAddress(e.target.value)}
                          className={`font-mono text-sm ${
                            addressesMatch === false
                              ? "border-red-500/50 focus:border-red-500"
                              : addressesMatch === true
                              ? "border-green-500/50 focus:border-green-500"
                              : ""
                          }`}
                        />
                        {addressesMatch === false && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Addresses do not match
                          </p>
                        )}
                        {addressesMatch === true && (
                          <p className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Addresses match
                          </p>
                        )}
                      </div>

                      {/* Optional Note */}
                      <div className="space-y-2">
                        <Label htmlFor="note" className="text-sm font-medium">
                          Optional Note / Message
                        </Label>
                        <textarea
                          id="note"
                          placeholder="Add an optional note for the recipient..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          maxLength={150}
                          rows={3}
                          className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {note.length}/150 characters
                        </p>
                      </div>

                      {/* Gas & Network Info */}
                      <div className="bg-foreground/5 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Info className="w-4 h-4 text-[#3ECF8E]" />
                          Transaction Details
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Network className="w-4 h-4" />
                              Network
                            </div>
                            <span className="font-medium">{nft.network}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Fuel className="w-4 h-4" />
                              Est. Gas Fee
                            </div>
                            <span className="font-medium font-mono text-xs">
                              {estimatedGas}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Warning */}
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-yellow-100/90 leading-relaxed">
                          <strong className="block mb-1">Important:</strong>
                          Transfers are irreversible once confirmed on-chain.
                          Please verify the recipient address carefully before
                          proceeding.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="sticky bottom-0 bg-surface-200 backdrop-blur-sm border-t border-white/10 p-6 pt-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleClose}
                        variant="outline"
                        size="lg"
                        className="flex-1 order-2 sm:order-1"
                        disabled={isTransferring}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmTransfer}
                        size="lg"
                        className="flex-1 order-1 sm:order-2 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90"
                        disabled={
                          !isValidAddress || !addressesMatch || isTransferring
                        }
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Confirm Transfer
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // Confirmation Step
                <>
                  <div className="p-6">
                    {!isSuccess ? (
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="mx-auto w-16 h-16 rounded-full bg-[#3ECF8E]/20 flex items-center justify-center mb-4">
                            <Send className="w-8 h-8 text-[#3ECF8E]" />
                          </div>
                          <h3 className="text-xl font-bold mb-2">
                            Confirm Transaction
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Review the details before sending the transfer
                          </p>
                        </div>

                        {/* Transaction Summary */}
                        <div className="bg-surface-75/50 rounded-xl p-4 space-y-3 border border-border/40">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">NFT</span>
                            <span className="font-medium">{nft.title}</span>
                          </div>

                          <Separator className="bg-border/40" />

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Token ID
                            </span>
                            <code className="font-mono text-xs">
                              {nft.tokenId}
                            </code>
                          </div>

                          <Separator className="bg-border/40" />

                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">
                              To Address
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 font-mono text-xs bg-surface-200 px-3 py-2 rounded border border-border/40 break-all">
                                {recipientAddress}
                              </code>
                              <Button
                                onClick={() =>
                                  handleCopyAddress(recipientAddress, "Address")
                                }
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <Separator className="bg-border/40" />

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Est. Gas Fee
                            </span>
                            <code className="font-mono text-xs">
                              {estimatedGas}
                            </code>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                          <Button
                            onClick={handleSendTransfer}
                            size="lg"
                            className="w-full bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black"
                            disabled={isTransferring}
                          >
                            {isTransferring ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending Transfer...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Send Transfer
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setShowConfirmation(false)}
                            variant="outline"
                            size="lg"
                            className="w-full"
                            disabled={isTransferring}
                          >
                            Go Back
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Success State
                      <div className="text-center py-8">
                        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                          <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">
                          Transfer Successful!
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Your NFT has been transferred to the recipient.
                        </p>

                        {hash && (
                          <div className="mb-6 p-4 bg-surface-75/50 rounded-lg border border-border/40">
                            <p className="text-xs text-muted-foreground mb-2">
                              Transaction Hash
                            </p>
                            <div className="flex items-center gap-2 justify-center">
                              <code className="text-xs font-mono">
                                {hash.slice(0, 10)}...{hash.slice(-8)}
                              </code>
                              <Button
                                onClick={() =>
                                  handleCopyAddress(hash, "Transaction hash")
                                }
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <a
                              href={`https://sepolia.basescan.org/tx/${hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#3ECF8E] hover:underline mt-2"
                            >
                              View on BaseScan
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        <Button
                          onClick={handleClose}
                          size="lg"
                          className="bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black"
                        >
                          Close
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
