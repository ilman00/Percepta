import express from "express";
import { getHomeDashboardStats, getTransactionDashboardStats } from "../controllers/statsController";
import { authenticate } from "../middlewares/authMiddleware";


const router = express.Router();

router.get("/buy-sell-dashboard-stats", authenticate, getHomeDashboardStats);
router.get("/running-dashboard-stats", authenticate, getTransactionDashboardStats);

export default router;
