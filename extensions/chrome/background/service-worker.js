/**
 * SEQL Inspector Background Service Worker
 * Manifest v3 requirement for message routing and extension lifecycle
 */

// Extension installed/updated handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[SEQL Inspector] Extension installed');
  } else if (details.reason === 'update') {
    console.log(
      '[SEQL Inspector] Extension updated to version',
      chrome.runtime.getManifest().version
    );
  }
});

// Message routing hub (for future extensibility)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages from content scripts or DevTools panel
  switch (message.type) {
    case 'ping':
      sendResponse({ status: 'pong' });
      break;

    case 'getTabId':
      sendResponse({ tabId: sender.tab?.id });
      break;

    default:
      // Unknown message type
      console.log('[SEQL Inspector] Unknown message:', message);
      sendResponse({ error: 'Unknown message type' });
  }

  // Return true to indicate async response (if needed)
  return true;
});

// Keep service worker alive (optional, for debugging)
// chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'keepAlive') {
//     console.log('[SEQL Inspector] Service worker alive');
//   }
// });
