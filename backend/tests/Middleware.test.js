const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
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
        process.env.JWT_SECRET = 'testsecret';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call next if token is valid', () => {
        const mockUser = { id: 1, email: 'test@example.com' };
        req.headers.authorization = 'Bearer validToken';
        jwt.verify.mockReturnValue(mockUser);

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('validToken', 'testsecret');
        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', () => {
        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid or expired', () => {
        req.headers.authorization = 'Bearer invalidToken';
        jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', () => {
        req.headers.authorization = 'Bearer'; // Missing token part

        // Since split(' ')[1] will be undefined
        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });
});
