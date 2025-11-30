const JobScraper = require('../services/JobScraper');
const puppeteer = require('puppeteer');

jest.mock('puppeteer');

describe('JobScraper', () => {
    let jobScraper;
    let mockBrowser;
    let mockPage;

    beforeEach(() => {
        jobScraper = new JobScraper();

        mockPage = {
            setUserAgent: jest.fn(),
            goto: jest.fn(),
            waitForSelector: jest.fn(),
            evaluate: jest.fn(),
            close: jest.fn(),
            $: jest.fn()
        };

        mockBrowser = {
            newPage: jest.fn().mockResolvedValue(mockPage),
            close: jest.fn()
        };

        puppeteer.launch.mockResolvedValue(mockBrowser);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('init', () => {
        it('should launch browser if not initialized', async () => {
            await jobScraper.init();
            expect(puppeteer.launch).toHaveBeenCalledWith(expect.objectContaining({
                headless: "new"
            }));
            expect(jobScraper.browser).toBe(mockBrowser);
        });

        it('should not launch browser if already initialized', async () => {
            jobScraper.browser = mockBrowser;
            await jobScraper.init();
            expect(puppeteer.launch).not.toHaveBeenCalled();
        });
    });

    describe('close', () => {
        it('should close browser if initialized', async () => {
            jobScraper.browser = mockBrowser;
            await jobScraper.close();
            expect(mockBrowser.close).toHaveBeenCalled();
            expect(jobScraper.browser).toBeNull();
        });
    });

    describe('scrapeLinkedIn', () => {
        const query = 'developer';
        const location = 'remote';

        it('should scrape jobs successfully', async () => {
            const mockJobs = [
                { title: 'Job 1', company: 'Company 1' }
            ];
            mockPage.evaluate.mockReturnValue(mockJobs);

            const result = await jobScraper.scrapeLinkedIn(query, location);

            expect(mockBrowser.newPage).toHaveBeenCalled();
            expect(mockPage.goto).toHaveBeenCalledWith(
                expect.stringContaining('linkedin.com/jobs/search'),
                expect.any(Object)
            );
            expect(result).toEqual(mockJobs);
            expect(mockPage.close).toHaveBeenCalled();
        });

        it('should handle errors gracefully and return empty array', async () => {
            mockBrowser.newPage.mockRejectedValue(new Error('Browser error'));

            const result = await jobScraper.scrapeLinkedIn(query, location);

            expect(result).toEqual([]);
        });
    });

    describe('scrapeUnstop', () => {
        it('should return mock jobs', async () => {
            const result = await jobScraper.scrapeUnstop('hackathon');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].source).toBe('Unstop');
        });
    });

    describe('searchJobs', () => {
        it('should call scrapeLinkedIn when source is linkedin', async () => {
            const spy = jest.spyOn(jobScraper, 'scrapeLinkedIn').mockResolvedValue([]);
            await jobScraper.searchJobs('linkedin', 'query', 'loc');
            expect(spy).toHaveBeenCalledWith('query', 'loc');
        });

        it('should call scrapeUnstop when source is unstop', async () => {
            const spy = jest.spyOn(jobScraper, 'scrapeUnstop').mockResolvedValue([]);
            await jobScraper.searchJobs('unstop', 'query', 'loc');
            expect(spy).toHaveBeenCalledWith('query');
        });

        it('should return empty array for unknown source', async () => {
            const result = await jobScraper.searchJobs('unknown', 'query', 'loc');
            expect(result).toEqual([]);
        });
    });
});
