# SEQL Inspector - Chrome DevTools Extension

A Chrome DevTools Extension that generates stable SEQL selectors for DOM elements using the seql-js library.

## Features

- **Generate Selectors** - Batch generate SEQL selectors for all interactive elements on a page
- **Element Picker** - Click to select any element and generate its SEQL selector
- **Tree View** - Hierarchical view of selectors grouped by tag or DOM structure
- **Live Search** - Real-time SEQL selector parsing and resolution with visual feedback
- **Tag Filter** - Filter selectors by element type (button, input, a, etc.)
- **Element Interaction** - Scroll to, highlight, and inspect selected elements
- **Details Panel** - View full selector, semantics, confidence score, and element preview

## Installation

### Prerequisites

1. Node.js v18+ and Yarn installed
2. Build the seql-js library first

### Build Steps

From the project root directory:

```bash
# Install dependencies
yarn install

# Build the extension (builds library and copies to extension)
yarn extension:prepare
```

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extensions/chrome/` directory
5. The extension should now appear in your extensions list

## Usage

### Opening the Panel

1. Open Chrome DevTools (F12 or Cmd+Option+I on Mac)
2. Find the **SEQL Inspector** tab in the DevTools panel bar
3. Click to open the SEQL Inspector panel

### Generating Selectors

#### Generate All Elements

1. Click the **"Generate for All Elements"** button in the toolbar
2. Wait for selectors to be generated (status will show progress)
3. Selectors appear in the tree view on the left

#### Pick Single Element

1. Click the **"Pick Element"** button
2. Hover over elements on the page (they will be highlighted)
3. Click an element to generate its SEQL selector
4. The selector is added to the list and selected

### Viewing Selectors

#### Grouping Modes

- **By Tag** - Groups selectors by element tag (button, a, input, etc.)
- **By Structure** - Groups selectors by DOM hierarchy

Toggle between modes using the grouping dropdown.

#### Tree Navigation

- Click group headers to expand/collapse
- Click a selector to view its details
- Use the tag filter dropdown to filter by element type

### Live Search

1. Type a SEQL selector in the search input
2. The extension will automatically parse and resolve the selector
3. Status indicators show:
   - ✓ Green - Element found successfully
   - ⚠ Yellow - Multiple elements match (ambiguous)
   - ✗ Red - No match or parse error
4. Matching elements are highlighted on the page

### Details Panel

Click any selector to open the details panel showing:

- Full SEQL selector (with copy button)
- Element tag
- Semantics (ARIA roles, labels, etc.)
- Confidence score
- HTML preview

#### Actions

- **Copy Selector** - Copy the full SEQL selector to clipboard
- **Scroll to Element** - Scroll the page to bring element into view
- **Highlight Element** - Temporarily highlight the element on the page

## SEQL Selector Format

Example: `v1: form :: div.container > button[type='submit']`

Structure:

- `v1:` - Version prefix
- `form` - Anchor (semantic root element)
- `::` - Anchor separator
- `div.container > button[type='submit']` - Path and target

## Development

### Project Structure

```
extensions/chrome/
├── manifest.json           # Extension configuration
├── devtools.html           # DevTools entry point
├── devtools.js             # Panel registration
├── panel/
│   ├── panel.html          # Main UI
│   ├── panel.js            # Panel logic
│   └── panel.css           # Styling
├── content/
│   └── content.js          # Library injection
├── background/
│   └── service-worker.js   # Message routing
├── lib/
│   └── seql-js.umd.cjs     # Bundled library
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Making Changes

1. Edit files in the `extensions/chrome/` directory
2. Go to `chrome://extensions/`
3. Click the refresh icon on the SEQL Inspector extension
4. Reopen DevTools to see changes

### Debugging

- Open DevTools on the DevTools window (Cmd+Option+I while DevTools is focused)
- Check the Console for errors
- Content script logs appear in the inspected page's console

## Troubleshooting

### Extension Not Loading

- Ensure all files exist (especially `lib/seql-js.umd.cjs`)
- Check for JSON syntax errors in `manifest.json`
- Look for errors in `chrome://extensions/`

### Selectors Not Generating

- Make sure the seql-js library is injected (check for `window.seqljs` in page console)
- Try refreshing the page and reopening DevTools

### Panel Not Appearing

- Close and reopen DevTools
- Try disabling and re-enabling the extension

## License

MIT License - See the main project LICENSE file.
