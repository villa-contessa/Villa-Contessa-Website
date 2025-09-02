// Hilfsfunktionen, um mit Cookies oder LocalStorage zu arbeiten
function isCookiesEnabled() {
   try {
      document.cookie = "testcookie=1; SameSite=Strict; Secure";
      const result = document.cookie.indexOf("testcookie") !== -1;
      document.cookie = "testcookie=1; SameSite=Strict; Secure; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      return result;
   } catch (e) {
      return false;
   }
}

function setStorage(key, value, days = 12) {
   const item = {
      value: value,
      expiry: new Date().getTime() + days * 24 * 60 * 60 * 1000,
   };
   if (isCookiesEnabled()) {
      Cookies.set(key, JSON.stringify(item), { expires: days, secure: true, sameSite: "strict" });
   } else {
      localStorage.setItem(key, JSON.stringify(item));
   }
}

function getStorage(key) {
   const itemStr = Cookies.get(key) || localStorage.getItem(key);
   if (!itemStr) {
      return null;
   }
   const item = JSON.parse(itemStr);
   const now = new Date().getTime();
   if (now > item.expiry) {
      if (isCookiesEnabled()) {
         Cookies.remove(key);
      } else {
         localStorage.removeItem(key);
      }
      return null;
   }
   return item.value;
}

document.addEventListener("DOMContentLoaded", function () {
   const currentPagePath = window.location.pathname;
   const specialPageVisited = getStorage("SpecialPageVisited");
   const popupAlreadyShown = getStorage("PopupAlreadyShown");

   // Setze ein Storage, wenn die Angebotsseite besucht wird
   // ... existing code ...
   if (!currentPagePath.includes("/hotel/angebote") && popupAlreadyShown !== "true" && specialPageVisited !== "true") {
      setTimeout(function () {
         const popup = document.querySelector('[data-id="popup_component"]');
         if (popup) {
            // jQuery bevorzugt: weiches Fade-in mit 805ms, Display bleibt flex
            if (window.jQuery) {
               var $popup = $('[data-id="popup_component"]');
               $popup.stop(true, true).css('display', 'none');
               // Display auf flex setzen, dann fadeIn verwenden
               $popup.css('display', 'flex').hide().fadeIn(800);
            } else {
               // Fallback ohne jQuery: Transition + Reflow erzwingen
               popup.style.display = 'flex';
               popup.style.opacity = '0';
               popup.style.transition = 'opacity 805ms ease';
               // Reflow erzwingen, damit die Transition sicher greift
               void popup.offsetHeight; // eslint-disable-line no-unused-expressions
               popup.style.opacity = '1';
            }
         }
         setStorage("PopupAlreadyShown", "true");
      }, 5000);
   }
});