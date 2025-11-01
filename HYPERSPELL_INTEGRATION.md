# Hyperspell Integration Guide

## Overview

Hyperspell has been successfully integrated into your data-daemons project to provide memory and context management for your Data Daemons.

## What Was Set Up

### 1. API Key Configuration
- Added `HYPERSPELL_API_KEY` to `.env.local`
- Your API key: `hs2-165-H48UqwCbNCGOnfEjHpT24cLCQCPfabPg`

### 2. SDK Installation
- **Frontend (TypeScript)**: Installed `hyperspell` package via npm
- **Backend (Python)**: Installed `hyperspell` package and added to `requirements.txt`

### 3. Memory Ingestion
Created `server/hyperspell_client.py` with three main functions:

#### `add_daemon_memory()`
Automatically called when feeds are processed to store:
- Daemon name and ID
- Content captions
- Roasts/commentary
- Source (email or drag-drop)
- Content type
- Timestamp

Memories are organized by daemon using collections (`daemon-{daemon_id}`).

#### `search_daemon_memories()`
Search for specific memories related to a daemon using natural language queries.

#### `get_recent_daemon_memories()`
Retrieve the most recent memories for a daemon (used in Pet Manager brainstorm).

### 4. Integration Points

#### Email Feed Processing (`/feed-by-email`)
- Located in: `server/main.py` lines 571-581
- Automatically saves memories to Hyperspell after successful feed analysis

#### Pet Manager Brainstorm (`/pet-manager/brainstorm`)
- Located in: `server/main.py` lines 590-713
- Fetches recent memories from Hyperspell for all daemons
- Synthesizes memories with traits to generate creative brainstorm ideas
- Stores brainstorm results in Convex

## How It Works

### Memory Creation Flow
1. User sends email or drags file to feed a daemon
2. Content is analyzed by Gemini LLM
3. Analysis results (caption, roast, trait deltas) are stored in Convex
4. **NEW**: Memory is added to Hyperspell with:
   - Full context text (daemon name, source, caption, roast)
   - Collection tag for filtering by daemon
   - Title for easy identification
   - Unique resource ID for updates

### Memory Retrieval Flow
1. User clicks "Brainstorm" in Pet Manager
2. Backend fetches all daemon data from Convex
3. **NEW**: For each daemon, retrieves recent memories from Hyperspell
4. Combines traits + memories into LLM prompt
5. Generates creative ideas referencing each daemon's personality and experiences

## Testing

Run the test script to verify integration:
```bash
python test_hyperspell.py
```

Expected output:
- API key detected ✓
- Memory added successfully (status: pending) ✓
- Search functionality working ✓

Note: Newly added memories take a few moments to be indexed and available for search.

## API Usage Examples

### Add a Memory
```python
from server.hyperspell_client import add_daemon_memory

success = add_daemon_memory(
    daemon_id="daemon123",
    daemon_name="Echo",
    caption="User sent a funny cat picture",
    roast="This cat has better style than you!",
    source="email",
    content_type="jpg",
    timestamp=1234567890000
)
```

### Search Memories
```python
from server.hyperspell_client import search_daemon_memories

results = search_daemon_memories(
    daemon_id="daemon123",
    query="cat pictures",
    limit=5
)

for memory in results:
    print(f"Title: {memory['title']}")
    print(f"Content: {memory['content']}")
```

### Get Recent Memories
```python
from server.hyperspell_client import get_recent_daemon_memories

recent = get_recent_daemon_memories(
    daemon_id="daemon123",
    limit=10
)
```

## Architecture

### Collections
Memories are organized into collections by daemon:
- Collection name format: `daemon-{daemon_id}`
- Example: `daemon-abc123`
- Allows efficient filtering and isolation of memories per daemon

### Resource IDs
Each memory has a unique resource ID:
- Format: `{daemon_id}-{timestamp}`
- Enables updates to existing memories
- Prevents duplicates

## Next Steps

### For Development
1. Test the Pet Manager brainstorm with real data
2. Monitor memory creation in Hyperspell dashboard: https://app.hyperspell.com
3. Adjust memory retention and limits as needed

### For Production
1. Consider adding memory deletion for privacy/GDPR
2. Implement memory summarization for long-running daemons
3. Add analytics to track memory usage per daemon
4. Consider memory export features for users

## Troubleshooting

### Memories not appearing in search
- Newly added memories take 1-2 seconds to be indexed
- Check memory status using Hyperspell dashboard

### API key issues
- Verify `HYPERSPELL_API_KEY` is set in `.env.local`
- Ensure the server is restarted after changing environment variables

### Python import errors
- Ensure `hyperspell` is installed: `pip install hyperspell`
- Check virtual environment is activated

## Resources

- Hyperspell Dashboard: https://app.hyperspell.com
- API Keys: https://app.hyperspell.com/api-keys
- Documentation: https://docs.hyperspell.com

## Summary

Hyperspell is now fully integrated into your data-daemons project! Your Data Daemons will automatically remember all the content they consume, and the Pet Manager can synthesize these memories to generate creative ideas that reflect each daemon's unique experiences.
