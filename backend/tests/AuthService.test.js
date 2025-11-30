const AuthService = require('../services/AuthService');
const DatabaseManager = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../database/db');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
    let authService;
    let mockDbInstance;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup DatabaseManager mock
        mockDbInstance = {
            getUserByEmail: jest.fn(),
            createUser: jest.fn(),
        };
        DatabaseManager.mockImplementation(() => mockDbInstance);

        authService = new AuthService();
    });

    describe('register', () => {
        const userData = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
        };

        it('should register a new user successfully', async () => {
            // Mock user does not exist
            mockDbInstance.getUserByEmail.mockReturnValue(null);

            // Mock password hashing
            bcrypt.hash.mockResolvedValue('hashedPassword');

            // Mock user creation
            const mockInsertResult = { lastInsertRowid: 1 };
            mockDbInstance.createUser.mockReturnValue(mockInsertResult);

            // Mock token generation
            jwt.sign.mockReturnValue('mockToken');

            const result = await authService.register(userData.email, userData.password, userData.name);

            expect(mockDbInstance.getUserByEmail).toHaveBeenCalledWith(userData.email);
            expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
            expect(mockDbInstance.createUser).toHaveBeenCalledWith(
                userData.email,
                'hashedPassword',
                userData.name,
                {}
            );
            expect(result).toEqual({
                success: true,
                userId: 1,
                token: 'mockToken',
                user: { id: 1, email: userData.email, name: userData.name }
            });
        });

        it('should throw error if user already exists', async () => {
            mockDbInstance.getUserByEmail.mockReturnValue({ id: 1, email: userData.email });

            await expect(authService.register(userData.email, userData.password, userData.name))
                .rejects.toThrow('User already exists');

            expect(mockDbInstance.createUser).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        const loginData = {
            email: 'test@example.com',
            password: 'password123'
        };

        const mockUser = {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            password_hash: 'hashedPassword',
            profile_data: '{}'
        };

        it('should login successfully with correct credentials', async () => {
            mockDbInstance.getUserByEmail.mockReturnValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mockToken');

            const result = await authService.login(loginData.email, loginData.password);

            expect(mockDbInstance.getUserByEmail).toHaveBeenCalledWith(loginData.email);
            expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password_hash);
            expect(result).toEqual({
                success: true,
                token: 'mockToken',
                user: expect.objectContaining({
                    id: 1,
                    email: loginData.email
                })
            });
        });

        it('should throw error if user not found', async () => {
            mockDbInstance.getUserByEmail.mockReturnValue(null);

            await expect(authService.login(loginData.email, loginData.password))
                .rejects.toThrow('User not found');
        });

        it('should throw error if password is invalid', async () => {
            mockDbInstance.getUserByEmail.mockReturnValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.login(loginData.email, loginData.password))
                .rejects.toThrow('Invalid password');
        });
    });

    describe('authMiddleware', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                headers: {}
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
        });

        it('should call next if token is valid', () => {
            req.headers.authorization = 'Bearer validToken';
            jwt.verify.mockReturnValue({ userId: 1 });

            authService.authMiddleware(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('validToken', expect.any(String));
            expect(req.userId).toBe(1);
            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if no token provided', () => {
            authService.authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token is invalid', () => {
            req.headers.authorization = 'Bearer invalidToken';
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

            authService.authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
