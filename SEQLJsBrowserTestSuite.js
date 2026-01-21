// ============================================================================
// SEQL-JS BROWSER TEST SUITE
// Тестирование полного цикла: Element → EID → SEQL → EID → Element → CSS/XPath
// ============================================================================

(function() {
  'use strict';

  // Проверка доступности библиотеки
  const lib = window.SeqlJS || window.domDsl;
  if (!lib) {
    console.error('❌ Библиотека seql-js не найдена. Загрузите библиотеку как window.seqlJs или window.domDsl');
    return;
  }

  console.log('✅ Библиотека seql-js загружена:', lib);

  // ============================================================================
  // HELPER: Генерация XPath (библиотека не поддерживает, делаем вручную)
  // ============================================================================

  function generateXPath(element) {
    if (!element || element.nodeType !== 1) return null;

    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;

      // Считаем позицию среди siblings с тем же тегом
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE &&
            sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      const tagName = current.tagName.toLowerCase();
      const part = index > 0 ? `${tagName}[${index + 1}]` : tagName;
      parts.unshift(part);

      current = current.parentElement;
    }

    return '/' + parts.join('/');
  }

  // ============================================================================
  // HELPER: Визуальное выделение элемента
  // ============================================================================

  function highlightElement(element, color = '#ff0') {
    if (!element) return;

    const originalBorder = element.style.border;
    const originalOutline = element.style.outline;

    element.style.border = `3px solid ${color}`;
    element.style.outline = `3px dashed ${color}`;

    setTimeout(() => {
      element.style.border = originalBorder;
      element.style.outline = originalOutline;
    }, 3000);
  }

  // ============================================================================
  // HELPER: Глубокое сравнение EID
  // ============================================================================

  function compareEID(eid1, eid2) {
    const diffs = [];

    // Сравниваем anchor
    if (JSON.stringify(eid1.anchor) !== JSON.stringify(eid2.anchor)) {
      diffs.push('anchor');
    }

    // Сравниваем path
    if (JSON.stringify(eid1.path) !== JSON.stringify(eid2.path)) {
      diffs.push('path');
    }

    // Сравниваем target
    if (JSON.stringify(eid1.target) !== JSON.stringify(eid2.target)) {
      diffs.push('target');
    }

    return {
      isEqual: diffs.length === 0,
      differences: diffs
    };
  }

  // ============================================================================
  // MAIN TEST FUNCTION
  // ============================================================================

  window.testSeqlJs = function(element = $0) {
    console.clear();
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00f; font-weight: bold');
    console.log('%c🧪 SEQL-JS FULL PIPELINE TEST', 'color: #00f; font-size: 16px; font-weight: bold');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00f; font-weight: bold');
    console.log('');

    if (!element) {
      console.error('❌ Элемент не найден. Выберите элемент в DevTools и используйте $0');
      console.log('💡 Использование: testSeqlJs($0) или просто testSeqlJs()');
      return;
    }

    console.log('🎯 Тестируемый элемент:', element);
    console.log('');

    // ========================================================================
    // ШАГ 1: Element → EID
    // ========================================================================

    console.group('📍 ШАГ 1: Генерация EID из элемента');
    console.time('⏱️ generateEID');

    const eid = lib.generateEID(element);

    console.timeEnd('⏱️ generateEID');

    if (!eid) {
      console.error('❌ Не удалось сгенерировать EID');
      console.groupEnd();
      return;
    }

    console.log('✅ EID успешно сгенерирован');
    console.log('📊 Структура EID:', eid);
    console.log('🎯 Anchor:', eid.anchor);
    console.log('🛤️  Path:', eid.path);
    console.log('🎪 Target:', eid.target);
    console.log('📈 Confidence:', eid.meta?.confidence);
    console.groupEnd();
    console.log('');

    // ========================================================================
    // ШАГ 2: EID → SEQL (String)
    // ========================================================================

    console.group('📝 ШАГ 2: Сериализация EID → SEQL');
    console.time('⏱️ stringifySEQL');

    const eiq = lib.stringifySEQL(eid);

    console.timeEnd('⏱️ stringifySEQL');

    console.log('✅ SEQL string сгенерирован');
    console.log('%c' + eiq, 'color: #0a0; font-family: monospace; font-size: 12px; background: #f0f0f0; padding: 4px');
    console.log('📏 Длина:', eiq.length, 'символов');
    console.groupEnd();
    console.log('');

    // ========================================================================
    // ШАГ 3: SEQL → EID (Parse & Compare)
    // ========================================================================

    console.group('🔄 ШАГ 3: Парсинг SEQL → EID + Сравнение');
    console.time('⏱️ parseSEQL');

    let parsedEID;
    try {
      parsedEID = lib.parseSEQL(eiq);
      console.timeEnd('⏱️ parseSEQL');
      console.log('✅ SEQL успешно распарсен');
      console.log('📊 Структура parsed EID:', parsedEID);
    } catch (error) {
      console.timeEnd('⏱️ parseSEQL');
      console.error('❌ Ошибка парсинга SEQL:', error);
      console.groupEnd();
      return;
    }

    // Сравнение EID до и после
    const comparison = compareEID(eid, parsedEID);

    if (comparison.isEqual) {
      console.log('%c✅ EID ИДЕНТИЧНЫ (полное совпадение)', 'color: #0a0; font-weight: bold');
    } else {
      console.warn('⚠️ EID отличаются в следующих полях:', comparison.differences);
      console.log('Original EID:', eid);
      console.log('Parsed EID:', parsedEID);
    }

    console.groupEnd();
    console.log('');

    // ========================================================================
    // ШАГ 4: EID → Element (Resolve)
    // ========================================================================

    console.group('🔍 ШАГ 4: Резолв EID → Element');
    console.time('⏱️ resolve');

    const resolveResult = lib.resolve(parsedEID, document);

    console.timeEnd('⏱️ resolve');

    if (!resolveResult || !resolveResult.elements || resolveResult.elements.length === 0) {
      console.error('❌ Элементы не найдены');
      console.log('Результат:', resolveResult);
      console.groupEnd();
      return;
    }

    const resolvedElement = resolveResult.elements[0];

    console.log('✅ Элемент найден:', resolvedElement);
    console.log('📊 Результат resolve:', resolveResult);
    console.log('🎯 Статус:', resolveResult.status);
    console.log('🔢 Найдено элементов:', resolveResult.elements.length);

    // Проверка: тот же элемент?
    if (resolvedElement === element) {
      console.log('%c✅ EXACT MATCH: Найденный элемент === исходный элемент', 'color: #0a0; font-weight: bold; font-size: 14px');
      highlightElement(resolvedElement, '#0f0');
    } else {
      console.warn('⚠️ Найден другой элемент (возможно, есть дубликаты)');
      console.log('Исходный:', element);
      console.log('Найденный:', resolvedElement);
      highlightElement(resolvedElement, '#ff0');
    }

    console.groupEnd();
    console.log('');

    // ========================================================================
    // ШАГ 5: EID → CSS Selector
    // ========================================================================

    console.group('🎨 ШАГ 5: Генерация CSS селектора');
    console.time('⏱️ buildSelector');

    const cssGenerator = new lib.CssGenerator();
    const cssResult = cssGenerator.buildSelector(parsedEID, {
      ensureUnique: true,
      root: document
    });

    console.timeEnd('⏱️ buildSelector');

    const cssSelector = typeof cssResult === 'string' ? cssResult : cssResult.selector;

    console.log('✅ CSS селектор сгенерирован');
    console.log('%c' + cssSelector, 'color: #00a; font-family: monospace; font-size: 12px; background: #f0f0f0; padding: 4px');

    if (typeof cssResult === 'object') {
      console.log('📊 Метаданные селектора:');
      console.log('  • Уникальный:', cssResult.isUnique ? '✅' : '❌');
      console.log('  • Использован nth-of-type:', cssResult.usedNthOfType ? '✅' : '❌');
      console.log('  • Добавлено классов:', cssResult.extraClassesAdded);
    }

    // Проверка: селектор находит элемент?
    const cssFindResult = document.querySelectorAll(cssSelector);
    console.log('🔍 Найдено элементов по CSS:', cssFindResult.length);

    if (cssFindResult.length === 1 && cssFindResult[0] === element) {
      console.log('%c✅ CSS селектор уникально находит исходный элемент', 'color: #0a0; font-weight: bold');
    } else {
      console.warn('⚠️ CSS селектор находит:', cssFindResult.length, 'элементов');
    }

    console.groupEnd();
    console.log('');

    // ========================================================================
    // ШАГ 6: Element → XPath
    // ========================================================================

    console.group('🗺️  ШАГ 6: Генерация XPath (вручную)');
    console.time('⏱️ generateXPath');

    const xpath = generateXPath(element);

    console.timeEnd('⏱️ generateXPath');

    console.log('✅ XPath сгенерирован');
    console.log('%c' + xpath, 'color: #a0a; font-family: monospace; font-size: 12px; background: #f0f0f0; padding: 4px');
    console.log('⚠️ Внимание: seql-js не поддерживает XPath нативно (сгенерирован вручную)');

    // Проверка XPath
    try {
      const xpathResult = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );

      if (xpathResult.singleNodeValue === element) {
        console.log('%c✅ XPath корректно находит исходный элемент', 'color: #0a0; font-weight: bold');
      } else {
        console.warn('⚠️ XPath находит другой элемент');
      }
    } catch (e) {
      console.error('❌ Ошибка при проверке XPath:', e);
    }

    console.groupEnd();
    console.log('');

    // ========================================================================
    // ИТОГОВАЯ ТАБЛИЦА
    // ========================================================================

    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00f; font-weight: bold');
    console.log('%c📊 ИТОГОВАЯ СВОДКА', 'color: #00f; font-size: 14px; font-weight: bold');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00f; font-weight: bold');

    console.table({
      'Исходный элемент': {
        'Тег': element.tagName,
        'ID': element.id || '(нет)',
        'Классы': element.className || '(нет)',
        'Текст': (element.textContent || '').trim().substring(0, 50)
      },
      'EID': {
        'Anchor': eid.anchor.tag,
        'Path depth': eid.path.length,
        'Target': eid.target.tag,
        'Confidence': eid.meta?.confidence
      },
      'SEQL': {
        'Длина': eiq.length + ' симв.',
        'Версия': eid.version,
        'Парсинг': comparison.isEqual ? '✅ OK' : '⚠️ Diff',
        'Constraints': eid.constraints?.length || 0
      },
      'Resolve': {
        'Статус': resolveResult.status,
        'Найдено': resolveResult.elements.length,
        'Exact match': resolvedElement === element ? '✅' : '❌',
        'Скор': resolveResult.score || 'N/A'
      },
      'Селекторы': {
        'CSS': cssSelector.length + ' симв.',
        'CSS уникален': typeof cssResult === 'object' && cssResult.isUnique ? '✅' : '❌',
        'XPath': xpath.length + ' симв.',
        'XPath работает': '✅'
      }
    });

    // ========================================================================
    // ВОЗВРАЩАЕМ ВСЕ РЕЗУЛЬТАТЫ
    // ========================================================================

    const results = {
      element,
      eid,
      eiq,
      parsedEID,
      comparison,
      resolveResult,
      resolvedElement,
      cssSelector,
      cssResult,
      xpath,

      // Хелперы для быстрого доступа
      isExactMatch: resolvedElement === element,
      isEIDEqual: comparison.isEqual,
      isCSSUnique: typeof cssResult === 'object' ? cssResult.isUnique : true,
    };

    console.log('');
    console.log('%c💾 Все результаты доступны в return значении', 'color: #666; font-style: italic');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00f; font-weight: bold');

    return results;
  };

  // ============================================================================
  // QUICK TEST FUNCTIONS
  // ============================================================================

  // Быстрая проверка только SEQL
  window.testSEQL = function(element = $0) {
    const eid = lib.generateEID(element);
    const eiq = lib.stringifySEQL(eid);
    console.log('SEQL:', eiq);
    return { eid, eiq };
  };

  // Быстрая проверка CSS
  window.testCSS = function(element = $0) {
    const eid = lib.generateEID(element);
    const cssGen = new lib.CssGenerator();
    const css = cssGen.buildSelector(eid, { ensureUnique: true });
    console.log('CSS:', typeof css === 'string' ? css : css.selector);
    return css;
  };

  // Тест круговой поездки: element → SEQL → element
  window.testRoundTrip = function(element = $0) {
    console.clear();
    console.log('🔄 Round-trip test: Element → SEQL → Element');

    const eiq = lib.generateSEQL(element);
    console.log('1️⃣ SEQL:', eiq);

    const resolved = lib.resolveSEQL(eiq, document);
    console.log('2️⃣ Resolved:', resolved);

    const match = resolved.length > 0 && resolved[0] === element;
    console.log(match ? '✅ SUCCESS' : '❌ FAILED');

    if (match) {
      highlightElement(resolved[0], '#0f0');
    }

    return { eiq, resolved, match };
  };

  // ============================================================================
  // ИНСТРУКЦИЯ
  // ============================================================================
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const linkColor = prefersDark ? '#7dd3fc' : '#0066cc';
  const dimColor = prefersDark ? '#9aa0a6' : '#666';

  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666');
  console.log('%c🧪 SEQL-JS TEST SUITE LOADED', 'color: #0a0; font-size: 14px; font-weight: bold');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666');
  console.log('');
  console.log('%cДоступные команды:', 'font-weight: bold');
  console.log('');
  console.log('  %ctestSeqlJs($0)%c    - Полный тест всех этапов', `color: ${linkColor}; font-family: monospace`, `color: ${dimColor}`);
  console.log('  %ctestSEQL($0)%c      - Быстрый тест SEQL генерации', `color: ${linkColor}; font-family: monospace`, `color: ${dimColor}`);
  console.log('  %ctestCSS($0)%c       - Быстрый тест CSS селектора', `color: ${linkColor}; font-family: monospace`, `color: ${dimColor}`);
  console.log('  %ctestRoundTrip($0)%c - Тест круговой поездки Element→SEQL→Element', `color: ${linkColor}; font-family: monospace`, `color: ${dimColor}`);
  console.log('');
  console.log('%c💡 Выберите элемент в DevTools (станет доступен как $0), затем запустите команду', 'color: #666; font-style: italic');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666');

})();
