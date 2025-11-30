const request = require('supertest');
const { app, server, db } = require('../server');

describe('API Endpoints', () => {
  afterAll(async () => {
    // Close the server if it exists (it shouldn't in test mode usually, but just in case)
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }
    // Explicitly close the database connection
    if (db) {
        await db.close();
    }
  });

  it('GET /health should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('database');
  });
});
