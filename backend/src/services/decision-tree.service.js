import supabase from "../config/supabase.js";

/**
 * XP Evaluation Rules
 * xpChange >= 15: Good decision
 * xpChange 1-14: Risky decision
 * xpChange <= 0: Bad decision
 * Auto-fail after 3 bad decisions
 */

class DecisionTreeService {
  /**
   * Start a new scenario - get root step and create progress
   */
  async startScenario(userId, scenarioId) {
    // Check if scenario exists
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("id, title")
      .eq("id", scenarioId)
      .single();

    if (scenarioError || !scenario) {
      throw new Error("Scenario not found");
    }

    // Get root step
    const { data: rootStep, error: stepError } = await supabase
      .from("steps")
      .select("id, context, options")
      .eq("scenario_id", scenarioId)
      .eq("is_root", true)
      .single();

    if (stepError || !rootStep) {
      throw new Error("Root step not found for this scenario");
    }

    // Create or reset progress
    const { data: existingProgress } = await supabase
      .from("progress")
      .select("id")
      .eq("user_id", userId)
      .eq("scenario_id", scenarioId)
      .single();

    let progress;

    if (existingProgress) {
      // Reset existing progress
      const { data, error } = await supabase
        .from("progress")
        .update({
          current_step_id: rootStep.id,
          score: 0,
          decisions: [],
          completed: false,
          failed: false,
          bad_decision_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProgress.id)
        .select()
        .single();

      if (error) {
        console.error("Reset progress error:", error);
        throw new Error("Failed to reset progress");
      }
      progress = data;
    } else {
      // Create new progress
      const { data, error } = await supabase
        .from("progress")
        .insert({
          user_id: userId,
          scenario_id: scenarioId,
          current_step_id: rootStep.id,
          score: 0,
          decisions: [],
          completed: false,
          failed: false,
          bad_decision_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Create progress error:", error);
        throw new Error("Failed to create progress");
      }
      progress = data;
    }

    return {
      progress,
      step: {
        id: rootStep.id,
        context: rootStep.context,
        options: rootStep.options,
      },
    };
  }

  /**
   * Get a specific step by stepId
   */
  async getStep(userId, scenarioId, stepId) {
    // Verify user has active progress for this scenario
    const { data: progress, error: progressError } = await supabase
      .from("progress")
      .select("id, current_step_id, completed, failed")
      .eq("user_id", userId)
      .eq("scenario_id", scenarioId)
      .single();

    if (progressError || !progress) {
      throw new Error("No active progress found. Start the scenario first.");
    }

    if (progress.completed || progress.failed) {
      throw new Error("Scenario already completed or failed");
    }

    // Verify this is the current step
    if (progress.current_step_id !== stepId) {
      throw new Error("This is not the current step");
    }

    // Get step details
    const { data: step, error: stepError } = await supabase
      .from("steps")
      .select("id, scenario_id, context, options")
      .eq("id", stepId)
      .eq("scenario_id", scenarioId)
      .single();

    if (stepError || !step) {
      throw new Error("Step not found");
    }

    return {
      step: {
        id: step.id,
        context: step.context,
        options: step.options,
      },
      progress: {
        totalXp: progress.score,
        badDecisionCount: progress.bad_decision_count,
      },
    };
  }

  /**
   * Submit an answer and move to next step
   */
  async submitAnswer(userId, scenarioId, stepId, optionId) {
    // Get current progress
    const { data: progress, error: progressError } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .eq("scenario_id", scenarioId)
      .single();

    if (progressError || !progress) {
      throw new Error("No active progress found");
    }

    if (progress.completed || progress.failed) {
      throw new Error("Scenario already completed or failed");
    }

    if (progress.current_step_id !== stepId) {
      throw new Error("This is not the current step");
    }

    // Get current step
    const { data: currentStep, error: stepError } = await supabase
      .from("steps")
      .select("options")
      .eq("id", stepId)
      .single();

    if (stepError || !currentStep) {
      throw new Error("Step not found");
    }

    // Find selected option
    const selectedOption = currentStep.options.find((opt) => opt.id === optionId);

    if (!selectedOption) {
      throw new Error("Invalid option selected");
    }

    // Calculate new XP and bad decision count
    const xpChange = selectedOption.xpChange;
    const newTotalXp = progress.score + xpChange;
    const isBadDecision = xpChange <= 0;
    const newBadDecisionCount = isBadDecision
      ? progress.bad_decision_count + 1
      : progress.bad_decision_count;

    // Update decisions history
    const newDecisions = [
      ...progress.decisions,
      {
        stepId,
        optionId,
        xpChange,
        timestamp: new Date().toISOString(),
      },
    ];

    // Check if scenario should fail (3 bad decisions)
    if (newBadDecisionCount >= 3) {
      const { data: updatedProgress, error: updateError } = await supabase
        .from("progress")
        .update({
          score: newTotalXp,
          bad_decision_count: newBadDecisionCount,
          decisions: newDecisions,
          failed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", progress.id)
        .select()
        .single();

      if (updateError) throw new Error("Failed to update progress");

      return {
        isComplete: true,
        isFailed: true,
        reason: "Too many bad decisions",
        summary: this.generateSummary(updatedProgress),
      };
    }

    const nextStepId = selectedOption.nextStepId;

    // Check if scenario is complete (no next step)
    if (!nextStepId) {
      const { data: updatedProgress, error: updateError } = await supabase
        .from("progress")
        .update({
          score: newTotalXp,
          bad_decision_count: newBadDecisionCount,
          decisions: newDecisions,
          completed: true,
          current_step_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", progress.id)
        .select()
        .single();

      if (updateError) throw new Error("Failed to update progress");

      return {
        isComplete: true,
        isFailed: false,
        summary: this.generateSummary(updatedProgress),
      };
    }

    // Get next step
    const { data: nextStep, error: nextStepError } = await supabase
      .from("steps")
      .select("id, context, options")
      .eq("id", nextStepId)
      .single();

    if (nextStepError || !nextStep) {
      throw new Error("Next step not found");
    }

    // Update progress with next step
    const { data: updatedProgress, error: updateError } = await supabase
      .from("progress")
      .update({
        current_step_id: nextStepId,
        score: newTotalXp,
        bad_decision_count: newBadDecisionCount,
        decisions: newDecisions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", progress.id)
      .select()
      .single();

    if (updateError) throw new Error("Failed to update progress");

    return {
      isComplete: false,
      xpGained: xpChange,
      decisionQuality: this.evaluateDecision(xpChange),
      nextStep: {
        id: nextStep.id,
        context: nextStep.context,
        options: nextStep.options,
      },
      progress: {
        totalXp: newTotalXp,
        badDecisionCount: newBadDecisionCount,
      },
    };
  }

  /**
   * Evaluate decision quality based on XP change
   */
  evaluateDecision(xpChange) {
    if (xpChange >= 15) return "good";
    if (xpChange >= 1) return "risky";
    return "bad";
  }

  /**
   * Generate completion summary
   */
  generateSummary(progress) {
    const decisions = progress.decisions || [];
    const goodDecisions = decisions.filter((d) => d.xpChange >= 15).length;
    const riskyDecisions = decisions.filter(
      (d) => d.xpChange >= 1 && d.xpChange < 15
    ).length;
    const badDecisions = decisions.filter((d) => d.xpChange <= 0).length;

    let performance;
    if (progress.score >= 100) performance = "excellent";
    else if (progress.score >= 50) performance = "good";
    else if (progress.score >= 0) performance = "average";
    else performance = "poor";

    return {
      totalXp: progress.score,
      totalDecisions: decisions.length,
      goodDecisions,
      riskyDecisions,
      badDecisions,
      performance,
      completed: progress.completed,
      failed: progress.failed,
      decisions: decisions.map((d) => ({
        stepId: d.stepId,
        optionId: d.optionId,
        xpChange: d.xpChange,
        quality: this.evaluateDecision(d.xpChange),
        timestamp: d.timestamp,
      })),
    };
  }

  /**
   * Get progress for AI analysis
   */
  async getProgressForAnalysis(userId, scenarioId) {
    const { data: progress, error } = await supabase
      .from("progress")
      .select(
        `
        *,
        scenarios (
          title,
          description,
          role,
          difficulty
        )
      `
      )
      .eq("user_id", userId)
      .eq("scenario_id", scenarioId)
      .single();

    if (error || !progress) {
      throw new Error("Progress not found");
    }

    return {
      scenario: progress.scenarios,
      summary: this.generateSummary(progress),
    };
  }
}

export default new DecisionTreeService();
