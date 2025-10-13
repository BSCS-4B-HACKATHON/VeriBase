import { Router } from "express";
import * as UploadController from "../controllers/upload.controller";

const uploadRouter = Router();

uploadRouter.post("/", UploadController.UploadHandler);

uploadRouter.post("/metadata", UploadController.UploadMetadataHandler);

export default uploadRouter;
