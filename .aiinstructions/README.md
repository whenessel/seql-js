# AI Instructions Index

This directory holds **shared instructions for AI agents** (Cursor, Claude Code, Codex, etc.). Use it as the single source of truth for naming, enforcement rules, docstrings, and feature documentation. All rule text and code examples here are in **English**.

## Relation to other project instructions

- **`CLAUDE.md`** (project root) — Project overview, tech stack, dev commands, critical rules (including SDK read-only), Chakra v3 summary, naming summary, common workflows. Used by Claude Code and others.
- **`AGENTS.md`** (project root) — Short summary for Codex and other agents; overlaps with rules and naming here.
- **`.cursor/rules/`** — Cursor-specific rules (Chakra v3 details, components, style system). For non-Cursor agents, the same UI rules are summarized in `.aiinstructions/rules/chakra-ui-v3.md`.

When in doubt: **enforcement and naming** follow `.aiinstructions/` (rules + naming). **Stack, commands, workflows** follow project root (`CLAUDE.md`, `AGENTS.md`).

---

## Default (style and docs)

- docs/docstrings.md
- naming/README.md
- naming/public-api.md
- naming/internals.md
- naming/classes.md
- naming/functions.md
- naming/types.md
- naming/variables.md
- naming/constants.md
- naming/enums.md
- naming/files.md
- naming/directories.md

## Language-specific

(no files)

## Agent profiles

- **agents/default.md** — Default profile for any agent: what to read first, when to apply naming/rules/feature-docs, priority.

## Rules (enforcement)

- **rules/feature-docs.md** — Feature work must use `docs/dev/features/<feature-name>/` with plan + implementation summary; keep docs small for token economy.
- **rules/issue-docs.md** — Issue work must use `docs/dev/issues/<issue-slug>/` with issue description + resolution summary; keep docs small for token economy.
- **rules/app-content-language.md** — All user-facing and in-app content must be in English.

## Priority

1. Agent profile
2. Rules (enforcement rules)
3. Language rules
4. Global style (naming, docstrings)

---

## Before making changes (checklist)

- **Touching `src/api/sdk/`?** → Not allowed. Change OpenAPI spec or add wrappers/adapters outside that directory. See **rules/api-sdk-readonly.md**.
- **Naming / files / components?** → Follow **naming/** (see naming/README.md priority: public-api, types/classes, functions/variables, files/directories, constants/enums, internals).
- **UI (Chakra)?** → Follow **rules/chakra-ui-v3.md** (imports, props, compound components, style system).
- **Updating only comments / docstrings?** → Follow **docs/docstrings.md**; do not change code or signatures.
- **Working on a feature?** → Use **docs/dev/features/<feature-name>/**; **create and save** the planning file (`plan.md`) in the mandatory format, then add or update **implementation summary**; keep docs small. See **rules/feature-docs.md**.
- **Working on an issue (bug, defect)?** → Use **docs/dev/issues/<issue-slug>/**; **create and save** the issue file (`<slug>.issue.md`) in the mandatory format, then add or update **resolution summary** (`<slug>.resolution.md`); keep docs small. See **rules/issue-docs.md**.
- **Adding or changing UI text / messages / labels?** → All application content must be in **English**. See **rules/app-content-language.md**.
