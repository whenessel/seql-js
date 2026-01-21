# Fix Verification Checklist

Use this checklist to verify the fix has been applied correctly.

## Pre-Fix Verification

- [ ] Confirmed error appears in browser console:
  ```
  Error: Invalid node: unexpected content ".glass-card#2"
  ```

- [ ] Generated SEQL string has wrong order:
  ```
  v1.0: form[data-seql-id="..."].glass-card#2
                                 ↑ Classes after attributes (wrong)
  ```

- [ ] `parseSEQL()` call throws error

## Code Changes

- [ ] Opened file: `/src/utils/seql-parser.ts`

- [ ] Located function `stringifyNode` (around line 221)

- [ ] Found "Prepare attributes" section (lines ~228-291)
  - [ ] This section stays in place - NO CHANGES

- [ ] Found `finalAttrs` filtering (lines ~293-302)
  - [ ] This section stays in place - NO CHANGES

- [ ] Found attributes addition block (lines ~298-304):
  ```typescript
  if (finalAttrs.length > 0) {
    finalAttrs.sort((a, b) => a.localeCompare(b));
    result += `[${finalAttrs.join(',')}]`;
  }
  ```
  - [ ] Marked for moving DOWN

- [ ] Found classes addition block (lines ~306-320):
  ```typescript
  if (semantics.classes && semantics.classes.length > 0) {
    const stableClasses = filterStableClasses(semantics.classes);
    // ... filtering logic ...
    result += limitedClasses.map(c => `.${c}`).join('');
  }
  ```
  - [ ] Marked for moving UP

- [ ] Swapped the two blocks

- [ ] New order is:
  1. Prepare attributes ✅ (unchanged)
  2. Filter finalAttrs ✅ (unchanged)
  3. **Add classes** ✅ (moved up)
  4. **Add attributes** ✅ (moved down)
  5. Add position ✅ (unchanged)

## Build Verification

- [ ] Saved changes to `/src/utils/seql-parser.ts`

- [ ] Ran build command:
  ```bash
  npm run build
  # or
  yarn build
  ```

- [ ] Build completed successfully (no errors)

- [ ] Check dist files were updated:
  ```bash
  ls -la dist/
  ```

## Runtime Testing

### Browser Console Test

- [ ] Opened browser at: https://appsurify.github.io/modern-seaside-stay/

- [ ] Loaded test script:
  ```javascript
  // Load: /Users/whenessel/Development/WebstormProjects/seql-js/SEQLJsBrowserTestSuite.js
  ```

- [ ] Ran test:
  ```javascript
  window.testSeqlJs()
  ```

### Expected Output Verification

- [ ] **Step 1 - EID Generation:**
  ```
  ✅ EID успешно сгенерирован
  📊 Структура EID: {...}
  🎯 Anchor: {tag: 'form', ...}
  🎪 Target: {tag: 'button', ...}
  📈 Confidence: 0.53
  ```

- [ ] **Step 2 - SEQL String Generation:**
  ```
  ✅ SEQL string сгенерирован
  v1.0: form.glass-card[data-seql-id="seql-el-17"]#2 :: button[id="check-out",text="Select date",type="button"]
        ↑ Classes BEFORE attributes ✅
  📏 Длина: ~109 символов
  ```

- [ ] **Step 3 - Parsing:**
  ```
  ✅ SEQL успешно распарсен
  ```
  - [ ] NO ERROR about "unexpected content"
  - [ ] Parsed EID matches original structure

- [ ] **Step 4 - Comparison:**
  ```
  ✅ EID восстановлен корректно
  ✅ Anchor совпадает
  ✅ Path совпадает
  ✅ Target совпадает
  ```

### Manual Inspection

- [ ] Inspected generated SEQL string format:
  ```javascript
  const el = document.querySelector('#check-out');
  const eid = window.seqlJs.generateEID(el);
  const seql = window.seqlJs.stringifySEQL(eid);
  console.log('SEQL:', seql);
  
  // Should show: form.glass-card[...]#2
  // NOT: form[...].glass-card#2
  ```

- [ ] Verified component order matches CSS standard:
  - [ ] Tag: ✅
  - [ ] Classes: ✅ (with dots: `.class`)
  - [ ] Attributes: ✅ (in brackets: `[attr="value"]`)
  - [ ] Position: ✅ (with hash: `#N`)

### Round-trip Test

- [ ] Element → EID → SEQL → EID → Element:
  ```javascript
  const el = document.querySelector('#check-out');
  const eid1 = window.seqlJs.generateEID(el);
  const seql = window.seqlJs.stringifySEQL(eid1);
  const eid2 = window.seqlJs.parseSEQL(seql);
  const resolved = window.seqlJs.resolve(eid2, document);
  
  console.log('Original element:', el);
  console.log('Resolved elements:', resolved.elements);
  console.log('Match:', resolved.elements[0] === el); // Should be true
  ```

- [ ] Round-trip succeeds
- [ ] Resolved element matches original

## Regression Testing

### Test Other Elements

- [ ] SVG elements:
  ```javascript
  const svg = document.querySelector('svg');
  const eid = window.seqlJs.generateEID(svg);
  const seql = window.seqlJs.stringifySEQL(eid);
  const parsed = window.seqlJs.parseSEQL(seql); // Should not throw
  ```

- [ ] Elements with multiple classes:
  ```javascript
  const multiClass = document.querySelector('.inline-flex.items-center');
  // Test generation and parsing
  ```

- [ ] Elements without classes:
  ```javascript
  const noClass = document.querySelector('button:not([class])');
  // Test generation and parsing
  ```

- [ ] Elements without attributes:
  ```javascript
  const noAttrs = document.createElement('div');
  document.body.appendChild(noAttrs);
  // Test generation and parsing
  ```

## Documentation Verification

- [ ] Updated any examples in docs that show SEQL format

- [ ] Checked that spec matches new format:
  ```
  /docs/specs/SEQL_SPECIFICATION_v1.0.md
  ```

- [ ] Format examples show correct order: `tag.class[attr]#pos`

## Edge Cases

- [ ] Element with ID only (no classes or other attributes):
  ```javascript
  <button id="test-btn">Test</button>
  // Should generate: button[id="test-btn"]
  ```

- [ ] Element with classes only (no attributes):
  ```javascript
  <div class="container wrapper">Container</div>
  // Should generate: div.container.wrapper
  ```

- [ ] Anchor node (no position):
  ```javascript
  // Anchor nodes don't have nthChild
  // Should generate: tag.class[attrs] (no #N)
  ```

- [ ] Path nodes:
  ```javascript
  // Path nodes between anchor and target
  // Should also follow: tag.class[attrs]#N order
  ```

## Final Checks

- [ ] No console errors during any tests

- [ ] All existing unit tests still pass:
  ```bash
  npm test
  # or
  yarn test
  ```

- [ ] Parser handles both old and new formats gracefully (if applicable)

- [ ] Performance is not degraded (generation/parsing speed)

## Sign-off

**Date:** _____________  
**Tester:** _____________  
**All checks passed:** ☐ YES ☐ NO

**Notes:**
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

**Status:**
- [ ] ✅ FIX VERIFIED - Ready to deploy
- [ ] ❌ ISSUES FOUND - See notes above
- [ ] 🔄 PARTIALLY WORKING - Needs more investigation

## Rollback Plan

If issues are found:

1. **Revert changes:**
   ```bash
   git checkout HEAD -- src/utils/seql-parser.ts
   npm run build
   ```

2. **Re-test with original code**

3. **Document specific failure cases**

4. **Review MANUAL_FIX.md for alternative approaches**
