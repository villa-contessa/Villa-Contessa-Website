// sticky navbar
window.addEventListener("scroll", () => {
   const nav = document.querySelector("#topnav");
   nav.classList.toggle("is--sticky", window.scrollY > 150);
});

// ***************************

// Disable background scrolling (i.e. when the navigation menu is open)
// documentation: see https://brota-disable-scroll.webflow.io/

var Webflow = Webflow || [];
Webflow.push(function () {
   var $body = $(document.body);
   var scrollPosition = 0;

   $('[scroll="disable"]').on("click", function () {
      var oldWidth = $body.innerWidth();
      scrollPosition = window.pageYOffset;
      $body.css("overflow", "hidden");
      $body.css("position", "fixed");
      $body.css("top", `-${scrollPosition}px`);
      $body.width(oldWidth);
   });
   $('[scroll="enable"]').on("click", function () {
      if ($body.css("overflow") != "hidden") {
         scrollPosition = window.pageYOffset;
      }
      $body.css("overflow", "");
      $body.css("position", "");
      $body.css("top", "");
      $body.width("");
      $(window).scrollTop(scrollPosition);
   });
   $('[scroll="both"]').on("click", function () {
      if ($body.css("overflow") !== "hidden") {
         var oldWidth = $body.innerWidth();
         scrollPosition = window.pageYOffset;
         $body.css("overflow", "hidden");
         $body.css("position", "fixed");
         $body.css("top", `-${scrollPosition}px`);
         $body.width(oldWidth);
      } else {
         $body.css("overflow", "");
         $body.css("position", "");
         $body.css("top", "");
         $body.width("");
         $(window).scrollTop(scrollPosition);
      }
   });
});

// ***************************


// Für nicht Deutsch-sprachige Gäste wird OnePageBooking per default auf Englisch-sprachig gestellt
$(document).ready(function () {
   // Überprüfung, welcher Language-Tag für die Seite gesetzt ist
   var language = document.documentElement.lang;
   // Wenn der Wert / die Language nicht "de" ist, dann werden die Links geändert (Verlinkung auf die englisch-sprachige Version von OnePageBooking)
   if (language !== "de") {
      $("a[href='https://onepagebooking.com/villa-contessa']").each(function () {
         $(this).attr("href", "https://onepagebooking.com/villa-contessa?lang=en");
      });
      $("a[href*='https://onepagebooking.com/villa-contessa/packages/']").each(function () {
         // Ersetzen Sie "de" durch "en" im Link
         var newHref = $(this).attr("href").replace("?lang=de", "?lang=en");
         $(this).attr("href", newHref);
      });
   }
});

// Code für den Language Switcher
var Webflow = Webflow || [];
Webflow.push(function() {
  var el = document.querySelector('[data-weglot="toggle-label"]');
  if (!el) return;

  function updateCode(lang) {
    el.textContent = lang;
		// Sobald Weglot fertig initialiert ist, erhält das Label des Language Switchers die Class "weglot-is-ready"
    el.classList.add('weglot-is-ready');
  }

  // Initiales Setzen des Language Switcher Labels (wird aus dem lang-Attribut des HMTL-Tags ausgelesen) 
  updateCode(document.documentElement.getAttribute('lang') || 'de');

  // Label des Language Switcher wird beim Wechsel der Sprache gesetzt
  if (window.Weglot && typeof Weglot.on === 'function') {
    if (Weglot.initialized) {
      updateCode(Weglot.getCurrentLang());
    }
    Weglot.on('initialized', function() {
      updateCode(Weglot.getCurrentLang());
    });
    Weglot.on('languageChanged', function(newLang) {
      updateCode(newLang);
    });
  }
});