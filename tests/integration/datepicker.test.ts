import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateSEQL, resolveSEQL } from '../../src';

describe('Date Picker - Dynamic ID handling', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should generate SEQL without dynamic aria-labelledby', () => {
    container.innerHTML = `
      <div id="calendar-container">
        <table aria-labelledby="react-day-picker-1" role="grid">
          <tbody class="rdp-tbody">
            <tr>
              <td role="presentation">
                <button name="day" role="gridcell" type="button">30</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const button = container.querySelector('button')!;
    const seql = generateSEQL(button);

    // SEQL should NOT contain dynamic aria-labelledby
    expect(seql).not.toBeNull();
    expect(seql).not.toContain('react-day-picker-1');
    expect(seql).toContain('role="grid"'); // But should keep role
  });

  it('should resolve element after simulated re-render with different ID', () => {
    // First render
    container.innerHTML = `
      <table aria-labelledby="react-day-picker-1" role="grid">
        <tbody>
          <tr><td><button>30</button></td></tr>
        </tbody>
      </table>
    `;

    const button1 = container.querySelector('button')!;
    const seql = generateSEQL(button1);

    // Simulate re-render with different ID
    container.innerHTML = `
      <table aria-labelledby="react-day-picker-2" role="grid">
        <tbody>
          <tr><td><button>30</button></td></tr>
        </tbody>
      </table>
    `;

    const elements = resolveSEQL(seql!, document);
    expect(elements.length).toBe(1);
    expect(elements[0].textContent).toBe('30');
  });

  it('should handle MUI date picker pattern', () => {
    container.innerHTML = `
      <div aria-describedby="mui-date-input-1" class="date-picker">
        <input type="text" role="textbox" value="2024-01-15" />
      </div>
    `;

    const input = container.querySelector('input')!;
    const seql = generateSEQL(input);

    expect(seql).not.toBeNull();
    expect(seql).not.toContain('mui-date-input-1');

    // Re-render with different ID
    container.innerHTML = `
      <div aria-describedby="mui-date-input-2" class="date-picker">
        <input type="text" role="textbox" value="2024-01-15" />
      </div>
    `;

    const elements = resolveSEQL(seql!, document);
    expect(elements.length).toBe(1);
  });

  it('should keep stable aria-labelledby values', () => {
    container.innerHTML = `
      <div>
        <label id="calendar-label">Select Date</label>
        <table aria-labelledby="calendar-label" role="grid">
          <tbody>
            <tr><td><button>15</button></td></tr>
          </tbody>
        </table>
      </div>
    `;

    const button = container.querySelector('button')!;
    const seql = generateSEQL(button);

    // Stable aria-labelledby should be kept
    expect(seql).not.toBeNull();
    expect(seql).toContain('aria-labelledby="calendar-label"');
  });

  it('should handle mixed stable and dynamic IDs in aria-labelledby', () => {
    container.innerHTML = `
      <table aria-labelledby="stable-label react-day-picker-1" role="grid">
        <tbody>
          <tr><td><button>20</button></td></tr>
        </tbody>
      </table>
    `;

    const button = container.querySelector('button')!;
    const seql = generateSEQL(button);

    // Should NOT contain the attribute because one of the IDs is dynamic
    expect(seql).not.toBeNull();
    expect(seql).not.toContain('aria-labelledby');
    expect(seql).toContain('role="grid"');
  });

  it('should handle aria-controls with dynamic ID', () => {
    container.innerHTML = `
      <div>
        <button aria-controls="dropdown-menu-1" type="button">Open Menu</button>
        <ul id="dropdown-menu-1" role="menu">
          <li role="menuitem">Item 1</li>
        </ul>
      </div>
    `;

    const button = container.querySelector('button')!;
    const seql = generateSEQL(button);

    expect(seql).not.toBeNull();
    expect(seql).not.toContain('dropdown-menu-1');
  });

  it('should handle for attribute with dynamic ID', () => {
    container.innerHTML = `
      <div>
        <label for="input-123">Name</label>
        <input id="input-123" type="text" />
      </div>
    `;

    const label = container.querySelector('label')!;
    const seql = generateSEQL(label);

    expect(seql).not.toBeNull();
    expect(seql).not.toContain('input-123');
  });
});
