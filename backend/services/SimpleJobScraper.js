const puppeteer = require('puppeteer');
const db = require('../database/db');

/**
 * Simple Job Scraper for MVP
 * Scrapes jobs from public sources
 * Run daily via cron
 */

class SimpleJobScraper {
    constructor() {
        this.browser = null;
        this.scrapedCount = 0;
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async scrapeNaukriPublic(keyword = 'software engineer', location = 'bangalore', pages = 3) {
        console.log(`🔍 Scraping Naukri for: ${keyword} in ${location}...`);

        const jobs = [];
        const page = await this.browser.newPage();

        try {
            for (let pageNum = 1; pageNum <= pages; pageNum++) {
                const url = `https://www.naukri.com/${keyword.replace(/ /g, '-')}-jobs-in-${location}?k=${encodeURIComponent(keyword)}&l=${location}&page=${pageNum}`;

                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForSelector('.jobTuple', { timeout: 10000 });

                const pageJobs = await page.evaluate(() => {
                    const jobCards = Array.from(document.querySelectorAll('.jobTuple'));

                    return jobCards.map(card => {
                        const titleEl = card.querySelector('.title');
                        const companyEl = card.querySelector('.companyInfo');
                        const expEl = card.querySelector('.expwdth');
                        const salaryEl = card.querySelector('.salary');
                        const locationEl = card.querySelector('.locWdth');
                        const skillsEl = card.querySelectorAll('.tags li');

                        return {
                            title: titleEl?.innerText?.trim(),
                            company: companyEl?.innerText?.trim(),
                            experience: expEl?.innerText?.trim(),
                            salary: salaryEl?.innerText?.trim(),
                            location: locationEl?.innerText?.trim(),
                            skills: Array.from(skillsEl).map(s => s.innerText.trim()),
                            source: 'naukri',
                            url: titleEl?.href
                        };
                    }).filter(job => job.title && job.company);
                });

                jobs.push(...pageJobs);
                console.log(`  Page ${pageNum}: Found ${pageJobs.length} jobs`);

                // Respectful scraping - wait between pages
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (error) {
            console.error('Naukri scraping error:', error.message);
        } finally {
            await page.close();
        }

        return jobs;
    }

    async scrapeIndeedPublic(keyword = 'software developer', location = 'bangalore', pages = 3) {
        console.log(`🔍 Scraping Indeed for: ${keyword} in ${location}...`);

        const jobs = [];
        const page = await this.browser.newPage();

        try {
            for (let start = 0; start < pages * 10; start += 10) {
                const url = `https://in.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${location}&start=${start}`;

                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForSelector('.jobsearch-ResultsList', { timeout: 10000 });

                const pageJobs = await page.evaluate(() => {
                    const jobCards = Array.from(document.querySelectorAll('.job_seen_beacon'));

                    return jobCards.map(card => {
                        const titleEl = card.querySelector('h2 span');
                        const companyEl = card.querySelector('.companyName');
                        const locationEl = card.querySelector('.companyLocation');
                        const salaryEl = card.querySelector('.salary-snippet');

                        return {
                            title: titleEl?.innerText?.trim(),
                            company: companyEl?.innerText?.trim(),
                            location: locationEl?.innerText?.trim(),
                            salary: salaryEl?.innerText?.trim(),
                            source: 'indeed',
                            url: card.querySelector('a')?.href
                        };
                    }).filter(job => job.title && job.company);
                });

                jobs.push(...pageJobs);
                console.log(`  Start ${start}: Found ${pageJobs.length} jobs`);

                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (error) {
            console.error('Indeed scraping error:', error.message);
        } finally {
            await page.close();
        }

        return jobs;
    }

    parseExperience(expStr) {
        if (!expStr) return { min: 0, max: 0 };

        const match = expStr.match(/(\d+)(?:-(\d+))?/);
        if (match) {
            const min = parseInt(match[1]) * 12; // Convert years to months
            const max = match[2] ? parseInt(match[2]) * 12 : min;
            return { min, max };
        }

        if (expStr.toLowerCase().includes('fresher')) {
            return { min: 0, max: 12 };
        }

        return { min: 0, max: 0 };
    }

    parseSalary(salaryStr) {
        if (!salaryStr) return { min: null, max: null };

        // Indian format: "3-6 Lacs P.A." or "₹5,00,000 - ₹8,00,000"
        const numberMatch = salaryStr.match(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?/);
        if (numberMatch) {
            const multiplier = salaryStr.toLowerCase().includes('lac') ? 100000 : 1;
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

                await db.query(`
                    INSERT INTO jobs (
                        title, company, location, source,
                        source_url, experience_min, experience_max,
                        salary_min, salary_max, requirements, posted_date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (source_url) DO NOTHING
                `, [
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
                    new Date().toISOString()
                ]);

                savedCount++;
            } catch (error) {
                // Skip duplicates
                if (!error.message.includes('UNIQUE')) {
                    console.error(`Error saving job: ${error.message}`);
                }
            }
        }

        console.log(`✅ Saved ${savedCount} new jobs`);
        return savedCount;
    }

    async scrapeAll() {
        await this.init();

        const allJobs = [];

        // Scrape different roles
        const searches = [
            { keyword: 'software engineer', location: 'bangalore' },
            { keyword: 'frontend developer', location: 'bangalore' },
            { keyword: 'backend developer', location: 'hyderabad' },
            { keyword: 'data scientist', location: 'pune' },
            { keyword: 'full stack developer', location: 'delhi' }
        ];

        for (const search of searches) {
            const naukriJobs = await this.scrapeNaukriPublic(search.keyword, search.location, 2);
            allJobs.push(...naukriJobs);

            const indeedJobs = await this.scrapeIndeedPublic(search.keyword, search.location, 2);
            allJobs.push(...indeedJobs);
        }

        await this.saveJobs(allJobs);
        await this.close();

        console.log(`\n🎉 Scraping complete! Total jobs found: ${allJobs.length}`);
        return allJobs;
    }
}

// CLI usage
if (require.main === module) {
    const scraper = new SimpleJobScraper();
    scraper.scrapeAll().catch(console.error);
}

module.exports = SimpleJobScraper;
