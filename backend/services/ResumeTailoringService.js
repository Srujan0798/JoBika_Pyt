const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ResumeTailoringService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.genAI = null;
        this.model = null;
        this.init();
    }

    init() {
        if (this.apiKey) {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
            console.log("✨ ResumeTailoringService: Gemini Pro initialized");
        } else {
            console.warn("⚠️ ResumeTailoringService: API Key missing. AI features disabled.");
        }
    }

    async tailorResumeForJob(userResume, jobDescription, jobDetails) {
        if (!this.model) {
            console.warn("Using mock tailoring due to missing AI model");
            return this.getMockTailoredResume(userResume, jobDetails);
        }

        const prompt = `
            You are an expert Resume Writer for the Indian job market.
            
            Target Role: ${jobDetails.title} at ${jobDetails.company}
            Job Description:
            ${jobDescription}
            
            Candidate Resume (JSON):
            ${JSON.stringify(userResume)}
            
            Task:
            Rewrite the candidate's resume to perfectly match the job description.
            1. **Summary**: Write a compelling 3-line summary highlighting experience relevant to the JD.
            2. **Skills**: Reorder and refine skills to match JD keywords. Add missing relevant skills if inferred from experience.
            3. **Experience**: Rewrite bullet points to emphasize impact and relevance to the JD. Use action verbs.
            4. **ATS Score**: Estimate an ATS match score (0-100).
            
            Output strictly in JSON format with this structure:
            {
                "summary": "...",
                "skills": ["..."],
                "experience": [{ "company": "...", "role": "...", "duration": "...", "highlights": ["..."] }],
                "education": [{ "degree": "...", "institution": "...", "year": "..." }],
                "projects": [{ "name": "...", "description": "...", "impact": "..." }],
                "atsScore": 85
            }
            Do not include markdown formatting like \`\`\`json.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const tailoredData = JSON.parse(cleanText);

            return {
                ...tailoredData,
                originalResumeId: userResume.id,
                targetJobId: jobDetails.id,
                tailoredAt: new Date().toISOString()
            };
        } catch (error) {
            console.error("Resume tailoring error:", error);
            return this.getMockTailoredResume(userResume, jobDetails);
        }
    }

    async generateResumePDF(resumeData, outputPath) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            // Colors
            const primaryColor = '#004E98'; // Deep Blue
            const secondaryColor = '#333333';

            // Header
            doc.fontSize(24).fillColor(primaryColor).font('Helvetica-Bold').text(resumeData.name || 'Candidate Name', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor(secondaryColor).font('Helvetica')
                .text(`${resumeData.email || ''} | ${resumeData.phone || ''} | ${resumeData.location || ''}`, { align: 'center' });
            doc.moveDown(0.5);

            // Divider
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E0E0E0').stroke();
            doc.moveDown(1);

            // Summary
            if (resumeData.summary) {
                doc.fontSize(14).fillColor(primaryColor).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
                doc.moveDown(0.3);
                doc.fontSize(10).fillColor(secondaryColor).font('Helvetica').text(resumeData.summary, { align: 'justify', lineGap: 2 });
                doc.moveDown(1);
            }

            // Skills
            if (resumeData.skills && resumeData.skills.length > 0) {
                doc.fontSize(14).fillColor(primaryColor).font('Helvetica-Bold').text('SKILLS');
                doc.moveDown(0.3);
                doc.fontSize(10).fillColor(secondaryColor).font('Helvetica').text(resumeData.skills.join(' • '), { lineGap: 2 });
                doc.moveDown(1);
            }

            // Experience
            if (resumeData.experience && resumeData.experience.length > 0) {
                doc.fontSize(14).fillColor(primaryColor).font('Helvetica-Bold').text('EXPERIENCE');
                doc.moveDown(0.5);

                resumeData.experience.forEach(exp => {
                    doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text(exp.role);
                    doc.fontSize(10).fillColor('#666666').font('Helvetica-Oblique').text(`${exp.company} | ${exp.duration}`);
                    doc.moveDown(0.3);

                    if (exp.highlights) {
                        exp.highlights.forEach(point => {
                            doc.fontSize(10).fillColor(secondaryColor).font('Helvetica').text(`• ${point}`, { indent: 15, lineGap: 2 });
                        });
                    }
                    doc.moveDown(0.8);
                });
            }

            // Education
            if (resumeData.education && resumeData.education.length > 0) {
                doc.fontSize(14).fillColor(primaryColor).font('Helvetica-Bold').text('EDUCATION');
                doc.moveDown(0.5);

                resumeData.education.forEach(edu => {
                    doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text(edu.degree);
                    doc.fontSize(10).fillColor('#666666').font('Helvetica').text(`${edu.institution} | ${edu.year}`);
                    doc.moveDown(0.5);
                });
            }

            doc.end();

            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        });
    }

    getMockTailoredResume(userResume, jobDetails) {
        return {
            name: userResume.name || "Candidate Name",
            email: userResume.email || "email@example.com",
            phone: userResume.phone || "9876543210",
            location: userResume.location || "India",
            summary: `Experienced professional tailored for ${jobDetails.title} at ${jobDetails.company}. (Mock Data)`,
            skills: [...(userResume.skills || []), "Tailored Skill 1", "Tailored Skill 2"],
            experience: userResume.experience || [],
            education: userResume.education || [],
            atsScore: 75
        };
    }
}

module.exports = ResumeTailoringService;
