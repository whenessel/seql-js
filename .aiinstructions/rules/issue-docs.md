# Issue Documentation Rule

## Scope

This rule applies whenever work is done on an **issue** (bug, defect, found problem, or technical debt item), regardless of agent or tool.

## Mandatory Location

- All issue-related documentation **must** live under **`docs/dev/issues/`**.
- Create **one directory per issue**, named by **slug** (kebab-case), e.g. `docs/dev/issues/fix-login-redirect-loop/`, `docs/dev/issues/oauth-token-refresh-race/`.
- **Slug** — short identifier for the issue in kebab-case, used for the directory and required file names (e.g. `fix-login-redirect-loop`, `oauth-token-refresh-race`).

## Required Files (obligatory)

In the issue directory, create two files named from the slug:

1. **`[slug].issue.md`** — problem description and analysis. Create and save **when the issue is identified or opened**. Use the structure from the «Issue document format» section below. Example: `fix-login-redirect-loop.issue.md`, `oauth-token-refresh-race.issue.md`.

2. **`[slug].resolution.md`** — resolution summary. Contains:
   - What was fixed (brief)
   - Main files created or changed
   - How it fits with existing code
   Brief and scannable; enough for humans and agents to understand the outcome. Example: `fix-login-redirect-loop.resolution.md`.

## Optional Files (only when necessary)

Additional files in the issue directory — **at the AI agent’s discretion**, only when needed for context, reproduction steps, or extra notes (e.g. `README.md` as entry point, repro checklist). **Do not add unnecessary files**; by default the issue and resolution documents are sufficient.

---

## Issue document format (mandatory for [slug].issue.md)

The issue file **must** follow this structure. Save as `docs/dev/issues/<issue-slug>/<slug>.issue.md`.

```markdown
# [Issue title]

---

**Status**: [Open / In progress / Resolved]
**Version**: [Doc version]
**Last Updated**: [Date Time]

---

## Summary

Short description of the problem (2–3 sentences). What is wrong and where it appears.

## Reproduction

Steps or conditions to reproduce:
1. Step one
2. Step two
3. Observed vs expected result

## Context

Relevant background:
- **Current state**: affected area of the project
- **Constraints**: technology, dependencies, environment
- **Assumptions**: what was assumed before the issue was found

## Impact

- Who/what is affected
- Severity (High / Medium / Low)
- Workarounds if any

## Analysis (optional)

Initial findings, possible causes, or links to related code/tickets.

## Notes

Extra notes, references, or links.
```

Sections may be shortened or marked "N/A" if not applicable; do not remove section headers. Keep content concise for token economy.

---

## Resolution document format (mandatory for [slug].resolution.md)

The resolution file **must** follow this structure. Save as `docs/dev/issues/<issue-slug>/<slug>.resolution.md`.

```markdown
# Resolution: [Issue title]

---

**Status**: Resolved
**Version**: [Doc version]
**Last Updated**: [Date Time]

---

## What was fixed

Brief description of the fix (2–4 sentences).

## Changes

- **Files created**: list with paths
- **Files modified**: list with paths and short note per file
- **Files removed**: if any

## Verification

- [ ] Criterion 1: how the fix was checked
- [ ] Criterion 2: regression or edge cases
- [ ] Criterion 3: tests or manual checks

## Notes

Additional notes or follow-ups.
```

Sections may be shortened or marked "N/A" if not applicable; do not remove section headers. Keep content concise for token economy.

## Purpose

- **Context and history:** Anyone (human or agent) can see what the problem was and how it was resolved.
- **Token economy:** Small, focused docs reduce token use when agents load issue context.
- **Traceability:** Issues are discoverable under one root (`docs/dev/issues/<issue-slug>/`).

## Workflow

1. **When an issue is identified:** ensure the directory `docs/dev/issues/<issue-slug>/` exists; **create and save** the issue file **`<slug>.issue.md`** in the format above. This step is **mandatory**.
2. During or after resolution: create or update **`<slug>.resolution.md`**.
3. Do not create separate documents for each sub-task; keep everything in the issue and resolution documents.

## Priority

This rule applies to all agents when working on issues. Example structure: directories under `docs/dev/issues/` with required files `<slug>.issue.md` and `<slug>.resolution.md` (e.g. `fix-login-redirect-loop`, `oauth-token-refresh-race`).
