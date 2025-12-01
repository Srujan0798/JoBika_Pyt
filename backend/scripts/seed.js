const db = require('../database/db');
const crypto = require('crypto');

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        // 1. Create Mock User
        const userId = '550e8400-e29b-41d4-a716-446655440000'; // Fixed UUID for demo
        const userEmail = 'demo@jobsaathi.com';

        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = ?', [userEmail]);
        const existingUser = userCheck.rows ? userCheck.rows[0] : userCheck[0];

        if (!existingUser) {
            console.log('Creating demo user...');
            await db.query(`
                INSERT INTO users (id, email, password_hash, name, current_role, current_company, total_years, skills, preferences)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId,
                userEmail,
                'hashed_password_placeholder', // In real app, hash this
                'Arjun Sharma',
                'Senior Frontend Developer',
                'TechCorp India',
                5,
                JSON.stringify(['React', 'Node.js', 'TypeScript', 'Tailwind CSS', 'Next.js']),
                JSON.stringify({ locations: ['Bangalore', 'Remote'], roles: ['Frontend Developer', 'Full Stack Developer'], remote: true })
            ]);
        } else {
            console.log('Demo user already exists.');
        }

        // 2. Create Realistic Jobs
        const jobs = [
            {
                title: 'Senior React Developer',
                company: 'Flipkart',
                location: 'Bangalore',
                description: 'We are looking for an experienced React developer to lead our frontend team. You will be working on high-scale e-commerce applications.',
                salary_min: 2500000,
                salary_max: 4500000,
                experience_min: 4,
                experience_max: 8,
                skills_required: JSON.stringify(['React', 'Redux', 'TypeScript', 'Performance Optimization']),
                source: 'LinkedIn'
            },
            {
                title: 'Full Stack Engineer (MERN)',
                company: 'Swiggy',
                location: 'Bangalore',
                description: 'Join our fast-paced delivery team. You will build scalable backend services and responsive UIs.',
                salary_min: 2000000,
                salary_max: 3500000,
                experience_min: 2,
                experience_max: 5,
                skills_required: JSON.stringify(['Node.js', 'Express', 'MongoDB', 'React', 'AWS']),
                source: 'Naukri'
            },
            {
                title: 'Product Manager',
                company: 'Zomato',
                location: 'Gurgaon',
                description: 'Drive the product vision for our new quick-commerce vertical. Experience in B2C apps is a must.',
                salary_min: 3000000,
                salary_max: 5000000,
                experience_min: 5,
                experience_max: 10,
                skills_required: JSON.stringify(['Product Management', 'Analytics', 'UX Design', 'Agile']),
                source: 'Direct'
            },
            {
                title: 'DevOps Engineer',
                company: 'Razorpay',
                location: 'Remote',
                description: 'Help us scale our payments infrastructure. Kubernetes and Terraform expertise required.',
                salary_min: 2200000,
                salary_max: 4000000,
                experience_min: 3,
                experience_max: 7,
                skills_required: JSON.stringify(['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Python']),
                source: 'LinkedIn'
            },
            {
                title: 'Data Scientist',
                company: 'Ola Electric',
                location: 'Bangalore',
                description: 'Build predictive models for battery performance and ride optimization.',
                salary_min: 1800000,
                salary_max: 3200000,
                experience_min: 2,
                experience_max: 5,
                skills_required: JSON.stringify(['Python', 'Machine Learning', 'SQL', 'TensorFlow']),
                source: 'Instahyre'
            }
        ];

        console.log('Seeding jobs...');
        for (const job of jobs) {
            const jobId = crypto.randomUUID();
            // Check if job exists (simple check by title & company)
            const jobCheck = await db.query('SELECT * FROM jobs WHERE title = ? AND company = ?', [job.title, job.company]);
            const existingJob = jobCheck.rows ? jobCheck.rows[0] : jobCheck[0];

            if (!existingJob) {
                await db.query(`
                    INSERT INTO jobs (id, title, company, location, description, salary_min, salary_max, experience_min, experience_max, skills_required, source, posted_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    jobId,
                    job.title,
                    job.company,
                    job.location,
                    job.description,
                    job.salary_min,
                    job.salary_max,
                    job.experience_min,
                    job.experience_max,
                    job.skills_required,
                    job.source,
                    new Date().toISOString()
                ]);
            }
        }

        console.log('✅ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
