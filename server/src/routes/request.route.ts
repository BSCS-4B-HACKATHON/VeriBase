import { Router } from "express";
import * as requestController from "../controllers/request.controller";

const requestRouter = Router();

requestRouter.post("/", requestController.CreateRequestHandler);

export default requestRouter;
