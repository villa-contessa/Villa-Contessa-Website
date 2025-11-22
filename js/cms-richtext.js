/* Dieses Script verwenden wir für folgende Zwecke:
- Um Info-Icons in den Richtext einer CMS Collection Page einzufügen (Platzhalter im Format {{1}} bis {{12}} werden durch ein Info-Icon / beim Klick auf das Icon wird ein Popup mit den Informationen angezeigt)
- Alle <strong>-Tags im Rich-Text werden mit der Class "text-weight-bold" versehen 
*/
(function () {
  // === Einstellungen ===
  // Passe den Selektor an, wenn Dein Rich-Text anders heißt:
  const TARGET_SELECTOR = '[data-vc-element = cms-angebotspakete-liste]';
  const MAX_INDEX = 12;

  // Test-RegEx (nicht global), um Textknoten schnell zu filtern
  const PLACEHOLDER_TEST_RE = /\{\{\s*(1[0-2]|[1-9])\s*\}\}?/;
  const PLACEHOLDER_RE = /\{\{\s*(1[0-2]|[1-9])\s*\}\}?/g;

  // Bestimmte Container überspringen
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'KBD', 'PRE']);

  function createInfoButton(n) {
    const span = document.createElement('span');
    // Attribute exakt wie gewünscht, mit dynamischer Zahl:
    span.setAttribute('aria-roledescription', 'aria-roledescription');
    span.className = 'modal_info-button';
    span.setAttribute('aria-label', 'Mehr Informationen');
    span.setAttribute('role', 'button');
    span.setAttribute('aria-haspopup', 'dialog');
    span.setAttribute('aria-controls', `fs-modal-2-popup-${n}`);
    span.setAttribute('fs-modal-element', `open-${n}`);
    span.setAttribute('aria-expanded', 'false');
    span.setAttribute('tabindex', '0');
    span.textContent = 'i';
    return span;
  }

  function replacePlaceholdersInTextNode(textNode) {
    const text = textNode.nodeValue;
    let lastIndex = 0;
    let match;
    const frag = document.createDocumentFragment();
    PLACEHOLDER_RE.lastIndex = 0;

    while ((match = PLACEHOLDER_RE.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) frag.appendChild(document.createTextNode(before));

      const num = parseInt(match[1], 10);
      // Sicherheitscheck: nur 1..12 ersetzen
      if (num >= 1 && num <= MAX_INDEX) {
        frag.appendChild(createInfoButton(num));
      } else {
        // Falls außerhalb des Bereichs -> Originaltext einfügen
        frag.appendChild(document.createTextNode(match[0]));
      }
      lastIndex = match.index + match[0].length;
    }

    const after = text.slice(lastIndex);
    if (after) frag.appendChild(document.createTextNode(after));

    textNode.parentNode.replaceChild(frag, textNode);
  }

  // <strong>-Tags innerhalb des Containers mit Klasse versehen (Skip-Tags respektieren)
  function isInsideSkipTag(el, root) {
    let node = el;
    while (node && node !== root) {
      if (SKIP_TAGS.has(node.nodeName)) return true;
      node = node.parentNode;
    }
    return false;
  }

  function addStrongClass(container) {
    container.querySelectorAll('strong').forEach((el) => {
      if (!isInsideSkipTag(el, container)) {
        el.classList.add('text-weight-bold');
      }
    });
  }

  function processContainer(container) {
    if (!container) return;

    // Alle Textknoten durchlaufen, die Platzhalter enthalten
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !PLACEHOLDER_TEST_RE.test(node.nodeValue)) {
            return NodeFilter.FILTER_REJECT;
          }
          const p = node.parentNode;
          if (p && SKIP_TAGS.has(p.nodeName)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const targets = [];
    let current;
    while ((current = walker.nextNode())) {
      targets.push(current);
    }

    targets.forEach(replacePlaceholdersInTextNode);

    // Danach alle <strong>-Elemente im Container klassieren
    addStrongClass(container);
  }

  function init() {
    // Einmalige Verarbeitung beim Laden
    document.querySelectorAll(TARGET_SELECTOR).forEach(processContainer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();