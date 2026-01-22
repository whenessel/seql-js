# Documentation Refactoring Plan - seql-js v1.1.0

## Executive Summary

Refactor documentation from Russian to English with improved organization, eliminate redundancies, and align with v1.1.0 codebase. Strategy: **Write fresh English documentation** using Russian specs as reference material, archive originals for safety.

## Current State

### Documentation (46 files, ~8,600 lines)

- **Language**: 85% Russian, comprehensive and high-quality
- **Structure**:
  - `docs/specs/` (14 files): SPECIFICATION.md (1,107 lines), ARCHITECTURE.md (980 lines), SEQL_SPECIFICATION_v1.0.md (892 lines)
  - `docs/issues/` (31 files): 5 resolved bug investigations with extensive analysis
- **Redundancies**: 30-40% overlap between SPECIFICATION.md and SEQL_SPECIFICATION_v1.0.md
- **Version gap**: CHANGELOG.md only covers v1.0.3, missing v1.1.0 nth-child feature

### Codebase (32 TypeScript files, v1.1.0)

- **Modules**: types/ generator/ resolver/ utils/
- **Features**: EID/SEQL dual format, attribute filtering (v1.0.3), nth-child positioning (v1.1.0)
- **Quality**: Zero dependencies, TypeScript-native, fully tested

## Proposed Documentation Structure

```
seql-js/
├── README.md                          # Keep existing (English, well-written)
├── CHANGELOG.md                       # ADD v1.1.0 entry
├── CLAUDE.md                          # Keep existing (AI agent guide)
│
├── docs/
│   ├── getting-started/
│   │   ├── README.md                  # Quick start (5 min to hello world)
│   │   ├── installation.md            # Setup & requirements
│   │   ├── basic-usage.md             # 5 common patterns
│   │   └── concepts.md                # EID vs SEQL, anchor/path/target
│   │
│   ├── guides/
│   │   ├── README.md                  # Guide index
│   │   ├── generation.md              # Generating EIDs in depth
│   │   ├── resolution.md              # Resolution algorithm explained
│   │   ├── batch-processing.md        # Batch generation
│   │   ├── caching.md                 # Performance optimization
│   │   ├── configuration.md           # Options & customization
│   │   └── rrweb-integration.md       # Session replay use case
│   │
│   ├── api/
│   │   ├── README.md                  # API overview
│   │   ├── core-functions.md          # generateEID(), resolve()
│   │   ├── seql-functions.md          # generateSEQL(), resolveSEQL(), parse, stringify
│   │   ├── batch-api.md               # Batch operations
│   │   ├── cache-api.md               # Cache management
│   │   └── types.md                   # TypeScript interfaces
│   │
│   ├── specification/
│   │   ├── README.md                  # Spec index
│   │   ├── eid-format.md              # EID JSON structure (v1.0)
│   │   ├── seql-syntax.md             # SEQL string syntax
│   │   ├── anchor-strategy.md         # Anchor finding algorithm
│   │   ├── path-construction.md       # Path building rules
│   │   ├── semantic-extraction.md     # What semantics are captured
│   │   ├── attribute-filtering.md     # State vs identity attributes (v1.0.3)
│   │   ├── svg-fingerprinting.md      # SVG stability
│   │   ├── constraints.md             # Constraint types & evaluation
│   │   └── resolution-phases.md       # 5-phase resolution algorithm
│   │
│   ├── architecture/
│   │   ├── README.md                  # Architecture overview
│   │   ├── system-design.md           # High-level design
│   │   ├── generation-pipeline.md     # Generator components & flow
│   │   ├── resolution-algorithm.md    # Resolver 5-phase algorithm
│   │   ├── semantic-model.md          # Anchor/path/target/constraints
│   │   └── design-decisions.md        # Architectural decisions & rationale
│   │
│   ├── examples/
│   │   ├── README.md                  # Examples index
│   │   ├── basic-examples.md          # 10-15 simple examples
│   │   ├── forms.md                   # Form elements
│   │   ├── navigation.md              # Nav, menus, tabs
│   │   ├── tables.md                  # Tables with nth-child
│   │   ├── svg-elements.md            # SVG examples
│   │   ├── edge-cases.md              # Complex scenarios
│   │   └── migration.md               # Migrating from CSS/XPath
│   │
│   ├── troubleshooting/
│   │   ├── README.md                  # Common issues index
│   │   ├── generation-issues.md       # Generation problems
│   │   ├── resolution-failures.md     # Resolution problems
│   │   └── performance.md             # Performance optimization
│   │
│   ├── contributing/
│   │   ├── README.md                  # How to contribute
│   │   ├── development-setup.md       # Local development
│   │   ├── testing.md                 # Running tests
│   │   ├── code-style.md              # Code conventions
│   │   ├── documentation.md           # Documentation guidelines
│   │   └── ai-agent-guidelines.md     # Translated AI_AGENT_INSTRUCTIONS.md
│   │
│   └── changelog/
│       └── detailed/                  # Optional: detailed version notes
│
└── docs/archive/                      # PRESERVE EXISTING DOCS
    ├── legacy-specs-russian/          # Russian originals
    │   ├── SPECIFICATION_v1.0_ru.md
    │   ├── ARCHITECTURE_v1.0_ru.md
    │   ├── SEQL_SPECIFICATION_v1.0_ru.md
    │   └── AI_AGENT_INSTRUCTIONS_ru.md
    └── issues-resolved/               # Resolved bug investigations
        ├── 2026-01-21-parse-error/
        ├── 2025-01-22-anchor-nth-child-bug/
        ├── dash-fix/
        ├── path-correct/
        └── svg-child/
```

