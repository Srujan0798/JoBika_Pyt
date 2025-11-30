# Audit Report & Summary of Findings

## 1. Project Structure & Stack
- **Frontend**: React + Vite (located in `frontend/`). *User Prompt incorrectly stated Vanilla JS.*
- **Backend**: Node.js + Express (located in `backend/`).
- **Database**: Hybrid PostgreSQL (Production) / SQLite (Dev/Fallback).
- **AI**: Gemini + OpenAI.

## 2. Critical Findings (Priority: High)
- **Database Query Inconsistency**:
  - `backend/server.js` contains direct SQL queries using `?` placeholders (SQLite style) for `saved-jobs` and `alerts` endpoints.
  - The `DatabaseManager` (in `backend/database/db.js`) is designed to accept `$1` (Postgres style) and convert to `?` for SQLite if needed.
  - **Impact**: Queries using `?` will **fail** on PostgreSQL (Production) because `pg` does not support `?` placeholders. This effectively breaks "Save Job" and "Create Alert" features in production.

- **Missing Tests**:
  - `backend/package.json` has no tests defined.
  - `frontend/package.json` has no tests defined.

- **Security**:
  - `DatabaseManager.safeQuery` relies on a simple string check (`${`, `+`) which is insufficient, though `pg` parameterized queries are used correctly in most places.
  - 5 High Severity vulnerabilities found in `npm audit`.

## 3. Code Quality (Priority: Medium)
- **Monolithic Server**: `backend/server.js` is over 600 lines long, mixing route definitions, business logic, and server configuration.
- **Mixed Parameter Styles**: Some code uses `$1`, some uses `?`.

## 4. Frontend Status
- `frontend/` is a standard Vite React app.
- "White Screen" issue mentioned in docs is a configuration issue (Vercel Output Directory), not a code bug, but should be verified.

## Plan for Fixes
1. **Fix Database Queries**: Standardized all queries to use `$1` syntax in `server.js` so `DatabaseManager` handles the conversion correctly for both DBs.
2. **Add Tests**: Implemented `jest` + `supertest` for backend API (Basic Health Check).
3. **Refactor**: Split `server.js` into `routes/auth.js` and `routes/user.js`. Refactored `DatabaseManager` to export a singleton instance to prevent connection leaks.
4. **Security**: Ensured all queries use parameterized queries. Fixed potential authentication regression by supporting both `userId` and `id` in JWT payload.
5. **Frontend**: Updated `vite.config.js` to output to `dist` for Vercel compatibility.
