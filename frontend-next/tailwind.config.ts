import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#FF6B35", // Vibrant Orange (India)
                    foreground: "#FFFFFF",
                },
                secondary: {
                    DEFAULT: "#004E98", // Deep Blue
                    foreground: "#FFFFFF",
                },
                accent: {
                    DEFAULT: "#138808", // India Green
                    foreground: "#FFFFFF",
                },
                muted: {
                    DEFAULT: "#F3F4F6",
                    foreground: "#6B7280",
                },
                card: {
                    DEFAULT: "#FFFFFF",
                    foreground: "#1F2937",
                },
            },
            animation: {
                "fade-in-up": "fadeInUp 0.5s ease-out",
            },
            keyframes: {
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
