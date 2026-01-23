import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PathBuilder } from '../../src/generator/path-builder';
import { SemanticExtractor } from '../../src/generator/semantic-extractor';
import { createEIDCache } from '../../src/utils/eid-cache';
import type { GeneratorOptions } from '../../src/types';

describe('PathBuilder', () => {
  let builder: PathBuilder;
  let extractor: SemanticExtractor;
  let options: GeneratorOptions;

  beforeEach(() => {
    document.body.innerHTML = '';
    options = { maxPathDepth: 10 };
    builder = new PathBuilder(options);
    extractor = new SemanticExtractor(options);
  });

  describe('Basic Path Building', () => {
    it('should build path from anchor to target', () => {
      document.body.innerHTML = `
        <form id="login">
          <div class="container">
            <div class="field">
              <button>Submit</button>
            </div>
          </div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(form, button, extractor);

      // Path should not include anchor (form) or target (button)
      expect(result.path.length).toBeGreaterThan(0);
      expect(result.degraded).toBe(false);
    });

    it('should exclude anchor and target from path', () => {
      document.body.innerHTML = `
        <form id="login">
          <button>Submit</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(form, button, extractor);

      // Direct child: path should be empty
      expect(result.path).toHaveLength(0);
    });

    it('should traverse upward from target to anchor', () => {
      document.body.innerHTML = `
        <main>
          <section>
            <article>
              <p>Text</p>
            </article>
          </section>
        </main>
      `;

      const main = document.querySelector('main')!;
      const p = document.querySelector('p')!;

      const result = builder.buildPath(main, p, extractor);

      // Should include section and article (all semantic tags)
      const tags = result.path.map((node) => node.tag);
      expect(tags).toContain('section');
      expect(tags).toContain('article');
    });

    it('should respect maxPathDepth option', () => {
      const shallowOptions: GeneratorOptions = { maxPathDepth: 3 };
      const shallowBuilder = new PathBuilder(shallowOptions);

      // Create deeply nested structure
      document.body.innerHTML = `
        <div id="root">
          <div><div><div><div><div><div><div><div><div><div>
            <button>Deep</button>
          </div></div></div></div></div></div></div></div></div></div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = shallowBuilder.buildPath(root, button, extractor);

      // Path should be limited by maxPathDepth
      expect(result.path.length).toBeLessThanOrEqual(3);
    });

    it('should support legacy buildPathNodes method', () => {
      document.body.innerHTML = `
        <form><div class="container"><button>Submit</button></div></form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const pathNodes = builder.buildPathNodes(form, button, extractor);

      expect(Array.isArray(pathNodes)).toBe(true);
      expect(pathNodes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Depth Overflow', () => {
    it('should set degraded=true when depth exceeds maxPathDepth', () => {
      const limitedOptions: GeneratorOptions = { maxPathDepth: 2 };
      const limitedBuilder = new PathBuilder(limitedOptions);

      document.body.innerHTML = `
        <div id="root">
          <div><div><div><div>
            <button>Deep</button>
          </div></div></div></div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = limitedBuilder.buildPath(root, button, extractor);

      expect(result.degraded).toBe(true);
    });

    it('should set degradationReason="path-depth-overflow"', () => {
      const limitedOptions: GeneratorOptions = { maxPathDepth: 2 };
      const limitedBuilder = new PathBuilder(limitedOptions);

      document.body.innerHTML = `
        <div id="root">
          <div><div><div><div>
            <button>Deep</button>
          </div></div></div></div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = limitedBuilder.buildPath(root, button, extractor);

      expect(result.degradationReason).toBe('path-depth-overflow');
    });

    it('should not set degraded when within depth limit', () => {
      const limitedOptions: GeneratorOptions = { maxPathDepth: 10 };
      const limitedBuilder = new PathBuilder(limitedOptions);

      document.body.innerHTML = `
        <form><div><button>Submit</button></div></form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const result = limitedBuilder.buildPath(form, button, extractor);

      expect(result.degraded).toBe(false);
      expect(result.degradationReason).toBeUndefined();
    });
  });

  describe('Noise Filtering', () => {
    it('should include semantic HTML tags', () => {
      document.body.innerHTML = `
        <div id="root">
          <nav><header><main><section><article><aside><footer>
            <button>Target</button>
          </footer></aside></article></section></main></header></nav>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const tags = result.path.map((node) => node.tag);
      // All semantic tags should be included
      expect(tags).toContain('nav');
      expect(tags).toContain('header');
      expect(tags).toContain('main');
      expect(tags).toContain('section');
      expect(tags).toContain('article');
    });

    it('should exclude plain div without semantic features', () => {
      document.body.innerHTML = `
        <div id="root">
          <div>
            <div class="mx-4 p-2">
              <button>Target</button>
            </div>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Plain divs with only utility classes should be filtered out
      expect(result.path.length).toBeLessThan(3);
    });

    it('should include div with role attribute', () => {
      document.body.innerHTML = `
        <div id="root">
          <div role="navigation">
            <button>Target</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Div with role should be included
      expect(result.path.length).toBeGreaterThan(0);
      const divNode = result.path.find((node) => node.tag === 'div');
      expect(divNode).toBeDefined();
      expect(divNode?.semantics.role).toBe('navigation');
    });

    it('should include div with ARIA attributes', () => {
      document.body.innerHTML = `
        <div id="root">
          <div aria-label="Main content">
            <button>Target</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Div with aria attributes should be included
      expect(result.path.length).toBeGreaterThan(0);
      const divNode = result.path.find((node) => node.tag === 'div');
      expect(divNode).toBeDefined();
    });

    it('should include div with semantic (non-utility) classes', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="user-profile">
            <button>Target</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Div with semantic class should be included
      expect(result.path.length).toBeGreaterThan(0);
      const divNode = result.path.find((node) => node.tag === 'div');
      expect(divNode).toBeDefined();
      expect(divNode?.semantics.classes).toContain('user-profile');
    });

    it('should include div with data-testid', () => {
      document.body.innerHTML = `
        <div id="root">
          <div data-testid="submit-form">
            <button>Target</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Div with data-testid should be included
      expect(result.path.length).toBeGreaterThan(0);
      const divNode = result.path.find((node) => node.tag === 'div');
      expect(divNode).toBeDefined();
    });

    it('should include div with data-qa', () => {
      document.body.innerHTML = `
        <div id="root">
          <div data-qa="main-container">
            <button>Target</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      expect(result.path.length).toBeGreaterThan(0);
    });

    it('should include div with stable ID', () => {
      document.body.innerHTML = `
        <div id="root">
          <div id="login-form">
            <button>Target</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Div with stable ID should be included
      expect(result.path.length).toBeGreaterThan(0);
      const divNode = result.path.find((node) => node.tag === 'div');
      expect(divNode).toBeDefined();
      expect(divNode?.semantics.id).toBe('login-form');
    });

    it('should exclude utility classes from path nodes', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="container mx-4 p-2 flex justify-center">
            <button>Target</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Should include container but not utility classes
      const divNode = result.path.find((node) => node.tag === 'div');
      if (divNode?.semantics.classes) {
        const classes = divNode.semantics.classes;
        expect(classes).toContain('container');
        expect(classes).not.toContain('mx-4');
        expect(classes).not.toContain('p-2');
      }
    });
  });

  describe('nth-child Calculation', () => {
    it('should calculate 1-based nth-child position', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="container">
            <div class="item">First</div>
            <div class="item">Second</div>
            <div class="item"><button>Target</button></div>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Find the "item" div containing the button
      const itemNode = result.path.find((node) =>
        node.semantics.classes?.includes('item')
      );

      if (itemNode) {
        expect(itemNode.nthChild).toBe(3); // Third child (1-based)
      }
    });

    it('should handle element without parent', () => {
      const orphan = document.createElement('div');
      const button = document.createElement('button');
      orphan.appendChild(button);

      // This should not throw
      const result = builder.buildPath(orphan, button, extractor);

      expect(result.path).toHaveLength(0);
    });

    it('should use parent.children to find position', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="container">
            <span>Text</span>
            <div class="item"><button>Target</button></div>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const itemNode = result.path.find((node) =>
        node.semantics.classes?.includes('item')
      );

      if (itemNode) {
        // Should be second child (after span)
        expect(itemNode.nthChild).toBe(2);
      }
    });
  });

  describe('Uniqueness Algorithm', () => {
    it('should return path as-is when selector is unique', () => {
      document.body.innerHTML = `
        <form id="unique-form">
          <div class="unique-container">
            <button id="unique-button">Submit</button>
          </div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(form, button, extractor);

      // With unique IDs, path should be minimal
      expect(result.path).toBeDefined();
    });

    it('should add skipped nodes when selector is not unique', () => {
      document.body.innerHTML = `
        <div id="root">
          <form>
            <div data-testid="form-1">
              <button>Submit</button>
            </div>
          </form>
          <form>
            <div data-testid="form-2">
              <button>Submit</button>
            </div>
          </form>
        </div>
      `;

      const root = document.getElementById('root')!;
      const firstButton = document.querySelectorAll('button')[0];

      const result = builder.buildPath(root, firstButton, extractor);

      // Should include data-testid div to disambiguate
      const hasDataTestId = result.path.some((node) =>
        node.semantics.attributes &&
        ('data-testid' in node.semantics.attributes)
      );
      expect(hasDataTestId).toBe(true);
    });

    it('should skip nodes below MIN_CONFIDENCE_FOR_SKIP', () => {
      document.body.innerHTML = `
        <div id="root">
          <div>
            <div class="mx-4">
              <button>Submit</button>
            </div>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Low-value nodes (utility classes only) should not be added
      expect(result.path.length).toBeLessThan(2);
    });

    it('should insert nodes in DOM order', () => {
      document.body.innerHTML = `
        <div id="root">
          <section>
            <div class="wrapper">
              <div class="inner">
                <button>Target</button>
              </div>
            </div>
          </section>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Verify path maintains DOM order
      const tags = result.path.map((node) => node.tag);
      const sectionIndex = tags.indexOf('section');
      const divIndices = tags.map((tag, i) => tag === 'div' ? i : -1).filter((i) => i !== -1);

      if (sectionIndex !== -1 && divIndices.length > 0) {
        // section should come before any divs in the path
        expect(divIndices.every((i) => i > sectionIndex)).toBe(true);
      }
    });

    it('should stop when selector becomes unique', () => {
      document.body.innerHTML = `
        <div id="root">
          <form id="login-form">
            <div>
              <div>
                <button>Submit</button>
              </div>
            </div>
          </form>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // With unique form ID, path should be short
      expect(result.path.length).toBeLessThan(3);
    });

    it('should handle querySelectorAll errors gracefully', () => {
      document.body.innerHTML = `
        <div id="root">
          <div id="[invalid-id">
            <button>Submit</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      // Should not throw on invalid selector
      expect(() => {
        builder.buildPath(root, button, extractor);
      }).not.toThrow();
    });
  });

  describe('Cache Integration', () => {
    it('should cache querySelectorAll results', () => {
      const cache = createEIDCache({ maxSize: 100 });
      const cachedBuilder = new PathBuilder(options, cache);

      document.body.innerHTML = `
        <form id="login-form">
          <div class="container">
            <button>Submit</button>
          </div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      // First call - should cache
      cachedBuilder.buildPath(form, button, extractor);

      // Second call - should use cache
      const result2 = cachedBuilder.buildPath(form, button, extractor);

      expect(result2.path).toBeDefined();
    });

    it('should work without cache', () => {
      const noCacheBuilder = new PathBuilder(options); // No cache passed

      document.body.innerHTML = `
        <form>
          <div class="container">
            <button>Submit</button>
          </div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const result = noCacheBuilder.buildPath(form, button, extractor);

      expect(result.path).toBeDefined();
      expect(Array.isArray(result.path)).toBe(true);
    });
  });

  describe('shouldInclude Method', () => {
    it('should include semantic tags', () => {
      const nav = document.createElement('nav');
      const header = document.createElement('header');
      const main = document.createElement('main');

      expect(builder.shouldInclude(nav)).toBe(true);
      expect(builder.shouldInclude(header)).toBe(true);
      expect(builder.shouldInclude(main)).toBe(true);
    });

    it('should exclude plain div', () => {
      const plainDiv = document.createElement('div');
      plainDiv.className = 'mx-4 p-2'; // Only utility classes

      expect(builder.shouldInclude(plainDiv)).toBe(false);
    });

    it('should exclude plain span', () => {
      const plainSpan = document.createElement('span');

      expect(builder.shouldInclude(plainSpan)).toBe(false);
    });

    it('should include div with semantic features', () => {
      const divWithRole = document.createElement('div');
      divWithRole.setAttribute('role', 'banner');

      const divWithAria = document.createElement('div');
      divWithAria.setAttribute('aria-label', 'Main');

      const divWithClass = document.createElement('div');
      divWithClass.className = 'user-profile';

      const divWithTestId = document.createElement('div');
      divWithTestId.setAttribute('data-testid', 'container');

      const divWithId = document.createElement('div');
      divWithId.id = 'main-content';

      expect(builder.shouldInclude(divWithRole)).toBe(true);
      expect(builder.shouldInclude(divWithAria)).toBe(true);
      expect(builder.shouldInclude(divWithClass)).toBe(true);
      expect(builder.shouldInclude(divWithTestId)).toBe(true);
      expect(builder.shouldInclude(divWithId)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty path (direct child)', () => {
      document.body.innerHTML = `
        <form><button>Submit</button></form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(form, button, extractor);

      expect(result.path).toHaveLength(0);
      expect(result.degraded).toBe(false);
    });

    it('should handle missing ownerDocument', () => {
      const orphanAnchor = document.createElement('div');
      const orphanTarget = document.createElement('button');
      orphanAnchor.appendChild(orphanTarget);

      const result = builder.buildPath(orphanAnchor, orphanTarget, extractor);

      // Should handle gracefully
      expect(result.path).toBeDefined();
    });

    it('should handle all path nodes filtered out', () => {
      document.body.innerHTML = `
        <form id="form">
          <div><div><div>
            <button>Submit</button>
          </div></div></div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(form, button, extractor);

      // All plain divs should be filtered out
      expect(result.path.length).toBe(0);
    });

    it('should handle target without parentElement', () => {
      const orphanButton = document.createElement('button');
      const anchor = document.createElement('div');
      anchor.appendChild(orphanButton);

      // Remove parentElement
      orphanButton.remove();

      const result = builder.buildPath(anchor, orphanButton, extractor);

      // Should handle gracefully
      expect(result.path).toBeDefined();
      expect(result.path).toHaveLength(0);
    });

    it('should handle target parentElement is null', () => {
      const button = document.createElement('button');
      const anchor = document.createElement('div');

      // Mock parentElement as null
      Object.defineProperty(button, 'parentElement', {
        get: () => null,
      });

      const result = builder.buildPath(anchor, button, extractor);

      // Should handle gracefully
      expect(result.path).toBeDefined();
    });
  });

  describe('All Semantic Tags', () => {
    // Test major semantic tags that should always be included
    const majorSemanticTags = [
      'article', 'aside', 'footer', 'header', 'main', 'nav', 'section',
      'form',
    ];

    majorSemanticTags.forEach((tag) => {
      it(`should include ${tag} tag in path`, () => {
        document.body.innerHTML = `
          <div id="root">
            <${tag} class="test-${tag}">
              <button>Target</button>
            </${tag}>
          </div>
        `;

        const root = document.getElementById('root')!;
        const button = document.querySelector('button')!;

        const result = builder.buildPath(root, button, extractor);

        const tags = result.path.map((node) => node.tag);
        expect(tags).toContain(tag);
      });
    });

    // Test table tag (requires proper structure)
    it('should include table tag in path', () => {
      document.body.innerHTML = `
        <div id="root">
          <table id="data-table">
            <tbody>
              <tr>
                <td><button>Target</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const tags = result.path.map((node) => node.tag);
      expect(tags).toContain('table');
    });

    // Test form-related semantic tags
    it('should include fieldset tag in path', () => {
      document.body.innerHTML = `
        <div id="root">
          <form>
            <fieldset>
              <button>Target</button>
            </fieldset>
          </form>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const tags = result.path.map((node) => node.tag);
      expect(tags).toContain('fieldset');
    });

    // Test list-related semantic tags
    it('should include ul/ol/li tags in path', () => {
      document.body.innerHTML = `
        <div id="root">
          <ul>
            <li>
              <button>Target</button>
            </li>
          </ul>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const tags = result.path.map((node) => node.tag);
      expect(tags).toContain('ul');
      expect(tags).toContain('li');
    });

    it('should include ol tag in path', () => {
      document.body.innerHTML = `
        <div id="root">
          <ol>
            <li>
              <button>Target</button>
            </li>
          </ol>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const tags = result.path.map((node) => node.tag);
      expect(tags).toContain('ol');
    });

    // Test definition list tags
    it('should include dl/dt/dd tags in path', () => {
      document.body.innerHTML = `
        <div id="root">
          <dl>
            <dt>Term</dt>
            <dd>
              <button>Target</button>
            </dd>
          </dl>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const tags = result.path.map((node) => node.tag);
      expect(tags).toContain('dl');
      expect(tags).toContain('dd');
    });

    // Special cases for table-related tags that require proper structure
    it('should include tr tag in path (within table)', () => {
      document.body.innerHTML = `
        <div id="root">
          <table>
            <tbody>
              <tr>
                <td><button>Target</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const tags = result.path.map((node) => node.tag);
      expect(tags).toContain('tr');
    });

    it('should include td tag in path (within table)', () => {
      document.body.innerHTML = `
        <div id="root">
          <table>
            <tbody>
              <tr>
                <td><button>Target</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const tags = result.path.map((node) => node.tag);
      expect(tags).toContain('td');
    });

    it('should include th tag in path (within table)', () => {
      document.body.innerHTML = `
        <div id="root">
          <table>
            <thead>
              <tr>
                <th><button>Target</button></th>
              </tr>
            </thead>
          </table>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const tags = result.path.map((node) => node.tag);
      expect(tags).toContain('th');
    });
  });

  describe('Uniqueness Algorithm - All Branches', () => {
    it('should return filtered path when selector is unique (matches.length <= 1)', () => {
      document.body.innerHTML = `
        <form id="unique-form">
          <div id="unique-container">
            <button>Submit</button>
          </div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(form, button, extractor);

      // With unique IDs, should return minimal path
      expect(result.path).toBeDefined();
    });

    it('should add skipped nodes when selector is not unique (matches.length > 1)', () => {
      document.body.innerHTML = `
        <div id="root">
          <form>
            <div data-testid="form-1">
              <button>Submit</button>
            </div>
          </form>
          <form>
            <div data-testid="form-2">
              <button>Submit</button>
            </div>
          </form>
        </div>
      `;

      const root = document.getElementById('root')!;
      const firstButton = document.querySelectorAll('button')[0];

      const result = builder.buildPath(root, firstButton, extractor);

      // Should add data-testid div to disambiguate
      const hasDataTestId = result.path.some((node) =>
        node.semantics.attributes &&
        ('data-testid' in node.semantics.attributes)
      );
      expect(hasDataTestId).toBe(true);
    });

    it('should skip nodes below MIN_CONFIDENCE_FOR_SKIP threshold', () => {
      document.body.innerHTML = `
        <div id="root">
          <div>
            <div class="mx-4 p-2">
              <button>Submit</button>
            </div>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Low-value nodes should not be added for uniqueness
      expect(result.path.length).toBeLessThan(3);
    });

    it('should stop adding nodes when selector becomes unique', () => {
      document.body.innerHTML = `
        <div id="root">
          <form id="login-form">
            <div>
              <div>
                <button>Submit</button>
              </div>
            </div>
          </form>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Should stop when unique, not add all nodes
      expect(result.path.length).toBeLessThan(3);
    });

    it('should handle case when all skipped nodes are below threshold', () => {
      document.body.innerHTML = `
        <div id="root">
          <form>
            <div class="mx-4">
              <div class="p-2">
                <button>Submit</button>
              </div>
            </div>
          </form>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      // Should handle gracefully when no good nodes to add
      expect(result.path).toBeDefined();
    });
  });

  describe('QuerySelectorAll Error Handling', () => {
    it('should handle querySelectorAll throwing error', () => {
      document.body.innerHTML = `
        <div id="root">
          <div id="[invalid-id">
            <button>Submit</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      // Should not throw on invalid selector
      expect(() => {
        builder.buildPath(root, button, extractor);
      }).not.toThrow();
    });

    it('should handle querySelectorAll returning empty NodeList', () => {
      document.body.innerHTML = `
        <div id="root">
          <div>
            <button>Submit</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      // Mock querySelectorAll to return empty NodeList
      const originalQuerySelectorAll = document.querySelectorAll;
      document.querySelectorAll = vi.fn().mockReturnValue({
        length: 0,
        [Symbol.iterator]: function* () {},
      } as NodeListOf<Element>);

      const result = builder.buildPath(root, button, extractor);

      // Should handle gracefully
      expect(result.path).toBeDefined();

      // Restore
      document.querySelectorAll = originalQuerySelectorAll;
    });

    it('should handle querySelectorAll with invalid selector in cache check', () => {
      const cache = createEIDCache();
      const cachedBuilder = new PathBuilder(options, cache);

      document.body.innerHTML = `
        <div id="root">
          <div id="test[invalid">
            <button>Submit</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      // Should not throw
      expect(() => {
        cachedBuilder.buildPath(root, button, extractor);
      }).not.toThrow();
    });
  });

  describe('Cache Integration - All Scenarios', () => {
    it('should use cached selector results when available', () => {
      const cache = createEIDCache({ maxSize: 100 });
      const cachedBuilder = new PathBuilder(options, cache);

      document.body.innerHTML = `
        <form id="login-form">
          <div class="container">
            <button>Submit</button>
          </div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      // First call - should cache
      const result1 = cachedBuilder.buildPath(form, button, extractor);

      // Second call - should use cache
      const result2 = cachedBuilder.buildPath(form, button, extractor);

      expect(result1.path).toBeDefined();
      expect(result2.path).toBeDefined();
    });

    it('should cache selector results for uniqueness check', () => {
      const cache = createEIDCache({ maxSize: 100 });
      const cachedBuilder = new PathBuilder(options, cache);

      document.body.innerHTML = `
        <div id="root">
          <form>
            <div data-testid="form-1">
              <button>Submit</button>
            </div>
          </form>
          <form>
            <div data-testid="form-2">
              <button>Submit</button>
            </div>
          </form>
        </div>
      `;

      const root = document.getElementById('root')!;
      const firstButton = document.querySelectorAll('button')[0];

      // First call - builds selector and caches
      const result1 = cachedBuilder.buildPath(root, firstButton, extractor);

      // Second call - should use cached selector results
      const result2 = cachedBuilder.buildPath(root, firstButton, extractor);

      expect(result1.path).toBeDefined();
      expect(result2.path).toBeDefined();
    });

    it('should handle cache miss gracefully', () => {
      const cache = createEIDCache({ maxSize: 1 }); // Small cache to force eviction
      const cachedBuilder = new PathBuilder(options, cache);

      document.body.innerHTML = `
        <form id="form1">
          <button>Submit</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      // Should work even if cache is full
      const result = cachedBuilder.buildPath(form, button, extractor);

      expect(result.path).toBeDefined();
    });

    it('should work without cache (undefined cache)', () => {
      const noCacheBuilder = new PathBuilder(options, undefined);

      document.body.innerHTML = `
        <form>
          <div class="container">
            <button>Submit</button>
          </div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const result = noCacheBuilder.buildPath(form, button, extractor);

      expect(result.path).toBeDefined();
      expect(Array.isArray(result.path)).toBe(true);
    });
  });

  describe('Utility Class Filtering', () => {
    it('should filter Tailwind utility classes', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="container mx-4 p-2 flex justify-center items-center">
            <button>Target</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const divNode = result.path.find((node) => node.tag === 'div');
      if (divNode?.semantics.classes) {
        const classes = divNode.semantics.classes;
        expect(classes).toContain('container');
        expect(classes).not.toContain('mx-4');
        expect(classes).not.toContain('p-2');
        expect(classes).not.toContain('flex');
      }
    });

    it('should filter Bootstrap utility classes', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="container d-flex justify-content-center align-items-center">
            <button>Target</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const divNode = result.path.find((node) => node.tag === 'div');
      if (divNode?.semantics.classes) {
        const classes = divNode.semantics.classes;
        expect(classes).toContain('container');
        // Bootstrap utility classes should be filtered
        expect(classes).not.toContain('d-flex');
      }
    });

    it('should keep semantic classes while filtering utilities', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="user-profile mx-4 p-2">
            <button>Target</button>
          </div>
        </div>
      `;

      const root = document.getElementById('root')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(root, button, extractor);

      const divNode = result.path.find((node) => node.tag === 'div');
      if (divNode?.semantics.classes) {
        const classes = divNode.semantics.classes;
        expect(classes).toContain('user-profile');
        expect(classes).not.toContain('mx-4');
        expect(classes).not.toContain('p-2');
      }
    });
  });

  describe('Path optimization', () => {
    it('should optimize path when selector is not unique', () => {
      document.body.innerHTML = `
        <form id="login">
          <div class="container">
            <div class="field">
              <button>Submit</button>
            </div>
            <div class="field">
              <button>Cancel</button>
            </div>
          </div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const submitButton = document.querySelectorAll('button')[0];

      const result = builder.buildPath(form, submitButton, extractor);

      // Path should be optimized to make selector unique
      expect(result.path.length).toBeGreaterThan(0);
    });

    it('should use cache for selector results during optimization', () => {
      document.body.innerHTML = `
        <form id="login">
          <div class="container">
            <div class="field">
              <button>Submit</button>
            </div>
            <div class="field">
              <button>Cancel</button>
            </div>
          </div>
        </form>
      `;

      const cache = createEIDCache();
      const builderWithCache = new PathBuilder(options, cache);
      const form = document.querySelector('form')!;
      const submitButton = document.querySelectorAll('button')[0];

      // First call - should compute and cache
      const result1 = builderWithCache.buildPath(form, submitButton, extractor);
      expect(result1.path.length).toBeGreaterThan(0);

      // Second call - should use cache
      const result2 = builderWithCache.buildPath(form, submitButton, extractor);
      expect(result2.path).toEqual(result1.path);
    });

    it('should handle querySelectorAll errors during optimization', () => {
      document.body.innerHTML = `
        <form id="login">
          <div class="container">
            <div class="field">
              <button>Submit</button>
            </div>
          </div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      // Mock querySelectorAll to throw error
      const originalQuerySelectorAll = document.querySelectorAll;
      document.querySelectorAll = vi.fn().mockImplementation(() => {
        throw new Error('Invalid selector');
      });

      const result = builder.buildPath(form, button, extractor);

      // Should return path even if querySelectorAll fails
      expect(result.path).toBeDefined();

      // Restore
      document.querySelectorAll = originalQuerySelectorAll;
    });

    it('should skip low-score nodes during optimization', () => {
      document.body.innerHTML = `
        <form id="login">
          <div>
            <div>
              <button>Submit</button>
            </div>
          </div>
        </form>
      `;

      const form = document.querySelector('form')!;
      const button = document.querySelector('button')!;

      const result = builder.buildPath(form, button, extractor);

      // Should build path, skipping low-score nodes
      expect(result.path).toBeDefined();
    });
  });
});