## Implementation Strategy

### Phase 1: Safety & Preparation (Day 1)

**Objective**: Preserve existing knowledge before any changes

1. **Archive existing documentation**
   - Move `docs/specs/*.md` → `docs/archive/legacy-specs-russian/` (rename with `_ru` suffix)
   - Move `docs/issues/` → `docs/archive/issues-resolved/`
   - Keep originals accessible for reference during translation

2. **Create directory structure**
   - Create all new directories: `getting-started/`, `guides/`, `api/`, etc.
   - No content yet, just structure

### Phase 2: Critical Documentation (Week 1, Priority 1)

**Objective**: Essential user-facing documentation in English

**Files to create** (12 files):

1. **CHANGELOG.md** - Add v1.1.0 entry

   ```markdown
   ## [1.1.0] - 2026-01-22

   ### Added

   - **nth-child positioning**: EID now includes `nthChild` property for accurate element positioning
   - Anchor nodes record position among siblings
   - Enables precise table cell identification (tr:nth-child(4) > td:nth-child(1))

   ### Changed

   - Improved CSS selector generation with nth-child disambiguation
   - Reorganized documentation: migrated to English, improved structure

   ### Fixed

   - Anchor node positioning in complex DOM structures
   ```

2. **docs/getting-started/** (4 files)
   - `README.md` - Quick start guide (< 100 lines)
   - `installation.md` - Setup instructions (< 50 lines)
   - `basic-usage.md` - 5 common code examples (< 150 lines)
   - `concepts.md` - EID vs SEQL, core model explanation (< 200 lines)

3. **docs/api/** (3 files)
   - `README.md` - API overview (< 50 lines)
   - `core-functions.md` - `generateEID()`, `resolve()` with examples (< 200 lines)
   - `seql-functions.md` - `generateSEQL()`, `resolveSEQL()`, parse, stringify (< 200 lines)

4. **docs/examples/** (4 files)
   - `README.md` - Examples index (< 50 lines)
   - `basic-examples.md` - 10-15 simple examples from tests (< 300 lines)
   - `forms.md` - Form element examples (< 150 lines)
   - `tables.md` - Table examples with nth-child (< 150 lines)

5. **Update root README.md** - Add documentation links section

   ```markdown
   ## Documentation

   - **[Getting Started](docs/getting-started/)** - Installation and quick start
   - **[API Reference](docs/api/)** - Complete API documentation
   - **[Examples](docs/examples/)** - Practical code examples
   - **[Specification](docs/specification/)** - EID and SEQL formats
   - **[Architecture](docs/architecture/)** - System design
   - **[Contributing](docs/contributing/)** - Development guide
   ```

### Phase 3: Technical Documentation (Week 2, Priority 2)

**Objective**: Formal specifications and architecture docs

**Files to create** (15 files):

1. **docs/specification/** (10 files, translate from Russian SPECIFICATION.md)
   - `README.md` - Spec index
   - `eid-format.md` - Translate §6, §14 from SPECIFICATION.md (< 300 lines)
   - `seql-syntax.md` - Translate from SEQL_SPECIFICATION_v1.0.md (< 300 lines)
   - `anchor-strategy.md` - Translate §7 from SPECIFICATION.md (< 250 lines)
   - `path-construction.md` - Translate §8 from SPECIFICATION.md (< 200 lines)
   - `semantic-extraction.md` - Translate §10 from SPECIFICATION.md (< 200 lines)
   - `attribute-filtering.md` - Translate existing ATTRIBUTE_FILTERING.md (< 300 lines)
   - `svg-fingerprinting.md` - Translate §9 from SPECIFICATION.md (< 200 lines)
   - `constraints.md` - Translate §12 from SPECIFICATION.md (< 200 lines)
   - `resolution-phases.md` - Translate §13 from SPECIFICATION.md (< 300 lines)

2. **docs/architecture/** (5 files, translate from Russian ARCHITECTURE.md + DECISIONS.md)
   - `README.md` - Architecture overview (< 100 lines)
   - `system-design.md` - Translate high-level sections from ARCHITECTURE.md (< 300 lines)
   - `generation-pipeline.md` - Generator flow (< 250 lines)
   - `resolution-algorithm.md` - Resolver 5-phase flow (< 250 lines)
   - `design-decisions.md` - Translate DECISIONS.md key decisions (< 300 lines)

### Phase 4: Supporting Documentation (Week 3, Priority 3)

**Objective**: Guides, troubleshooting, contributing

**Files to create** (15 files):

1. **docs/guides/** (7 files, new content)
   - `README.md`, `generation.md`, `resolution.md`, `batch-processing.md`, `caching.md`, `configuration.md`, `rrweb-integration.md`

2. **docs/troubleshooting/** (4 files, extract from resolved issues)
   - `README.md` - Index of common issues
   - Extract learnings from archived issue docs

3. **docs/contributing/** (5 files, new + translated)
   - `README.md`, `development-setup.md`, `testing.md`, `code-style.md`, `documentation.md`
   - `ai-agent-guidelines.md` - Translate AI_AGENT_INSTRUCTIONS.md to English

### Phase 5: Cleanup & Verification (Week 4)

**Objective**: Remove redundancies, verify completeness

1. **Remove redundant files**
   - Delete old `docs/specs/INDEX.md`, `SEQL_SYNTAX_CHEATSHEET.md`, `EID_SEQL_QUICK_REFERENCE.md`
   - Content moved to new structure

2. **Verification checklist**
   - [ ] All new docs in English
   - [ ] No file > 400 lines
   - [ ] All code examples tested
   - [ ] All internal links work
   - [ ] v1.1.0 documented in CHANGELOG and specifications
   - [ ] Russian originals archived, not deleted

## Translation Approach

**Strategy**: Fresh English writing, not literal translation

1. **Reference Russian docs** for technical accuracy
2. **Write fresh English** optimized for:
   - Simpler language
   - Code examples from actual tests
   - Practical focus (less theory, more examples)
3. **Preserve technical depth** from Russian specs
4. **Add v1.1.0 features** (nth-child positioning)

## Critical Files (Do These First)

Priority order for maximum impact:

1. **CHANGELOG.md** - Update with v1.1.0 (5 minutes)
2. **docs/getting-started/README.md** - Quick start guide (1 hour)
3. **docs/api/core-functions.md** - Core API reference (2 hours)
4. **docs/specification/eid-format.md** - EID structure with v1.1.0 nthChild (3 hours)
5. **docs/specification/seql-syntax.md** - SEQL string format (3 hours)

These 5 files cover: what changed, how to start, main API, and core technical specifications.

## Verification Plan

After implementation, verify:

1. **New user can get started in < 10 minutes**
   - Follow `docs/getting-started/README.md`
   - Run examples from `docs/examples/basic-examples.md`

2. **All code examples run successfully**
   - Extract examples into test file
   - Run with `yarn test`

3. **Documentation completeness**
   - All public APIs documented
   - v1.1.0 features (nth-child) documented
   - No broken links

4. **Russian originals preserved**
   - All archived in `docs/archive/legacy-specs-russian/`
   - Accessible for reference

## Success Metrics

- ✅ **100% English** documentation
- ✅ **No file > 400 lines** (maintainable chunks)
- ✅ **Zero broken links** in documentation
- ✅ **v1.1.0 complete** - CHANGELOG + specifications updated
- ✅ **Quick start < 10 min** - User can run first example
- ✅ **All examples tested** - Code examples verified

## Files to Modify

### Root Level

- [CHANGELOG.md](CHANGELOG.md) - Add v1.1.0 entry
- [README.md](README.md) - Update documentation links section

### Create New Documentation Structure

- `docs/getting-started/` - 4 files
- `docs/guides/` - 7 files
- `docs/api/` - 5 files
- `docs/specification/` - 10 files
- `docs/architecture/` - 5 files
- `docs/examples/` - 7 files
- `docs/troubleshooting/` - 4 files
- `docs/contributing/` - 5 files

### Archive Existing

- Move `docs/specs/` → `docs/archive/legacy-specs-russian/`
- Move `docs/issues/` → `docs/archive/issues-resolved/`

**Total**: ~50 new English documentation files, organized by audience and purpose

## User Preferences Confirmed

- ✅ **Full scope**: Create complete documentation (all phases, ~50 files)
- ✅ **Approach**: Write fresh English docs using Russian specs as reference
- ✅ **Issues**: Archive all resolved issues to `docs/archive/issues-resolved/`

## Implementation Notes

This plan will be executed in phases over the course of implementation:

- All new documentation will be written in clear, practical English
- Russian originals preserved in archive for reference
- Focus on code examples from actual tests
- Each file kept under 400 lines for maintainability
