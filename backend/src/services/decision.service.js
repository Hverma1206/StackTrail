import supabase from "../config/supabase.js";

/**
 * Decision Service - Handles game logic for Story Mode
 * Centralizes all business logic for scenario progression
 */

class DecisionService {
  /**
   * Evaluate decision type based on xpChange value
   * @param {number} xpChange - XP change value from the option
   * @returns {Object} Decision evaluation
   */
  evaluateDecision(xpChange) {
    if (xpChange >= 15) {
      return { type: "correct", isBad: false };
    } else if (xpChange >= 1 && xpChange <= 14) {
      return { type: "risky", isBad: false };
    } else {
      return { type: "bad", isBad: true };
    }
  }

  /**
   * Process user's answer to a step
   * @param {string} userId - User ID from auth
   * @param {string} scenarioId - Current scenario ID
   * @param {string} stepId - Current step ID
   * @param {number} chosenOptionIndex - Index of the option chosen by user
   * @returns {Object} Result of the decision with next step info
   */
  async processAnswer(userId, scenarioId, stepId, chosenOptionIndex) {
    try {
      // Get current step and its options
      const { data: currentStep, error: stepError } = await supabase
        .from("steps")
        .select("*")
        .eq("id", stepId)
        .eq("scenario_id", scenarioId)
        .single();

      if (stepError || !currentStep) {
        throw new Error("Step not found");
      }

      const options = currentStep.options;
      if (!options || !Array.isArray(options) || !options[chosenOptionIndex]) {
        throw new Error("Invalid option selected");
      }

      const chosenOption = options[chosenOptionIndex];
      const xpChange = chosenOption.xpChange || 0;
      const feedback = chosenOption.feedback || "";

      // Evaluate decision
      const evaluation = this.evaluateDecision(xpChange);

      // Get user's current progress
      const { data: progress, error: progressError } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", userId)
        .eq("scenario_id", scenarioId)
        .single();

      if (progressError || !progress) {
        throw new Error("Progress not found. Start the scenario first.");
      }

      // Check if already completed or failed
      if (progress.completed) {
        throw new Error("Scenario already completed");
      }

      if (progress.failed) {
        throw new Error("Scenario already failed. Cannot continue.");
      }

      // Calculate new score and bad decision count
      const newScore = progress.score + xpChange;
      const newBadDecisionCount = evaluation.isBad
        ? progress.bad_decision_count + 1
        : progress.bad_decision_count;

      // Check if user has failed (3 bad decisions)
      const failed = newBadDecisionCount >= 3;

      // Get next step
      const { data: nextStep } = await supabase
        .from("steps")
        .select("*")
        .eq("scenario_id", scenarioId)
        .eq("step_order", currentStep.step_order + 1)
        .single();

      // Check if scenario is completed (no more steps and not failed)
      const completed = !nextStep && !failed;

      // Prepare update data
      const updateData = {
        score: newScore,
        bad_decision_count: newBadDecisionCount,
        completed,
        failed,
        updated_at: new Date().toISOString(),
      };

      // Set current_step_id based on scenario state
      if (completed || failed) {
        updateData.current_step_id = null; // Clear current step on completion or failure
      } else if (nextStep) {
        updateData.current_step_id = nextStep.id;
      }

      // Update progress
      const { data: updatedProgress, error: updateError } = await supabase
        .from("progress")
        .update(updateData)
        .eq("user_id", userId)
        .eq("scenario_id", scenarioId)
        .select()
        .single();

      if (updateError) {
        throw new Error("Failed to update progress");
      }

      // When fetching a step
      const { data: step, error } = await supabase
        .from('steps')
        .select('*')
        .eq('id', stepId)
        .single();

      // Check if it's the final step
      if (step.is_final) {
        // Automatically mark progress as completed
        await supabase
          .from('progress')
          .update({ 
            completed: true, 
            current_step_id: step.id 
          })
          .eq('id', progressId);
      }

      // After updating progress with the decision, check if this was the final step
      if (!nextStep || (nextStep.options && nextStep.options.length === 0)) {
        // Mark as completed
        await supabase
          .from('progress')
          .update({ 
            completed: true,
            current_step_id: currentStepId
          })
          .eq('id', progressRecord.id);
      }

      return {
        success: true,
        decisionType: evaluation.type,
        xpChange,
        feedback,
        score: newScore,
        badDecisionCount: newBadDecisionCount,
        completed,
        failed,
        nextStepId: nextStep ? nextStep.id : null,
        progress: updatedProgress,
      };
    } catch (error) {
      console.error("Error processing answer:", error);
      throw error;
    }
  }

