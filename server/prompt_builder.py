from __future__ import annotations

from typing import Dict, List, Optional
from schemas import PersonalityTraits, TraitKey
from personality import build_personality_context, get_prompt_personality_section


def dominant_trait(traits: PersonalityTraits) -> Optional[TraitKey]:
    if not traits.values:
        return None
    # Ties broken by lexical order for determinism
    return max(traits.values.items(), key=lambda kv: (kv[1], kv[0]))[0]


def build_analysis_prompt(
    text: Optional[str],
    file_description: Optional[str],
    traits: PersonalityTraits,
    current_archetype_id: Optional[str] = None
) -> str:
    """
    Build personality-driven analysis prompt using hybrid archetype + trait system.

    Args:
        text: Content text to analyze
        file_description: Description of file being analyzed
        traits: Current Daemon traits
        current_archetype_id: Current archetype assignment (if any)

    Returns:
        Complete prompt for LLM
    """
    # Build personality context
    personality = build_personality_context(traits, current_archetype_id)
    personality_section = get_prompt_personality_section(personality)

    # Content being analyzed
    content = text or file_description or "N/A"
    content_preview = content[:500] + "..." if len(content) > 500 else content

    # All 20 trait keys for reference
    all_traits = [
        "Intelligence", "Creativity", "Empathy", "Resilience", "Curiosity",
        "Humor", "Kindness", "Confidence", "Discipline", "Honesty",
        "Patience", "Optimism", "Courage", "OpenMindedness", "Prudence",
        "Adaptability", "Gratitude", "Ambition", "Humility", "Playfulness"
    ]

    prompt = f"""You are a Daemon personality analyzer for a Tamagotchi-style pet game.

{personality_section}

Your task is to analyze the following content and respond with TWO things:

1. **Objective Trait Analysis**: Score each of the 20 personality traits based on the content's characteristics.
   - Each trait should receive a delta score between 0 and 3
   - 0 = not present, 1 = slightly present, 2 = moderately present, 3 = strongly present
   - Be objective and content-driven in your scoring

2. **Personality-Driven Roast**: Generate a short, punchy reaction to the content IN CHARACTER as this Daemon.
   - Must reflect your archetype personality ({personality.archetype_name}: {personality.tone_profile})
   - Should be influenced by your top traits: {", ".join(personality.top_traits) if personality.top_traits else "balanced"}
   - Keep it to ~25 words or less, maximum 140 characters
   - Be playful, witty, and memorable
   - Make the roast UNIQUE to your personality - a different Daemon would react differently!

**Content to analyze:**
{content_preview}

**The 20 traits to score:**
{", ".join(all_traits)}

**Response format (MUST be valid JSON):**
{{
  "traitDeltas": {{
    "Intelligence": 0-3,
    "Creativity": 0-3,
    "Empathy": 0-3,
    "Resilience": 0-3,
    "Curiosity": 0-3,
    "Humor": 0-3,
    "Kindness": 0-3,
    "Confidence": 0-3,
    "Discipline": 0-3,
    "Honesty": 0-3,
    "Patience": 0-3,
    "Optimism": 0-3,
    "Courage": 0-3,
    "OpenMindedness": 0-3,
    "Prudence": 0-3,
    "Adaptability": 0-3,
    "Gratitude": 0-3,
    "Ambition": 0-3,
    "Humility": 0-3,
    "Playfulness": 0-3
  }},
  "roast": "Your witty, personality-driven response here (≤140 chars)"
}}

Remember: The roast should sound like YOU, not a generic response!"""

    return prompt


def build_evolution_prompt(stage: str, traits: PersonalityTraits, current_archetype_id: Optional[str] = None) -> str:
    """Build evolution prompt with personality context."""
    personality = build_personality_context(traits, current_archetype_id)
    return (
        f"Evolve sprite for stage '{stage}'. Emphasize personality cues for {personality.archetype_name} archetype "
        f"({personality.tone_profile}). Top traits: {', '.join(personality.top_traits) if personality.top_traits else 'balanced'}. "
        "Return concise style tags and a short rationale."
    )


def build_name_prompt(traits: PersonalityTraits, current_archetype_id: Optional[str] = None) -> str:
    """Build name generation prompt with personality context."""
    personality = build_personality_context(traits, current_archetype_id)
    return (
        f"Generate a short, unique pet name for a {personality.archetype_name} archetype Daemon. "
        f"The name should subtly reflect their personality: {personality.tone_profile}. "
        "Avoid real human names. Be creative!"
    )