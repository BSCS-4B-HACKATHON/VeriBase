import mongoose, { Model, Schema } from "mongoose";

/**
 * Document metadata stored for each uploaded/encrypted file
 */
export interface IDocMeta {
  cid: string;
  filename: string;
  mime?: string;
  size?: number;
  iv?: string;
  ciphertextHash?: string;
  tag?: string;
}

/**
 * Request document interface
 */
export interface IRequest extends Document {
  requestId: string;
  requesterWallet: string;
  requestType: "national_id" | "land_ownership";
  minimalPublicLabel?: string;
  metadataCid?: string;
  metadataHash?: string;
  uploaderSignature?: string;
  files: IDocMeta[];
  consent: {
    textVersion: string;
    timestamp: Date;
  };
  status: "pending" | "verified" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const DocMetaSchema = new Schema<IDocMeta>(
  {
    cid: { type: String, required: true },
    filename: { type: String, required: true },
    mime: { type: String },
    size: { type: Number },
    iv: { type: String },
    ciphertextHash: { type: String },
    tag: { type: String },
  },
  { _id: false }
);

const RequestSchema = new Schema<IRequest>(
  {
    requestId: { type: String, required: true, unique: true },
    requesterWallet: { type: String, required: true },
    requestType: {
      type: String,
      enum: ["national_id", "land_ownership"],
      required: true,
    },
    minimalPublicLabel: { type: String },
    metadataCid: { type: String },
    metadataHash: { type: String },
    uploaderSignature: { type: String },
    files: { type: [DocMetaSchema], default: [] },
    consent: {
      textVersion: { type: String, required: true },
      timestamp: { type: Date, required: true, default: Date.now },
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true, versionKey: false }
);

// indexes for common queries
RequestSchema.index({ requesterWallet: 1, status: 1 });
RequestSchema.index({ metadataCid: 1 });

const RequestModel: Model<IRequest> = mongoose.model<IRequest>(
  "Request",
  RequestSchema
);

export default RequestModel;
