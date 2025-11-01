"""
Multi-LLM provider abstraction layer.

Supports Gemini, Claude, and OpenAI with unified interface.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import os
import json
import logging

logger = logging.getLogger(__name__)


class LLMResponse:
    """Unified response format from all LLM providers."""

    def __init__(self, content: str, raw_response: Any = None):
        self.content = content
        self.raw_response = raw_response

    def parse_json(self) -> Dict[str, Any]:
        """Parse JSON from response content."""
        try:
            # Try to extract JSON from markdown code blocks if present
            content = self.content.strip()
            if "```json" in content:
                start = content.find("```json") + 7
                end = content.find("```", start)
                content = content[start:end].strip()
            elif "```" in content:
                start = content.find("```") + 3
                end = content.find("```", start)
                content = content[start:end].strip()

            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from LLM response: {e}")
            logger.error(f"Content: {self.content}")
            raise ValueError(f"Invalid JSON in LLM response: {e}")


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    @abstractmethod
    def generate_content(self, prompt: str, **kwargs) -> LLMResponse:
        """
        Generate content from the LLM.

        Args:
            prompt: The prompt to send to the LLM
            **kwargs: Provider-specific options

        Returns:
            LLMResponse with generated content
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if this provider is properly configured and available."""
        pass


class GeminiProvider(LLMProvider):
    """Google Gemini provider implementation."""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key or os.getenv("GEMINI_API_KEY"))
        self.model = None
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
                logger.info("Gemini provider initialized successfully")
            except ImportError:
                logger.warning("google-generativeai package not installed")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")

    def generate_content(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate content using Gemini."""
        if not self.model:
            raise RuntimeError("Gemini model not initialized")

        try:
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": kwargs.get("temperature", 0.7),
                    "max_output_tokens": kwargs.get("max_tokens", 1024),
                }
            )
            return LLMResponse(response.text, response)
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise RuntimeError(f"Gemini API error: {e}")

    def is_available(self) -> bool:
        """Check if Gemini is available."""
        return self.model is not None


class ClaudeProvider(LLMProvider):
    """Anthropic Claude provider implementation."""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key or os.getenv("ANTHROPIC_API_KEY"))
        self.client = None
        if self.api_key:
            try:
                from anthropic import Anthropic
                self.client = Anthropic(api_key=self.api_key)
                logger.info("Claude provider initialized successfully")
            except ImportError:
                logger.warning("anthropic package not installed")
            except Exception as e:
                logger.error(f"Failed to initialize Claude: {e}")

    def generate_content(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate content using Claude."""
        if not self.client:
            raise RuntimeError("Claude client not initialized")

        try:
            response = self.client.messages.create(
                model=kwargs.get("model", "claude-3-5-sonnet-20241022"),
                max_tokens=kwargs.get("max_tokens", 1024),
                temperature=kwargs.get("temperature", 0.7),
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            content = response.content[0].text
            return LLMResponse(content, response)
        except Exception as e:
            logger.error(f"Claude generation failed: {e}")
            raise RuntimeError(f"Claude API error: {e}")

    def is_available(self) -> bool:
        """Check if Claude is available."""
        return self.client is not None


class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider implementation."""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key or os.getenv("OPENAI_API_KEY"))
        self.client = None
        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
                logger.info("OpenAI provider initialized successfully")
            except ImportError:
                logger.warning("openai package not installed")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI: {e}")

    def generate_content(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate content using OpenAI."""
        if not self.client:
            raise RuntimeError("OpenAI client not initialized")

        try:
            response = self.client.chat.completions.create(
                model=kwargs.get("model", "gpt-4o"),
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that responds with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 1024),
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            return LLMResponse(content, response)
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise RuntimeError(f"OpenAI API error: {e}")

    def is_available(self) -> bool:
        """Check if OpenAI is available."""
        return self.client is not None


# Provider registry
PROVIDERS = {
    "gemini": GeminiProvider,
    "claude": ClaudeProvider,
    "openai": OpenAIProvider,
}


def get_llm_provider(
    provider_name: Optional[str] = None,
    api_key: Optional[str] = None,
    fallback_enabled: bool = True
) -> Optional[LLMProvider]:
    """
    Get an LLM provider instance.

    Args:
        provider_name: Name of provider ("gemini", "claude", "openai")
                      If None, uses LLM_PROVIDER env var
        api_key: Optional API key override
        fallback_enabled: If True, try other providers if primary unavailable

    Returns:
        Initialized LLM provider or None if none available
    """
    # Determine which provider to use
    if provider_name is None:
        provider_name = os.getenv("LLM_PROVIDER", "gemini").lower()

    # Try to initialize primary provider
    if provider_name in PROVIDERS:
        provider_class = PROVIDERS[provider_name]
        provider = provider_class(api_key)
        if provider.is_available():
            logger.info(f"Using {provider_name} as LLM provider")
            return provider
        logger.warning(f"Primary provider {provider_name} not available")

    # Try fallback providers if enabled
    if fallback_enabled:
        for name, provider_class in PROVIDERS.items():
            if name != provider_name:
                provider = provider_class()
                if provider.is_available():
                    logger.info(f"Falling back to {name} as LLM provider")
                    return provider

    logger.error("No LLM providers available")
    return None
