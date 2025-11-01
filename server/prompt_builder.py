from __future__ import annotations

from typing import Dict, List, Optional
from server.schemas import PersonalityTraits, TraitKey


def dominant_trait(traits: PersonalityTraits) -> Optional[TraitKey]:
    if not traits.values:
        return None
    # Ties broken by lexical order for determinism
    return max(traits.values.items(), key=lambda kv: (kv[1], kv[0]))[0]


def build_analysis_prompt(text: Optional[str], file_description: Optional[str], traits: PersonalityTraits) -> str:
    dom = dominant_trait(traits)
    dom_val = traits.values.get(dom, 0) if dom else 0
    personality_context = f"Dominant trait: {dom} ({dom_val}/10)."
    content_context = f"Content: {text or file_description or 'N/A'}."
    trait_list = ", ".join(sorted(traits.values.keys())) or "(no traits yet)"
    return (
        "You are an objective content analyzer AND a playful Datagotchi personality. "
        "1) Score each of the 20 traits in [0..3] based on content. "
        "2) Generate a roast (<= 18 words) in the pet voice, influenced by the dominant trait. "
        f"{personality_context} {content_context} Current traits: {trait_list}."
    )


def build_evolution_prompt(stage: str, traits: PersonalityTraits) -> str:
    dom = dominant_trait(traits)
    return (
        f"Evolve sprite for stage '{stage}'. Emphasize personality cues around {dom or 'balanced personality'}. "
        "Return concise style tags and a short rationale."
    )


def build_name_prompt(traits: PersonalityTraits) -> str:
    dom = dominant_trait(traits)
    return (
        "Generate a short, unique pet name. Avoid real names. "
        f"Reflect the dominant trait '{dom or 'balanced'}' subtly."
    )