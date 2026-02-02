# Default Agent Profile

Use this profile when no other agent profile is specified. Applies to any AI agent (Cursor, Claude Code, Codex, etc.) working in this repository.

## What to read first

1. **This index:** `.aiinstructions/README.md` — default set, rules, priority, checklist.
2. **Enforcement rules:** `.aiinstructions/rules/` — api-sdk-readonly, chakra-ui-v3, feature-docs, app-content-language. Rules have priority over style.
3. **Naming:** `.aiinstructions/naming/README.md`, then `public-api.md`, `internals.md`, and other naming files as needed (see naming priority in naming/README.md).
4. **Docstrings (when updating comments only):** `.aiinstructions/docs/docstrings.md`.

## When doing what

- **Refactoring / new code:** Follow naming (`.aiinstructions/naming/`) and rules (`.aiinstructions/rules/`). Do not edit `src/api/sdk/`. Use Chakra UI v3 patterns for UI.
- **Updating documentation in code:** Follow `docs/docstrings.md`; edit only comments/docstrings; do not change code or signatures.
- **Working on a feature:** Use `docs/dev/features/<feature-name>/`; **create and save** the planning file (`plan.md`) in the mandatory format (see `rules/feature-docs.md`), then add or update implementation summary. Keep docs small for token economy.
- **Uncertainty:** Prefer rules over style; prefer `.aiinstructions/` for naming and enforcement; use project root (`CLAUDE.md`, `AGENTS.md`) for stack, commands, and workflows.

## Language

- **Application content:** All user-facing and in-app content (UI strings, messages, labels, errors, tooltips, etc.) **must be in English**. See **rules/app-content-language.md**.
- **Instructions:** Rule text and code examples in `.aiinstructions/` are in **English**. Human-facing explanations in planning docs or external communication may use any language.

## Priority (when rules conflict)

1. Agent profile (this file)
2. Rules (api-sdk-readonly, chakra-ui-v3, feature-docs, app-content-language)
3. Language-specific / global style (naming, docstrings)
