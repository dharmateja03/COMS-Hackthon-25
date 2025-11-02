"""
Quick test script to verify Snowflake connection
"""
import sys
sys.path.insert(0, '/app')

from app.services.snowflake_service import snowflake_service

print("=" * 60)
print("🧪 Testing Snowflake Connection")
print("=" * 60)

# Check if enabled
print(f"\n✓ Snowflake Enabled: {snowflake_service.enabled}")
print(f"✓ Account: {snowflake_service.account}")
print(f"✓ User: {snowflake_service.user}")
print(f"✓ Database: {snowflake_service.database}")
print(f"✓ Warehouse: {snowflake_service.warehouse}")

if snowflake_service.enabled:
    print("\n🔌 Testing connection...")
    try:
        conn = snowflake_service.get_connection()
        print("✅ Connection successful!")

        cursor = conn.cursor()
        cursor.execute("SELECT CURRENT_VERSION()")
        version = cursor.fetchone()[0]
        print(f"✅ Snowflake version: {version}")

        cursor.execute("SELECT CURRENT_DATABASE(), CURRENT_WAREHOUSE()")
        db, wh = cursor.fetchone()
        print(f"✅ Current database: {db}")
        print(f"✅ Current warehouse: {wh}")

        cursor.close()
        conn.close()

        print("\n🎉 Snowflake is fully configured and working!")

    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print("\nℹ️ Make sure you ran the SQL setup script in Snowflake!")
else:
    print("\n❌ Snowflake is not enabled. Check your .env configuration.")

print("=" * 60)
