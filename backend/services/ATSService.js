const GeminiService = require('./GeminiService');

class ATSService {
    constructor(apiKey) {
        this.gemini = new GeminiService(apiKey);
    }

    async calculateATSScore(resumeText, jobDescription) {
        const analysis = {
            overallScore: 0,
            breakdown: {},
            issues: [],
            recommendations: []
        };

        // 1. Keyword Matching (40%)
        const keywords = this.extractKeywords(jobDescription);
        const matchedKeywords = keywords.filter(kw =>
            resumeText.toLowerCase().includes(kw.toLowerCase())
        );

        analysis.breakdown.keywords = {
            score: (matchedKeywords.length / Math.max(keywords.length, 1)) * 40,
            matched: matchedKeywords,
            missing: keywords.filter(kw => !matchedKeywords.includes(kw))
        };

        if (analysis.breakdown.keywords.missing.length > 0) {
            analysis.issues.push(`Missing ${analysis.breakdown.keywords.missing.length} key terms`);
            analysis.recommendations.push(`Add: ${analysis.breakdown.keywords.missing.slice(0, 5).join(', ')}`);
        }

        // 2. Formatting (20%)
        const formattingChecks = {
            hasStandardSections: this.checkStandardSections(resumeText),
            hasQuantifiedAchievements: this.checkQuantifications(resumeText),
            appropriateLength: resumeText.length >= 500 && resumeText.length <= 8000
        };

        const formattingScore = Object.values(formattingChecks).filter(Boolean).length /
            Object.keys(formattingChecks).length * 20;

        analysis.breakdown.formatting = {
            score: formattingScore,
            checks: formattingChecks
        };

        if (!formattingChecks.hasStandardSections) {
            analysis.issues.push('Missing standard sections');
            analysis.recommendations.push('Add Skills, Experience, Education sections');
        }

        // 3. Experience Relevance (25%)
        const experienceScore = await this.analyzeExperienceRelevance(resumeText, jobDescription);
        analysis.breakdown.experience = experienceScore;

        // 4. Skills Match (15%)
        const requiredSkills = this.extractSkills(jobDescription);
        const userSkills = this.extractSkills(resumeText);
        const skillsMatch = requiredSkills.filter(skill =>
            userSkills.some(us => us.toLowerCase() === skill.toLowerCase())
        );

        analysis.breakdown.skills = {
            score: (skillsMatch.length / Math.max(requiredSkills.length, 1)) * 15,
            matched: skillsMatch,
            missing: requiredSkills.filter(rs => !skillsMatch.includes(rs))
        };

        // Calculate overall score
        analysis.overallScore = Math.round(
            analysis.breakdown.keywords.score +
            analysis.breakdown.formatting.score +
            analysis.breakdown.experience.score +
            analysis.breakdown.skills.score
        );

        // Grade
        if (analysis.overallScore >= 80) analysis.grade = 'Excellent';
        else if (analysis.overallScore >= 60) analysis.grade = 'Good';
        else if (analysis.overallScore >= 40) analysis.grade = 'Fair';
        else analysis.grade = 'Poor';

        return analysis;
    }

    extractKeywords(text) {
        // Simple mock extraction logic
        const commonKeywords = ['javascript', 'react', 'node.js', 'aws', 'python', 'java', 'sql', 'agile', 'communication', 'leadership'];
        return commonKeywords.filter(kw => text.toLowerCase().includes(kw));
    }

    extractSkills(text) {
        // Mock skill extraction
        const skills = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'AWS', 'Docker'];
        return skills.filter(s => text.toLowerCase().includes(s.toLowerCase()));
    }

    checkStandardSections(text) {
        const sections = ['experience', 'education', 'skills', 'summary'];
        return sections.every(section => new RegExp(section, 'i').test(text));
    }

    checkQuantifications(text) {
        const patterns = [/\d+%/, /\d+\s+(users|customers|employees|projects)/i, /increased|improved|reduced|grew/i];
        return patterns.some(pattern => pattern.test(text));
    }

    async analyzeExperienceRelevance(resumeText, jobDescription) {
        try {
            const prompt = `
            Compare the candidate's experience with job requirements.
            Resume: ${resumeText.substring(0, 1000)}...
            Job: ${jobDescription.substring(0, 500)}...
            Rate relevance 0-25. Return just the number.
            `;

            const responseText = await this.gemini.chat(prompt);
            return { score: parseInt(responseText) || 15 };
        } catch (error) {
            console.error('ATS Experience Analysis Error:', error);
            return { score: 15 }; // Fallback
        }
    }
}

module.exports = ATSService;
