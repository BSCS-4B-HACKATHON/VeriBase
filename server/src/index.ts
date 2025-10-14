import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Import routes
import uploadRoutes from "./routes/upload.route";
import requestRoutes from "./routes/request.route";
import nftRoutes from "./routes/nft.route";

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(
    cors({
        origin: (origin, cb) => {
            // allow requests from the frontend or allow server-to-server (no origin)
            if (!origin || origin === FRONTEND_ORIGIN) return cb(null, true);
            return cb(new Error("CORS blocked by server"));
        },
        credentials: true, // allow cookies / credentials
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    })
);

app.use(express.json({ limit: "50mb" }));

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI!)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB", err);
    });

// Use routes
app.use("/api/upload", uploadRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api", nftRoutes); // NFT minting routes

app.get("/", (_req, res) => {
    res.send("Hello, Blockchain API is running!");
});

app.listen(process.env.PORT || 6969, () => {
    console.log(`Server is running on port ${process.env.PORT || 6969}`);
});
