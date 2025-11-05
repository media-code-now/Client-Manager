#!/usr/bin/env python3
import requests
import json

def test_auth_endpoints():
    base_url = "http://localhost:5001"
    
    print("🧪 Testing CRM Auth Backend...\n")
    
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        health_response = requests.get(f"{base_url}/health", timeout=5)
        print(f"Health Status: {health_response.status_code}")
        print(f"Health Response: {health_response.text}\n")
        
        # Test registration
        print("Testing registration endpoint...")
        register_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123"
        }
        
        register_response = requests.post(
            f"{base_url}/auth/register",
            json=register_data,
            timeout=5
        )
        print(f"Register Status: {register_response.status_code}")
        print(f"Register Response: {register_response.text}\n")
        
        # Test login
        print("Testing login endpoint...")
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        login_response = requests.post(
            f"{base_url}/auth/login",
            json=login_data,
            timeout=5
        )
        print(f"Login Status: {login_response.status_code}")
        print(f"Login Response: {login_response.text}\n")
        
        print("✅ All tests completed!")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_auth_endpoints()