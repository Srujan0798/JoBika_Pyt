const puppeteer = require('puppeteer');
const db = require('../database/db');

/**
 * ApplicationFormFiller - The AUTO-APPLY engine
 * This is what makes JoBika special - automatically fills and submits job applications
 */
class ApplicationFormFiller {
    constructor() {
        this.browser = null;
        this.db = db;
    }

    async init() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: false, // Show browser for user to see
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * AUTO-APPLY to a job
     * This is the main function that does the magic
     */
    async autoApplyToJob(jobUrl, userData, tailoredResume, supervised = true) {
        try {
            await this.init();
            const page = await this.browser.newPage();

            // Set user agent
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

            console.log(`🤖 Navigating to: ${jobUrl}`);
            await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // Wait for page to load
            await page.waitForTimeout(2000);

            // Detect form fields
            const formFields = await this.detectFormFields(page);
            console.log(`📝 Detected ${Object.keys(formFields).length} form fields`);

            // Fill the form
            const fillResult = await this.fillApplicationForm(page, formFields, userData, tailoredResume);

            if (supervised) {
                // Take screenshot for user review
                const screenshot = await page.screenshot({ fullPage: true });
                const screenshotPath = `/tmp/application_preview_${Date.now()}.png`;
                require('fs').writeFileSync(screenshotPath, screenshot);

                console.log(`📸 Screenshot saved: ${screenshotPath}`);
                console.log(`⏸️  PAUSED - Waiting for user approval...`);

                return {
                    status: 'awaiting_approval',
                    screenshot: screenshotPath,
                    formData: fillResult,
                    page: page // Keep page open for user to review
                };
            } else {
                // Auto-submit
                const submitResult = await this.submitApplication(page);
                await page.close();

                return {
                    status: submitResult.success ? 'submitted' : 'failed',
                    confirmationId: submitResult.confirmationId,
                    message: submitResult.message
                };
            }
        } catch (error) {
            console.error('Auto-apply error:', error);
            throw error;
        }
    }

    /**
     * Detect all form fields on the page
     */
    async detectFormFields(page) {
        return await page.evaluate(() => {
            const fields = {};

            // Find all inputs, selects, textareas
            const inputs = document.querySelectorAll('input, select, textarea');

            inputs.forEach((input, index) => {
                const fieldInfo = {
                    type: input.type || input.tagName.toLowerCase(),
                    name: input.name,
                    id: input.id,
                    placeholder: input.placeholder,
                    required: input.required,
                    label: null
                };

                // Try to find associated label
                if (input.id) {
                    const label = document.querySelector(`label[for="${input.id}"]`);
                    if (label) fieldInfo.label = label.innerText;
                }

                // Use name, id, or index as key
                const key = input.name || input.id || `field_${index}`;
                fields[key] = fieldInfo;
            });

            return fields;
        });
    }

    /**
     * Intelligently fill the application form
     */
    async fillApplicationForm(page, formFields, userData, tailoredResume) {
        const filledFields = {};

        for (const [key, field] of Object.entries(formFields)) {
            const value = this.mapFieldToUserData(field, userData, tailoredResume);

            if (value && field.type !== 'file') {
                try {
                    const selector = field.id ? `#${field.id}` : `[name="${field.name}"]`;

                    if (field.type === 'select') {
                        await page.select(selector, value);
                    } else {
                        await page.type(selector, String(value));
                    }

                    filledFields[key] = value;
                    console.log(`✅ Filled ${field.label || key}: ${value}`);
                } catch (error) {
                    console.log(`⚠️  Failed to fill ${key}:`, error.message);
                }
            } else if (field.type === 'file' && value) {
                // Upload resume
                try {
                    const selector = field.id ? `#${field.id}` : `[name="${field.name}"]`;
                    const input = await page.$(selector);
                    if (input) {
                        await input.uploadFile(value);
                        filledFields[key] = value;
                        console.log(`📎 Uploaded resume to ${key}`);
                    }
                } catch (error) {
                    console.log(`⚠️  Failed to upload resume:`, error.message);
                }
            }
        }

        return filledFields;
    }

