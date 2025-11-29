# Meta-Grade SRE Agent - Quick Start Guide

## 🚀 Start the Agent

```bash
# Install Python dependencies
pip3 install requests

# Run for 5 hours (300 minutes)
python3 backend/scripts/async_sre_agent.py 300

# Or run indefinitely (Ctrl+C to stop)
python3 backend/scripts/async_sre_agent.py
```

## 🎛️ Configuration

Set these environment variables in `.env`:

```bash
# LLM Provider (gemini, openai, claude, ollama)
SRE_LLM_PROVIDER=gemini

# API Keys (use the one for your provider)
GEMINI_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here

# Safety Settings
SRE_SAFETY_MODE=true  # Requires approval before fixes  
SRE_MAX_FIXES_PER_HOUR=10  # Prevents runaway fixes
```

## 🧠 How It Works

1. **Monitors** - Scans logs every 60 seconds
2. **Detects** - Matches errors against 350+ known patterns
3. **Analyzes** - Sends to Gemini/GPT-4 for fix generation
4. **Applies** - Auto-fixes if confidence > 85%
5. **Reports** - Saves all fixes to `backend/sre_report.json`

## 🛡️ Safety Features

-Auto-backup before every fix
- Max fixes per hour limit
- Human approval for critical changes (SAFETY_MODE=true)
- Incident reports saved for review

## 📊 What It Fixes

- Database connection issues
- Memory leaks
- Network timeouts
- Security vulnerabilities
- Performance bottlenecks
- Frontend errors
- And 350+ more patterns!

## 🔍 Diagnostics

Run comprehensive system check:
```bash
./backend/scripts/diagnostics.sh
```

## 📝 Logs

- Agent actions: Console output
- Fixes applied: `backend/sre_report.json`
- Incidents needing review: `backend/incidents/*.json`
- Backups: `*.bak.<timestamp>`

## 🎯 Golden Templates Used

The agent uses battle-tested patterns:
- Circuit Breaker (Netflix)
- Exponential Backoff with Jitter (Uber)
- Graceful Shutdown (Docker/K8s)
- Rate Limiting (Instagram)
- Cache-Aside (Meta)

## 💡 Tips

- Start with SAFETY_MODE=true
- Review `backend/incidents/` for low-confidence fixes
- Check backups before deploying
- Run diagnostics.sh when issues persist
- Increase MAX_FIXES_PER_HOUR gradually

## 🆘 Troubleshooting

**Agent not detecting issues:**
- Check LOG_FILES paths in script
- Ensure logs are being written
- Verify knowledge base exists

**LLM not working:**
- Verify API key is set
- Check network connectivity
- Falls back to rule-based fixes if needed

**Too many false positives:**
- Reduce check frequency (increase sleep time)
- Adjust confidence threshold
- Add patterns to ignore list
