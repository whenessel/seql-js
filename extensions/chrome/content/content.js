/**
 * SEQL Inspector Content Script
 * Injects the seql-js library into the inspected page context
 */

(function() {
  'use strict';

  // Check if library is already injected
  if (window.__seqlInjected) {
    return;
  }
  window.__seqlInjected = true;

  // Create script element to inject the library
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('lib/seql-js.umd.cjs');
  script.onload = function() {
    // Library loaded, it should be available as window.SeqlJS
    console.log('[SEQL Inspector] seql-js library injected successfully');

    // Dispatch custom event to notify that library is ready
    window.dispatchEvent(new CustomEvent('seql-ready', {
      detail: { version: window.SeqlJS ? 'loaded' : 'unknown' }
    }));

    // Clean up script tag
    this.remove();
  };
  script.onerror = function() {
    console.error('[SEQL Inspector] Failed to load seql-js library');
    this.remove();
  };

  // Inject into page
  (document.head || document.documentElement).appendChild(script);
})();
