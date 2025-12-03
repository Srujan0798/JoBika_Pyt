const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * GeminiService - FREE AI service using Google's Gemini API
 * Perfect for JoBika - fast, free, and powerful!
 */
class GeminiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        console.log('🤖 GeminiService initialized with key:', apiKey ? (apiKey.substring(0, 5) + '...') : 'NULL');
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;
    }

    /**
     * Chat with Gemini AI
     */
    async chat(prompt, systemInstruction = null) {
        if (!this.model) {
            return this.getMockResponse(prompt);
        }

        try {
            const chatConfig = systemInstruction
                ? {
                    model: 'gemini-1.5-flash',
                    systemInstruction: systemInstruction
                }
                : { model: 'gemini-1.5-flash' };

            const model = this.genAI.getGenerativeModel(chatConfig);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error(`AI request failed: ${error.message} (Key: ${this.apiKey ? 'Present' : 'Missing'})`);
        }
    }

    /**
     * Generate JSON response (for structured data)
     */
    async generateJSON(prompt) {
        if (!this.model) {
            return this.getMockJSONResponse(prompt);
        }

        try {
            const result = await this.model.generateContent(
                prompt + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations."
            );
            const response = await result.response;
            let text = response.text();

            // Clean up response - remove markdown code blocks if present
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            return JSON.parse(text);
        } catch (error) {
            console.error('Gemini JSON generation error:', error);
            throw new Error(`AI JSON generation failed: ${error.message}`);
        }
    }

    /**
     * Chat with conversation history
     */
    async chatWithHistory(message, history = []) {
        if (!this.model) {
            return this.getMockResponse(message);
        }

        try {
            const chat = this.model.startChat({
                history: history.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.message || msg.content }]
                }))
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini chat error:', error);
            throw new Error(`Chat failed: ${error.message}`);
        }
    }

    /**
     * Mock response when API key not configured
     */
    getMockResponse(prompt) {
        const mockResponses = {
            'resume': 'This is a mock response. Add your FREE Gemini API key to get real AI-powered resume tailoring!',
            'interview': 'Mock interview preparation. Add Gemini API key for personalized prep!',
            'career': 'Mock career advice. Get real AI coaching with free Gemini API!',
            'default': 'This is a mock AI response. Add your FREE Gemini API key at https://aistudio.google.com/app/apikey to unlock real AI features!'
        };

        const key = Object.keys(mockResponses).find(k => prompt.toLowerCase().includes(k)) || 'default';
        return mockResponses[key];
    }

    /**
     * Mock JSON response
     */
    getMockJSONResponse(prompt) {
        if (prompt.includes('resume') || prompt.includes('tailor')) {
            return {
                summary: "Mock AI summary - Add Gemini API key for real customization",
                skills: ["JavaScript", "Python", "React"],
                experience: [{
                    company: "Example Corp",
                    role: "Software Engineer",
                    duration: "2020-Present",
                    highlights: ["Mock achievement 1", "Mock achievement 2"]
                }],
                education: [{
                    degree: "B.Tech Computer Science",
                    institution: "University Name",
                    year: "2020"
                }],
                projects: [],
                keywords: ["mock", "keyword"],
                atsScore: 75,
                isMock: true,
                message: "Add FREE Gemini API key for real AI tailoring!"
            };
        }

        return {
            message: "Mock JSON response",
            isMock: true
        };
    }

    /**
     * Check if service is configured
     */
    isConfigured() {
        return !!this.apiKey;
    }
}

module.exports = GeminiService;
