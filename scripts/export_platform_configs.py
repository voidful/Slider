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
import shlex
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

RESOURCE_DIRS = ("agents", "assets", "references", "scripts")
ROOT_FILES = ("SKILL.md", "README.md", "ARCHITECTURE.md", "TEST_MATRIX.md", "CHANGELOG.md")
GENERATED_FILES = shutil.ignore_patterns(
    "node_modules", "dist", "build", "__pycache__", "*.pyc", ".DS_Store", ".git",
)


def config_references(config_path: Path) -> list[tuple[str, Path]]:
    """Read the scalar and block-list paths used by our handoff metadata.

    This is deliberately limited to the repository's config format, not a
    general YAML loader. Quoted paths and trailing comments are supported.
    """
    references: list[tuple[str, Path]] = []
    in_knowledge = False
    for line in config_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if not line[0].isspace():
            in_knowledge = stripped == "knowledge_files:"
        if stripped.startswith(("instructions_source:", "knowledge_manifest:")):
            key, value = stripped.split(":", 1)
        elif in_knowledge and stripped.startswith("- "):
            key, value = "knowledge_files", stripped[2:]
        else:
            continue
        tokens = shlex.split(value, comments=True)
        if len(tokens) != 1:
            raise ValueError(f"{config_path}: {key} needs one file path")
        references.append((key, (config_path.parent / tokens[0]).resolve()))
    return references


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
        if not rel_path or not full_path.is_file():
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
    try:
        references = config_references(config_path)
    except ValueError as exc:
        return errors + [str(exc)]
    if not any(key == "instructions_source" for key, _ in references):
        errors.append(f"agents/{platform}/config.yaml: missing instructions_source")
    for key, path in references:
        if not path.is_relative_to(SKILL_ROOT.resolve()) or not path.is_file():
            errors.append(
                f"agents/{platform}/config.yaml: {key} points outside the bundle or to a missing file: {path}"
            )
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
    # Repository adapter budget, not a claim about an account's UI limits.
    if len(text) > 8000:
        errors.append(
            f"agents/chatgpt/system_prompt.md: {len(text)} characters, "
            "exceeds the bundle's 8000-character instruction budget"
        )
    return errors


def validate_platform(platform: str) -> list[str]:
    """Run all validations for a platform."""
    errors: list[str] = []
    errors.extend(validate_agent_dir(platform))
    errors.extend(validate_config_yaml(platform))
    errors.extend(validate_knowledge_manifest(platform))
    errors.extend(validate_skill_md())

    if platform == "claude":
        errors.extend(validate_claude_md())
    elif platform == "chatgpt":
        errors.extend(validate_system_prompt())

    return errors


def export_platform(platform: str, export_dir: Path) -> None:
    """Copy a usable skill bundle while preserving all relative references."""
    errors = validate_platform(platform)
    if errors:
        raise ValueError("\n".join(errors))
    destination = export_dir.resolve()
    source = SKILL_ROOT.resolve()
    if (
        source.is_relative_to(destination)
        or any(destination.is_relative_to(source / name) for name in RESOURCE_DIRS)
    ):
        raise ValueError("Export destination overlaps the skill source resources")

    export_dir.mkdir(parents=True, exist_ok=True)
    for name in ROOT_FILES:
        shutil.copy2(SKILL_ROOT / name, export_dir / name)
    for name in RESOURCE_DIRS:
        shutil.copytree(
            SKILL_ROOT / name, export_dir / name,
            dirs_exist_ok=True, ignore=GENERATED_FILES,
        )

    agent_dir = SKILL_ROOT / "agents" / platform
    # A flat knowledge selection supplements the complete runtime tree.
    manifest_path = agent_dir / "knowledge_manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        knowledge_dir = export_dir / "knowledge"
        knowledge_dir.mkdir(exist_ok=True)
        for entry in manifest.get("files", []):
            src = SKILL_ROOT / entry["path"]
            shutil.copy2(src, knowledge_dir / src.name)
    elif platform == "claude":
        knowledge_dir = export_dir / "knowledge"
        knowledge_dir.mkdir(exist_ok=True)
        for key, src in config_references(agent_dir / "config.yaml"):
            if key == "knowledge_files":
                shutil.copy2(src, knowledge_dir / src.name)
    print(f"  → Complete bundle; entrypoint: agents/{platform}/config.yaml")


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
        help="Output directory; with --platform all, create a subdirectory per platform (default: dist/<platform>)",
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
        base_dir = (
            args.export_dir / platform if args.export_dir and args.platform == "all"
            else args.export_dir or (SKILL_ROOT / "dist" / platform)
        )
        print(f"\n═══ Exporting {platform} → {base_dir} ═══")
        try:
            export_platform(platform, base_dir)
        except (ValueError, OSError) as exc:
            parser.exit(1, f"Export failed: {exc}\n")

    print("\n✓ Export complete")


if __name__ == "__main__":
    main()
