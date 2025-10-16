import { Router } from "express";
import * as adminController from "../controllers/admin.controller";

const adminRouter = Router();

// Get all requests (with optional filters)
adminRouter.get("/requests", adminController.GetAllRequestsHandler);

// Get detailed request by ID (admin access - no wallet check)
adminRouter.get(
  "/requests/:requestId",
  adminController.GetAdminRequestByIdHandler
);

// Get statistics
adminRouter.get("/stats", adminController.GetStatsHandler);

// Approve a request
adminRouter.put(
  "/requests/:requestId/approve",
  adminController.ApproveRequestHandler
);

// Reject a request
adminRouter.put(
  "/requests/:requestId/reject",
  adminController.RejectRequestHandler
);

export default adminRouter;
