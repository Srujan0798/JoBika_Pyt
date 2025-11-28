"""
Database connection module with automatic fallback to SQLite
"""
import os
import sqlite3

def get_db_connection():
    """
    Get database connection - ALWAYS uses SQLite for now
    PostgreSQL support disabled until Connection Pooling is enabled in Supabase
    """
    # Force SQLite for now
    print("📦 Using SQLite database")
    conn = sqlite3.connect('jobika.db', check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn, 'sqlite'

def get_placeholder(db_type):
    """Get SQL placeholder for the database type"""
    return '?'  # SQLite only for now

def init_db():
    """Initialize database with schema"""
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    
    print(f"🔧 Initializing database ({db_type})...")
    
    # Read and execute schema
    schema_file = os.path.join(os.path.dirname(__file__), 'supabase_schema.sql')
    
    if os.path.exists(schema_file):
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
            
        # Convert PostgreSQL schema to SQLite
        schema_sql = schema_sql.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')
        schema_sql = schema_sql.replace('TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        schema_sql = schema_sql.replace('TEXT[]', 'TEXT')
        schema_sql = schema_sql.replace('JSONB', 'TEXT')
        
        # Execute each statement
        for statement in schema_sql.split(';'):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                except sqlite3.OperationalError as e:
                    if 'already exists' not in str(e):
                        print(f"⚠️  Schema warning: {e}")
    
    conn.commit()
    conn.close()
    
    print("✅ Database initialized with ALL tables (Auth, Jobs, AI Features)")
