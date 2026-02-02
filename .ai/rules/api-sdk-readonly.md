# API SDK Read-Only Policy

## Scope

This rule applies to: `src/api/sdk/**`

## Generated Code Policy

The directory `src/api/sdk/` contains **fully auto-generated code** produced from an OpenAPI specification.

This code can be regenerated at any time.
Manual changes WILL be lost.

## Mandatory Rules

- Files in this directory are **READ-ONLY**
- DO NOT:
  - modify files
  - add new files
  - delete files
  - reformat code
  - refactor code
  - fix bugs directly
  - adjust types or method signatures

## Allowed Usage

You MAY:

- Read code to understand API structure
- Inspect models, schemas, and types
- Reference request/response shapes
- Use this code as input for implementations elsewhere

## Required Alternative Actions

If a task requires changes related to API behavior or typing:

- DO NOT edit `src/api/sdk/`
- Instead propose:
  - Updating the OpenAPI specification (`openapi.json`)
  - Updating SDK generation settings
  - Implementing wrappers or adapters **outside** this directory

## Enforcement

If a requested action would require modifying this directory:

1. REFUSE to make changes
2. STATE that the directory is auto-generated
3. SUGGEST a safe alternative

## Priority

This rule has **absolute priority** over all other rules.
