import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-primary mb-4">Welcome to JoBika</h1>
            <p className="text-xl text-muted-foreground mb-8">Your AI Career Copilot - Made for India</p>
            <div className="flex gap-4">
                <button
                    onClick={async () => {
                        try {
                            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/guest`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                            });
                            const data = await response.json();
                            if (data.success) {
                                localStorage.setItem('token', data.token);
                                localStorage.setItem('user', JSON.stringify(data.user));
                                window.location.href = '/dashboard';
                            }
                        } catch (error) {
                            console.error('Guest login failed:', error);
                        }
                    }}
                    className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
                >
                    Try Demo (No Login)
                </button>
                <Link to="/login" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Login
                </Link>
                <Link to="/signup" className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors">
                    Sign Up
                </Link>
            </div>
            <div className="mt-12 text-sm text-muted-foreground">
                v4.0 - RED THEME TEST
            </div>
        </div>
    );
};

export default Landing;
