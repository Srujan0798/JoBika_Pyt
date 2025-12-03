const GeminiService = require('./GeminiService');

class OrionCoachService {
    constructor(apiKey) {
        this.gemini = new GeminiService(apiKey);

        if (!apiKey) {
            console.warn('⚠️  Gemini API key not configured. Orion will use mock responses. Get FREE key: https://aistudio.google.com/app/apikey');
        }
    }

    async chatWithOrion(userMessage, chatHistory = []) {
        if (!this.gemini.isConfigured()) {
            return this.getMockResponse(userMessage);
        }

        try {
            const systemInstruction = `You are Orion, an expert AI career coach specializing in the Indian job market. 
You help with: resume improvement, interview prep, salary negotiation, career guidance, CTC negotiations, notice periods.
Be professional, encouraging, and provide actionable advice specific to India.
Use Indian English and understand concepts like CTC, LPA, notice period, immediate joiner, etc.`;

            return await this.gemini.chatWithHistory(userMessage, chatHistory);
        } catch (error) {
            console.error('Orion chat error:', error);

            // Fallback to mock if API fails (e.g. network timeout)
            console.warn('⚠️ Gemini API failed. Falling back to mock response.');
            const mock = this.getMockResponse(userMessage);
            return mock + " [DEBUG ERROR: " + error.message + "]";
        }
    }

    async generateResumeReview(resumeText) {
        if (!this.gemini.isConfigured()) {
            return { score: 75, feedback: "Mock feedback - add Gemini API key for real review!" };
        }

        const prompt = `Review this resume and provide a score and detailed feedback for the Indian job market:

${resumeText}

Provide a JSON response with:
{
  "score": 0-100,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "atsScore": 0-100,
  "recommendations": ["recommendation1", "recommendation2"]
}`;

        try {
            return await this.gemini.generateJSON(prompt);
        } catch (error) {
            console.error('Resume review error:', error);
            return { score: 75, feedback: "Error generating review", error: error.message };
        }
    }

    getMockResponse(message) {
        const responses = {
            resume: "I can help you improve your resume! However, I need a Gemini API key for detailed analysis. Get your FREE key at https://aistudio.google.com/app/apikey",
            interview: "For interview prep, I'd need access to AI capabilities. Please add your free Gemini API key!",
            salary: "Salary negotiation is important! Add Gemini API key for personalized advice.",
            default: "I'm Orion, your AI career coach! Add your FREE Gemini API key to unlock real AI-powered guidance. Visit: https://aistudio.google.com/app/apikey"
        };

        const key = Object.keys(responses).find(k => message.toLowerCase().includes(k)) || 'default';
        return responses[key];
    }
}

module.exports = OrionCoachService;
