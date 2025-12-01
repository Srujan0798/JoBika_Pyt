"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { FileText, Plus, Download, Calendar, Briefcase, Loader2, ArrowRight } from "lucide-react";

interface ResumeVersion {
    id: string;
    created_at: string;
    pdf_url: string;
    job_title: string;
    company: string;
}

export default function ResumesPage() {
    const [resumes, setResumes] = useState<ResumeVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [tailoring, setTailoring] = useState(false);

    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/resumes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setResumes(data);
            }
        } catch (error) {
            console.error("Failed to fetch resumes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTailorNew = async () => {
        // For demo simplicity, we'll just tailor for the most recent job or a dummy one
        // In a real app, this would open a modal to select a job
        setTailoring(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/resumes/tailor`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    resumeId: "latest",
                    jobDescription: "Senior React Developer with Node.js experience. Must know Redux and AWS." // Dummy JD
                })
            });
            const data = await res.json();
            if (data.success) {
                fetchResumes(); // Refresh list
            }
        } catch (error) {
            console.error("Tailoring failed:", error);
        } finally {
            setTailoring(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">My Resumes</h1>
                        <p className="text-muted-foreground mt-1">Manage your tailored resumes for different applications.</p>
                    </div>
                    <button
                        onClick={handleTailorNew}
                        disabled={tailoring}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {tailoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Tailor New Resume
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : resumes.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-muted/20">
                        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground">No resumes yet</h3>
                        <p className="text-muted-foreground mt-2 mb-6">Tailor your first resume to increase your chances.</p>
                        <button onClick={handleTailorNew} className="text-primary font-medium hover:underline">
                            Create your first tailored resume
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {resumes.map((resume) => (
                            <div key={resume.id} className="bg-white rounded-xl p-6 border border-muted/20 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(resume.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                                    {resume.job_title || "General Resume"}
                                </h3>
                                <div className="flex items-center text-sm text-muted-foreground mb-4">
                                    <Briefcase className="w-3 h-3 mr-1" />
                                    {resume.company || "Base Version"}
                                </div>
                                <div className="flex gap-2 mt-auto">
                                    <a
                                        href={`${API_BASE_URL}${resume.pdf_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-muted/50 hover:bg-muted text-foreground py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </a>
                                    {/* Link to detail view if we implement it */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
