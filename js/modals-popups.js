/*!
 * Villa Contessa – Modals & Popups, Version 2.0.0
 * Mit diesem Script stellen wir Modals / Popups für unsere Website bereit.
 * Hierbei verwenden wir das native Dialog-Element (HTML 5).
 * Unsere Modal- / Popup-Lösung kann sowohl für CMS-Inhalte als auch für normale, statische Inhalte verwendet werden.
 *
 * Folgende grundlegende Elemente verwenden wir für die Darstellung von Modals / Popups:
 * Gruppierung des Elements, dass die Modals beinhaltet: data-vc-modal-group="true"
 * CMS-Rich-Text mit Platzhaltern für Info-Buttons (z.B. {{1}}): data-vc-modal-cms-richtext="true"
 * Modal / Popup selbst (HTML-Element "Dialog"): data-vc-modal-name="1" *
 * Button/Link zum Öffnen des Modals / Popups: data-vc-modal-open="1" oder "spa-details";
 * das Modal / Popup trägt hierbei denselben Wert als data-vc-modal-name.
 * Namen dürfen in unterschiedlichen Gruppen wiederholt werden.
 * Schließen: data-vc-modal-close="true";
 * Hintergrund des Modals / Popuos: data-vc-modal-backdrop="true".
 * Alle Modals / Popuos haben die Webflow CSS Class "modal_popup".
 */
