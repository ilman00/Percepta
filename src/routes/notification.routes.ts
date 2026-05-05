import express from "express";
import { saveFcmToken } from "../controllers/notification.controller";
import { authenticate } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/fcm-token", authenticate, saveFcmToken);

export default router;