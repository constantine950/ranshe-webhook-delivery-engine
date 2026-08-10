import asyncio
import httpx

BASE_URL = "http://localhost:8000"


async def seed():
    async with httpx.AsyncClient() as client:

        # 1. Register user
        print("Creating user...")
        await client.post(f"{BASE_URL}/auth/register", json={
            "email": "admin@example.com",
            "password": "password123"
        })

        # 2. Login
        print("Logging in...")
        res = await client.post(f"{BASE_URL}/auth/login", json={
            "email": "admin@example.com",
            "password": "password123"
        })
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Create webhooks
        print("Creating webhooks...")
        wh1 = await client.post(f"{BASE_URL}/webhooks", json={
            "name": "Payment Service",
            "url": "https://webhook.site/2e5fa28f-5dae-49bc-8b2b-c47d459bd5f7"
        }, headers=headers)
        wh1_id = wh1.json()["id"]

        wh2 = await client.post(f"{BASE_URL}/webhooks", json={
            "name": "Email Service",
            "url": "https://webhook.site/64206348-f47b-4867-bb73-c290a3f0c876"
        }, headers=headers)
        wh2_id = wh2.json()["id"]

        wh3 = await client.post(f"{BASE_URL}/webhooks", json={
            "name": "Dead Service",
            "url": "https://this-service-is-down.example.com/webhook"
        }, headers=headers)
        wh3_id = wh3.json()["id"]

        # 4. Send events
        print("Sending events...")
        events = [
            {"webhook_id": wh1_id, "payload": {"user_id": "123",
                                               "email": "john@example.com"}, "event_type": "user.signup"},
            {"webhook_id": wh1_id, "payload": {"order_id": "456",
                                               "amount": 99.99}, "event_type": "order.created"},
            {"webhook_id": wh2_id, "payload": {"to": "jane@example.com",
                                               "subject": "Welcome"}, "event_type": "email.send"},
            {"webhook_id": wh3_id, "payload": {
                "data": "this will fail"}, "event_type": "test.failure"},
        ]

        for event in events:
            await client.post(f"{BASE_URL}/events", json=event, headers=headers)

        print("✅ Seed complete!")
        print(f"   Email: admin@example.com")
        print(f"   Password: password123")

asyncio.run(seed())
