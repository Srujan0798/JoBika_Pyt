"""
Database Migration Script for Supabase PostgreSQL
Converts SQLite schema to PostgreSQL and creates all tables
"""

import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

load_dotenv()

def get_supabase_connection():
    """Get connection to Supabase PostgreSQL database"""
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    try:
        conn = psycopg2.connect(database_url, sslmode='require')
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        raise

def run_migration():
    """Run the complete database migration"""
    print("🚀 Starting Supabase database migration...")
    
    try:
        # Connect to Supabase
        conn = get_supabase_connection()
        cursor = conn.cursor()
        
        print("✅ Connected to Supabase PostgreSQL")
        
        # Read and execute the schema file
        schema_file = os.path.join(os.path.dirname(__file__), 'supabase_schema.sql')
        
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
        
        # Execute the schema
        print("📝 Creating tables and indexes...")
        cursor.execute(schema_sql)
        conn.commit()
        
        print("✅ Schema created successfully")
        
        # Verify tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"\n📊 Created {len(tables)} tables:")
        for table in tables:
            print(f"  ✓ {table[0]}")
        
        # Verify indexes
        cursor.execute("""
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE schemaname = 'public'
        """)
        
        index_count = cursor.fetchone()[0]
        print(f"\n📈 Created {index_count} indexes")
        
        print("\n🔒 RLS policies: Disabled (using application-level security)")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Migration completed successfully!")
        print("\n📋 Next steps:")
        print("  1. Test database connection from your app")
        print("  2. Verify all API endpoints work")
        print("  3. Deploy to Render")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        return False

def test_connection():
    """Test connection to Supabase"""
    print("🔍 Testing Supabase connection...")
    
    try:
        conn = get_supabase_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        print(f"✅ Connected successfully!")
        print(f"📊 PostgreSQL version: {version[0]}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Test connection only
        test_connection()
    else:
        # Run full migration
        success = run_migration()
        sys.exit(0 if success else 1)
