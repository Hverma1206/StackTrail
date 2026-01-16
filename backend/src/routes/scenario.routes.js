import { Router } from "express";
import authMiddleware from "../middleware/auth.Middleware.js";
import {
  getAllScenarios,
  getScenarioById,
  startScenario,
  getStep,
  submitAnswer,
} from "../controllers/scenario.controller.js";

const router = Router();

/**
 * @route   
 * @desc   
 * @access  
 * @query  
 */
router.get("/", authMiddleware, getAllScenarios);

/**
 * @route   
 * @desc  
 * @access 
 */
router.get("/:id", authMiddleware, getScenarioById);

/**
 * @route   
 * @desc   
 * @access  
 */
router.get("/:id/start", authMiddleware, startScenario);

/**
 * @route   
 * @desc   
 * @access 
 */
router.get("/:id/step/:stepId", authMiddleware, getStep);

/**
 * @route   
 * @desc   
 * @access  
 * @body    
 */
router.post("/:id/step/:stepId/answer", authMiddleware, submitAnswer);

export default router;
