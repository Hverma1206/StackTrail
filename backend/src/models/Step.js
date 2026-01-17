import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  xpChange: {
    type: Number,
    required: true,
  },
  nextStepId: {
    type: String,
    default: null,
  },
});

const stepSchema = new mongoose.Schema(
  {
    scenario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scenario",
      required: true,
    },
    context: {
      type: String,
      required: true,
    },
    options: [optionSchema],
    is_root: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Step = mongoose.model("Step", stepSchema);

export default Step;
