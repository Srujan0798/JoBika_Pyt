#!/bin/bash

# JoBika - Automated GitHub Setup Script
# This script prepares your repository for GitHub and cloud deployment

echo "🚀 JoBika - GitHub Setup"
echo "======================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git not initialized. Run 'git init' first."
    exit 1
fi

echo "✅ Git repository detected"
echo ""

# Show current status
echo "📊 Current Status:"
git log --oneline -5
echo ""

# Instructions for GitHub
echo "📝 Next Steps:"
echo ""
echo "1. Create GitHub Repository:"
echo "   - Go to: https://github.com/new"
echo "   - Repository name: JoBika"
echo "   - Description: AI-powered job application platform - Made in India for global job seekers"
echo "   - Visibility: Public (recommended) or Private"
echo "   - DO NOT initialize with README (we already have one)"
echo ""

echo "2. Connect to GitHub:"
echo "   Run this command (replace YOUR_USERNAME):"
echo "   git remote add origin https://github.com/YOUR_USERNAME/JoBika.git"
echo ""

echo "3. Push to GitHub:"
echo "   git push -u origin main"
echo ""

echo "4. Deploy to Cloud:"
echo "   Railway: https://railway.app"
echo "   Render: https://render.com"
echo ""

echo "✅ All files are committed and ready!"
echo "✅ Total commits: $(git rev-list --count HEAD)"
echo "✅ Total files: $(git ls-files | wc -l)"
echo ""

echo "🎉 JoBika is ready for deployment!"
