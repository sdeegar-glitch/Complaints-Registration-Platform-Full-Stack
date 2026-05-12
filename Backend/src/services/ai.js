const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate a follow-up question for a complaint using Gemini AI.
 * @param {string} complaintText - The user's complaint text
 * @returns {Promise<string>} The AI-generated follow-up question
 */
async function generateFollowUpQuestion(complaintText) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `You are a complaints processing assistant. A user has submitted the following complaint:\n\n"${complaintText}"\n\nGenerate exactly one short, specific follow-up question that would help clarify the complaint or gather more information needed to resolve it. Return only the question text, nothing else.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text().trim();

  return text;
}

module.exports = { generateFollowUpQuestion };
