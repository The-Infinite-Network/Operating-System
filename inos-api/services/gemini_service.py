import os
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# Configurable via env var; falls back to the prompt alongside this file's repo
_DEFAULT_PROMPT = Path(__file__).resolve().parents[2] / "mcp" / "mcp-notion" / "src" / "prompts" / "twin-profile-extractor.txt"
PROMPT_PATH = Path(os.getenv("TWIN_EXTRACTOR_PROMPT_PATH", str(_DEFAULT_PROMPT)))

_TYPOGRAPHY = str.maketrans({
    '—': '--', '–': '-',
    '‘': "'",  '’': "'",
    '“': '"',  '”': '"',
    '…': '...',
})


def extract_twin_profile(raw_dialogue: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured in backend.")

    client = genai.Client(api_key=api_key)

    try:
        with open(PROMPT_PATH, "r", encoding="utf-8") as f:
            system_instruction = f.read()
    except FileNotFoundError:
        system_instruction = "You are an expert architectural profiler. Extract a structured JSON profile from the user's answers."

    prompt = f"Execute Twin Profile Extraction on the following dialogue:\n\n{raw_dialogue.translate(_TYPOGRAPHY)}"

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.1,
            response_mime_type="application/json"
        ),
    )

    return response.text
