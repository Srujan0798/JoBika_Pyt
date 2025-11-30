const request = require('supertest');
const { app, server } = require('../server');
const DatabaseManager = require('../database/db');

// Mock the DatabaseManager to avoid actual DB connections during tests
jest.mock('../database/db');

describe('API Health Check', () => {

    beforeAll(() => {
        // Setup mocks if needed
        DatabaseManager.mockImplementation(() => {
            return {
                dbType: 'postgres',
                initializePostgresSchema: jest.fn().mockResolvedValue(true),
                query: jest.fn().mockResolvedValue({ rows: [] }),
                close: jest.fn().mockResolvedValue(true),
                on: jest.fn()
            };
        });
    });

    afterAll(async () => {
        if (server) {
            await server.close();
        }
    });

    it('should return 200 OK for /health', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'healthy');
        expect(res.body).toHaveProperty('database');
    });
});
