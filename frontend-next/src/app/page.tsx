"use client";

import Link from "next/link";
import { Search, MapPin, Briefcase, Upload, CheckCircle, ArrowRight, Star, TrendingUp, Shield, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-muted/20 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
              J
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              JobSaathi
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/jobs" className="hover:text-primary transition-colors">Find Jobs</Link>
            <Link href="/resume" className="hover:text-primary transition-colors">AI Resume</Link>
            <Link href="/coaching" className="hover:text-primary transition-colors">Career Coach</Link>
            <Link href="/companies" className="hover:text-primary transition-colors">Companies</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Login
            </Link>
            <Link href="/register" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg shadow-primary/20">
              Register Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-primary/20 rounded-full px-4 py-1.5 mb-8 shadow-sm animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-secondary">#1 AI Job Platform for India 🇮🇳</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-foreground max-w-4xl mx-auto leading-tight">
              Your AI Companion for <br />
              <span className="text-primary">Career Success</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              JobSaathi uses advanced AI to match your skills with top Indian companies, tailor your resume, and automate your applications.
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-xl border border-muted/20 flex flex-col md:flex-row gap-2 mb-12">
              <div className="flex-1 flex items-center px-4 h-12 md:h-14 bg-muted/30 rounded-xl">
                <Search className="w-5 h-5 text-muted-foreground mr-3" />
                <input
                  type="text"
                  placeholder="Job title, skills, or company"
                  className="bg-transparent w-full outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex-1 flex items-center px-4 h-12 md:h-14 bg-muted/30 rounded-xl border-t md:border-t-0 md:border-l border-muted/20">
                <MapPin className="w-5 h-5 text-muted-foreground mr-3" />
                <input
                  type="text"
                  placeholder="City (e.g. Bangalore, Pune)"
                  className="bg-transparent w-full outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <button className="bg-primary hover:bg-primary/90 text-white px-8 h-12 md:h-14 rounded-xl font-medium transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95">
                Search Jobs
              </button>
            </div>

            {/* Trust Markers */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {['TCS', 'Infosys', 'Wipro', 'HDFC Bank', 'Reliance'].map((company) => (
                <span key={company} className="text-xl font-bold text-muted-foreground">{company}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose JobSaathi?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We've built features specifically for the Indian job market to give you the competitive edge.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Briefcase className="w-8 h-8 text-primary" />,
                  title: "AI Job Matching",
                  desc: "Our algorithm matches your skills with jobs that fit your experience and salary expectations perfectly."
                },
                {
                  icon: <Upload className="w-8 h-8 text-secondary" />,
                  title: "Smart Resume Builder",
                  desc: "Create ATS-friendly resumes tailored for Indian recruiters. Auto-fill from LinkedIn or PDF."
                },
                {
                  icon: <TrendingUp className="w-8 h-8 text-accent" />,
                  title: "Salary Insights",
                  desc: "Know your worth with real-time CTC benchmarks for your role and location in India."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-muted/20 hover:border-primary/20 hover:shadow-lg transition-all group">
                  <div className="w-14 h-14 bg-muted/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-secondary rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  Ready to Land Your Dream Job?
                </h2>
                <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-10">
                  Join 10,000+ job seekers in India who found their perfect role with JobSaathi.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register" className="bg-white text-secondary px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors">
                    Get Started for Free
                  </Link>
                  <Link href="/demo" className="bg-secondary-foreground/10 text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors backdrop-blur-sm">
                    View Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-bold text-sm">J</div>
                <span className="font-bold text-lg">JobSaathi</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Made with ❤️ in India.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Features</Link></li>
                <li><Link href="#" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="#" className="hover:text-primary">Success Stories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Career Blog</Link></li>
                <li><Link href="#" className="hover:text-primary">Resume Guide</Link></li>
                <li><Link href="#" className="hover:text-primary">Salary Calculator</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground pt-8 border-t border-muted/20">
            © 2024 JobSaathi. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
