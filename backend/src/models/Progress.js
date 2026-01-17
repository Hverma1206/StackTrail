import mongoose from "mongoose";

const decisionSchema = new mongoose.Schema({
  stepId: {
    type: String,
    required: true,
  },
  optionId: {
    type: String,
    required: true,
  },
  xpChange: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const progressSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    scenario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scenario",
      required: true,
      index: true,
    },
    current_step_id: {
      type: String,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    decisions: [decisionSchema],
    completed: {
      type: Boolean,
      default: false,
    },
    failed: {
      type: Boolean,
      default: false,
    },
    bad_decision_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding user progress on specific scenario
progressSchema.index({ user_id: 1, scenario_id: 1 });

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;
