#!/usr/bin/env python3
"""Export and validate platform-specific configurations for slider.

Usage:
    python scripts/export_platform_configs.py --platform all --validate
    python scripts/export_platform_configs.py --platform chatgpt --export-dir dist/chatgpt
    python scripts/export_platform_configs.py --platform claude --export-dir dist/claude
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent

PLATFORMS = ["gemini", "openai", "chatgpt", "claude"]

REQUIRED_AGENT_FILES: dict[str, list[str]] = {
    "gemini": ["config.yaml"],
    "openai": ["config.yaml"],
    "chatgpt": ["config.yaml", "system_prompt.md", "knowledge_manifest.json"],
    "claude": ["config.yaml", "CLAUDE.md"],
}


def validate_skill_md() -> list[str]:
    """Validate that SKILL.md exists and has valid frontmatter."""
    errors: list[str] = []
    skill_path = SKILL_ROOT / "SKILL.md"
    if not skill_path.exists():
        errors.append("SKILL.md not found at project root")
        return errors

    text = skill_path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        errors.append("SKILL.md missing YAML frontmatter")
    else:
        end = text.find("---", 3)
        if end < 0:
            errors.append("SKILL.md frontmatter not closed")
        else:
            frontmatter = text[3:end].strip()
            if "name:" not in frontmatter:
                errors.append("SKILL.md frontmatter missing 'name' field")
            if "description:" not in frontmatter:
                errors.append("SKILL.md frontmatter missing 'description' field")
    return errors


def validate_agent_dir(platform: str) -> list[str]:
    """Validate that a platform agent directory has required files."""
    errors: list[str] = []
    agent_dir = SKILL_ROOT / "agents" / platform
    if not agent_dir.is_dir():
        errors.append(f"agents/{platform}/ directory not found")
        return errors

    for filename in REQUIRED_AGENT_FILES.get(platform, []):
        filepath = agent_dir / filename
        if not filepath.exists():
            errors.append(f"agents/{platform}/{filename} not found")
        elif filepath.stat().st_size == 0:
            errors.append(f"agents/{platform}/{filename} is empty")
    return errors


def validate_knowledge_manifest(platform: str) -> list[str]:
    """Validate that knowledge manifest files all exist."""
    errors: list[str] = []
    manifest_path = SKILL_ROOT / "agents" / platform / "knowledge_manifest.json"
    if not manifest_path.exists():
        return errors

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"agents/{platform}/knowledge_manifest.json: invalid JSON: {exc}")
        return errors

    files = manifest.get("files", [])
    for entry in files:
        rel_path = entry.get("path", "")
        full_path = SKILL_ROOT / rel_path
        if not full_path.exists():
            errors.append(f"agents/{platform}/knowledge_manifest.json: missing file: {rel_path}")

    max_files = manifest.get("max_files", 20)
    if len(files) > max_files:
        errors.append(
            f"agents/{platform}/knowledge_manifest.json: {len(files)} files exceeds limit of {max_files}"
        )
    return errors


def validate_config_yaml(platform: str) -> list[str]:
    """Basic validation of config.yaml content."""
    errors: list[str] = []
    config_path = SKILL_ROOT / "agents" / platform / "config.yaml"
    if not config_path.exists():
        return errors

    text = config_path.read_text(encoding="utf-8")
    if "display_name" not in text:
        errors.append(f"agents/{platform}/config.yaml: missing display_name")
    if "platform:" not in text:
        errors.append(f"agents/{platform}/config.yaml: missing platform field")
    return errors


def validate_claude_md() -> list[str]:
    """Validate CLAUDE.md structure."""
    errors: list[str] = []
    path = SKILL_ROOT / "agents" / "claude" / "CLAUDE.md"
    if not path.exists():
        return errors

    text = path.read_text(encoding="utf-8")
    expected_tags = ["<role>", "<rules>", "<workflow>", "<priorities>"]
    for tag in expected_tags:
        if tag not in text:
            errors.append(f"agents/claude/CLAUDE.md: missing expected section {tag}")
    return errors


def validate_system_prompt() -> list[str]:
    """Validate ChatGPT system prompt size."""
    errors: list[str] = []
    path = SKILL_ROOT / "agents" / "chatgpt" / "system_prompt.md"
    if not path.exists():
        return errors

    text = path.read_text(encoding="utf-8")
    # Rough token estimate: ~4 chars per token
    estimated_tokens = len(text) // 4
    if estimated_tokens > 8000:
        errors.append(
            f"agents/chatgpt/system_prompt.md: estimated {estimated_tokens} tokens, "
            "may exceed ChatGPT instruction limits"
        )
    return errors


def validate_platform(platform: str) -> list[str]:
    """Run all validations for a platform."""
    errors: list[str] = []
    errors.extend(validate_agent_dir(platform))
    errors.extend(validate_config_yaml(platform))
    errors.extend(validate_knowledge_manifest(platform))

    if platform == "gemini":
        errors.extend(validate_skill_md())
    elif platform == "claude":
        errors.extend(validate_claude_md())
    elif platform == "chatgpt":
        errors.extend(validate_system_prompt())

    return errors


def export_platform(platform: str, export_dir: Path) -> None:
    """Export platform-specific files to a directory."""
    export_dir.mkdir(parents=True, exist_ok=True)

    agent_dir = SKILL_ROOT / "agents" / platform
    if not agent_dir.is_dir():
        print(f"  ✗ agents/{platform}/ not found, skipping")
        return

    # Copy agent config files
    for item in agent_dir.iterdir():
        if item.is_file():
            shutil.copy2(item, export_dir / item.name)
            print(f"  → {item.name}")

    # Copy knowledge files if manifest exists
    manifest_path = agent_dir / "knowledge_manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        knowledge_dir = export_dir / "knowledge"
        knowledge_dir.mkdir(exist_ok=True)
        for entry in manifest.get("files", []):
            src = SKILL_ROOT / entry["path"]
            if src.exists():
                shutil.copy2(src, knowledge_dir / src.name)
                print(f"  → knowledge/{src.name}")
    elif platform == "claude":
        # Copy knowledge files listed in config.yaml
        config_path = agent_dir / "config.yaml"
        if config_path.exists():
            text = config_path.read_text(encoding="utf-8")
            knowledge_dir = export_dir / "knowledge"
            knowledge_dir.mkdir(exist_ok=True)
            for line in text.splitlines():
                line = line.strip()
                if line.startswith("- ../../references/"):
                    rel = line.lstrip("- ")
                    src = (agent_dir / rel).resolve()
                    if src.exists():
                        shutil.copy2(src, knowledge_dir / src.name)
                        print(f"  → knowledge/{src.name}")

    # For Gemini, also copy SKILL.md and references
    if platform == "gemini":
        shutil.copy2(SKILL_ROOT / "SKILL.md", export_dir / "SKILL.md")
        print("  → SKILL.md")
        refs_dir = SKILL_ROOT / "references"
        if refs_dir.is_dir():
            dest_refs = export_dir / "references"
            if dest_refs.exists():
                shutil.rmtree(dest_refs)
            shutil.copytree(refs_dir, dest_refs)
            print(f"  → references/ ({len(list(dest_refs.iterdir()))} files)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export and validate platform-specific configurations."
    )
    parser.add_argument(
        "--platform",
        choices=PLATFORMS + ["all"],
        default="all",
        help="Target platform (default: all)",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Run validation checks",
    )
    parser.add_argument(
        "--export-dir",
        type=Path,
        help="Export directory (default: dist/<platform>)",
    )
    args = parser.parse_args()

    platforms = PLATFORMS if args.platform == "all" else [args.platform]

    if args.validate:
        total_errors: list[str] = []
        for platform in platforms:
            print(f"\n═══ Validating {platform} ═══")
            errors = validate_platform(platform)
            if errors:
                for err in errors:
                    print(f"  ✗ {err}")
                total_errors.extend(errors)
            else:
                print("  ✓ All checks passed")

        print(f"\n{'═' * 40}")
        if total_errors:
            print(f"✗ {len(total_errors)} error(s) found")
            sys.exit(1)
        else:
            print("✓ All platform validations passed")
            sys.exit(0)

    # Export mode
    for platform in platforms:
        base_dir = args.export_dir or (SKILL_ROOT / "dist" / platform)
        print(f"\n═══ Exporting {platform} → {base_dir} ═══")
        export_platform(platform, base_dir)

    print("\n✓ Export complete")


if __name__ == "__main__":
    main()
