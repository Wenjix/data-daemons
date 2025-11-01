"""
Hyperspell client helper for managing daemon memories.
"""
import os
from typing import Dict, List, Optional, Any
from hyperspell import Hyperspell

# Initialize Hyperspell client
_hyperspell_client: Optional[Hyperspell] = None


def get_hyperspell_client() -> Optional[Hyperspell]:
    """Get or create the Hyperspell client instance."""
    global _hyperspell_client

    if _hyperspell_client is None:
        # Hyperspell expects HYPERSPELL_TOKEN env var, so set it from our API key
        api_key = os.getenv("HYPERSPELL_API_KEY")
        if api_key:
            os.environ["HYPERSPELL_TOKEN"] = api_key
            _hyperspell_client = Hyperspell()

    return _hyperspell_client


def add_daemon_memory(
    daemon_id: str,
    daemon_name: str,
    caption: str,
    roast: str,
    source: str,
    content_type: str,
    timestamp: Optional[int] = None,
) -> bool:
    """
    Add a memory to Hyperspell for a specific daemon.

    Args:
        daemon_id: The unique ID of the daemon
        daemon_name: The name of the daemon
        caption: A caption describing the content
        roast: The roast/commentary generated for this content
        source: The source of the content ("email" or "drag-drop")
        content_type: The type of content (e.g., "txt", "png", "jpg")
        timestamp: Optional timestamp (defaults to current time)

    Returns:
        True if successful, False otherwise
    """
    client = get_hyperspell_client()
    if not client:
        print("[WARNING] Hyperspell client not available - skipping memory write")
        return False

    try:
        # Create memory text that includes all relevant context
        memory_text = f"Daemon: {daemon_name}\nSource: {source}\nContent: {caption}\nRoast: {roast}"

        # Use daemon ID as collection to group memories by daemon
        collection = f"daemon-{daemon_id}"

        # Add memory to Hyperspell
        result = client.memories.add(
            text=memory_text,
            collection=collection,
            title=f"{daemon_name}: {caption[:50]}",
            resource_id=f"{daemon_id}-{timestamp}" if timestamp else None,
        )

        print(f"[INFO] Added memory to Hyperspell for daemon {daemon_name}: {result.status}")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to add memory to Hyperspell: {e}")
        import traceback
        traceback.print_exc()
        return False


def search_daemon_memories(
    daemon_id: str,
    query: str,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Search for memories related to a specific daemon.

    Args:
        daemon_id: The unique ID of the daemon
        query: The search query
        limit: Maximum number of results to return

    Returns:
        List of memory objects with content and metadata
    """
    client = get_hyperspell_client()
    if not client:
        print("[WARNING] Hyperspell client not available - returning empty results")
        return []

    try:
        # Search - filter by collection in query
        search_query = f"{query} daemon:{daemon_id}" if query else f"daemon:{daemon_id}"
        response = client.memories.search(
            query=search_query,
            max_results=limit,
        )

        # Extract results from response
        if hasattr(response, 'results'):
            # Filter results to only include those from this daemon's collection
            collection = f"daemon-{daemon_id}"
            filtered_results = []
            for r in response.results:
                # Check if the result is from the correct collection
                if hasattr(r, 'collection') and r.collection == collection:
                    filtered_results.append({"content": r.content, "title": r.title if hasattr(r, 'title') else ""})
                elif not hasattr(r, 'collection'):
                    # If no collection attribute, include it (backward compatibility)
                    filtered_results.append({"content": r.content, "title": r.title if hasattr(r, 'title') else ""})
            return filtered_results[:limit]
        else:
            return []

    except Exception as e:
        print(f"[ERROR] Failed to search Hyperspell memories: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_recent_daemon_memories(
    daemon_id: str,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Get the most recent memories for a specific daemon.

    Args:
        daemon_id: The unique ID of the daemon
        limit: Maximum number of results to return

    Returns:
        List of memory objects with content and metadata
    """
    client = get_hyperspell_client()
    if not client:
        print("[WARNING] Hyperspell client not available - returning empty results")
        return []

    try:
        # Query for recent memories - use daemon ID in query
        response = client.memories.search(
            query=f"daemon:{daemon_id}",
            max_results=limit,
        )

        # Extract results from response
        if hasattr(response, 'results'):
            # Filter results to only include those from this daemon's collection
            collection = f"daemon-{daemon_id}"
            filtered_results = []
            for r in response.results:
                # Check if the result is from the correct collection
                if hasattr(r, 'collection') and r.collection == collection:
                    filtered_results.append({"content": r.content, "title": r.title if hasattr(r, 'title') else ""})
                elif not hasattr(r, 'collection'):
                    # If no collection attribute, include it (backward compatibility)
                    filtered_results.append({"content": r.content, "title": r.title if hasattr(r, 'title') else ""})
            return filtered_results[:limit]
        else:
            return []

    except Exception as e:
        print(f"[ERROR] Failed to fetch recent memories: {e}")
        import traceback
        traceback.print_exc()
        return []
