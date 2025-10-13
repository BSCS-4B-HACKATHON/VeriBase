import { Router } from "express";
import * as requestController from "../controllers/request.controller";

const requestRouter = Router();

requestRouter.post("/", requestController.CreateRequestHandler);

requestRouter.get("/", requestController.GetRequestsHandler);

export default requestRouter;
