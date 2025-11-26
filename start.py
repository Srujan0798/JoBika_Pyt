#!/usr/bin/env python3
"""
JoBika - Quick Start Script
Runs the backend server with proper Python 3 compatibility
"""

import os
import sys
import subprocess

def check_python_version():
    """Check if Python version is 3.8+"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required. Current version:", sys.version)
        sys.exit(1)
    print(f"✅ Python version: {sys.version.split()[0]}")

def check_dependencies():
    """Check if all dependencies are installed"""
    try:
        import flask
        import jwt
        print("✅ Dependencies installed")
        return True
    except ImportError as e:
        print(f"⚠️  Missing dependencies: {e}")
        print("Run: pip install -r requirements.txt")
        return False

def main():
    """Main entry point"""
    print("🚀 Starting JoBika Server...")
    print("=" * 50)
    
    # Check Python version
    check_python_version()
    
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    if os.path.exists(backend_dir):
        os.chdir(backend_dir)
        print(f"✅ Changed to backend directory")
    
    # Check dependencies
    if not check_dependencies():
        print("\n💡 Installing dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    # Run migration if needed
    if not os.path.exists('jobika.db'):
        print("\n🗄️  Running database migration...")
        subprocess.run([sys.executable, "migrate_db.py"])
    
    # Start server
    print("\n🌐 Starting Flask server...")
    print("=" * 50)
    subprocess.run([sys.executable, "server.py"])

if __name__ == "__main__":
    main()
