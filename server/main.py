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

from server.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    EvolveRequest,
    EvolveResponse,
    GenerateNameRequest,
    GenerateNameResponse,
    RemoveBackgroundRequest,
    RemoveBackgroundResponse,
    SpriteData,
)
from server.prompt_builder import build_analysis_prompt, build_evolution_prompt, build_name_prompt


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


def _resolve_daemon_id(to_field: Any) -> Optional[str]:
    # Accept string or list of strings; parse plus-tag as daemon hint
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

    for r in recipients:
        addr = r.strip()
        if "@" not in addr:
            continue
        local = addr.split("@", 1)[0]
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

    # Always build prompt (useful for dev-mode panel), even if returning mocks
    _prompt = build_analysis_prompt(text, file_desc, payload.currentTraits)

    if MOCK_MODE:
        tags: list[str] = []
        if text:
            length = len(text)
            tags.append("text")
            tags.append("long" if length > 80 else "short")
        if image_url or image_b64:
            tags.append("image")

        dom = None
        if current_traits:
            dom = max(current_traits.items(), key=lambda kv: (kv[1], kv[0]))[0]
        roast = f"Your vibe screams {dom or 'mystery'} — try harder."[:80]

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

        return AnalyzeResponse(
            caption=file_desc or (text[:64] if text else None),
            tags=tags,
            roast=roast,
            traitDeltas=[{"trait": d["trait"], "delta": d["delta"]} for d in deltas],
        )

    # TODO: Implement real model call here (Gemini 2.0) and parse outputs
    raise NotImplementedError("Model-backed analyze not implemented yet")


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

    to_field = payload.get("to")
    subject = payload.get("subject") or ""
    text = payload.get("text") or payload.get("plain") or ""
    html = payload.get("html") or ""
    attachments = payload.get("attachments") or payload.get("files") or []
    # Support both snake_case (AgentMail format) and camelCase (legacy)
    message_id = (
        payload.get("message_id") or
        payload.get("messageId") or
        payload.get("id") or
        str(uuid.uuid4())
    )

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