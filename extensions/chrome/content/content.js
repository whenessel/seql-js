/**
 * SEQL Inspector Content Script
 * Injects the seql-js library and test tools into the inspected page context
 */
(async function() {
  'use strict';

  if (window.__seqlInjected) return;
  window.__seqlInjected = true;

  /**
   * Вспомогательная функция для инъекции скрипта через Promise
   */
  const injectScript = (path) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(path);
      script.async = false; // Сохраняем порядок выполнения, если нужно

      script.onload = () => {
        script.remove();
        resolve();
      };

      script.onerror = () => {
        script.remove();
        reject(new Error(`Failed to load script: ${path}`));
      };

      (document.head || document.documentElement).appendChild(script);
    });
  };

  try {
    // 1. Загружаем основную библиотеку
    // Используем путь из manifest.json и структуры папок
    await injectScript('lib/seql-js.umd.cjs');
    console.log('[SEQL Inspector] Core library injected');

    // 2. Загружаем инструменты тестирования
    // Внимание: в вашем Project View файл называется seql-js-test-tools.js, а не SEQLJsBrowserTestSuite.js
    await injectScript('lib/seql-js-test-tools.js');
    console.log('[SEQL Inspector] Test tools injected');

    // 3. Уведомляем систему о готовности
    window.dispatchEvent(new CustomEvent('seql-ready', {
      detail: {
        version: window.SeqlJS ? 'loaded' : 'unknown',
        timestamp: Date.now()
      }
    }));

  } catch (error) {
    console.error(`[SEQL Inspector] Injection failed: ${error.message}`);
    window.__seqlInjected = false; // Позволяем повторную попытку при ошибке
  }
})();
