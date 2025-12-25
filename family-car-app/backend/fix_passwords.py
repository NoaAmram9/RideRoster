"""
Script to fix password hashes in the database.
Run this after installing the updated requirements.
"""

from passlib.context import CryptContext
import mysql.connector
from getpass import getpass

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)

def main():
    print("🔧 Family Car Manager - Password Hash Fixer\n")
    
    # Get database credentials
    db_host = input("MySQL Host [localhost]: ").strip() or "localhost"
    db_user = input("MySQL User [root]: ").strip() or "root"
    db_password = getpass("MySQL Password: ")
    db_name = input("Database Name [family_car_db]: ").strip() or "family_car_db"
    
    try:
        # Connect to database
        print("\n🔌 Connecting to database...")
        conn = mysql.connector.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name
        )
        cursor = conn.cursor()
        
        # Generate new password hashes
        admin_hash = get_password_hash("admin123")
        user_hash = get_password_hash("user123")
        
        print("🔐 Generating new password hashes...")
        
        # Update admin password
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE username = 'admin'",
            (admin_hash,)
        )
        
        # Update other users passwords
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE username IN ('john', 'jane')",
            (user_hash,)
        )
        
        # Commit changes
        conn.commit()
        
        # Verify
        cursor.execute("SELECT username, LEFT(password_hash, 20) FROM users")
        users = cursor.fetchall()
        
        print("\n✅ Passwords updated successfully!\n")
        print("Updated users:")
        for username, hash_preview in users:
            print(f"  - {username}: {hash_preview}...")
        
        print("\n📝 Login credentials:")
        print("  Username: admin")
        print("  Password: admin123")
        print("\n  Username: john/jane")
        print("  Password: user123")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"\n❌ Database error: {err}")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 Done! You can now login to the application.")
    else:
        print("\n😞 Something went wrong. Please check the error and try again.")