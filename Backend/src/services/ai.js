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

/**
 * Generate a professional resolution response for a complaint.
 * @param {string} complaintText - The user's original complaint
 * @returns {Promise<string>} A well-composed resolution draft
 */
async function generateResolution(complaintText) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `You are an official administrator for a public complaints portal. A user has submitted this complaint:\n\n"${complaintText}"\n\nWrite a professional, empathetic, and clear resolution message. Acknowledge their concern, state that the matter has been reviewed, and provide a formal confirmation of resolution. Keep it concise but polite. Return only the message text.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

module.exports = { generateFollowUpQuestion, generateResolution };
