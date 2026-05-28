import json
import os
from core.state import TwinProfileV3

schema_json = TwinProfileV3.get_schema_json()

prompt_path = "prompts/twin_profile_extractor_v3.txt"

with open(prompt_path, "r", encoding="utf-8") as f:
    content = f.read()

# Check if SCHEMA is already injected
if "# SCHEMA" in content:
    # Replace everything after # SCHEMA
    base_content = content.split("# SCHEMA")[0]
    new_content = base_content + "# SCHEMA\nMust strictly adhere to this JSON Schema:\n```json\n" + schema_json + "\n```\n"
else:
    new_content = content + "\n\n# SCHEMA\nMust strictly adhere to this JSON Schema:\n```json\n" + schema_json + "\n```\n"

with open(prompt_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Schema injected into v3 prompt.")
