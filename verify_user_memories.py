"""
Script to verify user memories were added to Hyperspell.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Add server directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "server"))

from hyperspell import Hyperspell

def verify_user_memories():
    """Search for and display user memories."""

    api_key = os.getenv("HYPERSPELL_API_KEY")
    if not api_key:
        print("[ERROR] HYPERSPELL_API_KEY not found")
        return

    os.environ["HYPERSPELL_TOKEN"] = api_key
    client = Hyperspell()

    print("Searching for user profile memories...")
    print("=" * 80)

    try:
        # Search for user memories
        response = client.memories.search(
            query="user preferences profile",
            max_results=20
        )

        if hasattr(response, 'results') and response.results:
            print(f"\nFound {len(response.results)} memories:\n")

            for i, result in enumerate(response.results, 1):
                title = result.title if hasattr(result, 'title') else "No title"
                content = result.content if hasattr(result, 'content') else "No content"

                print(f"{i}. {title}")
                print(f"   {content[:150]}...")
                print()

        else:
            print("\nNo memories found yet. They may still be processing.")
            print("Wait a few seconds and try again.")

    except Exception as e:
        print(f"[ERROR] Failed to search memories: {e}")

    print("=" * 80)
    print("\nTo view all memories, visit: https://app.hyperspell.com")

if __name__ == "__main__":
    verify_user_memories()
