import { Router } from "express";
import authMiddleware from "../middleware/auth.Middleware.js";
import { getProgress } from "../controllers/progress.controller.js";

const router = Router();

/**
 * @route   
 * @desc   
 * @access  
 */
router.get("/:scenarioId", authMiddleware, getProgress);

export default router;
