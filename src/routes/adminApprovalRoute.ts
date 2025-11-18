import { Router } from "express";
import { approveAdmin, getPendingAdmins } from "../controllers/adminController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

// Get all pending admins (super admin only)
router.get("/pending", authenticate, getPendingAdmins);

// Approve admin
router.put("/approve:adminId", authenticate, approveAdmin);

export default router;
