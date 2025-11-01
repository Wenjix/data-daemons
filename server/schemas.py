from __future__ import annotations

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field

# Canonical trait keys aligned with Unity TraitDefinitions.cs
TraitKey = Literal[
    "Intelligence",
    "Creativity",
    "Empathy",
    "Resilience",
    "Curiosity",
    "Humor",
    "Kindness",
    "Confidence",
    "Discipline",
    "Honesty",
    "Patience",
    "Optimism",
    "Courage",
    "OpenMindedness",
    "Prudence",
    "Adaptability",
    "Gratitude",
    "Ambition",
    "Humility",
    "Playfulness",
]


class PersonalityTraits(BaseModel):
    # All 20 traits; values are accumulated intensities (non-negative integers)
    values: Dict[TraitKey, int] = Field(default_factory=dict)
    # Subset displayed as active (stage-dependent count)
    active: List[TraitKey] = Field(default_factory=list)


class TraitDelta(BaseModel):
    # Delta for a single trait in [0..3]
    trait: TraitKey
    delta: int = Field(ge=0, le=3)


class EvolutionStage(str):
    Egg = "Egg"
    Baby = "Baby"
    Teen = "Teen"
    Adult = "Adult"


class PetState(BaseModel):
    petId: Optional[str] = None
    petName: Optional[str] = None
    evolutionStage: str = EvolutionStage.Egg
    currentSpriteUrl: Optional[str] = None
    personalityTraits: PersonalityTraits = Field(default_factory=PersonalityTraits)
    feedsSinceEvolution: int = 0
    satisfactionMeter: int = 0  # Only used in Egg stage
    activeTraitCount: int = 0
    generationPrompt: Optional[str] = None


class AnalyzeRequest(BaseModel):
    fileName: Optional[str] = None
    fileType: Optional[str] = None  # mime or extension
    fileDescription: Optional[str] = None
    # If text-only feed
    text: Optional[str] = None
    # If image feed (base64 or URL)
    imageUrl: Optional[str] = None
    imageBase64: Optional[str] = None
    currentTraits: PersonalityTraits = Field(default_factory=PersonalityTraits)
    dominantTrait: Optional[TraitKey] = None
    currentArchetypeId: Optional[str] = None


class AnalyzeResponse(BaseModel):
    caption: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    roast: Optional[str] = None
    traitDeltas: List[TraitDelta] = Field(default_factory=list)
    newArchetypeId: Optional[str] = None
    topTraits: List[str] = Field(default_factory=list)


class EvolveRequest(BaseModel):
    petState: PetState


class SpriteData(BaseModel):
    spriteUrl: Optional[str] = None
    silhouetteUrl: Optional[str] = None
    metadata: Dict[str, str] = Field(default_factory=dict)


class EvolveResponse(BaseModel):
    nextStage: str
    spriteData: SpriteData


class GenerateNameRequest(BaseModel):
    petState: PetState


class GenerateNameResponse(BaseModel):
    name: str
    rationale: Optional[str] = None


class RemoveBackgroundRequest(BaseModel):
    imageUrl: Optional[str] = None
    imageBase64: Optional[str] = None


class RemoveBackgroundResponse(BaseModel):
    resultUrl: Optional[str] = None
    notes: Optional[str] = None