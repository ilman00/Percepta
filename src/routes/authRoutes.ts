import { Router } from "express";
import { login, refreshTokens, adminChangeUserPassword, changeOwnPassword } from "../controllers/authController";
import { registerAdmin } from "../controllers/authController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", authenticate ,registerAdmin);
router.post("/login", login)
router.post("/refresh", refreshTokens);
router.patch("/admin/users/:id/password", authenticate, adminChangeUserPassword);
router.patch(
  "/admin/change-password",
  authenticate,
  changeOwnPassword
);

export default router;
