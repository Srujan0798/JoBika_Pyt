#!/bin/bash
#
# Meta-Grade Diagnostic Command Set
# Use these commands to diagnose production issues
#

echo "=== JoBika Diagnostic Toolkit ==="
echo ""

# === 1. NETWORK & CONNECTIVITY ===
echo "1. NETWORK & CONNECTIVITY"
echo "-------------------------"

# Check if port is open and listening
echo "Checking if port 3000 is listening..."
netstat -tulpn 2>/dev/null | grep :3000 || lsof -i :3000 2>/dev/null

# Check if backend is reachable
echo "Testing backend health endpoint..."
curl -v http://localhost:3000/health 2>&1 | head -20

# Check DNS resolution  
echo "Checking DNS resolution..."
# dig @8.8.8.8 your-domain.com || nslookup your-domain.com

# List all open connections
echo "Connection summary..."
ss -s 2>/dev/null || netstat -s 2>/dev/null | head -20

echo ""

# === 2. LOGS & PROCESSES ===
echo "2. LOGS & PROCESSES"
echo "-------------------"

# Find the heaviest memory processes
echo "Top 5 memory-consuming processes:"
ps aux --sort=-%mem 2>/dev/null | head -n 6 || ps -A -o %mem,pid,comm | sort -nr | head -6

# Find the heaviest CPU processes
echo "Top 5 CPU-consuming processes:"
ps aux --sort=-%cpu 2>/dev/null | head -n 6 || ps -A -o %cpu,pid,comm | sort -nr | head -6

# Check Node.js processes
echo "Node.js processes:"
ps aux | grep node | grep -v grep

# Check if PM2 is running
which pm2 > /dev/null 2>&1 && echo "PM2 processes:" && pm2 list

echo ""

# === 3. DATABASE (Postgres/SQLite) ===
echo "3. DATABASE"
echo "-----------"

# Check if PostgreSQL is running
if command -v psql &> /dev/null; then
    echo "PostgreSQL is installed"
    
    # Check active connections
    echo "Active connections count:"
    psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "Cannot connect to PostgreSQL"
    
    # Find long-running queries
    echo "Long-running queries (>1s):"
    psql -U postgres -c "SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '1 second';" 2>/dev/null
    
    # Check for locks
    echo "Lock count:"
    psql -U postgres -c "SELECT count(*) FROM pg_locks;" 2>/dev/null
else
    echo "PostgreSQL not found - checking for SQLite"
    if [ -f "backend/database/jobika.db" ]; then
        echo "SQLite database found at: backend/database/jobika.db"
        sqlite3 backend/database/jobika.db "SELECT 'Database accessible' as status;" 2>/dev/null
    fi
fi

echo ""

# === 4. DISK & RESOURCES ===
echo "4. DISK & RESOURCES"
echo "-------------------"

# Check disk space
echo "Disk usage:"
df -h | head -5

# Check memory usage
echo "Memory usage:"
free -h 2>/dev/null || vm_stat | head -10

# Check open file descriptors limit
echo "File descriptor limit:"
ulimit -n

# Check actual open files
echo "Currently open files:"
lsof 2>/dev/null | wc -l || echo "lsof not available"

echo ""

# === 5. APPLICATION SPECIFIC ===
echo "5. APPLICATION HEALTH"
echo "---------------------"

# Check if backend directory exists
if [ -d "backend" ]; then
    cd backend || exit
    
    # Check npm packages
    echo "Checking for vulnerable packages..."
    npm audit --json 2>/dev/null | head -20 || echo "npm not found"
    
    # Check for circular dependencies
    if command -v npx &> /dev/null; then
        echo "Checking for circular dependencies..."
        npx madge --circular . 2>/dev/null | head -10 || echo "No circular dependencies or madge not available"
    fi
    
    # Check TypeScript if exists
    if [ -f "tsconfig.json" ]; then
        echo "Running TypeScript type check..."
        npx tsc --noEmit 2>&1 | head -20 || echo "TypeScript check skipped"
    fi
    
    cd ..
else
    echo "Backend directory not found"
fi

# Check logs
echo "Recent error logs (last 20 lines):"
if [ -f "server.log" ]; then
    tail -20 server.log | grep -i "error" || echo "No recent errors in server.log"
else
    echo "server.log not found"
fi

echo ""
echo "=== Diagnostic Complete ==="
echo "Review the output above for any issues."
