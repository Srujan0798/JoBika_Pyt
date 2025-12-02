"use client";

import { useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export default function ResumeUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== "application/pdf") {
                setStatus("error");
                setMessage("Please upload a PDF file only.");
                return;
            }
            setFile(selectedFile);
            setStatus("idle");
            setMessage("");
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus("idle");

        const formData = new FormData();
        formData.append("resume", file);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Please login to upload resume");
            }

            const res = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setStatus("success");
            setMessage("Resume uploaded and parsed successfully!");
        } catch (err: any) {
            setStatus("error");
            setMessage(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>

                <div className="bg-white rounded-2xl shadow-xl border border-muted/20 overflow-hidden">
                    <div className="p-8 text-center border-b border-muted/20">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Upload Your Resume</h1>
                        <p className="text-muted-foreground mt-2">
                            We'll parse your resume to match you with the best jobs.
                        </p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 text-center hover:bg-muted/10 transition-colors relative">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="flex flex-col items-center">
                                    <FileText className="w-12 h-12 text-primary mb-3" />
                                    <p className="font-medium text-foreground">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                                    <p className="font-medium text-foreground">Click or drag PDF here</p>
                                    <p className="text-sm text-muted-foreground">Max file size: 5MB</p>
                                </div>
                            )}
                        </div>

                        {status === "error" && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{message}</p>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{message}</p>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Parsing Resume...
                                </>
                            ) : (
                                "Upload & Analyze"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
