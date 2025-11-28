/**
 * AI Resume Customizer for JoBika
 * Tailors user resume for specific job descriptions
 * Integrates with backend AI endpoints
 */

class AIResumeCustomizer {
    constructor() {
        this.apiEndpoint = '/api/guest/customize-resume';
    }

    /**
     * Generate job-specific customized resume
     * @param {Object} userResume - Complete user resume data
     * @param {Object} job - Target job details
     * @returns {Promise<Object>} Customized resume
     */
    async customizeForJob(userResume, job) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resume: userResume,
                    jobDescription: job.description || job.title,
                    jobTitle: job.title,
                    requiredSkills: job.requiredSkills || job.skills
                })
            });

            if (!response.ok) {
                throw new Error('Resume customization failed');
            }

            const customizedResume = await response.json();
            return this.formatCustomizedResume(customizedResume, job);
        } catch (error) {
            console.error('AI Resume Customization Error:', error);
            // Fallback to manual optimization
            return this.fallbackCustomization(userResume, job);
        }
    }

    /**
     * Format customized resume with job-specific optimizations
     */
    formatCustomizedResume(aiResponse, job) {
        return {
            personalInfo: aiResponse.personalInfo || {},
            professionalSummary: aiResponse.professionalSummary || this.generateSummary(job),
            skills: this.reorderSkills(aiResponse.skills, job.requiredSkills),
            experience: this.highlightRelevantExperience(aiResponse.experience, job),
            education: aiResponse.education || [],
            certifications: aiResponse.certifications || [],
            projects: this.prioritizeProjects(aiResponse.projects, job),
            keywords: aiResponse.atsKeywords || this.extractKeywords(job),
            matchScore: aiResponse.matchScore || 0,
            optimizations: {
                skillsMatched: aiResponse.matchingSkills || [],
                experienceHighlighted: true,
                atsOptimized: true,
                quantifiedAchievements: true
            }
        };
    }

    /**
     * Fallback customization when AI is unavailable
     */
    fallbackCustomization(userResume, job) {
        return {
            personalInfo: userResume.personalInfo,
            professionalSummary: this.generateSummary(job),
            skills: this.reorderSkills(userResume.skills, job.requiredSkills || job.skills),
            experience: userResume.experience,
            education: userResume.education,
            projects: userResume.projects,
            keywords: this.extractKeywords(job),
            optimizations: {
                skillsMatched: this.findMatchingSkills(userResume.skills, job.skills),
                experienceHighlighted: false,
                atsOptimized: false,
                quantifiedAchievements: false
            }
        };
    }

    /**
     * Generate professional summary tailored to job
     */
    generateSummary(job) {
        const templates = {
            'software': `Experienced software professional with expertise in ${job.skills.slice(0, 3).join(', ')}. Proven track record of delivering scalable solutions for ${job.industry || 'technology'} sector.`,
            'product': `Results-driven ${job.title} with strong background in product development and stakeholder management. Expert in agile methodologies and data-driven decision making.`,
            'design': `Creative ${job.title} with expertise in user-centered design. Proficient in ${job.skills.slice(0, 2).join(' and ')}, with a passion for creating intuitive user experiences.`,
            'data': `Data-driven professional specializing in ${job.skills.slice(0, 3).join(', ')}. Strong analytical skills with experience in deriving actionable insights from complex datasets.`
        };

        const category = this.categorizeJob(job.title);
        return templates[category] || `Experienced ${job.title} seeking challenging opportunities in ${job.company}.`;
    }

    /**
     * Reorder skills to match job requirements
     */
    reorderSkills(userSkills, requiredSkills) {
        if (!userSkills || !requiredSkills) return userSkills || [];

        const skillsList = Array.isArray(userSkills) ? userSkills :
            userSkills.split(',').map(s => s.trim());

        const requiredList = Array.isArray(requiredSkills) ? requiredSkills :
            requiredSkills.split(',').map(s => s.trim());

        // Matching skills first
        const matching = skillsList.filter(skill =>
            requiredList.some(req =>
                skill.toLowerCase().includes(req.toLowerCase()) ||
                req.toLowerCase().includes(skill.toLowerCase())
            )
        );

        // Non-matching skills after
        const others = skillsList.filter(skill => !matching.includes(skill));

        return [...matching, ...others];
    }

    /**
     * Highlight relevant experience for job
     */
    highlightRelevantExperience(experience, job) {
        if (!experience) return [];

        return experience.map(exp => ({
            ...exp,
            relevanceScore: this.calculateExperienceRelevance(exp, job),
            highlightedPoints: this.extractRelevantPoints(exp, job)
        })).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Prioritize projects based on job match
     */
    prioritizeProjects(projects, job) {
        if (!projects) return [];

        return projects.map(proj => ({
            ...proj,
            relevanceScore: this.calculateProjectRelevance(proj, job)
        })).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Extract ATS keywords from job description
     */
    extractKeywords(job) {
        const description = job.description || job.title;
        const skills = job.requiredSkills || job.skills || [];

        const commonKeywords = [
            'team player', 'communication', 'problem solving',
            'leadership', 'agile', 'scrum', 'collaboration'
        ];

        const technicalSkills = Array.isArray(skills) ? skills :
            skills.split(',').map(s => s.trim());

        return [...new Set([...technicalSkills, ...commonKeywords])];
    }

    /**
     * Calculate relevance score for experience
     */
    calculateExperienceRelevance(experience, job) {
        let score = 0;

        const expSkills = (experience.skills || []).map(s => s.toLowerCase());
        const jobSkills = (job.requiredSkills || job.skills || [])
            .map(s => s.toLowerCase());

        jobSkills.forEach(skill => {
            if (expSkills.some(es => es.includes(skill) || skill.includes(es))) {
                score += 10;
            }
        });

        // Bonus for recent experience
        if (experience.current || experience.endDate === 'Present') {
            score += 20;
        }

        return score;
    }

    /**
     * Calculate project relevance
     */
    calculateProjectRelevance(project, job) {
        let score = 0;

        const projTech = (project.technologies || []).map(t => t.toLowerCase());
        const jobSkills = (job.requiredSkills || job.skills || [])
            .map(s => s.toLowerCase());

        jobSkills.forEach(skill => {
            if (projTech.some(tech => tech.includes(skill) || skill.includes(tech))) {
                score += 15;
            }
        });

        return score;
    }

    /**
     * Extract relevant bullet points from experience
     */
    extractRelevantPoints(experience, job) {
        if (!experience.responsibilities) return [];

        const jobSkills = (job.requiredSkills || job.skills || [])
            .map(s => s.toLowerCase());

        return experience.responsibilities.filter(point =>
            jobSkills.some(skill => point.toLowerCase().includes(skill))
        );
    }

    /**
     * Find matching skills between user and job
     */
    findMatchingSkills(userSkills, jobSkills) {
        if (!userSkills || !jobSkills) return [];

        const userList = Array.isArray(userSkills) ? userSkills :
            userSkills.split(',').map(s => s.trim().toLowerCase());

        const jobList = Array.isArray(jobSkills) ? jobSkills :
            jobSkills.split(',').map(s => s.trim().toLowerCase());

        return userList.filter(skill =>
            jobList.some(jSkill =>
                skill.includes(jSkill) || jSkill.includes(skill)
            )
        );
    }

    /**
     * Categorize job by type
     */
    categorizeJob(title) {
        const titleLower = title.toLowerCase();

        if (titleLower.includes('software') || titleLower.includes('developer') ||
            titleLower.includes('engineer')) {
            return 'software';
        }
        if (titleLower.includes('product') || titleLower.includes('manager')) {
            return 'product';
        }
        if (titleLower.includes('design') || titleLower.includes('ux') ||
            titleLower.includes('ui')) {
            return 'design';
        }
        if (titleLower.includes('data') || titleLower.includes('analyst') ||
            titleLower.includes('scientist')) {
            return 'data';
        }

        return 'general';
    }

    /**
     * Generate download link for customized resume
     */
    async downloadResume(customizedResume, format = 'pdf') {
        // This would call a backend endpoint to generate PDF/DOCX
        try {
            const response = await fetch('/api/resume/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume: customizedResume, format })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `resume_${Date.now()}.${format}`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Resume download failed:', error);
            alert('Download failed. Please try again.');
        }
    }
}

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIResumeCustomizer;
} else {
    window.AIResumeCustomizer = AIResumeCustomizer;
}
