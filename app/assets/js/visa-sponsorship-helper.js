/**
 * H1B and Visa Sponsorship Filter for Indian Job Seekers
 * Helps identify companies that sponsor work visas
 */

class VisaSponsorshipHelper {
    constructor() {
        this.sponsorshipData = this.initializeSponsorshipData();
    }

    /**
     * Initialize known H1B sponsoring companies in India
     */
    initializeSponsorshipData() {
        return {
            // Tech Giants
            'Google': { h1b: true, greenCard: true, probability: 'Very High', avgTime: '6-12 months' },
            'Microsoft': { h1b: true, greenCard: true, probability: 'Very High', avgTime: '6-12 months' },
            'Amazon': { h1b: true, greenCard: true, probability: 'High', avgTime: '12-18 months' },
            'Meta': { h1b: true, greenCard: true, probability: 'Very High', avgTime: '6-12 months' },
            'Apple': { h1b: true, greenCard: true, probability: 'High', avgTime: '12-18 months' },

            // Indian Product Companies
            'Flipkart': { h1b: false, greenCard: false, probability: 'Low', avgTime: 'N/A' },
            'Swiggy': { h1b: false, greenCard: false, probability: 'Low', avgTime: 'N/A' },
            'Zomato': { h1b: false, greenCard: false, probability: 'Low', avgTime: 'N/A' },
            'CRED': { h1b: false, greenCard: false, probability: 'Low', avgTime: 'N/A' },
            'Razorpay': { h1b: false, greenCard: false, probability: 'Low', avgTime: 'N/A' },

            // Global Tech
            'Uber': { h1b: true, greenCard: true, probability: 'High', avgTime: '12-18 months' },
            'Airbnb': { h1b: true, greenCard: true, probability: 'High', avgTime: '12-18 months' },
            'Netflix': { h1b: true, greenCard: true, probability: 'Medium', avgTime: '18-24 months' },
            'LinkedIn': { h1b: true, greenCard: true, probability: 'High', avgTime: '12-18 months' },

            // Consulting/Services
            'TCS': { h1b: true, greenCard: false, probability: 'Medium', avgTime: '24-36 months' },
            'Infosys': { h1b: true, greenCard: false, probability: 'Medium', avgTime: '24-36 months' },
            'Wipro': { h1b: true, greenCard: false, probability: 'Medium', avgTime: '24-36 months' },
            'Cognizant': { h1b: true, greenCard: false, probability: 'Medium', avgTime: '24-36 months' },

            // Finance
            'Goldman Sachs': { h1b: true, greenCard: true, probability: 'High', avgTime: '12-18 months' },
            'JP Morgan': { h1b: true, greenCard: true, probability: 'High', avgTime: '12-18 months' },
            'Morgan Stanley': { h1b: true, greenCard: true, probability: 'Medium', avgTime: '18-24 months' }
        };
    }

    /**
     * Check if company sponsors H1B visas
     */
    checkSponsorship(companyName) {
        const company = this.findCompany(companyName);

        if (company) {
            return {
                found: true,
                companyName: companyName,
                ...company
            };
        }

        // Unknown company - return probabilistic estimate
        return {
            found: false,
            companyName: companyName,
            h1b: null,
            greenCard: null,
            probability: 'Unknown',
            avgTime: 'Varies',
            suggestion: 'Research company on H1B database (myvisajobs.com)'
        };
    }

    /**
     * Filter jobs by H1B sponsorship
     */
    filterJobsBySponsorship(jobs, requirements = {}) {
        const {
            requireH1B = true,
            requireGreenCard = false,
            minProbability = 'Low'
        } = requirements;

        const probabilityOrder = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'Unknown': 0 };
        const minProbLevel = probabilityOrder[minProbability];

