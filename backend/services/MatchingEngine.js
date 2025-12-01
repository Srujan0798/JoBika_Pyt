class MatchingEngine {
    constructor() {
        // Weights for the matching algorithm
        this.weights = {
            skills: 0.40,
            experience: 0.25,
            location: 0.15,
            salary: 0.10,
            culture: 0.10
        };
    }

    calculateScore(userProfile, job) {
        const skillsScore = this.matchSkills(userProfile.skills, job.skills_required);
        const expScore = this.matchExperience(userProfile.totalYears, job.experience_min, job.experience_max);
        const locScore = this.matchLocation(userProfile.location, job.location);
        const salaryScore = this.matchSalary(userProfile.expectedCtc, job.salary_min, job.salary_max);

        // Culture fit is hard to determine without more data, assuming neutral (50%) or based on company type if available
        const cultureScore = 50;

        const totalScore = (
            skillsScore * this.weights.skills +
            expScore * this.weights.experience +
            locScore * this.weights.location +
            salaryScore * this.weights.salary +
            cultureScore * this.weights.culture
        );

        return Math.round(totalScore);
    }

    matchSkills(userSkills, jobSkills) {
        if (!userSkills || !jobSkills) return 0;

        // Parse if strings (SQLite storage)
        const uSkills = typeof userSkills === 'string' ? JSON.parse(userSkills) : userSkills;
        const jSkills = typeof jobSkills === 'string' ? JSON.parse(jobSkills) : jobSkills;

        if (!Array.isArray(uSkills) || !Array.isArray(jSkills) || jSkills.length === 0) return 0;

        const userSkillSet = new Set(uSkills.map(s => s.toLowerCase()));
        const matchedCount = jSkills.filter(s => userSkillSet.has(s.toLowerCase())).length;

        return (matchedCount / jSkills.length) * 100;
    }

    matchExperience(userYears, minExp, maxExp) {
        if (!userYears) return 0;
        if (!minExp) return 100; // No requirement

        if (userYears >= minExp && (!maxExp || userYears <= maxExp)) {
            return 100;
        } else if (userYears < minExp) {
            // Penalize for being underqualified
            const diff = minExp - userYears;
            return Math.max(0, 100 - (diff * 20));
        } else {
            // Slight penalty for being overqualified (optional)
            return 90;
        }
    }

    matchLocation(userLoc, jobLoc) {
        if (!userLoc || !jobLoc) return 0;
        if (jobLoc.toLowerCase().includes('remote')) return 100;
        if (userLoc.toLowerCase().includes(jobLoc.toLowerCase()) || jobLoc.toLowerCase().includes(userLoc.toLowerCase())) {
            return 100;
        }
        return 0;
    }

    matchSalary(userExpected, jobMin, jobMax) {
        if (!userExpected || !jobMin) return 50; // Neutral if unknown

        // If job pays more than expected, great!
        if (jobMin >= userExpected) return 100;

        // If job max is less than expected, bad match
        if (jobMax && jobMax < userExpected) return 0;

        // If range overlaps
        if (jobMax && jobMax >= userExpected) return 80;

        return 50;
    }
}

module.exports = new MatchingEngine();
