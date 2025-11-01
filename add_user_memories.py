"""
Script to add user-level memories to Hyperspell.
These memories represent user preferences and characteristics that all daemons can access.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Add server directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "server"))

from hyperspell import Hyperspell

def add_user_memories():
    """Add user-level memories to Hyperspell."""

    # Initialize Hyperspell client
    api_key = os.getenv("HYPERSPELL_API_KEY")
    if not api_key:
        print("[ERROR] HYPERSPELL_API_KEY not found in environment")
        return False

    # Set the token environment variable
    os.environ["HYPERSPELL_TOKEN"] = api_key
    client = Hyperspell()

    # Define user memories
    user_memories = [
        {
            "title": "Food Preference: Chinese Food",
            "text": "The user loves Chinese food. This is an important dietary preference to remember when suggesting restaurants, meals, or food-related activities.",
            "category": "personal/food"
        },
        {
            "title": "Professional Identity: Startup Founder",
            "text": "The user has a startup founder grindset. They are entrepreneurial, driven, and focused on building and scaling businesses. They value hustle, innovation, and growth.",
            "category": "professional/identity"
        },
        {
            "title": "Interest: Hackathons",
            "text": "The user loves hackathons. They enjoy rapid prototyping, collaborative coding events, and the energy of building projects in short timeframes. This reflects their hands-on, maker mindset.",
            "category": "interests/events"
        },
        {
            "title": "Interest: Traveling",
            "text": "The user loves traveling. They enjoy exploring new places, experiencing different cultures, and having adventures. This is a key part of their lifestyle and personal fulfillment.",
            "category": "interests/lifestyle"
        },
        {
            "title": "Interest: Computer Games",
            "text": "The user loves computer games. Gaming is one of their hobbies and entertainment preferences. This could relate to game design, esports, or casual gaming.",
            "category": "interests/entertainment"
        },
        {
            "title": "Social Preference: Meeting New People",
            "text": "The user likes meeting new people. They are social, open to networking, and enjoy expanding their connections. This is valuable for both personal and professional contexts.",
            "category": "personal/social"
        },
        {
            "title": "Business Need: Seeking Investors",
            "text": "The user needs investors. They are actively seeking funding for their startup or business ventures. This is a critical professional goal and a key context for business-related interactions.",
            "category": "professional/needs"
        }
    ]

    print(f"Adding {len(user_memories)} user memories to Hyperspell...")
    print("=" * 80)

    success_count = 0
    for i, memory in enumerate(user_memories, 1):
        try:
            result = client.memories.add(
                text=memory["text"],
                title=memory["title"],
                collection="user-profile",
                resource_id=f"user-pref-{i}"
            )

            print(f"[{i}/{len(user_memories)}] Added: {memory['title']}")
            print(f"           Status: {result.status}")
            print(f"           Category: {memory['category']}")
            success_count += 1

        except Exception as e:
            print(f"[{i}/{len(user_memories)}] FAILED: {memory['title']}")
            print(f"           Error: {e}")

    print("=" * 80)
    print(f"\nCompleted! Successfully added {success_count}/{len(user_memories)} memories.")

    if success_count == len(user_memories):
        print("\n✓ All user memories have been added to Hyperspell!")
        print("✓ Collection: user-profile")
        print("✓ These memories are now accessible to all daemons and the Pet Manager")
        return True
    else:
        print(f"\n⚠ Warning: Only {success_count} out of {len(user_memories)} memories were added.")
        return False

if __name__ == "__main__":
    success = add_user_memories()
    sys.exit(0 if success else 1)