        return jobs.map(job => {
            const sponsorship = this.checkSponsorship(job.company);
            const probLevel = probabilityOrder[sponsorship.probability];

            let matches = true;
            let reasons = [];

            if (requireH1B && !sponsorship.h1b) {
                matches = false;
                reasons.push('Does not sponsor H1B');
            }

            if (requireGreenCard && !sponsorship.greenCard) {
                matches = false;
                reasons.push('Does not sponsor Green Card');
            }

            if (probLevel < minProbLevel) {
                matches = false;
                reasons.push(`Sponsorship probability too low (${sponsorship.probability})`);
            }

            return {
                ...job,
                sponsorshipInfo: sponsorship,
                sponsorshipMatch: matches,
                sponsorshipReasons: reasons
            };
        }).filter(job => job.sponsorshipMatch);
    }

    /**
     * Get H1B lottery insights
     */
    getH1BLotteryInfo(year = 2025) {
        return {
            year: year,
            cap: 85000,
            regularCap: 65000,
            advancedDegree: 20000,
            registrationPeriod: 'March 1-17, 2025',
            lotteryDate: 'March 31, 2025 (approx)',
            resultDate: 'April 15, 2025 (approx)',
            applicationDeadline: 'June 30, 2025',
            startDate: 'October 1, 2025',

            tips: [
                '✓ Register early during registration window',
                '✓ Master\'s degree holders have dual chance (advanced + regular cap)',
                '✓ Previous year selection rate: ~25-30%',
                '✓ STEM OPT extension available (24 months)',
                '✓ H1B transfer possible if not selected initially',
                '✓ Cap-exempt for universities, non-profits, research orgs'
            ],

            timeline: [
                { date: 'March 1-17', event: 'Registration Period' },
                { date: 'March 31', event: 'Lottery Selection' },
                { date: 'April 1', event: 'Results Announced' },
                { date: 'April 1 - June 30', event: 'File H1B Petition' },
                { date: 'October 1', event: 'H1B Start Date' }
            ],

            costs: {
                registrationFee: '$10',
                baseFiling: '$460',
                additionalFees: '$1,500-$4,500',
                attorneyFees: '$2,000-$5,000',
                totalEstimate: '$4,000-$10,000'
            },

            eligibility: [
                'Bachelors degree or higher',
                'Job offer from US employer',
                'Specialty occupation (tech, engineering, finance, etc.)',
                'Employer willing to sponsor'
            ]
        };
    }

    /**
     * Get Green Card sponsorship timeline
     */
    getGreenCardInfo() {
        return {
            eb2Category: {
                name: 'EB-2 (Advanced Degree)',
                waitTime: '3-5 years (India - long backlog)',
                eligibility: 'Masters + 5 years OR PhD',
                currentSlots: 'Limited (India has backlog)'
            },

            eb3Category: {
                name: 'EB-3 (Skilled Worker)',
                waitTime: '5-8 years (India - long backlog)',
                eligibility: 'Bachelors degree',
                currentSlots: 'Very Limited'
            },

            process: [
                '1. PERM Labor Certification (6-12 months)',
                '2. I-140 Petition (4-8 months)',
                '3. Wait for Priority Date (varies)',
                '4. I-485 Application (6-12 months)',
                '5. Green Card Received'
            ],

            tips: [
                '✓ Start GC process as soon as H1B approved',
                '✓ EB-2 NIW (National Interest Waiver) faster for some',
                '✓ Indian citizens face long backlogs (10+ years possible)',
                '✓ Country-neutral possible via spouse from different country',
                '✓ AC21 allows job change after I-140 approved + 180 days of I-485'
            ],

            costs: {
                permLabor: '$5,000-$10,000',
                i140: '$700 + attorney ($2,000-$5,000)',
                i485: '$1,225 + medicals ($500)',
                totalEstimate: '$10,000-$20,000'
            }
        };
    }

    /**
     * Get company-specific sponsorship stats
     */
    getCompanyStats(companyName) {
        const company = this.findCompany(companyName);

        if (!company || !company.h1b) {
            return {
                available: false,
                message: `No H1B sponsorship data available for ${companyName}`
            };
        }

        return {
            available: true,
            companyName: companyName,
            h1bApprovals: 'High',
            avgSalary: company.companyName === 'Google' ? '$120k-180k' : '$80k-150k',
            sponsorshipProbability: company.probability,
            timeline: company.avgTime,
            greenCardSupport: company.greenCard ? 'Yes' : 'No',

            bestPractices: [
                'Mention visa requirement in initial conversation',
                'Ask about company\'s H1B track record',
                'Confirm they sponsor during final rounds',
                'Get written confirmation in offer letter'
            ]
        };
    }

    // Helper methods
    findCompany(companyName) {
        // Exact match
        if (this.sponsorshipData[companyName]) {
            return this.sponsorshipData[companyName];
        }

        // Partial match (case-insensitive)
        const nameLower = companyName.toLowerCase();
        for (const [key, value] of Object.entries(this.sponsorshipData)) {
            if (key.toLowerCase().includes(nameLower) || nameLower.includes(key.toLowerCase())) {
                return value;
            }
        }

        return null;
    }

    /**
     * Get UI filter options
     */
    getFilterOptions() {
        return [
            { value: 'h1b', label: 'H1B Sponsorship', description: 'Companies that sponsor H1B visas' },
            { value: 'greencard', label: 'Green Card Sponsorship', description: 'Companies that sponsor permanent residency' },
            { value: 'high-prob', label: 'High Probability', description: 'Companies with high visa approval rates' },
            { value: 'fast-track', label: 'Fast Track (<12 months)', description: 'Faster visa processing' }
        ];
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisaSponsorshipHelper;
} else {
    window.VisaSponsorshipHelper = VisaSponsorshipHelper;
}