(function () {
  'use strict';

  var SEL_SCOPE = '[data-vc-modal-group]';
  var SEL_LISTE = '[data-vc-modal-cms-richtext]';
  var SEL_DIALOG = 'dialog[data-vc-modal-name]';
  var SEL_CLOSE = '[data-vc-modal-close]';
  var SEL_BACKDROP = '[data-vc-modal-backdrop]';
  if (window.VCInfoDialogs) return;
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, KBD: 1, PRE: 1, A: 1, BUTTON: 1 };

  // Exakt {{n}}: positive Zahl, keine Leerzeichen und keine führenden Nullen.
  // Die Nummer wird als Zeichenfolge verarbeitet.
  var PLACEHOLDER_SRC = '\\{\\{([1-9]\\d*)\\}\\}';

  function languageText() {
    return (document.documentElement.lang || 'de').toLowerCase().indexOf('en') === 0
      ? { open: 'More information', close: 'Close', dialog: 'More information' }
      : { open: 'Mehr Informationen', close: 'Schließen', dialog: 'Weitere Informationen' };
  }
  var TEXT = languageText();

  var dialogOfButton = new WeakMap(); // Info-Button -> <dialog>
  var openerOfDialog = new WeakMap(); // <dialog>    -> zuletzt benutzter Info-Button
  var pendingClose = new WeakMap();   // <dialog>    -> laufendes Ausblenden
  var dialogsOfScope = new WeakMap();
  var automaticOpeners = new WeakSet();
  var preparedDialogs = new WeakSet();
  var automaticDialogLabels = new WeakSet();

  function warn(message, element) { console.warn('[vc-info] ' + message, element); }

  /* ---------- Dialoge ---------- */

  // Prüft CMS-Rich-Text auf tatsächlichen Inhalt, unabhängig von Collection und Feldname.
  function isEmptyDialog(dialog) {
    var richTexts = dialog.querySelectorAll('.w-richtext');
    // Statische oder an Plain-Text-Felder gebundene Inhalte benötigen keinen Rich Text.
    if (!richTexts.length) return false;
    for (var i = 0; i < richTexts.length; i++) {
      var rt = richTexts[i];
      var hasContent =
        !rt.classList.contains('w-dyn-bind-empty') &&
        (rt.textContent.replace(/[\s​-‍﻿]/g, '') !== '' ||
          rt.querySelector('img, video, audio, iframe, svg, canvas'));
      if (hasContent) return false;
    }
    return true;
  }

  // In einer eingebetteten Vorschau kann die native Tab-Reihenfolge den Frame verlassen.
  // Nur die beiden Grenzen ergänzen; innerhalb des Dialogs bleibt die Browser-Reihenfolge.
  function keepTabInDialog(dialog, event) {
    if (event.key !== 'Tab' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        !dialog.open || !dialog.matches(':modal')) return;
    var stops = Array.from(dialog.querySelectorAll(
      'a[href], area[href], button, input, select, textarea, iframe, object, embed, ' +
      '[tabindex], [contenteditable], audio[controls], video[controls], summary'
    )).filter(function (element) {
      var visibility = window.getComputedStyle(element).visibility;
      return element.tabIndex >= 0 && !element.matches(':disabled') &&
        !element.closest('[inert], [hidden]') && element.getClientRects().length > 0 &&
        visibility !== 'hidden' && visibility !== 'collapse';
    }).sort(function (a, b) {
      var aIndex = a.tabIndex > 0 ? a.tabIndex : Infinity;
      var bIndex = b.tabIndex > 0 ? b.tabIndex : Infinity;
      return aIndex === bIndex ? 0 : aIndex - bIndex;
    });
    if (!stops.length) { event.preventDefault(); dialog.focus(); return; }
    var first = stops[0];
    var last = stops[stops.length - 1];
    var active = document.activeElement;
    if (stops.indexOf(active) === -1 || (!event.shiftKey && active === last) || (event.shiftKey && active === first)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  }

  function prepareDialog(dialog) {
    if (!dialog.hasAttribute('aria-label') && !dialog.hasAttribute('aria-labelledby')) {
      dialog.setAttribute('aria-label', TEXT.dialog);
      automaticDialogLabels.add(dialog);
    }
    var closers = dialog.querySelectorAll(SEL_CLOSE + ', ' + SEL_BACKDROP);
    for (var i = 0; i < closers.length; i++) {
      var el = closers[i];
      if (el.hasAttribute('data-vc-modal-backdrop')) {
        el.setAttribute('aria-hidden', 'true');
        continue;
      }
      if (el.tagName !== 'BUTTON') {
        var button = document.createElement('button');
        Array.from(el.attributes).forEach(function (attribute) {
          if (!/^(href|target|rel|role|tabindex|aria-roledescription)$/.test(attribute.name)) {
            button.setAttribute(attribute.name, attribute.value);
          }
        });
        while (el.firstChild) button.appendChild(el.firstChild);
        el.replaceWith(button);
        el = button;
      }
      el.type = 'button';
      el.removeAttribute('role');
      el.removeAttribute('tabindex');
      el.setAttribute('aria-label', TEXT.close);
    }
    var initialFocus = dialog.querySelector('[autofocus]') || dialog.querySelector('button' + SEL_CLOSE);
    if (initialFocus) initialFocus.setAttribute('autofocus', '');
    // Escape: statt sofort zu schließen ebenfalls sanft ausblenden
    dialog.addEventListener('keydown', function (event) { keepTabInDialog(dialog, event); });
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeDialog(dialog);
    });
    dialog.addEventListener('close', function () {
      // Ein verspätetes close-Ereignis darf einen erneut geöffneten Dialog nicht verändern.
      if (dialog.open) return;
      clearPendingClose(dialog);
      restoreOpener(dialog);
    });
    preparedDialogs.add(dialog);
  }

  function openDialog(button) {
    var dialog = dialogOfButton.get(button);
    if (!dialog || dialog.open || !preparedDialogs.has(dialog)) return;
    openerOfDialog.set(dialog, button);
    clearPendingClose(dialog);
    dialog.showModal();
    button.setAttribute('aria-expanded', 'true');
    // autofocus steht bereits vor showModal fest; keine nachträgliche Fokuskorrektur.
    dialog.scrollTop = 0;
    var content = dialog.querySelector('.modal_content');
    if (content) content.scrollTop = 0;
  }

  // Räumt ein laufendes Ausblenden auf (auch wenn der Browser den Dialog selbst geschlossen hat)
  function clearPendingClose(dialog) {
    var pending = pendingClose.get(dialog);
    if (pending) {
      window.clearTimeout(pending.timer);
      dialog.removeEventListener('animationend', pending.onEnd);
      dialog.removeEventListener('animationcancel', pending.onCancel);
      pendingClose.delete(dialog);
    }
    dialog.classList.remove('is-closing');
  }

  function finishClose(dialog) {
    clearPendingClose(dialog);
    if (!dialog.open) return;
    dialog.close();
    // In der Designer-Vorschau wird das native close-Ereignis nicht immer weitergereicht.
    // Den selbst ausgelösten Abschluss daher synchron vervollständigen.
    restoreOpener(dialog);
  }

  function restoreOpener(dialog) {
    var opener = openerOfDialog.get(dialog);
    if (opener) {
      opener.setAttribute('aria-expanded', 'false');
      if (opener.isConnected && !document.querySelector('dialog:modal')) opener.focus({ preventScroll: true });
    }
    openerOfDialog.delete(dialog);
  }

  function timeMs(value) {
    return parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000) || 0;
  }

  function closeAnimationMs(style) {
    var names = style.animationName.split(',').map(function (name) { return name.trim(); });
    var durations = style.animationDuration.split(',').map(timeMs);
    var delays = style.animationDelay.split(',').map(timeMs);
    var counts = style.animationIterationCount.split(',');
    var longest = 0;
    names.forEach(function (name, index) {
      if (name !== 'vc-modal-ausblenden') return;
      var count = parseFloat(counts[index % counts.length]);
      if (!Number.isFinite(count)) count = 1;
      longest = Math.max(longest, durations[index % durations.length] * count + delays[index % delays.length]);
    });
    return longest;
  }

  // Sanftes Ausblenden: Klasse .is-closing startet die CSS-Animation, danach wird geschlossen.
  // Ohne Animation (z. B. „Bewegung reduzieren" im Betriebssystem) schließt der Dialog sofort.
  function closeDialog(dialog) {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    var style = window.getComputedStyle(dialog);
    var duration = closeAnimationMs(style);
    if (duration <= 0) { finishClose(dialog); return; }
    var onEnd = function (e) {
      if (e.target === dialog && e.animationName === 'vc-modal-ausblenden') finishClose(dialog);
    };
    var onCancel = function (e) {
      if (e.target === dialog && e.animationName === 'vc-modal-ausblenden') finishClose(dialog);
    };
    dialog.addEventListener('animationend', onEnd);
    dialog.addEventListener('animationcancel', onCancel);
    pendingClose.set(dialog, {
      onEnd: onEnd,
      onCancel: onCancel,
      // Sicherheitsnetz, falls das Animationsende nicht gemeldet wird
      timer: window.setTimeout(function () { finishClose(dialog); }, duration + 100)
    });
  }

  /* ---------- Platzhalter -> Info-Buttons ---------- */

  function scopeOf(el) {
    // Die nächste markierte Gruppe bestimmt die Zuordnung, auch bei Verschachtelungen.
    return el.closest(SEL_SCOPE);
  }

  function createInfoButton(dialog) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'modal_info-button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', TEXT.open);
    button.setAttribute('data-vc-modal-open', dialog.getAttribute('data-vc-modal-name'));
    button.textContent = 'i';
    dialogOfButton.set(button, dialog);
    automaticOpeners.add(button);
    return button;
  }

  function replacePlaceholders(textNode, scope) {
    var text = textNode.nodeValue;
    var re = new RegExp(PLACEHOLDER_SRC, 'g');
    var frag = document.createDocumentFragment();
    var last = 0;
    var match;
    while ((match = re.exec(text)) !== null) {
      // Keine Teiltreffer innerhalb zusätzlicher Klammern wie {{{1}}}.
      if (text[match.index - 1] === '{' || text[match.index + match[0].length] === '}') continue;
      var before = text.slice(last, match.index);
      var number = match[1];
      var dialog = dialogsOfScope.get(scope).get(number);
      last = match.index + match[0].length;
      if (!dialog) {
        // Kein (befüllter) Dialog: Platzhalter entfernen, damit kein toter Button entsteht
        if (before) frag.appendChild(document.createTextNode(before));
        warn('Platzhalter {{' + number + '}} ohne verfügbaren Dialog in seiner Gruppe.', scope);
        continue;
      }
      // Geschütztes Leerzeichen: der Button rutscht nie allein in die nächste Zeile
      frag.appendChild(document.createTextNode(before.replace(/[ \t]+$/, ' ')));
      frag.appendChild(createInfoButton(dialog));
    }
    var after = text.slice(last);
    if (after) frag.appendChild(document.createTextNode(after));
    textNode.parentNode.replaceChild(frag, textNode);
  }

  function isInsideSkipTag(node, root) {
    for (var n = node.parentNode; n && n !== root.parentNode; n = n.parentNode) {
      if (SKIP_TAGS[n.nodeName] || (n.nodeType === 1 && n.isContentEditable)) return true;
    }
    return false;
  }

  function processContainer(container) {
    if (container.hasAttribute('data-vc-modal-ready')) return;
    var scope = scopeOf(container);
    if (!scope) { warn('CMS-Rich-Text ohne gemeinsame Modal-Gruppe.', container); return; }
    if (!dialogsOfScope.has(scope)) return;
    container.setAttribute('data-vc-modal-ready', '');
    var test = new RegExp(PLACEHOLDER_SRC);
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && test.test(node.nodeValue) && !isInsideSkipTag(node, container)) nodes.push(node);
    }
    nodes.forEach(function (n) { replacePlaceholders(n, scope); });

    // wie bisher in cms-richtext.js: <strong> erhält die Client-First-Klasse
    var strongs = container.querySelectorAll('strong');
    for (var i = 0; i < strongs.length; i++) {
      if (!isInsideSkipTag(strongs[i], container)) strongs[i].classList.add('text-weight-bold');
    }
  }


  /* ---------- Gruppen und gemeinsame Dialog-Zuordnung ---------- */

  function prepareGroups() {
    document.querySelectorAll(SEL_DIALOG).forEach(function (dialog) {
      if (!scopeOf(dialog)) warn('Dialog ohne gemeinsame Modal-Gruppe.', dialog);
    });
    document.querySelectorAll(SEL_SCOPE).forEach(function (scope) {
      dialogsOfScope.delete(scope);
      var map = new Map();
      var invalid = false;
      var dialogs = Array.from(scope.querySelectorAll(SEL_DIALOG)).filter(function (dialog) {
        return scopeOf(dialog) === scope;
      });
      dialogs.forEach(function (dialog) {
        var name = dialog.getAttribute('data-vc-modal-name');
        // Positive Nummer für CMS-Platzhalter oder lesbarer Name für normale Auslöser.
        if (!/^([1-9]\d*|[A-Za-z][A-Za-z0-9_-]*)$/.test(name) || map.has(name)) {
          invalid = true;
          warn('Ungültiger oder doppelter Dialogname innerhalb einer Modal-Gruppe.', dialog);
        }
        map.set(name, dialog);
      });
      if (invalid) return;
      dialogs.forEach(function (dialog) {
        var name = dialog.getAttribute('data-vc-modal-name');
        if (isEmptyDialog(dialog)) { dialog.remove(); map.delete(name); return; }
        if (!dialog.querySelector(SEL_CLOSE)) {
          map.delete(name);
          warn('Dialog ohne Schließen-Button.', dialog);
          return;
        }
        if (!preparedDialogs.has(dialog)) prepareDialog(dialog);
        if (automaticDialogLabels.has(dialog)) dialog.setAttribute('aria-label', TEXT.dialog);
        dialog.querySelectorAll('button' + SEL_CLOSE).forEach(function (button) {
          button.setAttribute('aria-label', TEXT.close);
        });
      });
      dialogsOfScope.set(scope, map);
    });
  }

  function prepareOpeners() {
    document.querySelectorAll('[data-vc-modal-open]').forEach(function (opener) {
      dialogOfButton.delete(opener);
      var scope = scopeOf(opener);
      var map = scope && dialogsOfScope.get(scope);
      var dialog = map && map.get(opener.getAttribute('data-vc-modal-open'));
      if (!dialog || !preparedDialogs.has(dialog)) return;
      dialogOfButton.set(opener, dialog);
      opener.setAttribute('aria-haspopup', 'dialog');
      opener.setAttribute('aria-expanded', dialog.open ? 'true' : 'false');
      if (automaticOpeners.has(opener)) opener.setAttribute('aria-label', TEXT.open);
      // Eigene Beschriftungen normaler Buttons und Links bleiben erhalten.
    });
  }

  /* ---------- Start ---------- */

  function init() {
    TEXT = languageText();
    if (!window.HTMLDialogElement || typeof HTMLDialogElement.prototype.showModal !== 'function') {
      warn('Dieser Browser unterstützt keine nativen modalen Dialoge.', document.documentElement);
      return;
    }
    prepareGroups();
    document.querySelectorAll(SEL_LISTE).forEach(function (container) { processContainer(container); });
    prepareOpeners();
  }

  // Erneute Initialisierung ist möglich, wenn später weitere CMS-Blöcke ergänzt werden.
  window.VCInfoDialogs = { version: '2.0.0', init: init };

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var opener = t.closest('[data-vc-modal-open]');
    if (opener && dialogOfButton.has(opener)) { e.preventDefault(); openDialog(opener); return; }
    var closer = t.closest(SEL_CLOSE + ', ' + SEL_BACKDROP);
    if (closer) {
      var dialog = closer.closest('dialog');
      if (dialog && preparedDialogs.has(dialog)) { e.preventDefault(); closeDialog(dialog); }
      return;
    }
    if (t.matches(SEL_DIALOG) && preparedDialogs.has(t)) closeDialog(t);
  });

  // Die Webflow-Vorschau kann CMS-Blöcke nach DOMContentLoaded einsetzen.
  // Erst nach dem Rendern initialisieren und spätere relevante Inhalte erfassen.
  var scheduled = false;
  function scheduleInit() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      init();
    });
  }
  var contentObserver = new MutationObserver(function (records) {
    var relevant = records.some(function (record) {
      if (record.type === 'attributes' && record.target === document.documentElement) return true;
      if (record.target.nodeType === 1 && record.target.closest(SEL_LISTE)) return true;
      return Array.from(record.addedNodes).some(function (node) {
        return node.nodeType === 1 &&
          (node.matches(SEL_SCOPE + ', ' + SEL_LISTE + ', ' + SEL_DIALOG + ', [data-vc-modal-open]') ||
            node.querySelector(SEL_SCOPE + ', ' + SEL_LISTE + ', ' + SEL_DIALOG + ', [data-vc-modal-open]'));
      });
    });
    if (relevant) scheduleInit();
  });
  contentObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['lang'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleInit, { once: true });
  else scheduleInit();
  window.addEventListener('load', scheduleInit, { once: true });
})();
