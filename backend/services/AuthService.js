const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

class AuthService {
    constructor() {
        this.db = db;
        this.saltRounds = 10;
    }

    async register(email, password, name, profileData = {}) {
        try {
            // Check if user exists
            const existingUser = await this.db.getUserByEmail(email);
            if (existingUser) {
                throw new Error('User already exists');
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, this.saltRounds);

            // Create user
            const result = this.db.createUser(email, passwordHash, name, profileData);

            // Generate token
            const token = this.generateToken(result.lastInsertRowid);

            return {
                success: true,
                userId: result.lastInsertRowid,
                token,
                user: { id: result.lastInsertRowid, email, name }
            };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            const user = await this.db.getUserByEmail(email);

            if (!user) {
                throw new Error('User not found');
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                throw new Error('Invalid password');
            }

            // Generate token
            const token = this.generateToken(user.id);

            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    profileData: JSON.parse(user.profile_data || '{}')
                }
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    generateToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Middleware to protect routes
    authMiddleware(req, res, next) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const decoded = this.verifyToken(token);
            req.userId = decoded.userId;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }
}

module.exports = AuthService;
