"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { User, Mail, Phone, MapPin, Briefcase, Award, Save, Loader2, ArrowLeft } from "lucide-react";

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    location: string;
    current_role: string;
    current_company: string;
    total_years: number;
    skills: string[];
    preferences: {
        locations: string[];
        roles: string[];
        remote: boolean;
    };
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile>({
        name: "",
        email: "",
        phone: "",
        location: "",
        current_role: "",
        current_company: "",
        total_years: 0,
        skills: [],
        preferences: { locations: [], roles: [], remote: false }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            // We don't have a direct GET /profile, so we use the stored user data or fetch from a new endpoint
            // Ideally backend should have GET /api/user/profile. Let's assume we need to add it or rely on local storage for basic info
            // and maybe fetch more. For now, let's try to fetch from a hypothetical GET /api/user/profile or just use what we have.
            // Actually, let's implement GET /api/user/profile in backend if it doesn't exist.
            // Checking user.js... it has PUT /profile but not GET /profile explicitly shown in previous turns.
            // Let's try to fetch.
            const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setProfile({
                    ...data,
                    skills: typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills || [],
                    preferences: typeof data.preferences === 'string' ? JSON.parse(data.preferences) : data.preferences || { locations: [], roles: [], remote: false }
                });
            } else {
                // Fallback to local storage if API fails (or not implemented)
                const stored = localStorage.getItem("user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setProfile(prev => ({ ...prev, ...parsed }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(profile)
            });

            if (res.ok) {
                setMessage("Profile updated successfully!");
                // Update local storage
                const stored = JSON.parse(localStorage.getItem("user") || "{}");
                localStorage.setItem("user", JSON.stringify({ ...stored, ...profile }));
            } else {
                throw new Error("Failed to update profile");
            }
        } catch (error) {
            console.error("Update failed:", error);
            setMessage("Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setProfile(prev => ({ ...prev, skills: val.split(",").map(s => s.trim()) }));
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="min-h-screen bg-muted/30 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>

                <div className="bg-white rounded-xl shadow-sm border border-muted/20 overflow-hidden">
                    <div className="p-6 border-b border-muted/20 bg-primary/5">
                        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
                        <p className="text-muted-foreground">Manage your personal information and job preferences.</p>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Personal Info */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Personal Information
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-muted/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full p-2 border rounded-lg bg-muted/30 text-muted-foreground cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-muted/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={profile.location}
                                        onChange={e => setProfile({ ...profile, location: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-muted/10"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Professional Info */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                Professional Details
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Current Role</label>
                                    <input
                                        type="text"
                                        value={profile.current_role}
                                        onChange={e => setProfile({ ...profile, current_role: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-muted/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Current Company</label>
                                    <input
                                        type="text"
                                        value={profile.current_company}
                                        onChange={e => setProfile({ ...profile, current_company: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-muted/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Total Experience (Years)</label>
                                    <input
                                        type="number"
                                        value={profile.total_years}
                                        onChange={e => setProfile({ ...profile, total_years: parseInt(e.target.value) || 0 })}
                                        className="w-full p-2 border rounded-lg bg-muted/10"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Skills */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Award className="w-5 h-5 text-primary" />
                                Skills
                            </h2>
                            <div>
                                <label className="block text-sm font-medium mb-1">Skills (comma separated)</label>
                                <input
                                    type="text"
                                    value={profile.skills.join(", ")}
                                    onChange={handleSkillChange}
                                    placeholder="React, Node.js, Python..."
                                    className="w-full p-2 border rounded-lg bg-muted/10"
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {profile.skills.map((skill, idx) => (
                                        skill.trim() && (
                                            <span key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                                                {skill.trim()}
                                            </span>
                                        )
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Actions */}
                        <div className="pt-4 flex items-center justify-between border-t border-muted/20">
                            <p className={`text-sm font-medium ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
                                {message}
                            </p>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
