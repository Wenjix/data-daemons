#!/usr/bin/env python3
"""
Test script to send an email via AgentMail to verify webhook integration.

This script:
1. Lists available inboxes in your AgentMail account
2. Sends a test email to text-pet@agentmail.to
3. Verifies the email triggers the webhook at /feed-by-email

Usage:
    python test_send_email.py                    # Sends to default (Nova)
    python test_send_email.py --daemon nova      # Sends to Nova daemon
    python test_send_email.py --daemon pixel     # Sends to Pixel daemon
    python test_send_email.py --daemon echo      # Sends to Echo daemon
"""

import os
import sys
import argparse
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Configuration
AGENTMAIL_API_KEY = os.getenv("AGENT_MAIL_KEY")
AGENTMAIL_API_BASE = "https://api.agentmail.to/v0"

def check_api_key():
    """Verify API key is configured."""
    if not AGENTMAIL_API_KEY:
        print("[ERROR] AGENT_MAIL_KEY not found in .env.local")
        print("Please ensure your .env.local file contains:")
        print("  AGENT_MAIL_KEY=your_api_key_here")
        sys.exit(1)
    print(f"[OK] API Key loaded: {AGENTMAIL_API_KEY[:20]}...")

def list_inboxes():
    """List all available inboxes in the AgentMail account."""
    print("\n[INFO] Fetching available inboxes...")

    headers = {
        "Authorization": f"Bearer {AGENTMAIL_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(f"{AGENTMAIL_API_BASE}/inboxes", headers=headers)
        response.raise_for_status()

        data = response.json()

        # Handle different response formats
        if isinstance(data, dict) and "inboxes" in data:
            inboxes = data["inboxes"]
        elif isinstance(data, list):
            inboxes = data
        else:
            print(f"[ERROR] Unexpected API response format: {data}")
            return None

        if not inboxes:
            print("[WARN] No inboxes found in your account.")
            print("\nYou may need to create an inbox first:")
            print("  https://docs.agentmail.to/api-reference/inboxes/create")
            return None

        print(f"\n[OK] Found {len(inboxes)} inbox(es):\n")
        for i, inbox in enumerate(inboxes, 1):
            # Check if inbox is a dict or just a string ID
            if isinstance(inbox, dict):
                inbox_id = inbox.get("inbox_id", inbox.get("id", "N/A"))
                username = inbox.get("username", "N/A")
                domain = inbox.get("domain", "agentmail.to")
                email = f"{username}@{domain}"
                print(f"  {i}. Inbox ID: {inbox_id}")
                print(f"     Email: {email}")
            else:
                # Inbox is just an ID string
                print(f"  {i}. Inbox ID: {inbox}")
            print()

        return inboxes

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Error fetching inboxes: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None

def send_test_email(inbox_id, daemon=None):
    """Send a test email to text-pet@agentmail.to with optional daemon routing."""
    # Build recipient email with daemon routing
    if daemon:
        recipient = f"text-pet+{daemon.lower()}@agentmail.to"
        print(f"\n[SEND] Sending test email to {daemon.upper()} daemon...")
    else:
        recipient = "text-pet@agentmail.to"
        print(f"\n[SEND] Sending test email (default routing)...")

    print(f"       From inbox: {inbox_id}")
    print(f"       To: {recipient}")

    headers = {
        "Authorization": f"Bearer {AGENTMAIL_API_KEY}",
        "Content-Type": "application/json"
    }

    # Build subject and body based on daemon target
    if daemon:
        subject_line = f"Test Email for {daemon.upper()} Daemon"
        text_body = (
            f"This is a test email specifically routed to the {daemon.upper()} daemon.\n\n"
            f"Using plus-tag addressing: {recipient}\n\n"
            "This verifies:\n"
            f"- {daemon.upper()} daemon receives and processes feeds independently ✅\n"
            "- Plus-tag routing logic works correctly ✅\n"
            "- Webhook integration is functioning ✅\n\n"
            f"Check Convex database to verify {daemon.upper()}'s traits were updated!"
        )
        html_body = (
            f"<p>This is a <strong>test email</strong> specifically routed to the <strong>{daemon.upper()}</strong> daemon.</p>"
            f"<p>Using plus-tag addressing: <code>{recipient}</code></p>"
            "<p>This verifies:</p>"
            "<ul>"
            f"<li>{daemon.upper()} daemon receives and processes feeds independently ✅</li>"
            "<li>Plus-tag routing logic works correctly ✅</li>"
            "<li>Webhook integration is functioning ✅</li>"
            "</ul>"
            f"<p><em>Check Convex database to verify {daemon.upper()}'s traits were updated!</em></p>"
        )
    else:
        subject_line = "Test Email from Data Daemons"
        text_body = (
            "This is a test email to verify the webhook integration works end-to-end.\n\n"
            "If you receive this email and the webhook processes it correctly:\n"
            "- Your AgentMail inbox is configured ✅\n"
            "- Your webhook endpoint is accessible ✅\n"
            "- The feed processing pipeline is working ✅\n\n"
            "Check your server logs and Convex database for the processed feed!"
        )
        html_body = (
            "<p>This is a <strong>test email</strong> to verify the webhook integration works end-to-end.</p>"
            "<p>If you receive this email and the webhook processes it correctly:</p>"
            "<ul>"
            "<li>Your AgentMail inbox is configured ✅</li>"
            "<li>Your webhook endpoint is accessible ✅</li>"
            "<li>The feed processing pipeline is working ✅</li>"
            "</ul>"
            "<p><em>Check your server logs and Convex database for the processed feed!</em></p>"
        )

    payload = {
        "to": [recipient],
        "subject": subject_line,
        "text": text_body,
        "html": html_body
    }

    try:
        response = requests.post(
            f"{AGENTMAIL_API_BASE}/inboxes/{inbox_id}/messages/send",
            headers=headers,
            json=payload
        )
        response.raise_for_status()

        result = response.json()
        message_id = result.get("message_id", "N/A")
        thread_id = result.get("thread_id", "N/A")

        print("\n[SUCCESS] Email sent successfully!")
        print(f"\n   Message ID: {message_id}")
        print(f"   Thread ID:  {thread_id}")
        print(f"   To:         {recipient}")
        if daemon:
            print(f"   Daemon:     {daemon.upper()}")

        print("\n" + "="*60)
        print("NEXT STEPS:")
        print("="*60)
        print("\n1. Check your server logs at:")
        print("   http://localhost:8000/feed-by-email")
        print("\n2. Verify the webhook was triggered:")
        print("   - Look for POST request in server console")
        print("   - Check for processing messages")
        print("\n3. Check Convex database:")
        print("   - Go to https://woozy-sturgeon-332.convex.cloud")
        print("   - Look in 'feeds' table for new entry")
        print(f"   - Feed ID should match message_id: {message_id}")
        print("\n4. Verify daemon traits were updated:")
        print("   - Check 'daemons' table in Convex")
        print("   - Traits should reflect the email content")
        print("="*60)

        return True

    except requests.exceptions.RequestException as e:
        print(f"\n[ERROR] Error sending email: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return False

def main():
    """Main execution flow."""
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description="Send test email via AgentMail to verify webhook integration"
    )
    parser.add_argument(
        "--daemon",
        choices=["nova", "pixel", "echo"],
        help="Target specific daemon using plus-tag routing (nova, pixel, or echo)"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("AgentMail Test Email Sender")
    if args.daemon:
        print(f"Target: {args.daemon.upper()} Daemon")
    print("=" * 60)

    # Step 1: Check API key
    check_api_key()

    # Step 2: List inboxes
    inboxes = list_inboxes()
    if not inboxes:
        sys.exit(1)

    # Step 3: Select inbox (automatically use first one)
    selected_inbox = inboxes[0]
    inbox_display = selected_inbox if isinstance(selected_inbox, str) else selected_inbox.get('inbox_id', selected_inbox.get('id', 'N/A'))
    print(f"[INFO] Using inbox: {inbox_display}")

    # Extract inbox_id from either string or dict
    if isinstance(selected_inbox, str):
        inbox_id = selected_inbox
    else:
        inbox_id = selected_inbox.get("inbox_id") or selected_inbox.get("id")

    # Step 4: Send email
    success = send_test_email(inbox_id, daemon=args.daemon)

    if success:
        print("\n[OK] Test completed successfully!")
        sys.exit(0)
    else:
        print("\n[ERROR] Test failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
