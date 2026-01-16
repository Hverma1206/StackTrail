import { Router } from "express";
import {
  signup,
  login,
  logout,
  refreshToken,
  getProfile,
  changePassword,
  requestPasswordReset,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.Middleware.js";

const router = Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/request-password-reset", requestPasswordReset);

// Protected routes
router.post("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, getProfile);
router.put("/change-password", authMiddleware, changePassword);

export default router;
