import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { generateEIQ, parseEIQ, resolveEIQ } from '../src';

describe('EIQ Shortening and Visibility Priority', () => {
  it('should not include default constraints in generated EIQ', () => {
    const dom = new JSDOM(`
      <div>
        <button id="my-button">Click me</button>
      </div>
    `);
    const button = dom.window.document.getElementById('my-button')!;
    const eiq = generateEIQ(button);
    
    // Should NOT contain constraints block
    expect(eiq).not.toContain('{unique=true,visible=true}');
    expect(eiq).toBe('v1.0: body :: button[id="my-button",text="Click me"]');
  });

  it('should prioritize visible elements when multiple matches exist', () => {
    document.body.innerHTML = `
      <div>
        <button class="target" style="display: none">Hidden</button>
        <button class="target">Visible</button>
        <button class="target" style="visibility: hidden">Hidden 2</button>
      </div>
    `;
    const visibleButton = document.querySelectorAll('button')[1];
    
    const eiq = 'v1.0: body :: button.target';
    const results = resolveEIQ(eiq, document);
    
    expect(results.length).toBe(1);
    expect(results[0]).toBe(visibleButton);
    expect(results[0].textContent).toBe('Visible');
  });

  it('should still find hidden elements if they are the only match', () => {
    document.body.innerHTML = `
      <div>
        <button id="hidden-btn" style="display: none">Hidden</button>
      </div>
    `;
    const hiddenButton = document.getElementById('hidden-btn')!;
    
    const eiq = 'v1.0: body :: button[id="hidden-btn"]';
    const results = resolveEIQ(eiq, document);
    
    expect(results.length).toBe(1);
    expect(results[0]).toBe(hiddenButton);
  });
});
