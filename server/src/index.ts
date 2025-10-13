import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Import routes
import uploadRoutes from "./routes/upload.route";
import requestRoutes from "./routes/request.route";

const app = express();
app.use(cors());
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

app.get("/", (_req, res) => {
    res.send("Hello, Blockchain API is running!");
});

app.listen(process.env.PORT || 6969, () => {
    console.log(`Server is running on port ${process.env.PORT || 6969}`);
});
