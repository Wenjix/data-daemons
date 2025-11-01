"""
Response validation and safety checks for LLM outputs.

Ensures all responses meet length, content, and safety requirements
with graceful fallbacks.
"""

from typing import Dict, List, Optional
import re
import logging

from schemas import TraitKey

logger = logging.getLogger(__name__)

# All 20 valid trait keys
VALID_TRAIT_KEYS: List[TraitKey] = [
    "Intelligence", "Creativity", "Empathy", "Resilience", "Curiosity",
    "Humor", "Kindness", "Confidence", "Discipline", "Honesty",
    "Patience", "Optimism", "Courage", "OpenMindedness", "Prudence",
    "Adaptability", "Gratitude", "Ambition", "Humility", "Playfulness"
]

# Forbidden content patterns (basic safety)
FORBIDDEN_PATTERNS = [
    r'\b(password|token|api[_-]?key|secret|credential)\b',
    r'\b(hack|exploit|vulnerability)\b',
    r'\b(offensive slur patterns)\b',  # Placeholder - expand as needed
]


def validate_roast(roast: str, max_chars: int = 140, max_words: int = 25) -> str:
    """
    Validate and sanitize a roast response.

    Args:
        roast: The roast string to validate
        max_chars: Maximum character limit
        max_words: Maximum word count

    Returns:
        Validated and sanitized roast
    """
    if not roast or not roast.strip():
        logger.warning("Empty roast received, using fallback")
        return "Interesting submission!"

    roast = roast.strip()

    # Check for forbidden content
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, roast, re.IGNORECASE):
            logger.warning(f"Roast contains forbidden content: {pattern}")
            return "Your content is... unique!"

    # Apply length constraints
    word_count = len(roast.split())
    if word_count > max_words:
        logger.info(f"Roast too long ({word_count} words), truncating")
        words = roast.split()[:max_words]
        roast = " ".join(words) + "..."

    if len(roast) > max_chars:
        logger.info(f"Roast exceeds char limit ({len(roast)} chars), truncating")
        roast = roast[:max_chars-3] + "..."

    return roast


def validate_trait_deltas(trait_deltas: Dict[str, int]) -> Dict[TraitKey, int]:
    """
    Validate trait delta dictionary.

    Ensures all 20 traits are present with valid delta values (0-3).

    Args:
        trait_deltas: Dict of trait keys to delta values

    Returns:
        Validated dict with all 20 traits
    """
    validated: Dict[TraitKey, int] = {}

    for trait in VALID_TRAIT_KEYS:
        delta = trait_deltas.get(trait, 0)

        # Validate delta is in range
        if not isinstance(delta, (int, float)):
            logger.warning(f"Invalid delta type for {trait}: {type(delta)}")
            delta = 0
        else:
            delta = int(delta)
            delta = max(0, min(3, delta))  # Clamp to [0, 3]

        validated[trait] = delta

    return validated


def validate_archetype_id(archetype_id: Optional[str]) -> Optional[str]:
    """
    Validate archetype ID.

    Args:
        archetype_id: The archetype ID to validate

    Returns:
        Valid archetype ID or None
    """
    if not archetype_id:
        return None

    # Valid archetype IDs (from archetypes.py)
    VALID_ARCHETYPES = [
        "guardian", "trickster", "sage", "oracle",
        "rebel", "diplomat", "seeker", "jester"
    ]

    archetype_id = archetype_id.lower().strip()

    if archetype_id not in VALID_ARCHETYPES:
        logger.warning(f"Invalid archetype ID: {archetype_id}")
        return None

    return archetype_id


def validate_top_traits(top_traits: List[str], max_traits: int = 3) -> List[TraitKey]:
    """
    Validate top traits list.

    Args:
        top_traits: List of trait keys
        max_traits: Maximum number of traits to return

    Returns:
        Validated list of trait keys
    """
    if not top_traits:
        return []

    validated: List[TraitKey] = []

    for trait in top_traits[:max_traits]:
        if trait in VALID_TRAIT_KEYS:
            validated.append(trait)  # type: ignore
        else:
            logger.warning(f"Invalid trait in top traits: {trait}")

    return validated


def sanitize_llm_response(
    roast: str,
    trait_deltas: Dict[str, int],
    archetype_id: Optional[str] = None,
    top_traits: Optional[List[str]] = None
) -> tuple[str, Dict[TraitKey, int], Optional[str], List[TraitKey]]:
    """
    Sanitize and validate complete LLM response.

    Args:
        roast: The roast string
        trait_deltas: Dict of trait deltas
        archetype_id: Optional archetype ID
        top_traits: Optional list of top traits

    Returns:
        Tuple of (validated_roast, validated_deltas, validated_archetype, validated_top_traits)
    """
    validated_roast = validate_roast(roast)
    validated_deltas = validate_trait_deltas(trait_deltas)
    validated_archetype = validate_archetype_id(archetype_id)
    validated_top_traits = validate_top_traits(top_traits or [])

    return validated_roast, validated_deltas, validated_archetype, validated_top_traits


def get_fallback_response() -> tuple[str, Dict[TraitKey, int]]:
    """
    Get fallback response when LLM fails completely.

    Returns:
        Tuple of (fallback_roast, zero_deltas)
    """
    fallback_roast = "I'm processing this... give me a moment to think!"
    zero_deltas = {trait: 0 for trait in VALID_TRAIT_KEYS}

    return fallback_roast, zero_deltas
