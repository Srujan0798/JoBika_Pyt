#!/bin/bash
# Properly convert server.js to server.ts

# 1. Copy server.js to server.ts
cp server.js server.ts 2>/dev/null || true

# 2. Convert requires to imports (proper way)
sed -i '' "1i\\
import dns from 'dns';\\
import dotenv from 'dotenv';\\
import express from 'express';\\
import cors from 'cors';\\
import bodyParser from 'body-parser';\\
import morgan from 'morgan';\\
import http from 'http';\\
import { Server } from 'socket.io';\\
import authRoutes from './routes/auth';\\
import userRoutes from './routes/user';\\
import jobRoutes from './routes/jobRoutes';\\
import resumeRoutes from './routes/resumes';\\
import applicationRoutes from './routes/applications';\\
import analyticsRoutes from './routes/analytics';\\
import networkingRoutes from './routes/networking';\\
import paymentRoutes from './routes/payments';\\
import testRoutes from './routes/testRoutes';\\
import cacheRoutes from './routes/cacheRoutes';\\
import errorHandler from './utils/errorHandler';\\
import security from './middleware/security';\\
import authMiddleware from './middleware/auth';\\
import db from './database/db';\\
import AuthService from './services/AuthService';\\
import OrionCoachService from './services/OrionCoachService';\\
import JobScraper from './services/JobScraper';\\
import ATSService from './services/ATSService';\\
import ResumeTailoringService from './services/ResumeTailoringService';\\
import ApplicationFormFiller from './services/ApplicationFormFiller';\\
import EmailService from './services/EmailService';\\
import cache from './utils/CacheService';\\
import logger from './utils/Logger';\\
import { dbCircuitBreaker, apiRetry, gracefulDegradation } from './utils/resiliencePatterns';\\
import { validate, validateQuery, jobSearchSchema, chatMessageSchema, alertSchema, autoApplyRequestSchema, tailorResumeSchema } from './middleware/validation';\\
import { SubscriptionManager } from './middleware/subscription';\\
" server.ts

# 3. Remove old require statements
sed -i '' '/^const dns = require/d' server.ts
sed -i '' '/^require.*dotenv/d' server.ts
sed -i '' '/^const express = require/d' server.ts
sed -i '' '/^const cors = require/d' server.ts
sed -i '' '/^const bodyParser = require/d' server.ts
sed -i '' '/^const morgan = require/d' server.ts
sed -i '' '/^const http = require/d' server.ts
sed -i '' '/^const { Server } = require/d' server.ts
sed -i '' '/^const.*Routes = require/d' server.ts
sed -i '' '/^const errorHandler = require/d' server.ts
sed -i '' '/^const security = require/d' server.ts
sed -i '' '/^const authMiddleware = require/d' server.ts
sed -i '' '/^const db = require/d' server.ts
sed -i '' '/^const.*Service = require/d' server.ts
sed -i '' '/^const cache = require/d' server.ts
sed -i '' '/^const logger = require/d' server.ts
sed -i '' '/^const { dbCircuitBreaker/d' server.ts
sed -i '' '/^const { validate/d' server.ts
sed -i '' '/^const { SubscriptionManager/d' server.ts

# 4. Fix app.use with require
sed -i '' "s/require('\.\/routes\/testRoutes')/testRoutes/g" server.ts
sed -i '' "s/require('\.\/routes\/cacheRoutes')/cacheRoutes/g" server.ts
sed -i '' "s/require('\.\/routes\/auth')/authRoutes/g" server.ts
sed -i '' "s/require('\.\/routes\/user')/userRoutes/g" server.ts
sed -i '' "s/require('\.\/routes\/resumes')/resumeRoutes/g" server.ts
sed -i '' "s/require('\.\/routes\/applications')/applicationRoutes/g" server.ts
sed -i '' "s/require('\.\/routes\/analytics')/analyticsRoutes/g" server.ts
sed -i '' "s/require('\.\/routes\/networking')/networkingRoutes/g" server.ts
sed -i '' "s/require('\.\/routes\/payments')/paymentRoutes/g" server.ts

# 5. Fix module.exports
sed -i '' 's/module\.exports = /export default /g' server.ts

# 6. Remove old .js file
rm server.js 2>/dev/null || true

echo "✅ server.ts properly converted"
