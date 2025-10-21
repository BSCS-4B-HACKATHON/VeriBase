import mongoose, { Document, Schema } from "mongoose";

/**
 * Admin Model
 * Stores wallet addresses that have admin privileges
 * Populate manually via MongoDB - no scripts needed
 */

export interface IAdmin extends Document {
  walletAddress: string;
}

const AdminSchema = new Schema<IAdmin>({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (v: string) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: "Invalid Ethereum address format",
    },
  },
});

// Index for fast lookups
AdminSchema.index({ walletAddress: 1 });

// Static method to check if wallet is admin (case-insensitive)
AdminSchema.statics.isAdmin = async function (
  walletAddress: string
): Promise<boolean> {
  if (!walletAddress) return false;

  const admin = await this.findOne({
    walletAddress: { $regex: new RegExp(`^${walletAddress}$`, "i") },
  });

  return !!admin;
};

// Static method to get all active admins
AdminSchema.statics.getActiveAdmins = async function (): Promise<string[]> {
  const admins = await this.find().select("walletAddress");
  return admins.map((admin: IAdmin) => admin.walletAddress);
};

export const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);
