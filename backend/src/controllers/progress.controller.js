import Progress from "../models/Progress.js";
import Scenario from "../models/Scenario.js";


export const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scenarioId } = req.params;

    const progress = await Progress.findOne({
      user_id: userId,
      scenario_id: scenarioId,
    }).populate("scenario_id");

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress not found for this scenario",
      });
    }

    res.json({
      success: true,
      progress: {
        id: progress._id,
        user_id: progress.user_id,
        scenario_id: progress.scenario_id._id,
        current_step_id: progress.current_step_id,
        score: progress.score,
        completed: progress.completed,
        failed: progress.failed,
        bad_decision_count: progress.bad_decision_count,
        created_at: progress.createdAt,
        updated_at: progress.updatedAt,
        scenarios: {
          id: progress.scenario_id._id,
          title: progress.scenario_id.title,
          role: progress.scenario_id.role,
          difficulty: progress.scenario_id.difficulty,
          description: progress.scenario_id.description,
        },
      },
    });
  } catch (error) {
    console.error("Error in getProgress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch progress",
      error: error.message,
    });
  }
};
