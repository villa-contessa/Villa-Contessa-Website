// Zunächst definieren wir ein paar Hilfsfunktionen, die wir benötigen, um sicherzustellen, dass das Popup nur einmal pro 21 Tagen angezeigt wird.
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // SameSite=Strict und Secure für Sicherheit
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict; Secure";
}

// Hilfsfunktion: Cookie lesen (Fallback für Vanilla JS)
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

// Intelligente Speicherfunktion: Versucht LocalStorage -> dann Cookie -> dann SessionStorage
function setSmartStorage(key, value, days) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + (days * 24 * 60 * 60 * 1000),
    };

    let saved = false;

    // 1. Versuch: LocalStorage
    try {
        localStorage.setItem(key, JSON.stringify(item));
        saved = true;
    } catch (e) {
        // Still failen, weiter zu Cookie
    }

    // 2. Versuch: Cookie
    if (!saved) {
        try {
            setCookie(key, value, days); 
            saved = true;
        } catch (e) {
           // Still failen, weiter zu SessionStorage
        }
    }

    // 3. Versuch: SessionStorage (Nur für aktuellen Tab)
    if (!saved) {
        try {
            sessionStorage.setItem(key, "true");
        } catch (e) {
            console.log("Browser blockiert jegliches Speichern.");
        }
    }
}

// Intelligente Lesefunktion
function getSmartStorage(key) {
    // 1. Check LocalStorage
    try {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
            const item = JSON.parse(itemStr);
            const now = new Date();
            // Prüfen ob abgelaufen (bei LocalStorage muss man das manuell prüfen)
            if (now.getTime() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return item.value;
        }
    } catch(e) {}

    // 2. Check Cookie
    const cookieVal = getCookie(key);
    if (cookieVal) return cookieVal;

    // 3. Check SessionStorage
    try {
        const sessionVal = sessionStorage.getItem(key);
        if (sessionVal) return sessionVal;
    } catch(e) {}

    return null;
}

// Jetzt kommt der eigentliche Code für das Popup:
document.addEventListener("DOMContentLoaded", function () {
    
    // KONFIGURATION
    const DAYS_TO_WAIT = 14; // 14-Tage Frist (das Popup wird nur alle 14 Tage angezeigt und nur dann, wenn der Nutzer die Angebotsseite noch nie besucht hat)
    const POPUP_SELECTOR = '[data-id="popup_component"]'; // Dein Webflow Attribut
    
    const currentPagePath = window.location.pathname;

    // A) Hat der Nutzer die Angebotsseite bereits besucht? -> Merken!
    if (currentPagePath.includes("/hotel/angebote")) {
        setSmartStorage("SpecialPageVisited", "true", DAYS_TO_WAIT);
    }

    // B) Status abrufen (hat der Nutzer die Angebotsseite bereits besucht? und hat das Popup bereits angezeigt?)
    const specialPageVisited = getSmartStorage("SpecialPageVisited");
    const popupAlreadyShown = getSmartStorage("PopupAlreadyShown");

    // C) Prüfung: Soll Popup angezeigt werden?
    // Bedingung: Der Nutzer ist NICHT auf der Angebotsseite UND das Popup wurde noch NICHT gezeigt UND die Angebotsseite wurde noch nicht besucht
    if (!currentPagePath.includes("/hotel/angebote") && 
        popupAlreadyShown !== "true" && 
        specialPageVisited !== "true") {

        // 5 Sekunden warten
        setTimeout(function () {
            const popup = document.querySelector(POPUP_SELECTOR);
            
            if (popup) {
                // Sichtbar machen (Animation via CSS Transition)
                popup.style.opacity = '0';
                popup.style.display = 'flex';
                
                // Kleiner Trick, damit der Browser den Display-Wechsel registriert vor dem Fade
                requestAnimationFrame(function() {
                    popup.style.transition = 'opacity 800ms ease';
                    popup.style.opacity = '1';
                });

                // Das Popup wurde angezeigt, also merken wir uns das sofort für die Zukunft (21 Tage gültig)
                setSmartStorage("PopupAlreadyShown", "true", DAYS_TO_WAIT);
            }
        }, 5000); 
    }
});