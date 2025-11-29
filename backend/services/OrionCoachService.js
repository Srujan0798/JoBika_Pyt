const OpenAI = require('openai');

class OrionCoachService {
    constructor(apiKey) {
        this.openai = apiKey ? new OpenAI({ apiKey }) : null;
    }

    async chat(message, history = []) {
        if (!this.openai) {
            return this.getMockResponse(message);
        }

        try {
            const systemPrompt = `You are Orion, an expert AI Career Coach for the Indian job market. 
            Your goal is to help users find jobs, improve their resumes, and ace interviews.
            - Be encouraging, professional, and concise.
            - Provide specific advice for the Indian market (e.g., salary in LPA, Bangalore/Gurgaon tech scene).
            - If asked about salary, give ranges based on Indian standards.
            - If asked for a resume review, ask them to paste the content or upload it.`;

            const messages = [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: message }
            ];

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: messages,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI Error:', error);
            return "I'm having trouble connecting to my brain right now. Please try again later.";
        }
    }

    getMockResponse(message) {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('resume')) {
            return "I'd be happy to review your resume! Please upload it in the Resume Editor or paste the text here, and I'll analyze it for ATS compatibility and impact.";
        }
        if (lowerMsg.includes('interview')) {
            return "Let's practice! I'll act as the hiring manager. First question: Tell me about a challenging project you worked on recently.";
        }
        if (lowerMsg.includes('salary')) {
            return "Based on your profile and location (Bangalore), the market range for Senior SDE is ₹25-40 LPA. You should target ₹30 LPA given your React expertise.";
        }
        if (lowerMsg.includes('negotiat')) {
            return "When negotiating, focus on your value. Say: 'Based on my research and the value I bring with my [Skill] expertise, I was looking for a package closer to ₹[Amount] LPA.'";
        }
        return "That's a great question. To give you the best advice, could you tell me more about your target role and preferred location?";
    }
}

module.exports = OrionCoachService;
