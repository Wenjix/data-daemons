"""
Personality context builder for hybrid archetype + trait system.

Connects Daemon traits to archetypes and generates dynamic personality descriptions
for use in LLM prompts.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

from schemas import PersonalityTraits, TraitKey
from archetypes import (
    assign_archetype,
    get_archetype_description,
    get_top_traits,
    ARCHETYPE_MAP,
    DEFAULT_ARCHETYPE_ID
)


@dataclass
class PersonalityContext:
    """Complete personality context for a Daemon."""
    archetype_id: str
    archetype_name: str
    tone_profile: str
    top_traits: List[TraitKey]
    description: str
    similarity_score: float
    ux_metadata: Dict[str, str]


def build_personality_context(
    traits: PersonalityTraits,
    current_archetype_id: Optional[str] = None,
    trait_threshold: int = 10,
    top_n_traits: int = 3
) -> PersonalityContext:
    """
    Build complete personality context from traits.

    This is the main entry point for converting raw trait data into
    a structured personality that can be used for prompt generation.

    Args:
        traits: Current trait values
        current_archetype_id: Previously assigned archetype (if any)
        trait_threshold: Minimum value for top trait consideration
        top_n_traits: Number of top traits to extract

    Returns:
        PersonalityContext with archetype and dynamic trait info
    """
    # Assign archetype based on trait similarity
    archetype_id, similarity = assign_archetype(
        traits,
        current_archetype_id=current_archetype_id
    )

    # Get top traits for dynamic overlay
    top_traits = get_top_traits(traits, threshold=trait_threshold, top_n=top_n_traits)

    # Get archetype details
    archetype = ARCHETYPE_MAP.get(archetype_id)
    if not archetype:
        archetype = ARCHETYPE_MAP[DEFAULT_ARCHETYPE_ID]

    # Generate description
    description = get_archetype_description(archetype_id, top_traits)

    return PersonalityContext(
        archetype_id=archetype_id,
        archetype_name=archetype.name,
        tone_profile=archetype.tone_profile,
        top_traits=top_traits,
        description=description,
        similarity_score=similarity,
        ux_metadata=archetype.ux_metadata
    )


def get_prompt_personality_section(context: PersonalityContext) -> str:
    """
    Generate the personality section for LLM prompts.

    Args:
        context: Personality context

    Returns:
        Formatted string for inclusion in prompts
    """
    base = f"You are speaking as a {context.archetype_name} archetype Daemon. "
    base += f"Your tone should be: {context.tone_profile}. "

    if context.top_traits:
        trait_list = ", ".join(context.top_traits)
        base += f"Your current strongest traits are: {trait_list}. "
        base += "Let these traits subtly influence your response while maintaining your core archetype personality."

    return base


def format_personality_for_ui(context: PersonalityContext) -> Dict[str, any]:
    """
    Format personality context for UI display.

    Args:
        context: Personality context

    Returns:
        Dict with UI-ready personality data
    """
    return {
        "archetypeId": context.archetype_id,
        "archetypeName": context.archetype_name,
        "emoji": context.ux_metadata.get("emoji", "✨"),
        "color": context.ux_metadata.get("color", "#888888"),
        "topTraits": context.top_traits,
        "description": context.description,
    }


def should_update_archetype(
    current_archetype_id: Optional[str],
    new_archetype_id: str,
    similarity_score: float,
    min_similarity: float = 0.15
) -> bool:
    """
    Determine if archetype should be updated.

    Prevents rapid switching by requiring minimum similarity improvement.

    Args:
        current_archetype_id: Current archetype
        new_archetype_id: Proposed new archetype
        similarity_score: Similarity score of new archetype
        min_similarity: Minimum score for update

    Returns:
        True if archetype should be updated
    """
    # Always update if no current archetype
    if not current_archetype_id:
        return True

    # Update if archetype changed and meets threshold
    if current_archetype_id != new_archetype_id:
        return similarity_score >= min_similarity

    # Don't update if same archetype
    return False
