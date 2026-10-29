#!/usr/bin/env python3
"""Regression checks for portable platform bundles; uses disposable files only."""
from __future__ import annotations

import contextlib
import io
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import export_platform_configs as exports


class PlatformExportTests(unittest.TestCase):
    def test_all_exports_are_separate_and_resolve_their_resources(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "platforms"
            subprocess.run(
                [sys.executable, str(exports.SKILL_ROOT / "scripts/export_platform_configs.py"),
                 "--platform", "all", "--export-dir", str(destination)],
                check=True, capture_output=True, text=True,
            )
            self.assertEqual(set(exports.PLATFORMS), {p.name for p in destination.iterdir()})
            for platform in exports.PLATFORMS:
                bundle = destination / platform
                config = bundle / "agents" / platform / "config.yaml"
                for _, resource in exports.config_references(config):
                    self.assertTrue(resource.is_relative_to(bundle.resolve()))
                    self.assertTrue(resource.is_file(), str(resource))
                for resource in (
                    "SKILL.md", "agents/openai.yaml", "references/task-workflows.md",
                    "scripts/render_slideshow_artifact.py",
                    "assets/html-slideshow-starter/paper-presentation.html",
                ):
                    self.assertTrue((bundle / resource).is_file(), resource)
                with patch.object(exports, "SKILL_ROOT", bundle):
                    self.assertEqual([], exports.validate_platform(platform))
            for platform in ("chatgpt", "claude"):
                self.assertTrue((destination / platform / "knowledge/output-contracts.md").is_file())
            # Execute the copied validator to catch source-tree path assumptions.
            subprocess.run(
                [sys.executable, str(destination / "openai/scripts/export_platform_configs.py"),
                 "--platform", "all", "--validate"],
                cwd=directory, check=True, capture_output=True, text=True,
            )

    def test_single_platform_uses_exact_destination(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "custom-name"
            subprocess.run(
                [sys.executable, str(exports.SKILL_ROOT / "scripts/export_platform_configs.py"),
                 "--platform", "openai", "--export-dir", str(destination)],
                check=True, capture_output=True, text=True,
            )
            self.assertTrue((destination / "SKILL.md").is_file())
            self.assertFalse((destination / "openai").exists())

    def test_generated_dependencies_are_excluded(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            source = Path(directory) / "source"
            destination = Path(directory) / "bundle"
            exports.export_platform("openai", source)
            generated = (
                "assets/react-project-starter/node_modules/example.js",
                "assets/react-project-starter/dist/index.html",
                "scripts/__pycache__/example.pyc",
            )
            for relative in generated:
                path = source / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("disposable fixture", encoding="utf-8")
            with patch.object(exports, "SKILL_ROOT", source):
                exports.export_platform("openai", destination)
            for relative in generated:
                self.assertFalse((destination / relative).exists())
            self.assertTrue((destination / "assets/react-project-starter/package.json").is_file())

    def test_missing_instruction_source_is_reported(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            agent = root / "agents/openai"
            agent.mkdir(parents=True)
            (agent / "config.yaml").write_text(
                'interface:\n  display_name: "Slider"\nplatform: openai\n'
                'instructions_source: "missing.md"\n', encoding="utf-8",
            )
            with patch.object(exports, "SKILL_ROOT", root):
                errors = exports.validate_config_yaml("openai")
            self.assertTrue(any("instructions_source" in error and "missing file" in error for error in errors))

    def test_quoted_config_paths_and_missing_knowledge(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            agent = root / "agents/openai"
            agent.mkdir(parents=True)
            (root / "source file.md").write_text("instructions", encoding="utf-8")
            config = agent / "config.yaml"
            config.write_text(
                'interface:\n  display_name: "Slider"\nplatform: openai\n'
                'instructions_source: "../../source file.md" # comment\n'
                'knowledge_files:\n  - "../../missing.md"\n', encoding="utf-8",
            )
            references = exports.config_references(config)
            self.assertEqual((root / "source file.md").resolve(), references[0][1])
            with patch.object(exports, "SKILL_ROOT", root):
                errors = exports.validate_config_yaml("openai")
            self.assertEqual(1, len(errors))
            self.assertIn("knowledge_files", errors[0])

    def test_export_cannot_overwrite_source_resources(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            source = Path(directory) / "source"
            exports.export_platform("openai", source)
            with patch.object(exports, "SKILL_ROOT", source):
                for destination in (source, source.parent, source / "assets/recursive-export"):
                    with self.subTest(destination=destination):
                        with self.assertRaisesRegex(ValueError, "overlaps"):
                            exports.export_platform("openai", destination)


if __name__ == "__main__":
    unittest.main()
