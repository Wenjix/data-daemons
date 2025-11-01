"""
Quick test script to verify Hyperspell integration.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Add server directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "server"))

from hyperspell_client import add_daemon_memory, get_recent_daemon_memories, search_daemon_memories

def test_hyperspell():
    print("Testing Hyperspell integration...")
    print(f"API Key present: {bool(os.getenv('HYPERSPELL_API_KEY'))}")

    # Test adding a memory
    print("\n1. Adding a test memory...")
    success = add_daemon_memory(
        daemon_id="test-daemon-123",
        daemon_name="TestDaemon",
        caption="Testing Hyperspell integration",
        roast="This is a test roast for the integration",
        source="drag-drop",
        content_type="txt",
        timestamp=1234567890,
    )
    print(f"   Result: {'Success' if success else 'Failed'}")

    # Test searching for memories
    print("\n2. Searching for recent memories...")
    memories = get_recent_daemon_memories("test-daemon-123", limit=5)
    print(f"   Found {len(memories)} memories")
    if memories:
        print(f"   First memory: {memories[0].get('content', '')[:100]}...")

    # Test search with query
    print("\n3. Searching with query 'test'...")
    search_results = search_daemon_memories("test-daemon-123", "test", limit=5)
    print(f"   Found {len(search_results)} results")

    print("\nHyperspell integration test complete!")

if __name__ == "__main__":
    test_hyperspell()
