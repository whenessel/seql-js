import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { generateEID } from '../../src/generator';
import { resolve } from '../../src/resolver';
import { stringifySEQL, parseSEQL } from '../../src/utils/seql-parser';

describe('Negative Tailwind classes filtering', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <section id="welcome">
            <div class="container">
              <div class="absolute -bottom-6 -left-6 w-2/3 rounded-2xl overflow-hidden shadow-xl">
                <img src="https://example.com/image.jpg" alt="Luxury apartment interior" class="w-full h-full object-cover">
              </div>
            </div>
          </section>
        </body>
      </html>
    `);
    document = dom.window.document;
  });

  it('should filter out negative Tailwind utility classes from EID', () => {
    const img = document.querySelector('img')!;
    const eid = generateEID(img);

    expect(eid).not.toBeNull();

    // Проверяем, что родитель с классами -bottom-6, -left-6 НЕ содержит эти классы в семантике
    const pathNode = eid!.path.find(node => node.tag === 'div');

    if (pathNode?.semantics.classes) {
      // Все Tailwind утилиты должны быть отфильтрованы
      expect(pathNode.semantics.classes).not.toContain('absolute');
      expect(pathNode.semantics.classes).not.toContain('-bottom-6');
      expect(pathNode.semantics.classes).not.toContain('-left-6');
      expect(pathNode.semantics.classes).not.toContain('w-2/3');
      expect(pathNode.semantics.classes).not.toContain('rounded-2xl');
      expect(pathNode.semantics.classes).not.toContain('overflow-hidden');
      expect(pathNode.semantics.classes).not.toContain('shadow-xl');
    }
  });

  it('should not include negative Tailwind classes in SEQL selector', () => {
    const img = document.querySelector('img')!;
    const seql = stringifySEQL(generateEID(img)!);

    // SEQL селектор НЕ должен содержать утилитарные классы
    expect(seql).not.toContain('.-bottom-6');
    expect(seql).not.toContain('.-left-6');
    expect(seql).not.toContain('.absolute');
    expect(seql).not.toContain('.w-2');
    expect(seql).not.toContain('.rounded');
    expect(seql).not.toContain('.overflow');
    expect(seql).not.toContain('.shadow');
  });

  it('should successfully parse and resolve SEQL without utility classes', () => {
    const img = document.querySelector('img')!;
    const eid = generateEID(img);
    const seql = stringifySEQL(eid!);

    // Парсинг должен успешно пройти (без ошибок)
    expect(() => parseSEQL(seql)).not.toThrow();

    const parsedEid = parseSEQL(seql);
    expect(parsedEid).not.toBeNull();

    // Резолв должен найти элемент
    const result = resolve(parsedEid, document);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0]).toBe(img);
  });

  it('should filter various negative Tailwind utilities', () => {
    const testCases = [
      { classes: ['-m-4', '-mt-2'], shouldBeEmpty: true },
      { classes: ['-top-4', '-bottom-6', '-left-6'], shouldBeEmpty: true },
      { classes: ['-z-10', '-z-20'], shouldBeEmpty: true },
      { classes: ['-space-x-2', '-space-y-4'], shouldBeEmpty: true },
      { classes: ['semantic-class', '-mt-4', 'button-primary'], shouldBeEmpty: false },
    ];

    for (const { classes, shouldBeEmpty } of testCases) {
      const html = `<div class="${classes.join(' ')}"></div>`;
      const testDom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
      const testDoc = testDom.window.document;
      const div = testDoc.querySelector('div')!;

      const eid = generateEID(div);
      const remainingClasses = eid?.target.semantics.classes || [];

      if (shouldBeEmpty) {
        // Все утилиты должны быть отфильтрованы
        expect(remainingClasses.length).toBe(0);
      } else {
        // Семантические классы должны остаться
        expect(remainingClasses).toContain('semantic-class');
        expect(remainingClasses).toContain('button-primary');
        expect(remainingClasses).not.toContain('-mt-4');
      }
    }
  });
});
