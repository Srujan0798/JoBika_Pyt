"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Register() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        location: "",
        currentRole: "",
        totalYears: "",
        expectedCtc: "",
        skills: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Convert skills string to array
            const payload = {
                ...formData,
                skills: formData.skills.split(",").map((s) => s.trim()),
                totalYears: Number(formData.totalYears),
                expectedCtc: Number(formData.expectedCtc),
            };

            const res = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            // Success - redirect to login or dashboard
            window.location.href = "/login?registered=true";
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-muted/20">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-foreground">Create Account</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Join JobSaathi to find your dream job
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground">Full Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground">Email Address</label>
                            <input
                                type="email"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground">Phone</label>
                                <input
                                    type="tel"
                                    className="mt-1 block w-full px-3 py-2 border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground">Location</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full px-3 py-2 border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground">Experience (Years)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="mt-1 block w-full px-3 py-2 border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.totalYears}
                                    onChange={(e) => setFormData({ ...formData, totalYears: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground">Expected CTC (LPA)</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full px-3 py-2 border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.expectedCtc}
                                    onChange={(e) => setFormData({ ...formData, expectedCtc: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground">Skills (comma separated)</label>
                            <input
                                type="text"
                                placeholder="React, Node.js, Python"
                                className="mt-1 block w-full px-3 py-2 border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                value={formData.skills}
                                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                    </button>

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">Already have an account? </span>
                        <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
