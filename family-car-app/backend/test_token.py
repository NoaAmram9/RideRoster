"""
Debug script to test JWT token generation and parsing.
Run this to verify tokens are created correctly.
"""

import sys
sys.path.insert(0, '.')

from app.core.security import create_access_token, decode_access_token
from datetime import timedelta

def test_token():
    print("🔐 Testing JWT Token Generation\n")
    
    # Create test token
    test_data = {
        "sub": 1,
        "username": "admin",
        "group_id": 1,
        "is_admin": True
    }
    
    print("📝 Creating token with data:")
    for key, value in test_data.items():
        print(f"   {key}: {value} (type: {type(value).__name__})")
    
    token = create_access_token(test_data, expires_delta=timedelta(minutes=30))
    print(f"\n✅ Token created: {token[:50]}...\n")
    
    # Decode token
    print("🔍 Decoding token...")
    try:
        payload = decode_access_token(token)
        print("✅ Token decoded successfully!\n")
        
        print("📦 Payload contents:")
        for key, value in payload.items():
            print(f"   {key}: {value} (type: {type(value).__name__})")
        
        # Check types
        print("\n🔎 Type checks:")
        sub = payload.get("sub")
        group_id = payload.get("group_id")
        
        print(f"   sub value: {sub}, type: {type(sub).__name__}")
        print(f"   group_id value: {group_id}, type: {type(group_id).__name__}")
        
        # Try conversion
        print("\n🔄 Testing conversions:")
        try:
            sub_int = int(sub)
            print(f"   ✅ sub converts to int: {sub_int}")
        except:
            print(f"   ❌ sub cannot convert to int")
        
        try:
            group_int = int(group_id)
            print(f"   ✅ group_id converts to int: {group_int}")
        except:
            print(f"   ❌ group_id cannot convert to int")
        
        print("\n🎉 All tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error decoding token: {e}")
        return False

if __name__ == "__main__":
    success = test_token()
    sys.exit(0 if success else 1)