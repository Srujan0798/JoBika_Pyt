"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Briefcase, IndianRupee, Clock, Building2, Share2, ArrowLeft, Zap, Users, Send } from "lucide-react";

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    salary_min: number;
    salary_max: number;
    experience_min: number;
    experience_max: number;
    skills_required: string;
    posted_date: string;
    source: string;
}

interface Connection {
    id: string;
    name: string;
    role: string;
    company: string;
    profileUrl: string;
    mutualConnections: number;
    isAlumni: boolean;
}

export default function JobDetailsPage() {
    const params = useParams();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [applyStatus, setApplyStatus] = useState<"idle" | "success" | "error">("idle");
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchJobDetails(params.id as string);
        }
    }, [params.id]);

    const fetchJobDetails = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`http://localhost:3000/api/jobs/${id}`, { // Assuming we have this endpoint or filter list
                // If not, we might need to fetch all and find, or implement GET /api/jobs/:id
                // Let's assume we implement GET /api/jobs/:id or use the list for now.
                // Actually, backend jobs.js doesn't have GET /:id. I should add it or just fetch list and find.
                // Fetching list is safer for now without changing backend again.
                headers: { Authorization: `Bearer ${token}` }
            });

            // Fallback to list fetch if specific endpoint fails or doesn't exist
            if (!res.ok) {
                const listRes = await fetch("http://localhost:3000/api/jobs", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const listData = await listRes.json();
                const found = listData.find((j: Job) => j.id === id);
                if (found) {
                    setJob(found);
                    fetchConnections(found.company, token);
                }
            } else {
                const data = await res.json();
                setJob(data);
                fetchConnections(data.company, token);
            }
        } catch (error) {
            console.error("Failed to fetch job:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConnections = async (company: string, token: string) => {
        setLoadingConnections(true);
        try {
            const res = await fetch(`http://localhost:3000/api/networking/connections?company=${encodeURIComponent(company)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.connections) {
                setConnections(data.connections);
            }
        } catch (error) {
            console.error("Failed to fetch connections:", error);
        } finally {
            setLoadingConnections(false);
        }
    };

    const handleAutoApply = async () => {
        if (!job) return;
        setApplying(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:3000/api/applications/auto-apply", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    jobId: job.id,
                    resumeVersionId: "latest", // Use latest for now
                    supervised: true
                })
            });
            const data = await res.json();
            if (data.success || data.result?.isMock) {
                setApplyStatus("success");
            } else {
                setApplyStatus("error");
            }
        } catch (error) {
            console.error("Auto-apply failed:", error);
            setApplyStatus("error");
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!job) return <div className="p-8 text-center">Job not found</div>;

    return (
        <div className="min-h-screen bg-muted/30 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Jobs
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl p-8 border border-muted/20 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground mb-2">{job.title}</h1>
                                    <div className="flex items-center text-lg text-muted-foreground">
                                        <Building2 className="w-5 h-5 mr-2" />
                                        {job.company}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="p-2 border border-muted rounded-lg hover:bg-muted/50 transition-colors">
                                        <Share2 className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                    <button
                                        onClick={handleAutoApply}
                                        disabled={applying || applyStatus === "success"}
                                        className={`px-6 py-2 rounded-lg font-medium text-white flex items-center gap-2 transition-all ${applyStatus === "success" ? "bg-green-600" : "bg-primary hover:bg-primary/90"
                                            }`}
                                    >
                                        {applying ? (
                                            "Applying..."
                                        ) : applyStatus === "success" ? (
                                            "Applied Successfully"
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4" />
                                                Auto-Apply
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-6 py-6 border-y border-muted/10 mb-6">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="w-5 h-5" />
                                    {job.location}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <IndianRupee className="w-5 h-5" />
                                    {job.salary_min ? `${(job.salary_min / 100000).toFixed(1)} - ${(job.salary_max / 100000).toFixed(1)} LPA` : "Not disclosed"}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="w-5 h-5" />
                                    {job.experience_min}-{job.experience_max} Yrs
                                </div>
                            </div>

                            <div className="prose max-w-none">
                                <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                                <p className="text-muted-foreground whitespace-pre-line">{job.description || "No description available."}</p>

                                <h3 className="text-lg font-semibold mt-6 mb-3">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills_required && JSON.parse(job.skills_required).map((skill: string) => (
                                        <span key={skill} className="bg-muted px-3 py-1 rounded-full text-sm text-foreground">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Networking Widget */}
                        <div className="bg-white rounded-xl p-6 border border-muted/20 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-foreground">Connections at {job.company}</h3>
                            </div>

                            {loadingConnections ? (
                                <div className="text-center py-4 text-muted-foreground">Finding connections...</div>
                            ) : connections.length > 0 ? (
                                <div className="space-y-4">
                                    {connections.map(conn => (
                                        <div key={conn.id} className="flex items-start gap-3 pb-3 border-b border-muted/10 last:border-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                                {conn.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{conn.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{conn.role}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {conn.isAlumni && (
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Alumni</span>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground">{conn.mutualConnections} mutual</span>
                                                </div>
                                            </div>
                                            <button className="text-primary hover:bg-primary/10 p-1.5 rounded transition-colors" title="Ask for referral">
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button className="w-full text-center text-sm text-primary font-medium hover:underline pt-2">
                                        View all connections
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No connections found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
