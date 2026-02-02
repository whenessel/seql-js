/**
 * Document context utilities for safe iframe and cross-document handling
 * @module utils/document-context
 */

/**
 * Safely extracts the document from an element
 * @param element - The element to extract document from
 * @returns The owner document
 * @throws Error if element is detached or has no ownerDocument
 */
export function getOwnerDocument(element: Element): Document {
  // Try ownerDocument first
  if (element.ownerDocument) {
    return element.ownerDocument;
  }

  // Fallback for jsdom iframe elements: try to get document by traversing
  // In jsdom, iframe contentDocument elements may not have ownerDocument set correctly
  let current: Node | null = element;
  while (current) {
    if (current.nodeType === 9) {
      // DOCUMENT_NODE
      return current as Document;
    }
    current = current.parentNode;
  }

  throw new Error(
    'Element does not have an ownerDocument. This typically means:\n' +
      '1. The element is detached from the DOM\n' +
      '2. The element was created but never attached\n' +
      '3. You are working with a document node instead of an element'
  );
}

/**
 * Validates that element and root belong to the same document
 * @param element - The element to validate
 * @param root - Optional root document or element to validate against
 * @throws Error if element and root are from different documents
 */
export function validateDocumentContext(element: Element, root?: Document | Element): void {
  if (!root) {
    return; // No root provided, validation not needed
  }

  const elementDoc = getOwnerDocument(element);
  const rootDoc = root instanceof Document ? root : getOwnerDocument(root);

  if (elementDoc !== rootDoc) {
    throw new Error(
      'Cross-document operation detected: element and root are from different documents.\n' +
        'Common causes:\n' +
        '1. Working with iframe: pass iframe.contentDocument as root parameter\n' +
        '2. Element from one iframe, root from another\n' +
        '3. Element from main document, root from iframe (or vice versa)\n' +
        '\n' +
        'Solution: Ensure element and root parameter are from the same document context.'
    );
  }
}

/**
 * Gets the appropriate root document/element for queries
 * Falls back to element's document when no root provided
 * @param element - The element to get context for
 * @param root - Optional explicit root
 * @returns The query root to use
 */
export function getQueryRoot(element: Element, root?: Document | Element): Document | Element {
  if (root) {
    // Validate before returning
    validateDocumentContext(element, root);
    return root;
  }

  // Fallback to element's owner document
  const doc = getOwnerDocument(element);
  return doc;
}
