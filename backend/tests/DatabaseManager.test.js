
jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
        on: jest.fn(),
        end: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

jest.mock('better-sqlite3', () => {
    return jest.fn().mockImplementation(() => ({
        prepare: jest.fn(),
        exec: jest.fn(),
        close: jest.fn(),
    }));
}, { virtual: true });

describe('DatabaseManager', () => {
    let DatabaseManager;
    let dbManager;
    let mockPool;
    let mockSqlite;
    let Database;
    let Pool;

    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };

        // Re-require modules after reset to ensure we get the fresh mocks/classes
        Database = require('better-sqlite3');
        const pg = require('pg');
        Pool = pg.Pool;
        DatabaseManager = require('../database/db');

        // Setup mocks on the fresh mock instances
        mockPool = new Pool(); // This uses the mock implementation defined in jest.mock('pg')

        mockSqlite = {
            prepare: jest.fn(),
            exec: jest.fn(),
            close: jest.fn(),
        };

        // Configure the Database mock to return our mockSqlite
        Database.mockImplementation(() => mockSqlite);
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize PostgreSQL in production', () => {
            process.env.NODE_ENV = 'production';
            process.env.DATABASE_URL = 'postgres://user:pass@host:5432/db';

            dbManager = new DatabaseManager();

            expect(Pool).toHaveBeenCalled();
            expect(dbManager.dbType).toBe('postgres');
        });

        it('should initialize SQLite in development (default)', () => {
            delete process.env.NODE_ENV;
            delete process.env.DATABASE_TYPE;
            delete process.env.DATABASE_URL;

            dbManager = new DatabaseManager();

            expect(Database).toHaveBeenCalled();
            expect(dbManager.dbType).toBe('sqlite');
        });

        it('should initialize based on DATABASE_TYPE env var', () => {
            process.env.DATABASE_TYPE = 'postgres';
            process.env.DATABASE_URL = 'postgres://url';

            dbManager = new DatabaseManager();

            expect(dbManager.dbType).toBe('postgres');
            expect(Pool).toHaveBeenCalled();
        });
    });

    describe('PostgreSQL Operations', () => {
        beforeEach(() => {
            process.env.DATABASE_TYPE = 'postgres';
            process.env.DATABASE_URL = 'postgres://url';
            dbManager = new DatabaseManager();
        });

        it('should execute query correctly', async () => {
            const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
            mockPool.query.mockResolvedValue(mockResult);

            const result = await dbManager.query('SELECT * FROM users');

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM users'),
                []
            );
            expect(result.rows).toEqual(mockResult.rows);
        });

        it('should handle query errors', async () => {
            mockPool.query.mockRejectedValue(new Error('DB Error'));

            await expect(dbManager.query('SELECT * FROM users'))
                .rejects.toThrow('DB Error');
        });

        it('should close connection', async () => {
            await dbManager.close();
            expect(mockPool.end).toHaveBeenCalled();
        });
    });

    describe('SQLite Operations', () => {
        beforeEach(() => {
            process.env.DATABASE_TYPE = 'sqlite';
            delete process.env.DATABASE_URL;

            // Database mock is already configured in top-level beforeEach
            // But we need to ensure mockSqlite is the one returned
            Database.mockImplementation(() => mockSqlite);

            dbManager = new DatabaseManager();
        });

        it('should execute SELECT query correctly', async () => {
            const mockStmt = {
                all: jest.fn().mockReturnValue([{ id: 1 }])
            };
            mockSqlite.prepare.mockReturnValue(mockStmt);

            const result = await dbManager.query('SELECT * FROM users');

            expect(mockSqlite.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users'));
            expect(mockStmt.all).toHaveBeenCalled();
            expect(result.rows).toEqual([{ id: 1 }]);
        });

        it('should execute INSERT/UPDATE query correctly', async () => {
            const mockStmt = {
                run: jest.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 })
            };
            mockSqlite.prepare.mockReturnValue(mockStmt);

            const result = await dbManager.query('INSERT INTO users ...');

            expect(mockStmt.run).toHaveBeenCalled();
            expect(result.lastInsertRowid).toBe(1);
        });

        it('should close connection', async () => {
            await dbManager.close();
            expect(mockSqlite.close).toHaveBeenCalled();
        });

        it('should throw error if db not initialized', async () => {
            dbManager.db = null;
            await expect(dbManager.query('SELECT 1')).rejects.toThrow('Database not initialized');
        });
    });

    describe('Safe Query & Helper Methods', () => {
        beforeEach(() => {
            dbManager = new DatabaseManager();
            // Mock internal query method to avoid actual DB calls
            dbManager.query = jest.fn().mockResolvedValue({ rows: [] });
        });

        it('should detect potential SQL injection', async () => {
            await expect(dbManager.safeQuery('SELECT * FROM users WHERE id = ' + '${id}'))
                .rejects.toThrow('SQL injection risk detected');
        });

        it('should pass safe queries', async () => {
            await dbManager.safeQuery('SELECT * FROM users WHERE id = ?', [1]);
            expect(dbManager.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1]);
        });

        it('getUserById should call safeQuery', async () => {
            await dbManager.getUserById(1);
            expect(dbManager.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM users'),
                [1]
            );
        });
    });
});
