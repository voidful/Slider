# Platform adaptation guide

Slider separates portable task guidance from host capabilities. A platform name does not establish filesystem, browser, code-execution, or upload access; inspect the current session.

## Instruction entrypoints

| Environment | Entrypoint | Notes |
|:---|:---|:---|
| Codex/local skill host | `SKILL.md` and `agents/openai.yaml` | Native skill instructions and optional UI metadata |
| Gemini CLI or another file-based skill host | `SKILL.md` | Install the complete skill folder at the host's supported skill location |
| ChatGPT Custom GPT | `agents/chatgpt/system_prompt.md` | Concise instruction adapter with selected knowledge files |
| Claude Projects / Claude Code | `agents/claude/CLAUDE.md` | Use as project instructions or scoped repository guidance |
| OpenAI integration | `agents/openai/config.yaml` | Repository handoff metadata; its source points to `SKILL.md` |

The per-platform `config.yaml` files describe this repository's bundles. They are not schemas consumed automatically by an OpenAI API or Agents SDK, and they do not configure a model.

For Codex discovery, place the complete `slider` folder in a supported local skill location. Current locations include repository `.agents/skills/` and user `~/.agents/skills/`; see [official skill documentation](https://learn.chatgpt.com/docs/build-skills). Avoid broad project-wide copies of presentation instructions when the task-scoped skill is sufficient.

## Validate and export

```bash
python3 scripts/export_platform_configs.py --platform all --validate
python3 scripts/export_platform_configs.py --platform all --export-dir dist/platforms
```

With `--platform all`, the output root contains a separate subdirectory per platform. For a single platform, `--export-dir` is its exact output directory.

Each export includes the skill instructions, references, scripts, assets, and agent metadata with relative paths preserved. Platform-specific instructions/configuration remain under `agents/<platform>/`. ChatGPT and Claude exports also supply a flat `knowledge/` selection for upload-oriented environments.

Do not install or load every platform adapter at once. They express the same task contract for different hosts.

## Upload-oriented environments

Use the appropriate concise prompt and select the relevant knowledge files, within the host's current limits. The ChatGPT manifest's 20-file selection is a bundle target, not a claim about every account's current upload limits. Documents can be retrieved by filename; their links describe the full repository structure.

Rendering requires more than reference text: the execution environment needs the scripts and canonical template. Where supported, supply the complete exported runtime bundle to its execution workspace. Without runtime access, deliver a plan or structured slide JSON and identify the missing build step. Do not fabricate an execution or browser result.

## Capability-based fallbacks

| Available capability | Work that can be completed |
|:---|:---|
| Source text only | Supported talk plan and claims; explicitly mark unavailable visuals/results |
| PDF inspection | Source/crop review and evidence selection |
| Python plus bundle | Structured-data helpers and HTML/React rendering |
| Chromium or browser tool | Actual rendering/overflow and interaction inspection |
| Node plus project dependencies | React development, build, and supported exports |

Use [output contracts](output-contracts.md) for offline and format limits and [verification](verification-workflow.md) for accurate reporting. Apply these limits from observed capabilities, not assumptions about ChatGPT, Claude, or Gemini.
