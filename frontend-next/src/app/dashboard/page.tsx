"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { Search, MapPin, Briefcase, IndianRupee, Clock, Building2, LogOut, Zap } from "lucide-react";

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary_min: number;
    salary_max: number;
    experience_min: number;
    experience_max: number;
    skills_required: string;
    posted_date: string;
    source: string;
    match_score?: number;
}

export default function Dashboard() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check auth
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        if (userData) {
            setUser(JSON.parse(userData));
        }

        // Fetch jobs
        fetchJobs(token);
    }, []);

    const fetchJobs = async (token: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/jobs`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setJobs(data);
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const formatSalary = (min: number, max: number) => {
        if (!min && !max) return "Not disclosed";
        const format = (n: number) => (n / 100000).toFixed(1) + " LPA";
        if (min && max) return `${format(min)} - ${format(max)}`;
        return format(min || max);
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Navbar */}
            <nav className="bg-white border-b border-muted/20 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            J
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            JobSaathi
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground">
                            Welcome, {user?.name}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-full transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-muted/20 shadow-sm">
                            <h3 className="font-bold mb-4 text-foreground">Menu</h3>
                            <nav className="space-y-2">
                                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                                    <Briefcase className="w-4 h-4" />
                                    Find Jobs
                                </Link>
                                <Link href="/applications" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors">
                                    <Clock className="w-4 h-4" />
                                    Tracker
                                </Link>
                                <Link href="/resumes" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors">
                                    <Briefcase className="w-4 h-4" />
                                    Resumes
                                </Link>
                                <Link href="/coach" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors">
                                    <Zap className="w-4 h-4" />
                                    AI Coach
                                </Link>
                                <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors">
                                    <Building2 className="w-4 h-4" />
                                    My Profile
                                </Link>
                            </nav>

                            <div className="mt-6 pt-6 border-t border-muted/20">
                                <Link href="/pricing" className="block bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-xl text-center hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                                    <div className="flex items-center justify-center gap-2 font-bold mb-1">
                                        <Zap className="w-4 h-4 fill-white" />
                                        Upgrade to Pro
                                    </div>
                                    <p className="text-xs text-white/90">Get AI coaching & more</p>
                                </Link>
                            </div>
                        </div>
                    </aside>

                    {/* Job Feed */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-6">Recommended Jobs</h1>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobs.map((job) => (
                                    <div key={job.id} className="bg-white p-6 rounded-xl border border-muted/20 hover:border-primary/30 hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                                        {job.title}
                                                    </h3>
                                                    {job.match_score && job.match_score > 0 && (
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${job.match_score >= 80 ? 'bg-green-100 text-green-700 border-green-200' :
                                                            job.match_score >= 50 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                                'bg-gray-100 text-gray-700 border-gray-200'
                                                            }`}>
                                                            {job.match_score}% Match
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground font-medium">{job.company}</p>
                                            </div>
                                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full border border-blue-100">
                                                {job.source || "Direct"}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {job.location || "Remote"}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <IndianRupee className="w-4 h-4" />
                                                {formatSalary(job.salary_min, job.salary_max)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {job.experience_min}-{job.experience_max} Yrs
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-muted/10">
                                            <div className="flex gap-2">
                                                {job.skills_required && JSON.parse(job.skills_required || "[]").slice(0, 3).map((skill: string) => (
                                                    <span key={skill} className="text-xs bg-muted/50 px-2 py-1 rounded-md text-muted-foreground">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                            <Link href={`/job/${job.id}`} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                                                Apply Now
                                            </Link>
                                        </div>
                                    </div>
                                ))}

                                {jobs.length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-xl border border-muted/20">
                                        <p className="text-muted-foreground">No jobs found matching your profile.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
