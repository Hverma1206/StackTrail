import supabase from "../config/supabase.js";
import decisionTreeService from "../services/decision-tree.service.js";


export const getAllScenarios = async (req, res) => {
  try {
    const { difficulty, role, search } = req.query;

    let query = supabase
      .from("scenarios")
      .select("id, title, role, difficulty, description, created_at")
      .order("created_at", { ascending: false });

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    if (role) {
      query = query.eq("role", role);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching scenarios:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch scenarios",
        error: error.message,
      });
    }

    res.json({
      success: true,
      count: data.length,
      scenarios: data,
    });
  } catch (error) {
    console.error("Error in getAllScenarios:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/scenarios/:id
 * Get a single scenario by ID (without steps for security)
 */
export const getScenarioById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: scenario, error } = await supabase
      .from("scenarios")
      .select("id, title, role, difficulty, description, created_at")
      .eq("id", id)
      .single();

    if (error || !scenario) {
      return res.status(404).json({
        success: false,
        message: "Scenario not found",
      });
    }

    res.json({
      success: true,
      scenario,
    });
  } catch (error) {
    console.error("Error in getScenarioById:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/scenarios/:id/start
 * Start a scenario - creates/resets progress and returns root step
 */
export const startScenario = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: scenarioId } = req.params;

    const result = await decisionTreeService.startScenario(userId, scenarioId);

    res.json({
      success: true,
      message: "Scenario started successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in startScenario:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to start scenario",
    });
  }
};

/**
 * GET /api/scenarios/:id/step/:stepId
 * Get a specific step for the scenario
 */
export const getStep = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: scenarioId, stepId } = req.params;

    const result = await decisionTreeService.getStep(userId, scenarioId, stepId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getStep:", error);
    const statusCode = error.message.includes("not found") || 
                       error.message.includes("not the current step") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to get step",
    });
  }
};

/**
 * POST /api/scenarios/:id/step/:stepId/answer
 * Submit an answer for a step
 */
export const submitAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: scenarioId, stepId } = req.params;
    const { optionId } = req.body;

    if (!optionId || typeof optionId !== "string") {
      return res.status(400).json({
        success: false,
        message: "optionId is required and must be a string",
      });
    }

    const result = await decisionTreeService.submitAnswer(
      userId,
      scenarioId,
      stepId,
      optionId
    );

    res.json({
      success: true,
      message: "Answer processed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in submitAnswer:", error);
    const statusCode = error.message.includes("not found") || 
                       error.message.includes("Invalid option") ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to process answer",
    });
  }
};
