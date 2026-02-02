import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator';
import { resolve } from '../../src/resolver';
import { CssGenerator } from '../../src/resolver/css-generator';
import type { ElementIdentity } from '../../src/types';

describe('resolver', () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('Test');
  });

  describe('resolve', () => {
    it('should resolve DSL back to the original element', () => {
      // Create structure
      const form = doc.createElement('form');
      form.id = 'test-form';
      const button = doc.createElement('button');
      button.className = 'submit';
      button.setAttribute('type', 'submit');
      button.textContent = 'Submit';
      form.appendChild(button);
      doc.body.appendChild(form);

      // Generate DSL
      const dsl = generateEID(button);
      expect(dsl).not.toBeNull();

      // Resolve back
      const result = resolve(dsl!, doc);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(button);
    });

    it('should handle not found with fallback', () => {
      const dsl: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'form',
          semantics: { id: 'nonexistent-form' },
          score: 0.8,
          degraded: false,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: { classes: ['nonexistent'] },
          score: 0.7,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'none',
          maxDepth: 3,
        },
        meta: {
          confidence: 0.75,
          generatedAt: new Date().toISOString(),
          generator: 'dom-dsl@1.0',
          source: 'test',
          degraded: false,
        },
      };

      const result = resolve(dsl, doc, { enableFallback: false });

      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
    });

    it('should resolve correct element using nthChild in table structure', () => {
      // Create a table with multiple rows and cells
      const table = doc.createElement('table');
      const tbody = doc.createElement('tbody');
      table.appendChild(tbody);

      // Create 3 rows with 3 cells each
      for (let row = 0; row < 3; row++) {
        const tr = doc.createElement('tr');
        for (let col = 0; col < 3; col++) {
          const td = doc.createElement('td');
          const button = doc.createElement('button');
          button.textContent = `R${row + 1}C${col + 1}`;
          td.appendChild(button);
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      doc.body.appendChild(table);

      // Target the button in row 2, cell 3 (middle row, last column)
      const targetRow = tbody.children[1] as HTMLTableRowElement;
      const targetCell = targetRow.children[2] as HTMLTableCellElement;
      const targetButton = targetCell.querySelector('button') as HTMLButtonElement;

      expect(targetButton.textContent).toBe('R2C3');

      // Generate DSL for the target button
      const dsl = generateEID(targetButton);
      expect(dsl).not.toBeNull();

      // Verify that nthChild is present in path nodes
      const pathWithNthChild = dsl!.path.filter((node) => node.nthChild !== undefined);
      expect(pathWithNthChild.length).toBeGreaterThan(0);

      // Resolve back
      const result = resolve(dsl!, doc);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(targetButton);
      expect(result.elements[0].textContent).toBe('R2C3');
    });

    it('should resolve correct TD element with duplicate text in calendar-like table', () => {
      // Create a calendar-like table structure with duplicate dates
      // Simulates a date picker where dates from previous/next months appear
      const table = doc.createElement('table');
      table.setAttribute('role', 'grid');
      table.setAttribute('aria-labelledby', 'calendar-title');

      const tbody = doc.createElement('tbody');
      tbody.className = 'calendar-body';
      table.appendChild(tbody);

      // Row 1: Previous month dates (28, 29, 30) + current month (1, 2, 3, 4)
      const row1 = doc.createElement('tr');
      ['28', '29', '30', '31', '1', '2', '3'].forEach((text) => {
        const td = doc.createElement('td');
        td.setAttribute('role', 'presentation');
        td.textContent = text;
        row1.appendChild(td);
      });
      tbody.appendChild(row1);

      // Row 2: Current month dates (4-10)
      const row2 = doc.createElement('tr');
      ['4', '5', '6', '7', '8', '9', '10'].forEach((text) => {
        const td = doc.createElement('td');
        td.setAttribute('role', 'presentation');
        td.textContent = text;
        row2.appendChild(td);
      });
      tbody.appendChild(row2);

      // Row 3: Current month dates (11-17)
      const row3 = doc.createElement('tr');
      ['11', '12', '13', '14', '15', '16', '17'].forEach((text) => {
        const td = doc.createElement('td');
        td.setAttribute('role', 'presentation');
        td.textContent = text;
        row3.appendChild(td);
      });
      tbody.appendChild(row3);

      // Row 4: Current month dates (18-24) - TARGET ROW
      const row4 = doc.createElement('tr');
      ['18', '19', '20', '21', '22', '23', '24'].forEach((text) => {
        const td = doc.createElement('td');
        td.setAttribute('role', 'presentation');
        td.textContent = text;
        row4.appendChild(td);
      });
      tbody.appendChild(row4);

      // Row 5: Current month dates (25-31)
      const row5 = doc.createElement('tr');
      ['25', '26', '27', '28', '29', '30', '31'].forEach((text) => {
        const td = doc.createElement('td');
        td.setAttribute('role', 'presentation');
        td.textContent = text;
        row5.appendChild(td);
      });
      tbody.appendChild(row5);

      doc.body.appendChild(table);

      // Target: TD with text "31" in row 5, cell 7 (NOT the "31" in row 1, cell 4)
      const targetRow = tbody.children[4] as HTMLTableRowElement; // Row 5 (0-indexed: 4)
      const targetTd = targetRow.children[6] as HTMLTableCellElement; // Cell 7 (0-indexed: 6)

      expect(targetTd.textContent).toBe('31');

      // Verify there are multiple TDs with text "31"
      const allTdsWithText31 = Array.from(table.querySelectorAll('td')).filter(
        (td) => td.textContent === '31'
      );
      expect(allTdsWithText31.length).toBe(2); // One in row 1, one in row 5

      // Generate DSL for the target TD (row 5, cell 7)
      const dsl = generateEID(targetTd);
      expect(dsl).not.toBeNull();

      // Verify that nthChild is present in path nodes
      const pathWithNthChild = dsl!.path.filter((node) => node.nthChild !== undefined);
      expect(pathWithNthChild.length).toBeGreaterThan(0);

      // Find the TR node in path and verify its nthChild is 5 (row 5)
      const trNode = dsl!.path.find((node) => node.tag === 'tr');
      expect(trNode).toBeDefined();
      expect(trNode!.nthChild).toBe(5); // Row 5

      // Resolve back - should find the CORRECT TD (row 5, cell 7), not the first one
      const result = resolve(dsl!, doc);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(targetTd);
      expect(result.elements[0].textContent).toBe('31');

      // Verify it's the correct TD by checking its position
      const resolvedTd = result.elements[0] as HTMLTableCellElement;
      const resolvedRow = resolvedTd.parentElement as HTMLTableRowElement;
      const resolvedTbody = resolvedRow.parentElement as HTMLTableSectionElement;

      const rowIndex = Array.from(resolvedTbody.children).indexOf(resolvedRow);
      const cellIndex = Array.from(resolvedRow.children).indexOf(resolvedTd);

      expect(rowIndex).toBe(4); // Row 5 (0-indexed: 4)
      expect(cellIndex).toBe(6); // Cell 7 (0-indexed: 6)
    });

    it('should resolve TD element itself (not button inside) in calendar table', () => {
      // Create a calendar-like table structure
      const table = doc.createElement('table');
      table.setAttribute('role', 'grid');
      table.setAttribute('aria-labelledby', 'react-day-picker-28');
      table.className = 'w-full border-collapse space-y-1';

      const tbody = doc.createElement('tbody');
      tbody.className = 'rdp-tbody';
      table.appendChild(tbody);

      // Create 5 rows with 7 cells each
      for (let row = 0; row < 5; row++) {
        const tr = doc.createElement('tr');
        for (let col = 0; col < 7; col++) {
          const td = doc.createElement('td');
          td.setAttribute('role', 'presentation');
          const button = doc.createElement('button');
          button.textContent = `${row * 7 + col + 1}`;
          td.appendChild(button);
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      doc.body.appendChild(table);

      // Target: TD element in row 3, cell 4 (contains button with text "18")
      // Row 0: 1-7, Row 1: 8-14, Row 2: 15-21, Row 3: 22-28
      // So for "18" we need Row 2 (0-indexed: 2), Cell 3 (0-indexed: 3) -> 15 + 3 = 18
      const targetRow = tbody.children[2] as HTMLTableRowElement; // Row 3 (0-indexed: 2)
      const targetTd = targetRow.children[3] as HTMLTableCellElement; // Cell 4 (0-indexed: 3)

      expect(targetTd.textContent).toBe('18');

      // Generate DSL for the TD element itself (not the button inside)
      const dsl = generateEID(targetTd);
      expect(dsl).not.toBeNull();

      // Verify DSL structure
      expect(dsl!.target.tag).toBe('td');
      expect(dsl!.target.semantics.role).toBe('presentation');

      // Resolve back - should find the TD element, not fallback to anchor
      const result = resolve(dsl!, doc);
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(targetTd);
      expect(result.elements[0].tagName.toLowerCase()).toBe('td');

      // Verify it's the correct TD by checking its position
      const resolvedTd = result.elements[0] as HTMLTableCellElement;
      const resolvedRow = resolvedTd.parentElement as HTMLTableRowElement;
      const resolvedTbody = resolvedRow.parentElement as HTMLTableSectionElement;

      const rowIndex = Array.from(resolvedTbody.children).indexOf(resolvedRow);
      const cellIndex = Array.from(resolvedRow.children).indexOf(resolvedTd);

      expect(rowIndex).toBe(2); // Row 3 (0-indexed: 2)
      expect(cellIndex).toBe(3); // Cell 4 (0-indexed: 3)
    });

    it('should resolve correct TR element using nthChild', () => {
      // Create a table with multiple rows
      const table = doc.createElement('table');
      table.setAttribute('role', 'grid');
      table.setAttribute('aria-labelledby', 'react-day-picker-28');

      const tbody = doc.createElement('tbody');
      tbody.className = 'rdp-tbody';
      table.appendChild(tbody);

      // Create 5 rows with 7 cells each
      for (let row = 0; row < 5; row++) {
        const tr = doc.createElement('tr');
        for (let col = 0; col < 7; col++) {
          const td = doc.createElement('td');
          td.setAttribute('role', 'presentation');
          td.textContent = `${row * 7 + col + 1}`;
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      doc.body.appendChild(table);

      // Target: TR element (row 4, 0-indexed: 3)
      const targetRow = tbody.children[3] as HTMLTableRowElement;

      expect(targetRow.tagName.toLowerCase()).toBe('tr');
      expect(targetRow.children.length).toBe(7);

      // Generate DSL for the TR element itself
      const dsl = generateEID(targetRow);
      expect(dsl).not.toBeNull();

      // Verify DSL structure
      expect(dsl!.target.tag).toBe('tr');

      // Verify that nthChild is present in target
      expect(dsl!.target.nthChild).toBeDefined();
      expect(dsl!.target.nthChild).toBe(4); // Row 4 (1-based)

      // Resolve back - should find the correct TR element
      const result = resolve(dsl!, doc);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(targetRow);
      expect(result.elements[0].tagName.toLowerCase()).toBe('tr');

      // Verify it's the correct TR by checking its position
      const resolvedRow = result.elements[0] as HTMLTableRowElement;
      const resolvedTbody = resolvedRow.parentElement as HTMLTableSectionElement;

      const rowIndex = Array.from(resolvedTbody.children).indexOf(resolvedRow);
      expect(rowIndex).toBe(3); // Row 4 (0-indexed: 3)

      // Verify row content
      expect(resolvedRow.children[0].textContent).toBe('22'); // First cell of row 4
    });
  });

  describe('CssGenerator', () => {
    it('should build correct CSS selector from DSL', () => {
      const generator = new CssGenerator();

      const dsl: unknown = {
        version: '1.0',
        anchor: {
          tag: 'form',
          semantics: { id: 'login' },
          score: 0.8,
          degraded: false,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {
            classes: ['btn', 'primary'],
            attributes: { type: 'submit' },
          },
          score: 0.7,
        },
        constraints: [],
        fallback: { onMultiple: 'first', onMissing: 'none', maxDepth: 3 },
        meta: {
          confidence: 0.75,
          generatedAt: '',
          generator: '',
          source: '',
          degraded: false,
        },
      };

      const selector = generator.buildSelector(dsl);

      expect(selector).toContain('form#login');
      expect(selector).toContain('button');
      expect(selector).toContain('.btn');
      // Note: 'primary' might be filtered if it's detected as utility
      // The selector should contain at least one stable class
      expect(selector).toContain('[type="submit"]');
    });

    it('should filter out invalid arbitrary classes from selector', () => {
      const generator = new CssGenerator();

      const dsl: unknown = {
        version: '1.0',
        anchor: {
          tag: 'footer',
          semantics: {},
          score: 0.5,
          degraded: false,
        },
        path: [
          {
            tag: 'div',
            semantics: {
              classes: ['[animation-delay:300ms]', 'container'],
            },
            score: 0.6,
          },
        ],
        target: {
          tag: 'span',
          semantics: {
            classes: ['text-muted'],
          },
          score: 0.55,
        },
        constraints: [],
        fallback: { onMultiple: 'first', onMissing: 'none', maxDepth: 3 },
        meta: {
          confidence: 0.75,
          generatedAt: '',
          generator: '',
          source: '',
          degraded: false,
        },
      };

      const selector = generator.buildSelector(dsl);

      // Should NOT contain the arbitrary class
      expect(selector).not.toContain('[animation-delay:300ms]');
      expect(selector).not.toContain('\\[animation-delay');
      // Should contain valid classes
      expect(selector).toContain('footer');
      expect(selector).toContain('div');
      expect(selector).toContain('span');
    });
  });

  describe('Fallback Scenarios', () => {
    it('should use anchor-only fallback when target not found', () => {
      const form = doc.createElement('form');
      form.id = 'login-form';
      doc.body.appendChild(form);

      const button = doc.createElement('button');
      button.textContent = 'Submit';
      form.appendChild(button);

      const eid = generateEID(button)!;
      // Remove button from DOM
      button.remove();

      eid.fallback.onMissing = 'anchor-only';
      const result = resolve(eid, doc, { enableFallback: true });

      expect(result.status).toBe('degraded-fallback');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(form); // Should return anchor
      expect(result.confidence).toBeLessThan(eid.meta.confidence);
    });

    it('should use best-score fallback for multiple matches', () => {
      const form = doc.createElement('form');
      form.id = 'login-form';
      const button1 = doc.createElement('button');
      button1.textContent = 'Submit';
      button1.id = 'submit-1';
      const button2 = doc.createElement('button');
      button2.textContent = 'Submit';
      button2.id = 'submit-2';
      form.appendChild(button1);
      form.appendChild(button2);
      doc.body.appendChild(form);

      const eid = generateEID(button1)!;
      eid.fallback.onMultiple = 'best-score';

      const result = resolve(eid, doc);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      // Should select element with best score (likely button1 with id)
      expect(result.elements[0].id).toBe('submit-1');
    });

    it('should use allow-multiple fallback for multiple matches', () => {
      const form = doc.createElement('form');
      form.id = 'login-form';
      const button1 = doc.createElement('button');
      button1.textContent = 'Submit';
      const button2 = doc.createElement('button');
      button2.textContent = 'Submit';
      form.appendChild(button1);
      form.appendChild(button2);
      doc.body.appendChild(form);

      const eid = generateEID(button1)!;
      eid.fallback.onMultiple = 'allow-multiple';

      const result = resolve(eid, doc);

      expect(result.status).toBe('success');
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
      // Confidence may be degraded or same depending on fallback handler logic
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should resolve quickly with many candidates', () => {
      const form = doc.createElement('form');
      form.id = 'login-form';
      for (let i = 0; i < 100; i++) {
        const button = doc.createElement('button');
        button.textContent = `Button ${i}`;
        form.appendChild(button);
      }
      doc.body.appendChild(form);

      const targetButton = form.children[50] as HTMLButtonElement;
      const eid = generateEID(targetButton)!;

      const start = performance.now();
      const result = resolve(eid, doc);
      const duration = performance.now() - start;

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should limit candidates with maxCandidates option', () => {
      const form = doc.createElement('form');
      form.id = 'login-form';
      for (let i = 0; i < 200; i++) {
        const button = doc.createElement('button');
        button.textContent = 'Submit';
        form.appendChild(button);
      }
      doc.body.appendChild(form);

      const targetButton = form.children[0] as HTMLButtonElement;
      const eid = generateEID(targetButton)!;

      const start = performance.now();
      const result = resolve(eid, doc, { maxCandidates: 50 });
      const duration = performance.now() - start;

      expect(result.status).toBe('success');
      expect(duration).toBeLessThan(100); // Should be faster with limit
    });
  });

  describe('DOM Variations', () => {
    it('should resolve after DOM structure changes', () => {
      const form = doc.createElement('form');
      form.id = 'login-form';
      const button = doc.createElement('button');
      button.textContent = 'Submit';
      form.appendChild(button);
      doc.body.appendChild(form);

      const eid = generateEID(button)!;

      // Add wrapper div
      const wrapper = doc.createElement('div');
      wrapper.className = 'wrapper';
      form.insertBefore(wrapper, button);
      wrapper.appendChild(button);

      const result = resolve(eid, doc);

      // Should still resolve despite structure change
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });

    it('should resolve with dynamic classes added', () => {
      const form = doc.createElement('form');
      form.id = 'login-form';
      const button = doc.createElement('button');
      button.textContent = 'Submit';
      form.appendChild(button);
      doc.body.appendChild(form);

      const eid = generateEID(button)!;

      // Add dynamic class
      button.classList.add('active', 'focused');

      const result = resolve(eid, doc);

      // Should still resolve (dynamic classes filtered)
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });

    it('should resolve with attributes changed', () => {
      const form = doc.createElement('form');
      form.id = 'login-form';
      const button = doc.createElement('button');
      button.textContent = 'Submit';
      form.appendChild(button);
      doc.body.appendChild(form);

      const eid = generateEID(button)!;

      // Change state attributes
      button.setAttribute('disabled', 'true');
      button.setAttribute('aria-selected', 'true');

      const result = resolve(eid, doc);

      // Should still resolve (state attributes filtered)
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });
  });

  describe('Resilience', () => {
    it('should handle missing anchor gracefully', () => {
      const form = doc.createElement('form');
      form.id = 'login-form';
      const button = doc.createElement('button');
      button.textContent = 'Submit';
      form.appendChild(button);
      doc.body.appendChild(form);

      const eid = generateEID(button)!;
      // Remove anchor
      form.remove();

      const result = resolve(eid, doc, { enableFallback: false });

      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
    });

    it('should handle invalid CSS selector gracefully', () => {
      const form = doc.createElement('form');
      form.id = 'login[form'; // Invalid ID
      const button = doc.createElement('button');
      button.textContent = 'Submit';
      form.appendChild(button);
      doc.body.appendChild(form);

      const eid = generateEID(button)!;

      const result = resolve(eid, doc);

      // Should handle gracefully (jsdom may or may not throw on invalid selector)
      expect(['error', 'degraded-fallback', 'success']).toContain(result.status);
    });

    it('should handle empty document', () => {
      const emptyDoc = document.implementation.createHTMLDocument('Empty');
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'form',
          semantics: { id: 'nonexistent' },
          score: 0.9,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {},
          score: 0.8,
        },
        meta: {
          confidence: 0.85,
          generatedAt: Date.now(),
        },
        constraints: [],
        fallback: {
          onMissing: 'none',
          onMultiple: 'first',
        },
      };

      const result = resolve(eid, emptyDoc, { enableFallback: false });

      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
    });
  });

  describe('Complex Structures', () => {
    it('should resolve in deeply nested structure', () => {
      let current = doc.body;
      for (let i = 0; i < 10; i++) {
        const div = doc.createElement('div');
        div.className = `level-${i}`;
        current.appendChild(div);
        current = div;
      }
      const button = doc.createElement('button');
      button.textContent = 'Submit';
      current.appendChild(button);

      const eid = generateEID(button)!;

      const result = resolve(eid, doc);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(button);
    });

    it('should resolve in shadow DOM-like structure', () => {
      const container = doc.createElement('div');
      container.id = 'shadow-container';
      const form = doc.createElement('form');
      form.id = 'login-form';
      const button = doc.createElement('button');
      button.textContent = 'Submit';
      form.appendChild(button);
      container.appendChild(form);
      doc.body.appendChild(container);

      const eid = generateEID(button)!;

      const result = resolve(eid, container); // Resolve within container

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(button);
    });

    it('should resolve with multiple forms and similar buttons', () => {
      for (let i = 0; i < 5; i++) {
        const form = doc.createElement('form');
        form.id = `form-${i}`;
        const button = doc.createElement('button');
        button.textContent = 'Submit';
        form.appendChild(button);
        doc.body.appendChild(form);
      }

      const targetForm = doc.getElementById('form-2')!;
      const targetButton = targetForm.querySelector('button')!;
      const eid = generateEID(targetButton)!;

      const result = resolve(eid, doc);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      // Should resolve to one of the buttons (anchor context should help)
      const resolvedFormId = result.elements[0].closest('form')?.id;
      expect(resolvedFormId).toBeDefined();
      expect(['form-0', 'form-1', 'form-2', 'form-3', 'form-4']).toContain(resolvedFormId);
    });
  });
});
