// Register SEQL Inspector panel in Chrome DevTools
chrome.devtools.panels.create('SEQL Inspector', 'icons/icon16.png', 'panel/panel.html', (panel) => {
  console.log('SEQL Inspector panel created');
});
