from __future__ import annotations

import os
from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from convex import ConvexClient
import hmac
import hashlib
import json
import uuid
from typing import Any, Dict, List, Optional

from schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    EvolveRequest,
    EvolveResponse,
    GenerateNameRequest,
    GenerateNameResponse,
    RemoveBackgroundRequest,
    RemoveBackgroundResponse,
    SpriteData,
    PersonalityTraits,
)
from prompt_builder import build_analysis_prompt, build_evolution_prompt, build_name_prompt
from llm_providers import get_llm_provider, LLMProvider
from personality import build_personality_context
import logging

logger = logging.getLogger(__name__)


load_dotenv()
# Also load optional .env.local from server dir and project root
try:
    load_dotenv(".env.local", override=True)
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"), override=True)
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"), override=True)
except Exception:
    pass

MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"

app = FastAPI(debug=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()


# Convex client bootstrap (supports both CONVEX_URL and VITE_CONVEX_URL)
CONVEX_URL = os.getenv("CONVEX_URL") or os.getenv("VITE_CONVEX_URL") or "http://localhost:8787"
convex_client: Optional[ConvexClient] = None
if CONVEX_URL:
    try:
        convex_client = ConvexClient(CONVEX_URL)
    except Exception:
        convex_client = None

# LLM provider initialization
LLM_FALLBACK_ENABLED = os.getenv("LLM_FALLBACK_ENABLED", "true").lower() == "true"
llm_provider: Optional[LLMProvider] = None
try:
    llm_provider = get_llm_provider(fallback_enabled=LLM_FALLBACK_ENABLED)
    if llm_provider:
        logger.info("LLM provider initialized successfully")
    else:
        logger.warning("No LLM provider available - will use mock mode")
except Exception as e:
    logger.error(f"Failed to initialize LLM provider: {e}")
    llm_provider = None


def _verify_agentmail_signature(raw_body: bytes, header_val: Optional[str]) -> bool:
    # Demo mode: allow bypass via MOCK_MODE or explicit toggle
    if MOCK_MODE or os.getenv("DISABLE_AGENTMAIL_SIGNATURE", "true").lower() == "true":
        return True
    key = os.getenv("AGENT_MAIL_KEY")
    if not key:
        return True
    if not header_val:
        return False
    sig = header_val.strip()
    if sig.lower().startswith("sha256="):
        sig = sig.split("=", 1)[1]
    computed = hmac.new(key.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, computed)


def _whitelist_attachments(attachments: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    if not attachments:
        return []
    allowed = {"image/png", "image/jpeg", "image/webp", "image/gif"}
    clean: List[Dict[str, Any]] = []
    for att in attachments:
        # Support both snake_case (AgentMail format) and camelCase (legacy)
        ctype = (
            att.get("content_type") or
            att.get("contentType") or
            att.get("mime") or
            att.get("type") or
            ""
        ).lower()
        if ctype in allowed:
            clean.append({
                "filename": att.get("filename"),
                "contentType": ctype,
                "size": att.get("size"),
                # retain either base64 or url for downstream if present
                "base64": att.get("base64") or att.get("content"),
                "url": att.get("url"),
            })
    return clean


def _extract_message_fields(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract message fields from various webhook payload formats.

    Handles:
    - Event wrapper format: { event_type: "message.received", message: {...} }
    - Nested message object: { message: { to: [...], subject: "..." } }
    - Flat format: { to: [...], subject: "..." } (for local testing)

    Returns a dict with normalized field names: to, subject, text, html, attachments, message_id
    """
    message_data = payload

    # Try event wrapper format (AgentMail WebSocket API style)
    if "event_type" in payload:
        if payload.get("event_type") == "message.received" and "message" in payload:
            message_data = payload["message"]
    # Try nested message object
    elif "message" in payload and isinstance(payload.get("message"), dict):
        # Check if message contains expected fields
        msg = payload["message"]
        if any(key in msg for key in ["to", "subject", "text", "from", "recipients"]):
            message_data = msg

    # Extract fields with multiple fallback names
    return {
        "to": (
            message_data.get("to") or
            message_data.get("recipients") or
            payload.get("to")  # Fallback to top-level
        ),
        "subject": (
            message_data.get("subject") or
            payload.get("subject")  # Fallback to top-level
        ),
        "text": (
            message_data.get("text") or
            message_data.get("plain") or
            message_data.get("body") or
            message_data.get("text_body") or
            payload.get("text") or  # Fallback to top-level
            payload.get("plain")
        ),
        "html": (
            message_data.get("html") or
            message_data.get("html_body") or
            payload.get("html")  # Fallback to top-level
        ),
        "attachments": (
            message_data.get("attachments") or
            message_data.get("files") or
            payload.get("attachments") or  # Fallback to top-level
            payload.get("files") or
            []
        ),
        "message_id": (
            message_data.get("message_id") or
            message_data.get("messageId") or
            message_data.get("id") or
            payload.get("message_id") or  # Fallback to top-level
            payload.get("messageId") or
            payload.get("id") or
            payload.get("event_id")
        ),
    }


def _resolve_daemon_id(to_field: Any) -> Optional[str]:
    # Accept string or list of strings; route to daemon based on email address
    if convex_client is None:
        return None
    try:
        daemons = convex_client.query("daemons:all", {}) or []
    except Exception:
        daemons = []
    if not daemons:
        return None

    def pick_first():
        return daemons[0]["_id"]

    recipients: List[str] = []
    if isinstance(to_field, str):
        recipients = [to_field]
    elif isinstance(to_field, list):
        recipients = [str(x) for x in to_field]

    # Dedicated mailbox mappings (exact matches take priority)
    mailbox_to_daemon = {
        "nova-pet": "nova",
        "pixel-pet": "pixel",
        "echo-pet": "echo",
    }

    for r in recipients:
        addr = r.strip().lower()
        if "@" not in addr:
            continue
        local = addr.split("@", 1)[0]

        # PRIORITY 1: Check for dedicated mailbox (exact match)
        for mailbox_prefix, daemon_name in mailbox_to_daemon.items():
            if local == mailbox_prefix:
                # Match daemon by name
                for d in daemons:
                    if str(d.get("name", "")).lower() == daemon_name:
                        return d["_id"]

        # PRIORITY 2: Check for plus-tag routing (backward compatibility)
        hint = None
        if "+" in local:
            hint = local.split("+", 1)[1]
        # Try matching by _id or name
        if hint:
            for d in daemons:
                if d.get("_id") == hint:
                    return d["_id"]
            for d in daemons:
                if str(d.get("name", "")).lower() == hint.lower():
                    return d["_id"]

    # PRIORITY 3: Default to first daemon
    return pick_first()


@router.get("/health")
async def health():
    return {"status": "ok", "mock": MOCK_MODE}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    text = payload.text
    file_desc = payload.fileDescription
    image_url = payload.imageUrl
    image_b64 = payload.imageBase64
    current_traits = payload.currentTraits.values or {}
    current_archetype_id = payload.currentArchetypeId

    # Build personality-aware prompt
    prompt = build_analysis_prompt(text, file_desc, payload.currentTraits, current_archetype_id)

    # Determine if we should use LLM or mocks
    use_llm = not MOCK_MODE and llm_provider is not None

    if use_llm:
        try:
            # Call LLM provider
            logger.info("Calling LLM provider for analysis")
            response = llm_provider.generate_content(prompt)

            # Parse JSON response
            result = response.parse_json()

            # Extract trait deltas
            trait_deltas_dict = result.get("traitDeltas", {})
            trait_deltas = [
                {"trait": trait, "delta": trait_deltas_dict.get(trait, 0)}
                for trait in [
                    "Intelligence", "Creativity", "Empathy", "Resilience", "Curiosity",
                    "Humor", "Kindness", "Confidence", "Discipline", "Honesty",
                    "Patience", "Optimism", "Courage", "OpenMindedness", "Prudence",
                    "Adaptability", "Gratitude", "Ambition", "Humility", "Playfulness"
                ]
            ]

            # Extract roast and enforce length constraints
            roast = result.get("roast", "Interesting content!")
            roast = roast[:140]  # Hard limit to 140 chars

            # Generate tags based on content
            tags = []
            if text:
                tags.append("text")
                tags.append("long" if len(text) > 80 else "short")
            if image_url or image_b64:
                tags.append("image")

            # Calculate new archetype after applying trait deltas
            projected_traits = {**current_traits}
            for td in trait_deltas:
                trait_key = td["trait"]
                projected_traits[trait_key] = projected_traits.get(trait_key, 0) + td["delta"]

            projected_traits_obj = PersonalityTraits(values=projected_traits)
            new_personality = build_personality_context(projected_traits_obj, current_archetype_id)

            logger.info(f"LLM analysis successful. Roast: {roast[:50]}... Archetype: {new_personality.archetype_id}")
            return AnalyzeResponse(
                caption=file_desc or (text[:64] if text else None),
                tags=tags,
                roast=roast,
                traitDeltas=trait_deltas,
                newArchetypeId=new_personality.archetype_id,
                topTraits=new_personality.top_traits,
            )

        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            logger.info("Falling back to mock response")
            # Fall through to mock logic

    # Mock mode or LLM fallback
    tags: list[str] = []
    if text:
        length = len(text)
        tags.append("text")
        tags.append("long" if length > 80 else "short")
    if image_url or image_b64:
        tags.append("image")

    # Generate personality context for mock roast
    personality = build_personality_context(payload.currentTraits, current_archetype_id)
    roast = f"{personality.archetype_name} says: Your vibe screams {personality.top_traits[0] if personality.top_traits else 'mystery'} — try harder."[:140]

    deltas = []
    all_traits = [
        "Intelligence","Creativity","Empathy","Resilience","Curiosity","Humor","Kindness","Confidence",
        "Discipline","Honesty","Patience","Optimism","Courage","OpenMindedness","Prudence","Adaptability",
        "Gratitude","Ambition","Humility","Playfulness",
    ]
    for t in all_traits:
        deltas.append({"trait": t, "delta": 0})
    if current_traits:
        top4 = sorted(current_traits.items(), key=lambda kv: kv[1], reverse=True)[:4]
        base_map = {d["trait"]: d["delta"] for d in deltas}
        for trait, _score in top4:
            base_map[trait] = min(3, base_map.get(trait, 0) + 1)
        deltas = [{"trait": t, "delta": base_map[t]} for t in base_map]

    # Calculate new archetype after applying mock deltas
    projected_traits = {**current_traits}
    for d in deltas:
        projected_traits[d["trait"]] = projected_traits.get(d["trait"], 0) + d["delta"]

    projected_traits_obj = PersonalityTraits(values=projected_traits)
    new_personality = build_personality_context(projected_traits_obj, current_archetype_id)

    return AnalyzeResponse(
        caption=file_desc or (text[:64] if text else None),
        tags=tags,
        roast=roast,
        traitDeltas=[{"trait": d["trait"], "delta": d["delta"]} for d in deltas],
        newArchetypeId=new_personality.archetype_id,
        topTraits=new_personality.top_traits,
    )


@router.post("/evolve", response_model=EvolveResponse)
async def evolve(payload: EvolveRequest) -> EvolveResponse:
    pet_state = payload.petState
    stage = pet_state.evolutionStage
    next_map = {"Egg": "Baby", "Baby": "Teen", "Teen": "Adult", "Adult": "Adult"}
    next_stage = next_map.get(stage, "Adult")

    if MOCK_MODE:
        _prompt = build_evolution_prompt(next_stage, pet_state.personalityTraits)
        return EvolveResponse(
            nextStage=next_stage,
            spriteData=SpriteData(
                spriteUrl=f"/static/mock_sprites/{next_stage.lower()}.png",
                silhouetteUrl=f"/static/mock_sprites/{next_stage.lower()}_silhouette.png",
                metadata={"style": "cartoon", "notes": "mock sprite"},
            ),
        )

    raise NotImplementedError("Model-backed evolve not implemented yet")


@router.post("/generate-name", response_model=GenerateNameResponse)
async def generate_name(payload: GenerateNameRequest) -> GenerateNameResponse:
    pet_state = payload.petState
    if MOCK_MODE:
        _prompt = build_name_prompt(pet_state.personalityTraits)
        values = pet_state.personalityTraits.values or {}
        dom = max(values.items(), key=lambda kv: (kv[1], kv[0]))[0] if values else "N"
        initial = dom[0].lower()
        return GenerateNameResponse(name=f"{initial}oggo", rationale=f"Inspired by {dom}")
    raise NotImplementedError("Model-backed name generation not implemented yet")


@router.post("/remove-background", response_model=RemoveBackgroundResponse)
async def remove_background(payload: RemoveBackgroundRequest) -> RemoveBackgroundResponse:
    if MOCK_MODE:
        return RemoveBackgroundResponse(resultUrl=payload.imageUrl, notes="mock passthrough")
    raise NotImplementedError("Background removal not implemented yet")


# Defer router inclusion until after all routes are defined


@router.post("/feed-by-email")
async def feed_by_email(request: Request):
    raw = await request.body()
    sig = request.headers.get("X-AgentMail-Signature")
    if not _verify_agentmail_signature(raw, sig):
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        # Prefer explicit JSON parsing from raw for reliability
        body_text = raw.decode("utf-8", errors="ignore")
        payload = json.loads(body_text)
    except Exception as e:
        # Attempt to parse as form-encoded fallback
        try:
            form = await request.form()
            body_text = form.get("payload") or form.get("data") or ""
            payload = json.loads(body_text) if body_text else {}
        except Exception as e2:
            # Log the error details for debugging
            print(f"[ERROR] Malformed payload - JSON parse error: {e}")
            print(f"[ERROR] Form parse error: {e2}")
            print(f"[ERROR] Raw body preview: {raw[:500]}")
            raise HTTPException(status_code=400, detail="Malformed payload")

    # Debug logging to capture actual webhook structure
    print("=" * 80)
    print("[WEBHOOK DEBUG] Received webhook payload")
    print(f"[WEBHOOK DEBUG] Payload keys: {list(payload.keys())}")
    print(f"[WEBHOOK DEBUG] Full payload: {json.dumps(payload, indent=2)[:2000]}")
    print("=" * 80)

    # Extract fields using smart extraction (handles multiple payload formats)
    fields = _extract_message_fields(payload)

    to_field = fields["to"]
    subject = fields["subject"] or ""
    text = fields["text"] or ""
    html = fields["html"] or ""
    attachments = fields["attachments"] or []
    message_id = fields["message_id"] or str(uuid.uuid4())

    # Debug logging for extracted fields
    print("[WEBHOOK DEBUG] Extracted fields:")
    print(f"  to_field: {to_field}")
    print(f"  subject: {subject}")
    print(f"  text: {text[:100] if text else 'NONE'}...")
    print(f"  message_id: {message_id}")
    print(f"  attachments count: {len(attachments)}")
    print("=" * 80)

    # Choose daemonId based on recipient; fallback to first available
    daemon_id = _resolve_daemon_id(to_field)
    if not daemon_id:
        raise HTTPException(status_code=503, detail="Daemon routing unavailable")

    # Pull daemon traits for analysis context
    daemon_doc = None
    try:
        daemon_doc = convex_client.query("daemons:get", {"id": daemon_id}) if convex_client else None
    except Exception:
        daemon_doc = None

    current_traits = daemon_doc.get("traits", {}) if daemon_doc else {}
    clean_atts = _whitelist_attachments(attachments)

    # Build content summary for feed record
    summary_bits: List[str] = []
    if subject:
        summary_bits.append(subject.strip())
    if text:
        summary_bits.append((text.strip()[:120] + ("…" if len(text.strip()) > 120 else "")))
    content_summary = " | ".join([s for s in summary_bits if s]) or "(no subject/text)"

    now = int(__import__("time").time() * 1000)

    # Idempotency check and start processing
    if convex_client is None:
        raise HTTPException(status_code=503, detail="Convex client unavailable")
    try:
        existing = convex_client.query("feeds:getByFeedId", {"feedId": message_id})
        if not existing:
            convex_client.mutation("feeds:startProcessing", {
                "feedId": message_id,
                "daemonId": daemon_id,
                "source": "email",
                "contentSummary": content_summary,
                "attachmentsMeta": clean_atts,
                "now": now,
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Convex start error: {e}")

    # Invoke shared analysis pipeline (mocked for now)
    try:
        # Prefer text; optionally pass one image if present
        img_b64 = None
        img_url = None
        if clean_atts:
            first = clean_atts[0]
            img_b64 = first.get("base64")
            img_url = first.get("url")

        req = AnalyzeRequest(
            fileName=subject if subject else None,
            fileType=None,
            fileDescription=subject or None,
            text=text or None,
            imageUrl=img_url,
            imageBase64=img_b64,
            currentTraits={"values": current_traits, "active": []},
            dominantTrait=None,
        )
        # Reuse the existing analyze logic
        result: AnalyzeResponse = await analyze(req)
    except HTTPException as he:
        # Convert to Convex error status
        try:
            convex_client.mutation("feeds:errored", {
                "feedId": message_id,
                "errorMessage": he.detail,
                "now": now,
            })
        except Exception:
            pass
        raise he
    except Exception as e:
        try:
            convex_client.mutation("feeds:errored", {
                "feedId": message_id,
                "errorMessage": str(e),
                "now": now,
            })
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Analysis error: {e}")

    # Map trait deltas list to record with all keys present
    base: Dict[str, int] = {
        "Intelligence": 0, "Creativity": 0, "Empathy": 0, "Resilience": 0, "Curiosity": 0,
        "Humor": 0, "Kindness": 0, "Confidence": 0, "Discipline": 0, "Honesty": 0,
        "Patience": 0, "Optimism": 0, "Courage": 0, "OpenMindedness": 0, "Prudence": 0,
        "Adaptability": 0, "Gratitude": 0, "Ambition": 0, "Humility": 0, "Playfulness": 0,
    }
    for d in (result.traitDeltas or []):
        base[d.trait] = d.delta

    try:
        convex_client.mutation("feeds:complete", {
            "feedId": message_id,
            "traitsDelta": base,
            "roast": result.roast or "",
            "now": now,
        })
    except Exception as e:
        # Best-effort completion; if Convex fails, surface as 500
        raise HTTPException(status_code=500, detail=f"Convex complete error: {e}")

    return {
        "status": "success",
        "feedId": message_id,
        "daemonId": daemon_id,
        "source": "email",
    }

# Direct route registration for demo reliability
@app.post("/feed-by-email")
async def feed_by_email_direct(request: Request):
    return await feed_by_email(request)

# Include the router after all endpoints are defined
app.include_router(router)