    /**
     * Map form field to user data
     */
    mapFieldToUserData(field, userData, tailoredResume) {
        const identifier = `${field.label || ''} ${field.name || ''} ${field.placeholder || ''}`.toLowerCase();

        // Name fields
        if (identifier.includes('full name') || identifier.includes('your name')) {
            return userData.fullName || userData.name;
        }
        if (identifier.includes('first name')) {
            return userData.firstName;
        }
        if (identifier.includes('last name')) {
            return userData.lastName;
        }

        // Contact
        if (identifier.includes('email')) {
            return userData.email;
        }
        if (identifier.includes('phone') || identifier.includes('mobile')) {
            return userData.phone;
        }

        // Professional
        if (identifier.includes('current company')) {
            return userData.currentCompany;
        }
        if (identifier.includes('current role') || identifier.includes('current designation')) {
            return userData.currentRole;
        }
        if (identifier.includes('total experience') || identifier.includes('years of experience')) {
            return userData.totalYears?.toString();
        }
        if (identifier.includes('current ctc')) {
            return userData.currentCTC?.toString();
        }
        if (identifier.includes('expected ctc')) {
            return userData.expectedCTC?.toString();
        }
        if (identifier.includes('notice period')) {
            return userData.noticePeriod?.toString();
        }

        // Location
        if (identifier.includes('location') || identifier.includes('city')) {
            return userData.location;
        }

        // Resume upload
        if (field.type === 'file' && identifier.includes('resume')) {
            return tailoredResume.pdfPath;
        }

        // LinkedIn
        if (identifier.includes('linkedin')) {
            return userData.linkedinUrl;
        }

        // Cover letter
        if (identifier.includes('cover letter')) {
            return tailoredResume.coverLetter || 'I am excited to apply for this position...';
        }

        return null;
    }

    /**
     * Submit the application
     */
    async submitApplication(page) {
        try {
            // Find submit button
            const submitButton = await page.$(
                'button[type="submit"], input[type="submit"], button:contains("Submit"), button:contains("Apply")'
            );

            if (!submitButton) {
                throw new Error('Submit button not found');
            }

            console.log('🚀 Submitting application...');
            await submitButton.click();

            // Wait for confirmation
            await page.waitForNavigation({ timeout: 10000 }).catch(() => { });
            await page.waitForTimeout(2000);

            // Check for confirmation message
            const confirmationText = await page.evaluate(() => document.body.innerText);
            const isSuccess =
                confirmationText.toLowerCase().includes('application submitted') ||
                confirmationText.toLowerCase().includes('thank you') ||
                confirmationText.toLowerCase().includes('success');

            return {
                success: isSuccess,
                confirmationId: isSuccess ? this.extractApplicationId(confirmationText) : null,
                message: isSuccess ? 'Application submitted successfully' : 'Submission status unclear'
            };
        } catch (error) {
            console.error('Submit error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Extract application ID from confirmation message
     */
    extractApplicationId(text) {
        const match = text.match(/application.*?id.*?:?\s*([A-Z0-9-]+)/i);
        return match ? match[1] : `APP-${Date.now()}`;
    }

    /**
     * Batch auto-apply to multiple jobs
     * The core of automated job hunting
     */
    async batchAutoApply(userId, jobIds, supervised = false, dailyLimit = 20) {
        const results = [];
        const user = this.db.getUserById(userId);

        let appliedToday = 0;

        for (const jobId of jobIds) {
            if (appliedToday >= dailyLimit) {
                console.log(`🛑 Daily limit reached (${dailyLimit} applications)`);
                break;
            }

            try {
                const job = await this.getJobDetails(jobId);
                const tailoredResume = await this.generateTailoredResume(user, job);

                const result = await this.autoApplyToJob(
                    job.url,
                    user,
                    tailoredResume,
                    supervised
                );

                results.push({
                    jobId,
                    company: job.company,
                    status: result.status,
                    appliedAt: new Date()
                });

                appliedToday++;

                // Delay between applications (to avoid rate limiting)
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                results.push({
                    jobId,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return {
            totalAttempted: results.length,
            successful: results.filter(r => r.status === 'submitted').length,
            failed: results.filter(r => r.status === 'failed').length,
            results
        };
    }

    async getJobDetails(jobId) {
        const job = this.db.searchJobs({ jobId });
        if (!job || job.length === 0) {
            throw new Error(`Job ${jobId} not found`);
        }
        return job[0];
    }

    async generateTailoredResume(user, job) {
        // This would call ResumeTailoringService
        // For now, placeholder
        return {
            pdfPath: `/tmp/resume_${user.id}_${job.id}.pdf`,
            coverLetter: 'Generated cover letter...'
        };
    }
}

module.exports = ApplicationFormFiller;
