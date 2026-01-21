# Issue #2026-01-21: SEQL Parser Component Order Mismatch

**Date:** January 21, 2026  
**Status:** 🔴 CRITICAL - Breaking parser functionality  
**Priority:** P0 - Immediate fix required

## Problem Statement

The SEQL selector parser is failing with the following error:

```
Error: Invalid node: unexpected content ".glass-card#2" in "form[data-seql-id="seql-el-17"].glass-card#2"
```

This is caused by a **component order mismatch** between the generator and parser:
- **Generator produces:** `tag[attributes].classes#position`
- **Parser expects:** `tag.classes[attributes]#position`

## Documentation

This issue directory contains complete documentation for diagnosing and fixing the problem:

### 📋 [SUMMARY.md](./SUMMARY.md)
**Start here** - Quick overview and TL;DR for busy developers.

### 📖 [ISSUE.md](./ISSUE.md)
**Detailed analysis** - Full problem description with:
- Root cause analysis
- Test cases and reproduction steps
- Complete code diff showing exactly what to change
- Verification procedures

### 🤖 [AI_AGENT_PROMPT.md](./AI_AGENT_PROMPT.md)
**For AI-assisted fixing** - Structured prompt for:
- Claude Code
- GitHub Copilot
- Cursor AI
- Other AI coding assistants

Contains precise instructions for automated code modification.

### 🔧 [MANUAL_FIX.md](./MANUAL_FIX.md)
**For manual fixing** - Step-by-step guide for:
- Developers who prefer manual edits
- When AI tools are unavailable
- When you want to understand the change deeply

Includes debugging tips and alternative approaches.

## Quick Reference

### Affected File
```
/src/utils/seql-parser.ts
```

### Affected Function
```typescript
function stringifyNode(
  node: AnchorNode | PathNode | TargetNode,
  isTarget: boolean = false,
  options: Required<StringifyOptions>
): string
```
Lines: ~221-339

### The Fix (One-liner)
**Move the "Add stable classes" block BEFORE the "Add attributes" block**

### Test Case
```javascript
// Element: <button id="check-out" class="text-muted-foreground" ...>
// Current output: form[data-seql-id="..."].glass-card#2
// Expected output: form.glass-card[data-seql-id="..."]#2
```

## Resolution Path

Choose your approach:

### Option A: Automated Fix (Recommended)
1. Open [AI_AGENT_PROMPT.md](./AI_AGENT_PROMPT.md)
2. Copy the entire prompt
3. Paste into your AI coding assistant (Claude Code, Cursor, etc.)
4. Review and apply the suggested changes
5. Run tests to verify

**Estimated time:** 2-5 minutes

### Option B: Manual Fix
1. Open [MANUAL_FIX.md](./MANUAL_FIX.md)
2. Follow step-by-step instructions
3. Make the code changes carefully
4. Run tests to verify

**Estimated time:** 10-15 minutes

## Verification

After applying the fix:

```bash
# Build the project
npm run build  # or yarn build

# Load test suite in browser
# Navigate to: https://appsurify.github.io/modern-seaside-stay/
# Load file: /Users/whenessel/Development/WebstormProjects/seql-js/SEQLJsBrowserTestSuite.js

# Run in console:
window.testSeqlJs()
```

**Expected result:**
```
✅ EID успешно сгенерирован
✅ SEQL string сгенерирован
v1.0: form.glass-card[data-seql-id="seql-el-17"]#2 :: button[id="check-out",text="Select date",type="button"]
✅ SEQL успешно распарсен
✅ EID восстановлен корректно
```

## Impact Assessment

| Category | Impact |
|----------|--------|
| **Severity** | CRITICAL - Parser completely broken |
| **Breaking Change** | YES - Changes serialization format |
| **Backwards Compatibility** | NO - Old SEQL strings won't parse |
| **Migration Required** | YES - Regenerate all stored selectors |
| **API Changes** | NO - Only internal format changes |

## Migration Plan

After deploying the fix:

1. **Immediate:** New elements will generate correct SEQL selectors
2. **Short-term:** Cached/stored SEQL selectors will fail to parse
3. **Action Required:** Regenerate all stored SEQL selectors in:
   - Analytics databases
   - Session replay systems
   - Any cached selector storage

## Related Resources

- **Specification:** `/docs/specs/SEQL_SPECIFICATION_v1.0.md`
- **Test Suite:** `/SEQLJsBrowserTestSuite.js`
- **Test Site:** https://appsurify.github.io/modern-seaside-stay/
- **Source File:** `/src/utils/seql-parser.ts`

## Timeline

- **Discovered:** 2026-01-21 13:45 UTC
- **Diagnosed:** 2026-01-21 (same day)
- **Target Fix:** Immediate (P0 priority)
- **Rollout:** Coordinate with analytics team for migration

## Contact & Support

If you encounter issues:
1. Review [MANUAL_FIX.md](./MANUAL_FIX.md) debugging section
2. Check console for specific error messages
3. Verify build artifacts are up to date
4. Ensure test environment matches production

---

**Created:** 2026-01-21  
**Last Updated:** 2026-01-21  
**Issue Type:** Bug - Critical  
**Component:** Parser/Serialization
