
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
import selectionchange from 'selectionchange-polyfill';

// keydown key codes
const LEFT  = 37;
const RIGHT = 39;

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

  function onselectionchange () {
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
      tRange.selectNodeContents(token);
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
      tRange.selectNodeContents(token);
      normalize(tRange);

      if (norm.endContainer !== tRange.endContainer || norm.endOffset !== tRange.endOffset) {
        range.setEnd(tRange.endContainer, tRange.endOffset);
        modified = true;
      }
    }

    if (modified) {
      console.log('setting range!', backward, range.toString());
      selectionSetRange(sel, range, backward);
    }
  }

  function onkeydown (e) {
    if (composing) return;
    console.log(e, e.which);

    let sel = currentSelection(doc);
    if (!sel) return;

    let range = currentRange(sel);
    if (!range) return;

    if (!contains(node, range.commonAncestorContainer)) return;

    range = normalize(range.cloneRange());

    let tRange;
    let token;

    // start?
    if (e.which === LEFT) {
      token = closest(range.startContainer, '.selection-token', true, node);
      if (token) {
        tRange = range.cloneRange();
        tRange.selectNodeContents(token);
        normalize(tRange);

        if (range.startContainer === tRange.startContainer && range.startOffset === tRange.startOffset) {
          console.log('start is at beginning of token!');
          e.preventDefault();
          let n = token.previousSibling
          if (n) {
            range.setStart(n, n.nodeType === 1 ? n.childNodes.length : n.nodeValue.length);
            range.setEnd(n, n.nodeType === 1 ? n.childNodes.length : n.nodeValue.length);
            //range.setStartBefore(token);
            //range.setEndBefore(token);
            selectionSetRange(sel, range, false);
          }
        }
      }

    // end?
    } else if (e.which === RIGHT) {
      token = closest(range.endContainer, '.selection-token', true, node);
      if (token) {
        tRange = range.cloneRange();
        tRange.selectNodeContents(token);
        normalize(tRange);

        if (range.endContainer === tRange.endContainer && range.endOffset === tRange.endOffset) {
          console.log('end is at end of token!');
          e.preventDefault();
          let n = token.nextSibling;
          if (n) {
            range.setStart(n, 0);
            range.setEnd(n, 0);
            //range.setStartAfter(token);
            //range.setEndAfter(token);
            selectionSetRange(sel, range, false);
          }
        }
      }
    }
  }

  function oncompositionstart (e) {
    composing = true;
  }

  function oncompositionend (e) {
    composing = false;
  }

  function cleanup () {
    doc.removeEventListener('keydown', onkeydown, false);
    doc.removeEventListener('selectionchange', onselectionchange, false);
    doc.removeEventListener('compositionstart', oncompositionstart, false);
    doc.removeEventListener('compositionend', oncompositionend, false);
  }

  let doc = getDocument(node);
  let composing = false;

  // ensure that the Document is emitting "selectionchange" events
  selectionchange.start(doc);

  doc.addEventListener('keydown', onkeydown, false);
  doc.addEventListener('selectionchange', onselectionchange, false);
  doc.addEventListener('compositionstart', oncompositionstart, false);
  doc.addEventListener('compositionend', oncompositionend, false);

  return cleanup;
}

export default SelectionToken;
