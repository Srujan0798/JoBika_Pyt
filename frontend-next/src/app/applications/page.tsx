"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { Briefcase, Building, MapPin, Clock, MoreHorizontal, CheckCircle, XCircle, Calendar } from "lucide-react";

interface Application {
    id: string;
    job_id: string;
    company: string;
    role: string;
    location: string;
    status: string;
    applied_at: string;
    job_url: string;
}

const COLUMNS = [
    { id: "Applied", label: "Applied", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { id: "Screening", label: "Screening", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { id: "Interview", label: "Interview", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { id: "Offer", label: "Offer", color: "bg-green-50 text-green-700 border-green-200" },
    { id: "Rejected", label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
];

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/analytics/applications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setApplications(data);
            }
        } catch (error) {
            console.error("Failed to fetch applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const getColumnApplications = (status: string) => {
        return applications.filter(app => app.status === status || (status === "Applied" && !COLUMNS.find(c => c.id === app.status)));
    };

    return (
        <div className="min-h-screen bg-muted/30 py-8 px-4 overflow-x-auto">
            <div className="min-w-[1200px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Application Tracker</h1>
                    <p className="text-muted-foreground mt-1">Track the status of your job applications.</p>
                </div>

                <div className="flex gap-6 h-[calc(100vh-200px)]">
                    {COLUMNS.map((column) => (
                        <div key={column.id} className="flex-1 min-w-[280px] flex flex-col">
                            <div className={`flex items-center justify-between p-3 rounded-t-xl border-t border-x ${column.color} bg-white`}>
                                <h3 className="font-semibold">{column.label}</h3>
                                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
                                    {getColumnApplications(column.id).length}
                                </span>
                            </div>
                            <div className="flex-1 bg-muted/20 border-x border-b rounded-b-xl p-3 space-y-3 overflow-y-auto">
                                {getColumnApplications(column.id).map((app) => (
                                    <div key={app.id} className="bg-white p-4 rounded-lg shadow-sm border border-muted/20 hover:shadow-md transition-shadow cursor-pointer group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-foreground line-clamp-1">{app.role}</h4>
                                            <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                                            <Building className="w-3 h-3 mr-1.5" />
                                            {app.company}
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                                            <MapPin className="w-3 h-3 mr-1.5" />
                                            {app.location}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-muted/20">
                                            <div className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(app.applied_at).toLocaleDateString()}
                                            </div>
                                            {/* Status badge if needed, but column implies status */}
                                        </div>
                                    </div>
                                ))}
                                {getColumnApplications(column.id).length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground/50 text-sm italic">
                                        No applications
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
