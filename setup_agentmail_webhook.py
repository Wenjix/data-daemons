#!/usr/bin/env python3
"""
Setup script to configure AgentMail webhook for Data Daemons.

This script:
1. Lists existing webhooks in your AgentMail account
2. Optionally deletes old webhooks
3. Creates a new webhook pointing to your ngrok URL
4. Subscribes to "message.received" events

Usage:
    python setup_agentmail_webhook.py
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Configuration
AGENTMAIL_API_KEY = os.getenv("AGENT_MAIL_KEY")
AGENTMAIL_API_BASE = "https://api.agentmail.to/v0"  # Use v0 like inboxes API
WEBHOOK_URL = "https://unnarrative-terefah-wally.ngrok-free.dev/feed-by-email"

def check_api_key():
    """Verify API key is configured."""
    if not AGENTMAIL_API_KEY:
        print("[ERROR] AGENT_MAIL_KEY not found in .env.local")
        print("Please ensure your .env.local file contains:")
        print("  AGENT_MAIL_KEY=your_api_key_here")
        sys.exit(1)
    print(f"[OK] API Key loaded: {AGENTMAIL_API_KEY[:20]}...")

def list_webhooks():
    """List all existing webhooks."""
    print("\n[INFO] Fetching existing webhooks...")

    headers = {
        "Authorization": f"Bearer {AGENTMAIL_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(f"{AGENTMAIL_API_BASE}/webhooks", headers=headers)
        response.raise_for_status()

        data = response.json()

        # Handle different response formats
        if isinstance(data, dict) and "webhooks" in data:
            webhooks = data["webhooks"]
        elif isinstance(data, list):
            webhooks = data
        else:
            webhooks = []

        if not webhooks:
            print("[INFO] No existing webhooks found.")
            return []

        print(f"\n[OK] Found {len(webhooks)} webhook(s):\n")
        for i, webhook in enumerate(webhooks, 1):
            webhook_id = webhook.get("id") or webhook.get("webhook_id", "N/A")
            url = webhook.get("url", "N/A")
            events = webhook.get("event_types") or webhook.get("events", [])
            print(f"  {i}. ID: {webhook_id}")
            print(f"     URL: {url}")
            print(f"     Events: {', '.join(events)}")
            print()

        return webhooks

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Error fetching webhooks: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return []

def delete_webhook(webhook_id):
    """Delete a webhook by ID."""
    print(f"[INFO] Deleting webhook: {webhook_id}...")

    headers = {
        "Authorization": f"Bearer {AGENTMAIL_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.delete(
            f"{AGENTMAIL_API_BASE}/webhooks/{webhook_id}",
            headers=headers
        )
        response.raise_for_status()
        print(f"[OK] Webhook {webhook_id} deleted successfully.")
        return True

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Error deleting webhook: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return False

def create_webhook(url, event_types=None):
    """Create a new webhook."""
    if event_types is None:
        event_types = ["message.received"]

    print(f"\n[INFO] Creating webhook for: {url}...")

    headers = {
        "Authorization": f"Bearer {AGENTMAIL_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "url": url,
        "event_types": event_types
    }

    try:
        response = requests.post(
            f"{AGENTMAIL_API_BASE}/webhooks",
            headers=headers,
            json=payload
        )
        response.raise_for_status()

        webhook = response.json()
        webhook_id = webhook.get("id") or webhook.get("webhook_id", "N/A")

        print("\n[SUCCESS] Webhook created successfully!")
        print(f"\n   Webhook ID: {webhook_id}")
        print(f"   URL: {url}")
        print(f"   Events: {', '.join(event_types)}")

        print("\n" + "="*60)
        print("WEBHOOK CONFIGURATION COMPLETE")
        print("="*60)
        print("\nYour webhook is now configured to receive AgentMail events!")
        print("\nNext steps:")
        print("1. Ensure your ngrok tunnel is running")
        print("2. Ensure your server is running at http://localhost:8000")
        print("3. Send test emails to verify webhook triggers:")
        print("   - python test_send_email.py --daemon nova")
        print("   - python test_send_email.py --daemon pixel")
        print("   - python test_send_email.py --daemon echo")
        print("="*60)

        return True

    except requests.exceptions.RequestException as e:
        print(f"\n[ERROR] Error creating webhook: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return False

def main():
    """Main execution flow."""
    print("=" * 60)
    print("AgentMail Webhook Setup")
    print("=" * 60)

    # Step 1: Check API key
    check_api_key()

    # Step 2: List existing webhooks
    webhooks = list_webhooks()

    # Step 3: Ask about deleting old webhooks
    if webhooks:
        for webhook in webhooks:
            webhook_id = webhook.get("id") or webhook.get("webhook_id")
            webhook_url = webhook.get("url", "")

            # Delete if URL doesn't match our ngrok URL
            if webhook_url != WEBHOOK_URL:
                print(f"[INFO] Found webhook with different URL: {webhook_url}")
                print(f"[INFO] Will delete and recreate with: {WEBHOOK_URL}")
                delete_webhook(webhook_id)
            else:
                print(f"[INFO] Webhook already configured correctly: {webhook_url}")
                print("[OK] No changes needed!")
                return

    # Step 4: Create new webhook
    success = create_webhook(WEBHOOK_URL)

    if success:
        print("\n[OK] Setup completed successfully!")
        sys.exit(0)
    else:
        print("\n[ERROR] Setup failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
