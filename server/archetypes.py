"""
Archetype system for personality-driven Daemon responses.

Defines personality archetypes with trait centroids and provides logic
for matching Daemons to archetypes based on their trait vectors.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import math

from schemas import TraitKey, PersonalityTraits


# All 20 trait keys for reference
ALL_TRAITS: List[TraitKey] = [
    "Intelligence", "Creativity", "Empathy", "Resilience", "Curiosity",
    "Humor", "Kindness", "Confidence", "Discipline", "Honesty",
    "Patience", "Optimism", "Courage", "OpenMindedness", "Prudence",
    "Adaptability", "Gratitude", "Ambition", "Humility", "Playfulness"
]


@dataclass
class ArchetypeDefinition:
    """Definition of a Daemon personality archetype."""
    id: str
    name: str
    trait_centroid: Dict[TraitKey, float]  # Normalized trait values (0.0 - 1.0)
    tone_profile: str  # Description for LLM prompt
    ux_metadata: Dict[str, str]  # UI hints: color, emoji, etc.


# Define 8 distinct archetypes with normalized trait centroids
ARCHETYPES: List[ArchetypeDefinition] = [
    ArchetypeDefinition(
        id="guardian",
        name="Guardian",
        trait_centroid={
            "Intelligence": 0.6, "Creativity": 0.4, "Empathy": 0.9, "Resilience": 0.8, "Curiosity": 0.5,
            "Humor": 0.4, "Kindness": 0.9, "Confidence": 0.6, "Discipline": 0.7, "Honesty": 0.8,
            "Patience": 0.9, "Optimism": 0.6, "Courage": 0.7, "OpenMindedness": 0.6, "Prudence": 0.8,
            "Adaptability": 0.6, "Gratitude": 0.8, "Ambition": 0.4, "Humility": 0.8, "Playfulness": 0.3
        },
        tone_profile="protective, nurturing, reliable, speaks with gentle wisdom and care",
        ux_metadata={"color": "#4A90E2", "emoji": "🛡️", "animation": "steady-glow"}
    ),
    ArchetypeDefinition(
        id="trickster",
        name="Trickster",
        trait_centroid={
            "Intelligence": 0.7, "Creativity": 0.9, "Empathy": 0.5, "Resilience": 0.6, "Curiosity": 0.8,
            "Humor": 0.9, "Kindness": 0.5, "Confidence": 0.8, "Discipline": 0.3, "Honesty": 0.4,
            "Patience": 0.3, "Optimism": 0.7, "Courage": 0.8, "OpenMindedness": 0.8, "Prudence": 0.2,
            "Adaptability": 0.8, "Gratitude": 0.4, "Ambition": 0.6, "Humility": 0.3, "Playfulness": 0.9
        },
        tone_profile="mischievous, witty, chaotic, loves wordplay and playful teasing",
        ux_metadata={"color": "#9B59B6", "emoji": "🃏", "animation": "bounce-spin"}
    ),
    ArchetypeDefinition(
        id="sage",
        name="Sage",
        trait_centroid={
            "Intelligence": 0.9, "Creativity": 0.6, "Empathy": 0.6, "Resilience": 0.7, "Curiosity": 0.8,
            "Humor": 0.4, "Kindness": 0.6, "Confidence": 0.7, "Discipline": 0.8, "Honesty": 0.9,
            "Patience": 0.8, "Optimism": 0.5, "Courage": 0.6, "OpenMindedness": 0.9, "Prudence": 0.8,
            "Adaptability": 0.7, "Gratitude": 0.6, "Ambition": 0.5, "Humility": 0.7, "Playfulness": 0.2
        },
        tone_profile="analytical, wise, measured, speaks with clarity and philosophical depth",
        ux_metadata={"color": "#2ECC71", "emoji": "📚", "animation": "pulse-glow"}
    ),
    ArchetypeDefinition(
        id="oracle",
        name="Oracle",
        trait_centroid={
            "Intelligence": 0.7, "Creativity": 0.8, "Empathy": 0.8, "Resilience": 0.6, "Curiosity": 0.9,
            "Humor": 0.5, "Kindness": 0.7, "Confidence": 0.6, "Discipline": 0.5, "Honesty": 0.7,
            "Patience": 0.7, "Optimism": 0.7, "Courage": 0.6, "OpenMindedness": 0.9, "Prudence": 0.6,
            "Adaptability": 0.8, "Gratitude": 0.7, "Ambition": 0.5, "Humility": 0.6, "Playfulness": 0.5
        },
        tone_profile="intuitive, mysterious, insightful, speaks in riddles and deep observations",
        ux_metadata={"color": "#8E44AD", "emoji": "🔮", "animation": "shimmer-fade"}
    ),
    ArchetypeDefinition(
        id="rebel",
        name="Rebel",
        trait_centroid={
            "Intelligence": 0.6, "Creativity": 0.7, "Empathy": 0.4, "Resilience": 0.8, "Curiosity": 0.7,
            "Humor": 0.6, "Kindness": 0.4, "Confidence": 0.9, "Discipline": 0.4, "Honesty": 0.7,
            "Patience": 0.3, "Optimism": 0.6, "Courage": 0.9, "OpenMindedness": 0.7, "Prudence": 0.3,
            "Adaptability": 0.7, "Gratitude": 0.3, "Ambition": 0.9, "Humility": 0.2, "Playfulness": 0.6
        },
        tone_profile="bold, defiant, direct, challenges conventions with edgy confidence",
        ux_metadata={"color": "#E74C3C", "emoji": "⚡", "animation": "sharp-flash"}
    ),
    ArchetypeDefinition(
        id="diplomat",
        name="Diplomat",
        trait_centroid={
            "Intelligence": 0.7, "Creativity": 0.5, "Empathy": 0.9, "Resilience": 0.6, "Curiosity": 0.6,
            "Humor": 0.5, "Kindness": 0.9, "Confidence": 0.7, "Discipline": 0.7, "Honesty": 0.8,
            "Patience": 0.9, "Optimism": 0.7, "Courage": 0.6, "OpenMindedness": 0.9, "Prudence": 0.8,
            "Adaptability": 0.8, "Gratitude": 0.8, "Ambition": 0.5, "Humility": 0.8, "Playfulness": 0.4
        },
        tone_profile="tactful, harmonious, balanced, speaks with diplomatic grace and understanding",
        ux_metadata={"color": "#3498DB", "emoji": "🕊️", "animation": "smooth-wave"}
    ),
    ArchetypeDefinition(
        id="seeker",
        name="Seeker",
        trait_centroid={
            "Intelligence": 0.6, "Creativity": 0.7, "Empathy": 0.6, "Resilience": 0.6, "Curiosity": 0.9,
            "Humor": 0.6, "Kindness": 0.6, "Confidence": 0.6, "Discipline": 0.5, "Honesty": 0.7,
            "Patience": 0.6, "Optimism": 0.8, "Courage": 0.7, "OpenMindedness": 0.9, "Prudence": 0.5,
            "Adaptability": 0.9, "Gratitude": 0.7, "Ambition": 0.7, "Humility": 0.6, "Playfulness": 0.7
        },
        tone_profile="curious, adventurous, enthusiastic, always discovering and questioning",
        ux_metadata={"color": "#F39C12", "emoji": "🔍", "animation": "search-sweep"}
    ),
    ArchetypeDefinition(
        id="jester",
        name="Jester",
        trait_centroid={
            "Intelligence": 0.6, "Creativity": 0.8, "Empathy": 0.6, "Resilience": 0.5, "Curiosity": 0.7,
            "Humor": 0.9, "Kindness": 0.7, "Confidence": 0.7, "Discipline": 0.3, "Honesty": 0.6,
            "Patience": 0.4, "Optimism": 0.9, "Courage": 0.6, "OpenMindedness": 0.7, "Prudence": 0.3,
            "Adaptability": 0.7, "Gratitude": 0.7, "Ambition": 0.4, "Humility": 0.5, "Playfulness": 0.9
        },
        tone_profile="jovial, lighthearted, entertaining, turns everything into comedy gold",
        ux_metadata={"color": "#E67E22", "emoji": "🎭", "animation": "wiggle-bounce"}
    )
]

# Create lookup dict for fast access
ARCHETYPE_MAP: Dict[str, ArchetypeDefinition] = {a.id: a for a in ARCHETYPES}

# Default archetype for fallback
DEFAULT_ARCHETYPE_ID = "seeker"


def cosine_similarity(vec1: Dict[TraitKey, float], vec2: Dict[TraitKey, float]) -> float:
    """
    Calculate cosine similarity between two trait vectors.

    Returns value between 0 and 1, where 1 is identical.
    """
    # Ensure all traits are present with 0 as default
    keys = ALL_TRAITS

    dot_product = sum(vec1.get(k, 0.0) * vec2.get(k, 0.0) for k in keys)
    magnitude1 = math.sqrt(sum(vec1.get(k, 0.0) ** 2 for k in keys))
    magnitude2 = math.sqrt(sum(vec2.get(k, 0.0) ** 2 for k in keys))

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    return dot_product / (magnitude1 * magnitude2)


def normalize_traits(traits: Dict[TraitKey, int]) -> Dict[TraitKey, float]:
    """
    Normalize integer trait values to 0.0-1.0 range.

    Assumes trait values are typically in 0-100 range.
    Clamps to max value for normalization.
    """
    if not traits:
        return {k: 0.0 for k in ALL_TRAITS}

    max_value = max(traits.values()) if traits.values() else 1
    if max_value == 0:
        return {k: 0.0 for k in ALL_TRAITS}

    return {k: traits.get(k, 0) / max_value for k in ALL_TRAITS}


def assign_archetype(
    traits: PersonalityTraits,
    current_archetype_id: Optional[str] = None,
    similarity_margin: float = 0.15
) -> Tuple[str, float]:
    """
    Assign an archetype to a Daemon based on trait vector similarity.

    Args:
        traits: Current trait values
        current_archetype_id: Previously assigned archetype (if any)
        similarity_margin: Minimum difference required to switch archetypes

    Returns:
        Tuple of (archetype_id, similarity_score)
    """
    # Normalize trait values
    normalized = normalize_traits(traits.values)

    # Calculate similarities to all archetypes
    similarities = [
        (archetype.id, cosine_similarity(normalized, archetype.trait_centroid))
        for archetype in ARCHETYPES
    ]

    # Sort by similarity (highest first)
    similarities.sort(key=lambda x: x[1], reverse=True)

    best_id, best_score = similarities[0]

    # If daemon has an existing archetype, check margin before switching
    if current_archetype_id and current_archetype_id in ARCHETYPE_MAP:
        current_score = next(
            (score for aid, score in similarities if aid == current_archetype_id),
            0.0
        )

        # Only switch if new archetype is significantly better
        if best_score - current_score < similarity_margin:
            return current_archetype_id, current_score

    return best_id, best_score


def get_top_traits(traits: PersonalityTraits, threshold: int = 10, top_n: int = 3) -> List[TraitKey]:
    """
    Extract top N traits above a threshold value.

    Args:
        traits: Current trait values
        threshold: Minimum value for a trait to be considered
        top_n: Number of top traits to return

    Returns:
        List of top trait keys
    """
    # Filter traits above threshold
    above_threshold = [
        (key, value) for key, value in traits.values.items()
        if value >= threshold
    ]

    # Sort by value (highest first)
    above_threshold.sort(key=lambda x: x[1], reverse=True)

    # Return top N
    return [key for key, _ in above_threshold[:top_n]]


def get_archetype_description(
    archetype_id: str,
    top_traits: Optional[List[TraitKey]] = None
) -> str:
    """
    Generate a personality description combining archetype and dynamic traits.

    Args:
        archetype_id: The assigned archetype ID
        top_traits: Optional list of top current traits

    Returns:
        Human-readable personality description
    """
    archetype = ARCHETYPE_MAP.get(archetype_id)
    if not archetype:
        archetype = ARCHETYPE_MAP[DEFAULT_ARCHETYPE_ID]

    base_description = f"{archetype.name} ({archetype.tone_profile})"

    if top_traits and len(top_traits) > 0:
        trait_str = " and ".join(top_traits[:3])
        dynamic_overlay = f"Currently skewing {trait_str.lower()}"
        return f"{base_description}. {dynamic_overlay}."

    return base_description + "."
