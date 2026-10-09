/*!
 * Villa Contessa – Modals & Popups, Version 1.2.0
 * Native Dialoge mit CMS-Platzhaltern und normalen Buttons/Links.
 * JavaScript extern mit defer laden; modals-popups.css separat im Head.
 *
 * CMS: data-vc-element="angebotspaket" als gemeinsamer Bereich;
 * Rich Text: data-vc-element="cms-angebotspakete-dialog-liste";
 * dialog: data-vc-info="1" passend zu {{1}} und "Zusätzliche Infos 1".
 *
 * Normale Auslöser: gemeinsamer Wrapper mit data-vc-modal-scope="";
 * Button/Link: data-vc-modal-open="spa-info"; dialog: data-vc-modal="spa-info".
 * Namen dürfen in unterschiedlichen Bereichen wiederholt werden.
 * Schließen: data-vc-info-close="button"; Hintergrund: data-vc-info-close="cover".
 * Alle Dialoge behalten die Webflow-Klasse modal_popup.
 */
(function () {
  'use strict';

  var SEL_PAKET = '[data-vc-element="angebotspaket"]';
  var SEL_SCOPE = SEL_PAKET + ', [data-vc-modal-scope], .w-dyn-item';
  var SEL_MANUAL_DIALOG = 'dialog[data-vc-modal]';
  // Bestehende und neue CMS-Markierungen werden unterstützt.
  var SEL_LISTE = '[data-vc-element="cms-angebotspakete-liste"], [data-vc-element="cms-angebotspakete-dialog-liste"]';
  var SEL_DIALOG = 'dialog[data-vc-info]';
  if (window.VCInfoDialogs) return;
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, KBD: 1, PRE: 1, A: 1, BUTTON: 1 };

  // Exakt {{n}}: positive Zahl, keine Leerzeichen und keine führenden Nullen.
  // Die Nummer wird als Zeichenfolge verarbeitet; keine Begrenzung auf 99.
  var PLACEHOLDER_SRC = '\\{\\{([1-9]\\d*)\\}\\}';

  function languageText() {
    return (document.documentElement.lang || 'de').toLowerCase().indexOf('en') === 0
      ? { open: 'More information', close: 'Close', dialog: 'Further information' }
      : { open: 'Mehr Informationen', close: 'Schließen', dialog: 'Weitere Informationen' };
  }
  var TEXT = languageText();

  var dialogOfButton = new WeakMap(); // Info-Button -> <dialog>
  var openerOfDialog = new WeakMap(); // <dialog>    -> zuletzt benutzter Info-Button
  var pendingClose = new WeakMap();   // <dialog>    -> laufendes Ausblenden
  var dialogsOfScope = new WeakMap();
  var manualDialogsOfScope = new WeakMap();
  var preparedDialogs = new WeakSet();
  var automaticDialogLabels = new WeakSet();

  function warn(message, element) { console.warn('[vc-info] ' + message, element); }

  /* ---------- Dialoge ---------- */

  // Ein Dialog gilt als leer, wenn das CMS-Feld „Zusätzliche Infos n" nicht befüllt ist.
  function isEmptyDialog(dialog) {
    var richTexts = dialog.querySelectorAll('.w-richtext');
    if (!richTexts.length) return true;
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
    var closers = dialog.querySelectorAll('[data-vc-info-close]');
    for (var i = 0; i < closers.length; i++) {
      var el = closers[i];
      if (el.getAttribute('data-vc-info-close') === 'cover') {
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
    var initialFocus = dialog.querySelector('[autofocus]') || dialog.querySelector('button[data-vc-info-close="button"]');
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
      if (name !== 'vc-info-aus') return;
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
      if (e.target === dialog && e.animationName === 'vc-info-aus') finishClose(dialog);
    };
    var onCancel = function (e) {
      if (e.target === dialog && e.animationName === 'vc-info-aus') finishClose(dialog);
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
    // Auch verschachtelte Collection Items bekommen ihren eigenen Bereich.
    return el.closest(SEL_SCOPE);
  }

  function createInfoButton(dialog) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'modal_info-button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', TEXT.open);
    button.setAttribute('data-vc-info-open', dialog.getAttribute('data-vc-info'));
    button.textContent = 'i';
    dialogOfButton.set(button, dialog);
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
        warn('Platzhalter {{' + number + '}} ohne befülltes Zusatzinfo-Feld.', scope);
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
    if (container.hasAttribute('data-vc-info-ready')) return;
    var scope = scopeOf(container);
    if (!scope) { warn('Leistungsbeschreibung ohne Angebotsblock. Keine seitenweite Ersatzsuche.', container); return; }
    if (!dialogsOfScope.has(scope)) return;
    container.setAttribute('data-vc-info-ready', '');
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


  /* ---------- Normale Buttons und Links ---------- */

  function prepareManualTriggers() {
    var scopes = new Set();
    document.querySelectorAll(SEL_MANUAL_DIALOG).forEach(function (dialog) {
      var scope = scopeOf(dialog);
      if (!scope) { warn('Dialog ohne gemeinsamen Modal-Bereich.', dialog); return; }
      scopes.add(scope);
    });
    scopes.forEach(function (scope) {
      manualDialogsOfScope.delete(scope);
      var map = new Map();
      var invalid = false;
      var dialogs = Array.from(scope.querySelectorAll(SEL_MANUAL_DIALOG)).filter(function (dialog) {
        return scopeOf(dialog) === scope;
      });
      dialogs.forEach(function (dialog) {
        var name = dialog.getAttribute('data-vc-modal');
        if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(name) || map.has(name)) {
          invalid = true;
          warn('Ungültiger oder doppelter Modal-Name innerhalb eines Bereichs.', dialog);
        }
        map.set(name, dialog);
      });
      if (invalid) return;
      dialogs.forEach(function (dialog) {
        var name = dialog.getAttribute('data-vc-modal');
        if (!dialog.querySelector('[data-vc-info-close="button"]')) {
          map.delete(name);
          warn('Dialog ohne Schließen-Button.', dialog);
          return;
        }
        if (!preparedDialogs.has(dialog)) prepareDialog(dialog);
        if (automaticDialogLabels.has(dialog)) dialog.setAttribute('aria-label', TEXT.dialog);
        dialog.querySelectorAll('button[data-vc-info-close="button"]').forEach(function (button) {
          button.setAttribute('aria-label', TEXT.close);
        });
      });
      manualDialogsOfScope.set(scope, map);
    });
    document.querySelectorAll('[data-vc-modal-open]').forEach(function (opener) {
      dialogOfButton.delete(opener);
      var scope = scopeOf(opener);
      var map = scope && manualDialogsOfScope.get(scope);
      var dialog = map && map.get(opener.getAttribute('data-vc-modal-open'));
      if (!dialog || !preparedDialogs.has(dialog)) return;
      dialogOfButton.set(opener, dialog);
      opener.setAttribute('aria-haspopup', 'dialog');
      opener.setAttribute('aria-expanded', dialog.open ? 'true' : 'false');
      // Der vorhandene sichtbare Text bzw. aria-label des Auslösers bleibt erhalten.
    });
  }

  /* ---------- Start ---------- */

  function init() {
    TEXT = languageText();
    if (!window.HTMLDialogElement || typeof HTMLDialogElement.prototype.showModal !== 'function') {
      warn('Dieser Browser unterstützt keine nativen modalen Dialoge.', document.documentElement);
      return;
    }
    prepareManualTriggers();
    var containers = document.querySelectorAll(SEL_LISTE);
    var seen = new Set();
    for (var j = 0; j < containers.length; j++) {
      var scope = scopeOf(containers[j]);
      if (!scope || seen.has(scope)) continue;
      seen.add(scope);
      dialogsOfScope.delete(scope);
      var dialogs = Array.from(scope.querySelectorAll(SEL_DIALOG)).filter(function (dialog) { return scopeOf(dialog) === scope; });
      if (!dialogs.length) continue; // Noch nicht umgestellte Angebotsblöcke bleiben unverändert.
      var map = new Map();
      var invalid = false;
      dialogs.forEach(function (dialog) {
        var number = dialog.getAttribute('data-vc-info');
        if (!/^[1-9]\d*$/.test(number) || map.has(number)) {
          invalid = true;
          warn('Ungültige oder doppelte Zusatzinfo-Nummer innerhalb eines Angebots.', dialog);
        }
        map.set(number, dialog);
      });
      if (invalid) continue;
      dialogs.forEach(function (dialog) {
        var number = dialog.getAttribute('data-vc-info');
        if (isEmptyDialog(dialog)) { dialog.remove(); map.delete(number); return; }
        if (!dialog.querySelector('[data-vc-info-close="button"]')) {
          map.delete(number);
          warn('Dialog ohne Schließen-Button. Der zugehörige Infobutton wird ausgelassen.', dialog);
          return;
        }
        if (!preparedDialogs.has(dialog)) prepareDialog(dialog);
      });
      dialogsOfScope.set(scope, map);
    }
    for (var k = 0; k < containers.length; k++) {
      processContainer(containers[k]);
      var buttons = containers[k].querySelectorAll('[data-vc-info-open]');
      for (var b = 0; b < buttons.length; b++) {
        if (dialogOfButton.has(buttons[b])) buttons[b].setAttribute('aria-label', TEXT.open);
      }
      var scope = scopeOf(containers[k]);
      if (!scope) continue;
      scope.querySelectorAll(SEL_DIALOG).forEach(function (dialog) {
        if (!preparedDialogs.has(dialog)) return;
        if (automaticDialogLabels.has(dialog)) dialog.setAttribute('aria-label', TEXT.dialog);
        dialog.querySelectorAll('button[data-vc-info-close="button"]').forEach(function (button) {
          button.setAttribute('aria-label', TEXT.close);
        });
      });
    }
  }

  // Erneute Initialisierung ist möglich, wenn später weitere CMS-Blöcke ergänzt werden.
  window.VCInfoDialogs = { version: '1.2.0', init: init };

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var opener = t.closest('[data-vc-info-open], [data-vc-modal-open]');
    if (opener && dialogOfButton.has(opener)) { e.preventDefault(); openDialog(opener); return; }
    var closer = t.closest('[data-vc-info-close]');
    if (closer) {
      var dialog = closer.closest('dialog');
      if (dialog && preparedDialogs.has(dialog)) { e.preventDefault(); closeDialog(dialog); }
      return;
    }
    if (t.matches(SEL_DIALOG + ', ' + SEL_MANUAL_DIALOG) && preparedDialogs.has(t)) closeDialog(t);
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
          (node.matches(SEL_LISTE + ', ' + SEL_DIALOG + ', ' + SEL_MANUAL_DIALOG + ', [data-vc-modal-open]') ||
            node.querySelector(SEL_LISTE + ', ' + SEL_DIALOG + ', ' + SEL_MANUAL_DIALOG + ', [data-vc-modal-open]'));
      });
    });
    if (relevant) scheduleInit();
  });
  contentObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['lang'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleInit, { once: true });
  else scheduleInit();
  window.addEventListener('load', scheduleInit, { once: true });
})();
