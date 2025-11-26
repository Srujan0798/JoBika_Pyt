import requests
import time

url = "http://localhost:5000/api/auth/login"
data = {"email": "test@example.com", "password": "password"}

print("Testing Rate Limit (Limit: 5 per minute)...")
for i in range(10):
    try:
        response = requests.post(url, json=data)
        print(f"Request {i+1}: {response.status_code}")
        if response.status_code == 429:
            print("✅ Rate limit hit! Test Passed.")
            break
    except Exception as e:
        print(f"Request failed: {e}")
    time.sleep(0.2)
