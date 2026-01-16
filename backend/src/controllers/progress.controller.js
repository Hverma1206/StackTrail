import supabase from "../config/supabase.js";


export const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scenarioId } = req.params;

    const { data, error } = await supabase
      .from("progress")
      .select(`
        id,
        user_id,
        scenario_id,
        current_step_id,
        score,
        completed,
        failed,
        bad_decision_count,
        created_at,
        updated_at,
        scenarios (
          id,
          title,
          role,
          difficulty,
          description
        )
      `)
      .eq("user_id", userId)
      .eq("scenario_id", scenarioId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Progress not found for this scenario",
      });
    }

    res.json({
      success: true,
      progress: data,
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
