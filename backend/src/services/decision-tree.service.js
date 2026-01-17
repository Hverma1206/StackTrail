import Scenario from "../models/Scenario.js";
import Step from "../models/Step.js";
import Progress from "../models/Progress.js";

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
    const scenario = await Scenario.findById(scenarioId);

    if (!scenario) {
      throw new Error("Scenario not found");
    }

    // Get root step
    const rootStep = await Step.findOne({
      scenario_id: scenarioId,
      is_root: true,
    });

    if (!rootStep) {
      throw new Error("Root step not found for this scenario");
    }

    // Create or reset progress
    const existingProgress = await Progress.findOne({
      user_id: userId,
      scenario_id: scenarioId,
    });

    let progress;

    if (existingProgress) {
      // Reset existing progress
      existingProgress.current_step_id = rootStep._id.toString();
      existingProgress.score = 0;
      existingProgress.decisions = [];
      existingProgress.completed = false;
      existingProgress.failed = false;
      existingProgress.bad_decision_count = 0;
      await existingProgress.save();
      progress = existingProgress;
    } else {
      // Create new progress
      progress = await Progress.create({
        user_id: userId,
        scenario_id: scenarioId,
        current_step_id: rootStep._id.toString(),
        score: 0,
        decisions: [],
        completed: false,
        failed: false,
        bad_decision_count: 0,
      });
    }

    return {
      progress,
      step: {
        id: rootStep._id.toString(),
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
    const progress = await Progress.findOne({
      user_id: userId,
      scenario_id: scenarioId,
    });

    if (!progress) {
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
    const step = await Step.findById(stepId);

    if (!step || step.scenario_id.toString() !== scenarioId) {
      throw new Error("Step not found");
    }

    return {
      step: {
        id: step._id.toString(),
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
    const progress = await Progress.findOne({
      user_id: userId,
      scenario_id: scenarioId,
    });

    if (!progress) {
      throw new Error("No active progress found");
    }

    if (progress.completed || progress.failed) {
      throw new Error("Scenario already completed or failed");
    }

    if (progress.current_step_id !== stepId) {
      throw new Error("This is not the current step");
    }

    // Get current step
    const currentStep = await Step.findById(stepId);

    if (!currentStep) {
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
      progress.score = newTotalXp;
      progress.bad_decision_count = newBadDecisionCount;
      progress.decisions = newDecisions;
      progress.failed = true;
      await progress.save();

      return {
        isComplete: true,
        isFailed: true,
        reason: "Too many bad decisions",
        summary: this.generateSummary(progress),
      };
    }

    const nextStepId = selectedOption.nextStepId;

    // Check if scenario is complete (no next step)
    if (!nextStepId) {
      progress.score = newTotalXp;
      progress.bad_decision_count = newBadDecisionCount;
      progress.decisions = newDecisions;
      progress.completed = true;
      progress.current_step_id = null;
      await progress.save();

      return {
        isComplete: true,
        isFailed: false,
        summary: this.generateSummary(progress),
      };
    }

    // Get next step
    const nextStep = await Step.findById(nextStepId);

    if (!nextStep) {
      throw new Error("Next step not found");
    }

    // Update progress with next step
    progress.current_step_id = nextStepId;
    progress.score = newTotalXp;
    progress.bad_decision_count = newBadDecisionCount;
    progress.decisions = newDecisions;
    await progress.save();

    return {
      isComplete: false,
      xpGained: xpChange,
      decisionQuality: this.evaluateDecision(xpChange),
      nextStep: {
        id: nextStep._id.toString(),
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
    const progress = await Progress.findOne({
      user_id: userId,
      scenario_id: scenarioId,
    }).populate("scenario_id");

    if (!progress) {
      throw new Error("Progress not found");
    }

    return {
      scenario: {
        title: progress.scenario_id.title,
        description: progress.scenario_id.description,
        role: progress.scenario_id.role,
        difficulty: progress.scenario_id.difficulty,
      },
      summary: this.generateSummary(progress),
    };
  }
}

export default new DecisionTreeService();
