
/**
 * Module dependencies.
 */

import closest from 'component-closest';
import contains from 'node-contains';
import getDocument from 'get-document';
import normalize from 'range-normalize';
import currentRange from 'current-range';
import currentSelection from 'current-selection';
import selectionSetRange from 'selection-set-range';
import selectionIsBackward from 'selection-is-backward';

/**
 * Accepts an HTMLElement node, and makes it check for `.selection-token` class
 * nodes. When the document "selection" changes, and one of the start/end
 * boundaries is within a "selection token", then the selection is extended to
 * surround the contents of the "selection token".
 *
 * @param {HTMLElement} node
 * @public
 */

function SelectionToken (node) {
  let doc = getDocument(node);

  doc.addEventListener('selectionchange', function () {
    let sel = currentSelection(doc);
    if (!sel) return;

    let range = currentRange(sel);
    if (!range) return;

    if (!contains(node, range.commonAncestorContainer)) return;

    let backward = !sel.collapsed && selectionIsBackward(sel);

    range = range.cloneRange();

    let norm = normalize(range.cloneRange());

    let modified = false;
    let tRange;
    let token;

    // start?
    token = closest(range.startContainer, '.selection-token', true, node);
    if (token) {
      tRange = norm.cloneRange();
      tRange.selectNode(token);
      normalize(tRange);

      if (norm.startContainer !== tRange.startContainer || norm.startOffset !== tRange.startOffset) {
        range.setStart(tRange.startContainer, tRange.startOffset);
        modified = true;
      }
    }

    // end?
    token = closest(range.endContainer, '.selection-token', true, node);
    if (token) {
      tRange = norm.cloneRange();
      tRange.selectNode(token);
      normalize(tRange);

      if (norm.endContainer !== tRange.endContainer || norm.endOffset !== tRange.endOffset) {
        range.setEnd(tRange.endContainer, tRange.endOffset);
        modified = true;
      }
    }

    if (modified) {
      selectionSetRange(sel, range, backward);
    }
  });
}

export default SelectionToken;
