import { Router } from "express";
import * as requestController from "../controllers/request.controller";

const requestRouter = Router();

requestRouter.post("/", requestController.CreateRequestHandler);

requestRouter.get("/", requestController.GetRequestsHandler);

requestRouter.get(
    "/:requesterWallet/:requestId",
    requestController.GetRequestByIdHandler
);

export default requestRouter;
