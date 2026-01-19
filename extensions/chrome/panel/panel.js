/**
 * SEQL Inspector Panel Logic
 * Main panel functionality for the Chrome DevTools extension
 */

(function() {
  'use strict';

  // State
  const state = {
    selectors: [],
    selectedId: null,
    groupingMode: 'tag', // 'tag' | 'structure'
    expandedGroups: new Set(),
    tagFilter: '',
    searchDebounceTimer: null
  };

  // DOM Elements
  const elements = {
    btnGenerateAll: document.getElementById('btn-generate-all'),
    btnPickElement: document.getElementById('btn-pick-element'),
    statusText: document.getElementById('status-text'),
    searchInput: document.getElementById('search-input'),
    searchStatus: document.getElementById('search-status'),
    tagFilter: document.getElementById('tag-filter'),
    groupingMode: document.getElementById('grouping-mode'),
    selectorTree: document.getElementById('selector-tree'),
    detailsPanel: document.getElementById('details-panel'),
    btnCloseDetails: document.getElementById('btn-close-details'),
    btnCopySelector: document.getElementById('btn-copy-selector'),
    btnScrollTo: document.getElementById('btn-scroll-to'),
    btnHighlight: document.getElementById('btn-highlight'),
    detailSelector: document.getElementById('detail-selector'),
    detailTag: document.getElementById('detail-tag'),
    detailConfidence: document.getElementById('detail-confidence'),
    detailSemantics: document.getElementById('detail-semantics'),
    detailPreview: document.getElementById('detail-preview'),
    elementRefLink: document.getElementById('element-ref-link')
  };

  // Initialize
  function init() {
    bindEvents();
    setStatus('Ready');
  }

  // Bind event listeners
  function bindEvents() {
    elements.btnGenerateAll.addEventListener('click', handleGenerateAll);
    elements.btnPickElement.addEventListener('click', handlePickElement);
    elements.btnCloseDetails.addEventListener('click', hideDetails);
    elements.btnCopySelector.addEventListener('click', handleCopySelector);
    elements.btnScrollTo.addEventListener('click', handleScrollTo);
    elements.btnHighlight.addEventListener('click', handleHighlight);
    elements.elementRefLink.addEventListener('click', handleInspectElement);
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.tagFilter.addEventListener('change', handleTagFilterChange);
    elements.groupingMode.addEventListener('change', handleGroupingModeChange);
  }

  // Set status text
  function setStatus(text) {
    elements.statusText.textContent = text;
  }

  // Execute code in inspected page
  function evalInPage(code, callback) {
    chrome.devtools.inspectedWindow.eval(code, (result, exception) => {
      if (exception) {
        console.error('Eval error:', exception);
        callback(null, exception);
      } else {
        callback(result, null);
      }
    });
  }

  // Generate selectors for all interactive elements
  function handleGenerateAll() {
    setStatus('Generating selectors...');
    elements.btnGenerateAll.disabled = true;

    const code = `
      (function() {
        if (!window.SeqlJS) {
          return { error: 'seql-js library not loaded. Please refresh the page.' };
        }

        const selector = 'button, a, input, select, textarea, [role], [data-testid], [aria-label], form, nav, main, header, footer, aside, section, article';
        const elements = document.querySelectorAll(selector);
        const results = [];
        let index = 0;

        elements.forEach(el => {
          try {
            // Skip hidden elements
            if (el.offsetParent === null && el.tagName !== 'INPUT' && el.type !== 'hidden') {
              return;
            }

            const seql = window.SeqlJS.generateSEQL(el);
            const eid = window.SeqlJS.generateEID(el);
            
            if (seql && eid) {
              const elementId = 'seql-el-' + index++;
              el.setAttribute('data-seql-id', elementId);
              
              // Get short selector (last segment)
              const shortSelector = seql.split('>').pop().trim();
              
              // Get outer HTML preview (truncated)
              let preview = el.outerHTML;
              if (preview.length > 200) {
                preview = preview.substring(0, 200) + '...';
              }

              results.push({
                selector: seql,
                shortSelector: shortSelector,
                tag: el.tagName.toLowerCase(),
                elementId: elementId,
                eid: eid,
                preview: preview,
                confidence: eid.target?.confidence || 0
              });
            }
          } catch (e) {
            console.warn('Failed to generate selector for element:', e);
          }
        });

        return { selectors: results };
      })()
    `;

    evalInPage(code, (result, error) => {
      elements.btnGenerateAll.disabled = false;

      if (error || !result) {
        setStatus('Error: Failed to generate selectors');
        console.error('Generation error:', error);
        return;
      }

      if (result.error) {
        setStatus('Error: ' + result.error);
        return;
      }

      state.selectors = result.selectors || [];
      setStatus(`Generated ${state.selectors.length} selectors`);

      updateTagFilter();
      renderTree();
    });
  }

  // Element picker mode
  function handlePickElement() {
    setStatus('Pick an element (click to select, Esc to cancel)...');
    elements.btnPickElement.disabled = true;

    const code = `
      (function() {
        if (window.__seqlPicker) {
          return { error: 'Picker already active' };
        }

        window.__seqlPicker = true;

        // Create highlight box only (no blocking overlay)
        const highlight = document.createElement('div');
        highlight.id = 'seql-picker-highlight';
        highlight.style.cssText = 'position:fixed;pointer-events:none;border:3px solid #1a73e8;background:rgba(26,115,232,0.15);z-index:2147483647;display:none;box-shadow:0 0 8px rgba(26,115,232,0.5);';
        document.body.appendChild(highlight);

        // Change cursor on body
        const originalCursor = document.body.style.cursor;
        document.body.style.cursor = 'crosshair';

        let hoveredElement = null;

        // Use capture phase to intercept events before they reach the page
        function handleMouseMove(e) {
          const el = e.target;
          if (el && el !== highlight && !el.id?.startsWith('seql-')) {
            hoveredElement = el;
            const rect = el.getBoundingClientRect();
            highlight.style.display = 'block';
            highlight.style.top = rect.top + 'px';
            highlight.style.left = rect.left + 'px';
            highlight.style.width = rect.width + 'px';
            highlight.style.height = rect.height + 'px';
          }
        }

        function handleMouseDown(e) {
          // Prevent mousedown from closing popups/dropdowns
          if (!hoveredElement) return;
          e.preventDefault();
          e.stopImmediatePropagation();
        }

        function handleClick(e) {
          // Only intercept if we have a hovered element
          if (!hoveredElement) return;
          
          // Stop the event from reaching page handlers
          e.preventDefault();
          e.stopImmediatePropagation();
          
          // Store reference before cleanup
          const targetElement = hoveredElement;
          
          // Cleanup first
          cleanup();

          if (targetElement && window.SeqlJS) {
            try {
              const seql = window.SeqlJS.generateSEQL(targetElement);
              const eid = window.SeqlJS.generateEID(targetElement);
              
              if (seql && eid) {
                const elementId = 'seql-el-picked-' + Date.now();
                targetElement.setAttribute('data-seql-id', elementId);
                
                const shortSelector = seql.split('>').pop().trim();
                let preview = targetElement.outerHTML;
                if (preview.length > 200) {
                  preview = preview.substring(0, 200) + '...';
                }

                window.__seqlPickerResult = {
                  selector: seql,
                  shortSelector: shortSelector,
                  tag: targetElement.tagName.toLowerCase(),
                  elementId: elementId,
                  eid: eid,
                  preview: preview,
                  confidence: eid.target?.confidence || 0
                };
              }
            } catch (e) {
              console.error('Failed to generate selector:', e);
            }
          }
        }

        function handleKeyDown(e) {
          if (e.key === 'Escape') {
            cleanup();
          }
        }

        function cleanup() {
          highlight.remove();
          document.body.style.cursor = originalCursor;
          document.removeEventListener('mousemove', handleMouseMove, true);
          document.removeEventListener('mousedown', handleMouseDown, true);
          document.removeEventListener('click', handleClick, true);
          document.removeEventListener('keydown', handleKeyDown, true);
          window.__seqlPicker = false;
        }

        // Add event listeners on capture phase
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('mousedown', handleMouseDown, true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('keydown', handleKeyDown, true);

        return { status: 'picker_active' };
      })()
    `;

    evalInPage(code, (result, error) => {
      if (error || result?.error) {
        elements.btnPickElement.disabled = false;
        setStatus('Ready');
        return;
      }

      // Poll for result
      const checkResult = setInterval(() => {
        evalInPage('window.__seqlPickerResult || (window.__seqlPicker ? null : { cancelled: true })', (res, err) => {
          if (res) {
            clearInterval(checkResult);
            elements.btnPickElement.disabled = false;

            if (res.cancelled) {
              setStatus('Picker cancelled');
              return;
            }

            // Add to selectors
            state.selectors.push(res);
            setStatus(`Picked: ${res.tag}`);

            // Clean up
            evalInPage('delete window.__seqlPickerResult');

            updateTagFilter();
            renderTree();

            // Select the new item
            selectItem(res.elementId);
          }
        });
      }, 200);
    });
  }

  // Update tag filter dropdown
  function updateTagFilter() {
    const tags = new Set(state.selectors.map(s => s.tag));
    const sortedTags = Array.from(tags).sort();

    elements.tagFilter.innerHTML = '<option value="">All Tags</option>';
    sortedTags.forEach(tag => {
      const count = state.selectors.filter(s => s.tag === tag).length;
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = `${tag} (${count})`;
      elements.tagFilter.appendChild(option);
    });
  }

  // Handle tag filter change
  function handleTagFilterChange() {
    state.tagFilter = elements.tagFilter.value;
    renderTree();
  }

  // Handle grouping mode change
  function handleGroupingModeChange() {
    state.groupingMode = elements.groupingMode.value;
    renderTree();
  }

  // Get filtered selectors
  function getFilteredSelectors() {
    if (!state.tagFilter) {
      return state.selectors;
    }
    return state.selectors.filter(s => s.tag === state.tagFilter);
  }

  // Render tree view
  function renderTree() {
    const filtered = getFilteredSelectors();

    if (filtered.length === 0) {
      elements.selectorTree.innerHTML = `
        <div class="empty-state">
          <p>No selectors ${state.tagFilter ? 'match the filter' : 'generated yet'}.</p>
          <p>Click "Generate for All Elements" or "Pick Element" to start.</p>
        </div>
      `;
      return;
    }

    if (state.groupingMode === 'tag') {
      renderTreeByTag(filtered);
    } else {
      renderTreeByStructure(filtered);
    }
  }

  // Render tree grouped by tag
  function renderTreeByTag(selectors) {
    const groups = {};
    selectors.forEach(s => {
      if (!groups[s.tag]) {
        groups[s.tag] = [];
      }
      groups[s.tag].push(s);
    });

    const sortedTags = Object.keys(groups).sort();
    let html = '';

    sortedTags.forEach(tag => {
      const items = groups[tag];
      const isExpanded = state.expandedGroups.has(tag);
      const headerClass = isExpanded ? '' : 'collapsed';
      const itemsClass = isExpanded ? '' : 'hidden';

      html += `
        <div class="tree-group" data-group="${tag}">
          <div class="tree-group-header ${headerClass}" data-group="${tag}">
            <span class="expand-icon">▼</span>
            <span class="group-name">${tag}</span>
            <span class="group-count">${items.length}</span>
          </div>
          <div class="tree-group-items ${itemsClass}">
            ${items.map(item => renderTreeItem(item)).join('')}
          </div>
        </div>
      `;
    });

    elements.selectorTree.innerHTML = html;
    bindTreeEvents();
  }

  // Render tree grouped by structure (simplified DOM hierarchy)
  function renderTreeByStructure(selectors) {
    // Group by anchor element from EID
    const groups = {};
    selectors.forEach(s => {
      const anchor = s.eid?.anchor?.tag || 'unknown';
      if (!groups[anchor]) {
        groups[anchor] = [];
      }
      groups[anchor].push(s);
    });

    const sortedAnchors = Object.keys(groups).sort();
    let html = '';

    sortedAnchors.forEach(anchor => {
      const items = groups[anchor];
      const isExpanded = state.expandedGroups.has(anchor);
      const headerClass = isExpanded ? '' : 'collapsed';
      const itemsClass = isExpanded ? '' : 'hidden';

      html += `
        <div class="tree-group" data-group="${anchor}">
          <div class="tree-group-header ${headerClass}" data-group="${anchor}">
            <span class="expand-icon">▼</span>
            <span class="group-name">Anchor: ${anchor}</span>
            <span class="group-count">${items.length}</span>
          </div>
          <div class="tree-group-items ${itemsClass}">
            ${items.map(item => renderTreeItem(item)).join('')}
          </div>
        </div>
      `;
    });

    elements.selectorTree.innerHTML = html;
    bindTreeEvents();
  }

  // Render single tree item
  function renderTreeItem(item) {
    const isSelected = state.selectedId === item.elementId;
    const selectedClass = isSelected ? 'selected' : '';

    return `
      <div class="tree-item ${selectedClass}" data-id="${item.elementId}">
        <span class="item-tag">${item.tag}</span>
        <span class="item-selector">${escapeHtml(item.shortSelector)}</span>
      </div>
    `;
  }

  // Bind tree event listeners
  function bindTreeEvents() {
    // Group header clicks (expand/collapse)
    elements.selectorTree.querySelectorAll('.tree-group-header').forEach(header => {
      header.addEventListener('click', () => {
        const group = header.dataset.group;
        const items = header.nextElementSibling;

        if (state.expandedGroups.has(group)) {
          state.expandedGroups.delete(group);
          header.classList.add('collapsed');
          items.classList.add('hidden');
        } else {
          state.expandedGroups.add(group);
          header.classList.remove('collapsed');
          items.classList.remove('hidden');
        }
      });
    });

    // Tree item clicks
    elements.selectorTree.querySelectorAll('.tree-item').forEach(item => {
      item.addEventListener('click', () => {
        selectItem(item.dataset.id);
      });
    });
  }

  // Select a tree item
  function selectItem(elementId) {
    state.selectedId = elementId;

    // Update selection visual
    elements.selectorTree.querySelectorAll('.tree-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.id === elementId);
    });

    // Find selector data
    const selectorData = state.selectors.find(s => s.elementId === elementId);
    if (selectorData) {
      showDetails(selectorData);
    }
  }

  // Show details panel
  function showDetails(data) {
    elements.detailSelector.textContent = data.selector;
    elements.detailTag.textContent = data.tag;
    elements.detailConfidence.textContent = (data.confidence * 100).toFixed(1) + '%';
    elements.detailSemantics.textContent = JSON.stringify(data.eid?.target?.semantics || {}, null, 2);
    elements.detailPreview.textContent = data.preview;

    // Update element reference link text
    const tagLower = data.tag.toLowerCase();
    elements.elementRefLink.textContent = `▶ <${tagLower}>`;

    elements.detailsPanel.classList.remove('hidden');
  }

  // Hide details panel
  function hideDetails() {
    elements.detailsPanel.classList.add('hidden');
    state.selectedId = null;

    elements.selectorTree.querySelectorAll('.tree-item.selected').forEach(item => {
      item.classList.remove('selected');
    });
  }

  // Copy selector to clipboard (using fallback for DevTools context where Clipboard API is blocked)
  function handleCopySelector() {
    const selector = elements.detailSelector.textContent;

    // Create a temporary textarea to copy text
    const textarea = document.createElement('textarea');
    textarea.value = selector;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      const btn = elements.btnCopySelector;
      const original = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => btn.textContent = original, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
      setStatus('Failed to copy to clipboard');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  // Scroll to element
  function handleScrollTo() {
    if (!state.selectedId) return;

    const code = `
      (function() {
        const el = document.querySelector('[data-seql-id="${state.selectedId}"]');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
        return false;
      })()
    `;

    evalInPage(code, (result) => {
      if (!result) {
        setStatus('Element not found');
      }
    });
  }

  // Highlight element
  function handleHighlight() {
    if (!state.selectedId) return;

    const code = `
      (function() {
        const el = document.querySelector('[data-seql-id="${state.selectedId}"]');
        if (el) {
          const rect = el.getBoundingClientRect();
          
          // Create highlight
          let highlight = document.getElementById('seql-temp-highlight');
          if (!highlight) {
            highlight = document.createElement('div');
            highlight.id = 'seql-temp-highlight';
            highlight.style.cssText = 'position:fixed;pointer-events:none;border:4px solid #ff6b00;background:rgba(255,107,0,0.3);z-index:2147483647;transition:all 0.15s ease;box-shadow:0 0 12px rgba(255,107,0,0.6);';
            document.body.appendChild(highlight);
          }
          
          highlight.style.top = rect.top + 'px';
          highlight.style.left = rect.left + 'px';
          highlight.style.width = rect.width + 'px';
          highlight.style.height = rect.height + 'px';
          highlight.style.display = 'block';
          
          // Remove after 4 seconds
          setTimeout(() => {
            highlight.style.display = 'none';
          }, 4000);
          
          return true;
        }
        return false;
      })()
    `;

    evalInPage(code, (result) => {
      if (!result) {
        setStatus('Element not found');
      }
    });
  }

  // Inspect element in Elements panel (like browser console $())
  function handleInspectElement() {
    if (!state.selectedId) return;

    const code = `
      (function() {
        const el = document.querySelector('[data-seql-id="${state.selectedId}"]');
        if (el) {
          inspect(el);
          return true;
        }
        return false;
      })()
    `;

    evalInPage(code, (result) => {
      if (!result) {
        setStatus('Element not found');
      }
    });
  }

  // Handle search input
  function handleSearchInput() {
    clearTimeout(state.searchDebounceTimer);

    const query = elements.searchInput.value.trim();

    if (!query) {
      elements.searchStatus.textContent = '';
      elements.searchStatus.className = 'search-status';
      clearHighlights();
      return;
    }

    state.searchDebounceTimer = setTimeout(() => {
      resolveSearchQuery(query);
    }, 300);
  }

  // Resolve search query
  function resolveSearchQuery(query) {
    const code = `
      (function() {
        if (!window.SeqlJS || !window.SeqlJS.resolveSEQL) {
          return { error: 'seql-js library not available' };
        }

        try {
          // Try to parse and resolve the SEQL selector using resolveSEQL (accepts string)
          const elements = window.SeqlJS.resolveSEQL(${JSON.stringify(query)}, document);
          
          if (elements && elements.length > 0) {
            // Highlight matched elements
            elements.forEach((el, i) => {
              const rect = el.getBoundingClientRect();
              let highlight = document.getElementById('seql-search-highlight-' + i);
              if (!highlight) {
                highlight = document.createElement('div');
                highlight.id = 'seql-search-highlight-' + i;
                highlight.className = 'seql-search-highlight';
                highlight.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #0d8050;background:rgba(13,128,80,0.15);z-index:2147483647;';
                document.body.appendChild(highlight);
              }
              highlight.style.top = rect.top + 'px';
              highlight.style.left = rect.left + 'px';
              highlight.style.width = rect.width + 'px';
              highlight.style.height = rect.height + 'px';
              highlight.style.display = 'block';
            });

            // Clear extra highlights
            let i = elements.length;
            while (document.getElementById('seql-search-highlight-' + i)) {
              document.getElementById('seql-search-highlight-' + i).remove();
              i++;
            }

            return {
              status: elements.length === 1 ? 'success' : 'warning',
              count: elements.length
            };
          } else {
            return { status: 'error', count: 0 };
          }
        } catch (e) {
          return { status: 'error', message: e.message };
        }
      })()
    `;

    evalInPage(code, (result, error) => {
      if (error || !result) {
        elements.searchStatus.textContent = '✗ Error';
        elements.searchStatus.className = 'search-status error';
        return;
      }

      if (result.error) {
        elements.searchStatus.textContent = '✗ ' + result.error;
        elements.searchStatus.className = 'search-status error';
        return;
      }

      if (result.status === 'success') {
        elements.searchStatus.textContent = `✓ Found ${result.count}`;
        elements.searchStatus.className = 'search-status success';
      } else if (result.status === 'warning') {
        elements.searchStatus.textContent = `⚠ Found ${result.count}`;
        elements.searchStatus.className = 'search-status warning';
      } else {
        elements.searchStatus.textContent = '✗ Not found';
        elements.searchStatus.className = 'search-status error';
        clearHighlights();
      }

      // Auto-clear highlights after 3 seconds
      setTimeout(clearHighlights, 3000);
    });
  }

  // Clear search highlights
  function clearHighlights() {
    evalInPage(`
      (function() {
        document.querySelectorAll('.seql-search-highlight').forEach(el => el.remove());
      })()
    `);
  }

  // Escape HTML for safe display
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Start
  init();
})();
