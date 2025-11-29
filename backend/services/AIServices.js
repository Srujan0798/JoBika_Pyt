
class AIServices {
    constructor(apiKey) {
        this.openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    }

    // --- Cover Letter Generation ---

    async generateCoverLetter(userProfile, jobDescription, companyInfo) {
        const prompt = `
You are an expert cover letter writer for the Indian job market.

Generate a professional cover letter for this application:

CANDIDATE PROFILE:
Name: ${userProfile.name}
Current Role: ${userProfile.currentRole} at ${userProfile.currentCompany}
Total Experience: ${userProfile.totalYears} years
Key Skills: ${userProfile.skills.join(', ')}
Notable Achievements:
${userProfile.achievements ? userProfile.achievements.map(a => `- ${a}`).join('\n') : '- Consistent top performer'}

JOB DETAILS:
Company: ${companyInfo.name}
Position: ${jobDescription.title}
Job Description: ${jobDescription.full}

COMPANY CONTEXT:
${companyInfo.about || 'A leading company in its sector.'}
Recent News: ${companyInfo.recentNews || 'Growing presence in the market.'}

REQUIREMENTS:
1. Professional yet warm tone suitable for Indian corporate culture
2. Address specific requirements from the JD
3. Highlight 2-3 relevant achievements with quantified impact
4. Show genuine interest in the company (reference recent news/products)
5. Keep under 300 words
6. Follow this structure:
   - Opening: Express interest + how you learned about the role
   - Body: Why you're a great fit (2-3 key qualifications)
   - Company fit: Why this company specifically
   - Closing: Call to action + thank you
7. Use Indian English conventions
8. Mention notice period if immediate joiner or < 30 days

Do NOT:
- Use overly flowery language
- Make generic statements
- Mention salary expectations
- Use American spellings (favor -> favour, etc.)
`;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            });

            let coverLetter = response.choices[0].message.content;

            // Post-processing
            coverLetter = coverLetter
                .replace(/\[Your Name\]/g, userProfile.name)
                .replace(/\[Date\]/g, new Date().toLocaleDateString('en-IN'))
                .replace(/\[Company Name\]/g, companyInfo.name);

            return coverLetter;
        } catch (error) {
            console.error('Error generating cover letter:', error);
            throw error;
        }
    }

    async generateCoverLetterVariations(userProfile, jobDescription, companyInfo) {
        const variations = [];

        const tones = [
            'enthusiastic and energetic',
            'professional and formal',
            'confident and results-driven'
        ];

        for (const tone of tones) {
            // Modify job description to include tone preference for the prompt
            const modifiedJD = { ...jobDescription, full: jobDescription.full + `\n\nPREFERRED TONE: ${tone}` };
            const letter = await this.generateCoverLetter(userProfile, modifiedJD, companyInfo);
            variations.push({ tone, content: letter });
        }

        return variations;
    }

    // --- Interview Preparation ---

    async generateInterviewPrep(jobDescription, companyName, userProfile) {
        try {
            const [commonQuestions, starExamples, salaryScript] = await Promise.all([
                this.generateCommonQuestions(jobDescription.full, userProfile),
                this.generateSTARExamples(userProfile.experience || []),
                this.generateSalaryScript(userProfile, jobDescription)
            ]);

            return {
                commonQuestions,
                // companySpecific: await this.generateCompanyQuestions(companyName), // Placeholder
                // technicalQuestions: await this.generateTechnicalQuestions(jobDescription.skills), // Placeholder
                starExamples,
                salaryNegotiation: salaryScript,
                // companyResearch: await this.companyResearchBrief(companyName) // Placeholder
            };
        } catch (error) {
            console.error('Error generating interview prep:', error);
            throw error;
        }
    }

    async generateCommonQuestions(jobDescriptionText, userProfile) {
        const prompt = `
Generate 10 most likely interview questions for this role.

Job Description:
${jobDescriptionText}

Candidate Background:
${JSON.stringify(userProfile)}

For each question, provide:
1. The question
2. Why it's being asked
3. A tailored answer using the candidate's experience
4. Key points to emphasize

Focus on Indian interview context (notice period, CTC discussions, etc.)
Return as JSON object with key "questions" containing an array of objects.
`;

        const response = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    }

    async generateSTARExamples(experiences) {
        const examples = [];

        for (const exp of experiences) {
            const prompt = `
Convert this work experience into a STAR format story:

${JSON.stringify(exp)}

Generate a compelling STAR story that showcases:
- Leadership
- Problem-solving
- Impact

Format:
Situation: (2 sentences)
Task: (1 sentence)
Action: (3-4 bullet points)
Result: (Quantified outcome)
`;

            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }]
            });

            examples.push({
                role: exp.role,
                company: exp.company,
                story: response.choices[0].message.content
            });
        }

        return examples;
    }

    async generateSalaryScript(userProfile, jobDescription) {
        // In a real app, fetchSalaryData would call an external API or DB
        // Here we mock it or use the user's provided data
        const marketMin = userProfile.expectedCTC * 0.9;
        const marketMax = userProfile.expectedCTC * 1.3;

        const script = `
SALARY NEGOTIATION GUIDE

Your Current CTC: ₹${(userProfile.currentCTC || 0).toLocaleString('en-IN')}
Market Range for ${jobDescription.title} in ${userProfile.location || 'India'}: 
₹${marketMin.toLocaleString('en-IN')} - ₹${marketMax.toLocaleString('en-IN')}

Your Target Range: ₹${(userProfile.expectedCTC || 0).toLocaleString('en-IN')} - ₹${((userProfile.expectedCTC || 0) * 1.15).toLocaleString('en-IN')}

WHEN THEY ASK ABOUT CURRENT CTC:
"My current CTC is ₹${(userProfile.currentCTC || 0).toLocaleString('en-IN')}. However, I'm looking for a role that values my [specific skills], and I've been targeting positions in the range of ₹${(userProfile.expectedCTC || 0).toLocaleString('en-IN')} based on my research of market rates for similar roles."

WHEN THEY ASK YOUR EXPECTATIONS:
"Based on my ${userProfile.totalYears || 0} years of experience and the value I can bring to [specific contribution to company], I'm looking for a compensation in the range of ₹${(userProfile.expectedCTC || 0).toLocaleString('en-IN')} to ₹${((userProfile.expectedCTC || 0) * 1.15).toLocaleString('en-IN')}. However, I'm flexible and would love to understand the complete benefits package."

WHEN THEY OFFER LOWER THAN EXPECTED:
"Thank you for the offer. I'm very excited about the opportunity. However, I was expecting something closer to ₹${(userProfile.expectedCTC || 0).toLocaleString('en-IN')} given [list 2-3 key qualifications]. Is there flexibility on the base salary or other components like variable pay, ESOPs, or joining bonus?"

RED FLAGS TO WATCH:
- Asking for current payslips upfront (you can decline politely)
- Pressure to reveal salary before discussing role
- Offers significantly below market (>20% lower)
`;

        return script;
    }
}


module.exports = AIServices;
