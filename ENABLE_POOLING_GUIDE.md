# HOW TO ENABLE CONNECTION POOLING IN SUPABASE

## Current Status:
✅ OAuth working (SECRET_KEY fixed)
❌ Database failing (IPv6 not supported by Render)

## THE ONLY FIX: Enable Connection Pooling

### Step 1: Go to Database Settings
1. Open: https://supabase.com/dashboard/project/eabkwiklxjbqbfxcdlkk/settings/database
2. Scroll down the page

### Step 2: Find "Connection Pooling" Section
Look for a section that says one of these:
- "Connection Pooling"
- "Pooler Configuration"
- "Session Pooler"
- "Transaction Pooler"

### Step 3: Enable It
You'll see one of these:
- **Toggle switch** - Turn it ON (should turn green)
- **"Enable" button** - Click it
- **"Configure" button** - Click it, then enable

### Step 4: Get the Connection String
After enabling, you'll see connection strings appear.

Look for:
- **"Session Pooler"** or **"Session mode"**
- **URI** format
- Port **5432** or **6543**

It will look like:
```
postgresql://postgres.PROJECT_ID:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:XXXX/postgres
```

### Step 5: Copy and Modify
1. Copy that string
2. Replace `[YOUR-PASSWORD]` with `23110081aiiTgn`
3. The final string should be:
   ```
   postgresql://postgres.eabkwiklxjbqbfxcdlkk:23110081aiiTgn@aws-0-ap-south-1.pooler.supabase.com:XXXX/postgres
   ```
   (XXXX will be 5432 or 6543)

### Step 6: Update Render
1. Go to: https://dashboard.render.com
2. Click: jobika-pyt → Environment
3. Find: `DATABASE_URL`
4. Replace with the new pooler connection string
5. Save Changes
6. Manual Deploy → Deploy latest commit

---

## IF YOU CAN'T FIND CONNECTION POOLING OPTION:

### Option A: Check Your Supabase Plan
- Free tier might not have Connection Pooling
- You may need to upgrade to Pro plan ($25/month)

### Option B: Purchase IPv4 Add-on
- Supabase Settings → Billing
- Look for "IPv4 Add-on"
- Purchase it ($4/month)
- Then use the direct connection

### Option C: Use a Different Hosting Platform
- Vercel, Railway, or Fly.io might work better
- Or use a platform that supports IPv6

---

## WHAT TO LOOK FOR IN SUPABASE:

When you're on the Database settings page, scroll down and look for ANY of these headings:
- "Connection Pooling"
- "Pooler"
- "Session Pooler"
- "Transaction Pooler"
- "Connection Pool Configuration"

If you see NONE of these, it means:
1. Your plan doesn't support it, OR
2. It's in a different location

Try checking:
- Settings → Database → scroll ALL the way down
- Settings → API → Connection strings
- Project Settings → Database

---

## SCREENSHOT WHAT YOU SEE:

If you can't find it, take a screenshot of your Supabase Database settings page and I can help you locate it.

---

## ALTERNATIVE: Test Connection Pooling Locally

Run this to see if pooling is available:
```bash
cd /Users/roshwinram/Downloads/JoBika_Pyt
python3 test_supabase_connection.py
```

If ALL tests fail, Connection Pooling is definitely not enabled.
