# Application Content Language Rule

## Scope

This rule applies to **all user-facing and in-app content** in the application (UI strings, messages, labels, placeholders, errors, tooltips, page titles, documentation visible in the app, etc.).

## Requirement

**All content in the application must be in English.**

- UI labels, buttons, links, headings, and placeholders
- Error and validation messages
- Toast and notification text
- Tooltips and help text
- Page titles and navigation labels
- Any text that is rendered to the user or stored for display in the app

## Out of scope

- Rule text and code examples inside `.aiinstructions/` (already English per agent profile)
- Human-facing explanations in planning docs, commit messages, or external communication (may use any language)
- Identifiers in code (naming conventions are defined in `.aiinstructions/naming/`; English-only is required there for public API and consistency)

## Priority

When adding or changing user-visible strings, always use English. Do not introduce non-English copy in the application codebase.
