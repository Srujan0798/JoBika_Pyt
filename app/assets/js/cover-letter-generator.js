/**
 * AI Cover Letter Generator for JoBika
 * Auto-generates personalized cover letters for job applications
 * Tailored for Indian job market
 */

class CoverLetterGenerator {
    constructor() {
        this.apiEndpoint = '/api/guest/generate-cover-letter';
    }

    /**
     * Generate cover letter for specific job
     * @param {Object} userProfile - User's profile and resume
     * @param {Object} job - Target job details
     * @returns {Promise<string>} Generated cover letter
     */
    async generateCoverLetter(userProfile, job, tone = 'professional') {
        try {
            // Try AI generation first
            if (window.JoBikaAPI && window.JoBikaAPI.generateAICoverLetter) {
                const result = await window.JoBikaAPI.generateAICoverLetter(userProfile, job, {
                    name: job.company,
                    about: job.about || 'A leading company.',
                    recentNews: job.recentNews || ''
                });

                if (result && result.cover_letter) {
                    return result.cover_letter;
                }
            }
        } catch (error) {
            console.error('Using fallback cover letter generation:', error);
        }

        // Fallback to template-based generation
        return this.generateFromTemplate(userProfile, job);
    }

    /**
     * Template-based cover letter generation (fallback)
     */
    generateFromTemplate(profile, job) {
        const name = profile.name || 'Candidate';
        const email = profile.email || '';
        const phone = profile.phone || '';
        const experience = profile.yearsOfExperience || 0;
        const skills = profile.skills || [];
        const currentCompany = profile.currentCompany || '';

        // Get matching skills
        const matchingSkills = this.findMatchingSkills(skills, job.requiredSkills || job.skills || []);
        const topSkills = matchingSkills.slice(0, 3).join(', ');

        // Format date in Indian format
        const date = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        return `${name}
${email}
${phone}

${date}

Hiring Manager
${job.company}
${job.location}

Subject: Application for ${job.title}

Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With ${experience} years of professional experience${currentCompany ? ` at ${currentCompany}` : ''} and expertise in ${topSkills}, I am confident in my ability to contribute effectively to your team.

${this.generateBodyParagraphs(profile, job)}

I am particularly drawn to ${job.company} because of its${this.getCompanyHighlight(job)}. I believe my background in ${topSkills} aligns well with the requirements outlined in your job posting.

${this.generateCTCParagraph(profile)}

I am excited about the opportunity to bring my skills and experience to ${job.company}. I am available for an interview at your earliest convenience and can ${this.getNoticePeriod(profile)}.

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team.

Sincerely,
${name}

Attachments:
- Resume
${profile.portfolio ? '- Portfolio/Work Samples' : ''}`;
    }

    /**
     * Generate body paragraphs based on job and profile
     */
    generateBodyParagraphs(profile, job) {
        const paragraphs = [];

        // Technical skills paragraph
        if (job.requiredSkills && job.requiredSkills.length > 0) {
            const matchingSkills = this.findMatchingSkills(
                profile.skills || [],
                job.requiredSkills
            );

            if (matchingSkills.length > 0) {
                paragraphs.push(
                    `In my current role, I have gained extensive experience with ${matchingSkills.join(', ')}. ` +
                    `I have successfully delivered multiple projects utilizing these technologies, demonstrating my ability to ` +
                    `adapt to new challenges and contribute to team success.`
                );
            }
        }

        // Experience paragraph
        if (profile.recentProjects && profile.recentProjects.length > 0) {
            const proj = profile.recentProjects[0];
            paragraphs.push(
                `Recently, I ${proj.description || 'worked on a significant project'} which resulted in ` +
                `${proj.impact || 'measurable improvements in performance and user satisfaction'}. ` +
                `This experience has equipped me with strong problem-solving skills and attention to detail.`
            );
        } else {
            paragraphs.push(
                `Throughout my career, I have consistently delivered high-quality work while collaborating ` +
                `effectively with cross-functional teams. My approach combines technical expertise with ` +
                `strong communication skills to ensure project success.`
            );
        }

        return paragraphs.join('\n\n');
    }

    /**
     * Generate CTC-related paragraph (for Indian market)
     */
    generateCTCParagraph(profile) {
        if (profile.expectedCTC && profile.currentCTC) {
            return `Regarding compensation, my current CTC is ₹${profile.currentCTC} LPA, and I am looking for opportunities in the range of ₹${profile.expectedCTC} LPA, negotiable based on the overall package and growth prospects.`;
        }

        if (profile.expectedCTC) {
            return `I am seeking opportunities with a compensation package around ₹${profile.expectedCTC} LPA.`;
        }

        return `I am open to discussing compensation based on the role's requirements and growth opportunities.`;
    }

    /**
     * Get notice period statement
     */
    getNoticePeriod(profile) {
        const period = profile.noticePeriod;

        if (period === 'immediate') {
            return 'join immediately or within 15 days';
        } else if (period === 'serving') {
            return 'join as soon as I complete my current notice period';
        } else if (period) {
            return `join after serving my ${period}-day notice period`;
        }

        return 'discuss the joining timeline based on mutual convenience';
    }

    /**
     * Get company highlight based on type/industry
     */
    getCompanyHighlight(job) {
        const highlights = {
            'startup': ' innovative approach and dynamic work culture',
            'mnc': ' global presence and commitment to excellence',
            'product': ' focus on building impactful products',
            'fintech': ' mission to revolutionize financial services in India',
            'ecommerce': ' leadership in e-commerce and customer satisfaction',
            'technology': ' cutting-edge technology and innovation'
        };

        const companyType = job.companySize || 'technology';
        return highlights[companyType] || highlights['technology'];
    }

    /**
     * Find matching skills between user and job
     */
    findMatchingSkills(userSkills, jobSkills) {
        if (!userSkills || !jobSkills) return [];

        const userList = Array.isArray(userSkills) ? userSkills :
            userSkills.split(',').map(s => s.trim());
        const jobList = Array.isArray(jobSkills) ? jobSkills :
            jobSkills.split(',').map(s => s.trim());

        return userList.filter(skill =>
            jobList.some(jSkill =>
                skill.toLowerCase().includes(jSkill.toLowerCase()) ||
                jSkill.toLowerCase().includes(skill.toLowerCase())
            )
        );
    }

    /**
     * Generate cover letter as downloadable file
     */
    downloadCoverLetter(coverLetter, jobTitle) {
        const blob = new Blob([coverLetter], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CoverLetter_${jobTitle.replace(/\s+/g, '_')}_${Date.now()}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    /**
     * Copy cover letter to clipboard
     */
    async copyToClipboard(coverLetter) {
        try {
            await navigator.clipboard.writeText(coverLetter);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }
}

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoverLetterGenerator;
} else {
    window.CoverLetterGenerator = CoverLetterGenerator;
}
