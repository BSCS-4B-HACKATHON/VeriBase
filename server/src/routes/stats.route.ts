import { Router } from "express";
import {
  GetGlobalStatsHandler,
  GetUserStatsHandler,
} from "../controllers/stats.controller";

const router = Router();

// Get global statistics (all users, all requests, on-chain totals)
router.get("/global", GetGlobalStatsHandler);

// Get user-specific statistics
router.get("/user/:walletAddress", GetUserStatsHandler);

export default router;
