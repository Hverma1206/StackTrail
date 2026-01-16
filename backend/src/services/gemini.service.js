import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini API
 */
class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found in environment variables");
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  }

  /**
   * Construct a detailed prompt for post-scenario analysis
   * @param {Object} scenario - Scenario details
   * @param {Object} progress - User progress data
   * @returns {string} Formatted prompt
   */
  constructAnalysisPrompt(scenario, progress) {
    const decisions = progress.decisions || [];
    const { score, bad_decision_count, completed, failed } = progress;

    const outcomeStatus = completed ? "COMPLETED" : failed ? "FAILED" : "INCOMPLETE";
    
    // Handle case where there are no decisions (edge case)
    if (decisions.length === 0) {
      return `You are a Staff-level Software Engineer providing mentorship feedback on an incident response simulation.

**Scenario Details:**
- Title: ${scenario.title}
- Role: ${scenario.role}
- Difficulty: ${scenario.difficulty}
- Description: ${scenario.description}

**User Performance:**
- Final Outcome: ${outcomeStatus}
- Final Score: ${score}
- Poor Decisions Made: ${bad_decision_count}
- Total Decisions: 0

**Note:** The scenario ended without any recorded decisions. This is unusual.

**Your Task:**
Provide brief feedback indicating that no decisions were recorded, and suggest the user retry the scenario properly.

**Response Format:**
Provide your analysis in valid JSON format with the following structure:
{
  "summary": "No decisions were recorded for this scenario. Please retry to get proper feedback.",
  "strengths": ["Completed the scenario"],
  "mistakes": ["No decision history available"],
  "recommendations": ["Retry the scenario to get proper analysis", "Ensure all decisions are being saved correctly"],
  "seniorPerspective": "In real incidents, documentation and decision tracking is critical. Always ensure your actions are properly recorded."
}

Provide ONLY the JSON response, no additional text.`;
    }
    
    const decisionsSummary = decisions.map((decision, index) => {
      return `
Decision ${index + 1}:
- Context: ${decision.stepContext || 'No context available'}
- Chosen Option: ${decision.optionText || 'No option text available'}
- XP Impact: ${decision.xpChange > 0 ? '+' : ''}${decision.xpChange}
`;
    }).join('\n');

    const prompt = `You are a Staff-level Software Engineer providing mentorship feedback on an incident response simulation.

**Scenario Details:**
- Title: ${scenario.title}
- Role: ${scenario.role}
- Difficulty: ${scenario.difficulty}
- Description: ${scenario.description}

**User Performance:**
- Final Outcome: ${outcomeStatus}
- Final Score: ${score}
- Poor Decisions Made: ${bad_decision_count}
- Total Decisions: ${decisions.length}

**Decision Sequence:**
${decisionsSummary}

**Your Task:**
As a senior engineering mentor, analyze this decision sequence from a real-world engineering perspective. Focus on:

1. What this person did well
2. Where they made mistakes or took unnecessary risks
3. How a senior engineer would have approached these situations differently
4. Concrete recommendations for improvement

**Important Guidelines:**
- Use a calm, professional tone
- Focus on learning and growth, not scoring
- Provide real-world engineering context
- Avoid mentioning XP, points, or game mechanics
- Be constructive and actionable

**Response Format:**
Provide your analysis in valid JSON format with the following structure:
{
  "summary": "2-3 sentence high-level assessment of performance",
  "strengths": ["Array of 2-4 specific positive behaviors or good decisions"],
  "mistakes": ["Array of 2-4 risky or ineffective decisions with brief explanations"],
  "recommendations": ["Array of 3-5 concrete, actionable improvements"],
  "seniorPerspective": "A paragraph describing how an experienced staff engineer would approach this type of incident, including key principles and practices"
}

Provide ONLY the JSON response, no additional text.`;

    return prompt;
  }

  /**
   * Generate post-scenario analysis using Gemini
   * @param {Object} scenario - Scenario details
   * @param {Object} progress - User progress data
   * @returns {Object} Structured analysis response
   */
  async generateAnalysis(scenario, progress) {
    try {
      const prompt = this.constructAnalysisPrompt(scenario, progress);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      // Remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      const analysis = JSON.parse(cleanedText);
      
      // Validate response structure
      if (!analysis.summary || !analysis.strengths || !analysis.mistakes || 
          !analysis.recommendations || !analysis.seniorPerspective) {
        throw new Error("Invalid analysis structure returned from AI");
      }
      
      return {
        success: true,
        analysis
      };
    } catch (error) {
      console.error("Error generating analysis:", error);
      throw new Error(`Failed to generate AI analysis: ${error.message}`);
    }
  }
}

export default new GeminiService();
