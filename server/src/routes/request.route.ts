import { Router } from "express";
import * as requestController from "../controllers/request.controller";

const requestRouter = Router();

requestRouter.post("/", requestController.CreateRequestHandler);

requestRouter.get("/", requestController.GetRequestsHandler);

requestRouter.get(
    "/:requesterWallet/:requestId",
    requestController.GetRequestByIdHandler
);

// update request (uploader updates metadata/files)
requestRouter.patch(
    "/:requesterWallet/:requestId",
    requestController.UpdateRequestHandler
);

export default requestRouter;
