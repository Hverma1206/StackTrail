import supabase from "../config/supabase.js";
import geminiService from "../services/gemini.service.js";

/**
 * Generate AI-powered post-scenario analysis
 * @route POST /api/scenarios/:scenarioId/analyze
 * @access Private (requires authentication)
 */
export const generateAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scenarioId } = req.params;

    // Fetch user's progress for this scenario
    const { data: progress, error: progressError } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .eq("scenario_id", scenarioId)
      .single();

    if (progressError || !progress) {
      return res.status(404).json({
        success: false,
        message: "Progress not found for this scenario",
      });
    }

    // Validate that scenario is completed or failed
    if (!progress.completed && !progress.failed) {
      return res.status(400).json({
        success: false,
        message: "Analysis can only be generated for completed or failed scenarios",
      });
    }

    // Fetch scenario details
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", scenarioId)
      .single();

    if (scenarioError || !scenario) {
      return res.status(404).json({
        success: false,
        message: "Scenario not found",
      });
    }

    // Enrich decisions with full context and option text
    const enrichedDecisions = [];
    
    if (progress.decisions && progress.decisions.length > 0) {
      for (const decision of progress.decisions) {
        try {
          // Fetch the step to get context
          const { data: step } = await supabase
            .from("steps")
            .select("context, options")
            .eq("id", decision.stepId)
            .single();

          if (step) {
            // Find the chosen option
            const chosenOption = step.options?.find(opt => opt.id === decision.optionId);
            
            enrichedDecisions.push({
              stepContext: step.context || "Context not available",
              optionText: chosenOption?.text || "Option not available",
              xpChange: decision.xpChange || 0
            });
          }
        } catch (err) {
          console.error(`Error enriching decision ${decision.stepId}:`, err);
          // Add minimal data if step fetch fails
          enrichedDecisions.push({
            stepContext: "Context unavailable",
            optionText: "Option unavailable",
            xpChange: decision.xpChange || 0
          });
        }
      }
    }

    // Create enriched progress object for analysis
    const enrichedProgress = {
      ...progress,
      decisions: enrichedDecisions
    };

    // Generate AI analysis
    const result = await geminiService.generateAnalysis(scenario, enrichedProgress);

    if (!result.success) {
      throw new Error("Failed to generate analysis");
    }

    res.json({
      success: true,
      analysis: result.analysis,
      metadata: {
        scenarioTitle: scenario.title,
        scenarioRole: scenario.role,
        scenarioDifficulty: scenario.difficulty,
        completed: progress.completed,
        failed: progress.failed,
        finalScore: progress.score,
        totalDecisions: progress.decisions?.length || 0,
        badDecisions: progress.bad_decision_count,
      },
    });
  } catch (error) {
    console.error("Error in generateAnalysis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate analysis",
      error: error.message,
    });
  }
};
