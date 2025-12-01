const puppeteer = require('puppeteer');
const db = require('../database/db');
const crypto = require('crypto');

class JobScraper {
    constructor() {
        this.browser = null;
    }

    async init() {
        if (!this.browser) {
            try {
                this.browser = await puppeteer.launch({
                    headless: "new",
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            } catch (error) {
                console.warn("⚠️ Puppeteer launch failed (likely missing browser binary). Switching to Mock Mode.");
                this.browser = null;
            }
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    // Generate a UUID for the ID
    generateId() {
        return crypto.randomUUID();
    }

    parseExperience(expStr) {
        if (!expStr) return { min: 0, max: 0 };
        const match = expStr.match(/(\d+)(?:-(\d+))?/);
        if (match) {
            return {
                min: parseFloat(match[1]),
                max: match[2] ? parseFloat(match[2]) : parseFloat(match[1])
            };
        }
        if (expStr.toLowerCase().includes('fresher')) return { min: 0, max: 1 };
        return { min: 0, max: 0 };
    }

    parseSalary(salaryStr) {
        if (!salaryStr) return { min: null, max: null };
        // Handle "3-6 Lacs P.A." or "12-18 LPA"
        const numberMatch = salaryStr.match(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?/);
        if (numberMatch) {
            // Assume LPA if not specified, or if 'lac'/'lpa' is present
            const isLPA = salaryStr.toLowerCase().includes('lac') || salaryStr.toLowerCase().includes('lpa') || !salaryStr.toLowerCase().includes('p.a');
            const multiplier = isLPA ? 100000 : 1;

            const min = parseFloat(numberMatch[1]) * multiplier;
            const max = numberMatch[2] ? parseFloat(numberMatch[2]) * multiplier : min;
            return { min, max };
        }
        return { min: null, max: null };
    }

    async saveJobs(jobs) {
        console.log(`\n💾 Saving ${jobs.length} jobs to database...`);
        let savedCount = 0;

        for (const job of jobs) {
            try {
                const exp = this.parseExperience(job.experience);
                const salary = this.parseSalary(job.salary);
                const id = this.generateId();

                // Check if job exists (by URL or Title+Company)
                const existing = await db.query(
                    'SELECT id FROM jobs WHERE external_link = ? OR (title = ? AND company = ?)',
                    [job.url, job.title, job.company]
                );

                if (existing && (existing.rows ? existing.rows.length > 0 : existing.length > 0)) {
                    continue;
                }

                await db.query(`
                    INSERT INTO jobs (
                        id, title, company, location, source,
                        external_link, experience_min, experience_max,
                        salary_min, salary_max, skills_required, posted_date,
                        description, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `, [
                    id,
                    job.title,
                    job.company,
                    job.location,
                    job.source,
                    job.url,
                    exp.min,
                    exp.max,
                    salary.min,
                    salary.max,
                    JSON.stringify(job.skills || []),
                    new Date().toISOString(),
                    job.description || `Job opportunity at ${job.company}`
                ]);

                savedCount++;
            } catch (error) {
                console.error(`Error saving job ${job.title}:`, error.message);
            }
        }
        console.log(`✅ Saved ${savedCount} new jobs`);
        return savedCount;
    }

    async generateMockJobs() {
        console.log("⚠️ Scraping yielded low results. Generating mock data for demo...");
        const roles = ['Frontend Developer', 'Backend Engineer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist'];
        const companies = ['TechCorp India', 'Innovate Solutions', 'Global Systems', 'StartUp Hub', 'Cloud Networks'];
        const locations = ['Bangalore', 'Pune', 'Hyderabad', 'Gurgaon', 'Remote'];

        const mockJobs = [];
        for (let i = 0; i < 10; i++) {
            const role = roles[Math.floor(Math.random() * roles.length)];
            const company = companies[Math.floor(Math.random() * companies.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];

            mockJobs.push({
                title: role,
                company: company,
                location: location,
                experience: `${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 5) + 3} Years`,
                salary: `${Math.floor(Math.random() * 10) + 5}-${Math.floor(Math.random() * 15) + 15} LPA`,
                skills: ['React', 'Node.js', 'SQL', 'AWS'].sort(() => 0.5 - Math.random()).slice(0, 3),
                source: 'MockData',
                url: `https://example.com/job-${i}`,
                description: `We are looking for a talented ${role} to join our team in ${location}.`
            });
        }
        return mockJobs;
    }

    async scrapeNaukri(keyword, location) {
        // Simplified scraping logic - in production this needs proxy rotation
        console.log(`Scraping Naukri for ${keyword} in ${location}...`);
        try {
            const page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Note: Naukri is very hard to scrape without blocking. 
            // We'll try a generic search page, but fallback to mock if it fails.
            const url = `https://www.naukri.com/${keyword.replace(/ /g, '-')}-jobs-in-${location}`;

            // Short timeout to fail fast and use mock
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

            // ... Scraping logic would go here ...
            // For this demo, we'll return empty to trigger mock generation
            // unless we successfully find selectors.

            await page.close();
            return [];
        } catch (e) {
            console.log("Naukri scraping failed (expected without proxies):", e.message);
            return [];
        }
    }

    async run() {
        await this.init();
        const allJobs = [];

        // Try scraping only if browser is available
        if (this.browser) {
            const scraped = await this.scrapeNaukri('software engineer', 'bangalore');
            allJobs.push(...scraped);
        } else {
            console.log("ℹ️ Skipping live scraping due to missing browser.");
        }

        // If we didn't get enough jobs (or browser failed), generate mock data
        if (allJobs.length < 5) {
            const mocks = await this.generateMockJobs();
            allJobs.push(...mocks);
        }

        await this.saveJobs(allJobs);
        await this.close();
        return allJobs.length;
    }
}

// CLI Support
if (require.main === module) {
    const scraper = new JobScraper();
    scraper.run().then(count => {
        console.log(`JobScraper finished. Processed ${count} jobs.`);
        process.exit(0);
    }).catch(err => {
        console.error("JobScraper failed:", err);
        process.exit(1);
    });
}

module.exports = JobScraper;