  /**
   * Start a new scenario for a user
   * @param {string} userId - User ID from auth
   * @param {string} scenarioId - Scenario to start
   * @returns {Object} Initial progress and first step
   */
  async startScenario(userId, scenarioId) {
    try {
      // Check if scenario exists
      const { data: scenario, error: scenarioError } = await supabase
        .from("scenarios")
        .select("*")
        .eq("id", scenarioId)
        .single();

      if (scenarioError || !scenario) {
        throw new Error("Scenario not found");
      }

      // Get first step
      const { data: firstStep, error: firstStepError } = await supabase
        .from("steps")
        .select("*")
        .eq("scenario_id", scenarioId)
        .eq("step_order", 1)
        .single();

      if (firstStepError || !firstStep) {
        throw new Error("First step not found for this scenario");
      }

      // Check if progress already exists
      const { data: existingProgress } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", userId)
        .eq("scenario_id", scenarioId)
        .single();

      let progress;

      if (existingProgress) {
        // Reset existing progress
        const { data: updatedProgress, error: updateError } = await supabase
          .from("progress")
          .update({
            current_step_id: firstStep.id,
            score: 0,
            completed: false,
            failed: false,
            bad_decision_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("scenario_id", scenarioId)
          .select()
          .single();

        if (updateError) {
          throw new Error("Failed to reset progress");
        }

        progress = updatedProgress;
      } else {
        // Create new progress
        const { data: newProgress, error: createError } = await supabase
          .from("progress")
          .insert({
            user_id: userId,
            scenario_id: scenarioId,
            current_step_id: firstStep.id,
            score: 0,
            completed: false,
            failed: false,
            bad_decision_count: 0,
          })
          .select()
          .single();

        if (createError) {
          throw new Error("Failed to create progress");
        }

        progress = newProgress;
      }

      return {
        success: true,
        scenario,
        currentStep: firstStep,
        progress,
      };
    } catch (error) {
      console.error("Error starting scenario:", error);
      throw error;
    }
  }

  /**
   * Get current step for user's active scenario
   * @param {string} userId - User ID from auth
   * @param {string} scenarioId - Scenario ID
   * @param {string} stepId - Step ID to retrieve
   * @returns {Object} Step details and progress
   */
  async getStep(userId, scenarioId, stepId) {
    try {
      // Get user's progress
      const { data: progress, error: progressError } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", userId)
        .eq("scenario_id", scenarioId)
        .single();

      if (progressError || !progress) {
        throw new Error("Progress not found. Start the scenario first.");
      }

      // Check if scenario is completed or failed
      if (progress.completed) {
        throw new Error("Scenario already completed");
      }

      if (progress.failed) {
        throw new Error("Scenario already failed");
      }

      // Get the requested step
      const { data: step, error: stepError } = await supabase
        .from("steps")
        .select("*")
        .eq("id", stepId)
        .eq("scenario_id", scenarioId)
        .single();

      if (stepError || !step) {
        throw new Error("Step not found");
      }

      // Verify this is the current step
      if (progress.current_step_id !== stepId) {
        throw new Error("This is not the current step");
      }

      return {
        success: true,
        step,
        progress,
      };
    } catch (error) {
      console.error("Error getting step:", error);
      throw error;
    }
  }
}

export default new DecisionService();
