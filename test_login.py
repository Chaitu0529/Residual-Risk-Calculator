import urllib.request, json

# Test direct backend
url = "http://localhost:8080/auth/login"
payload = json.dumps({"username": "admin", "password": "Admin@123456"}).encode()
req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    print("DIRECT BACKEND: OK")
    print("  token:", data["data"]["token"][:30] + "...")
    print("  roles:", data["data"]["roles"])
except Exception as e:
    print("DIRECT BACKEND ERROR:", e)

# Test via nginx proxy (port 3000)
url2 = "http://localhost:3000/auth/login"
req2 = urllib.request.Request(url2, data=payload, headers={"Content-Type": "application/json"})
try:
    resp2 = urllib.request.urlopen(req2)
    data2 = json.loads(resp2.read().decode())
    print("\nVIA NGINX (port 3000): OK")
    print("  token:", data2["data"]["token"][:30] + "...")
except Exception as e:
    print("\nVIA NGINX ERROR:", e)
