// Für die Custom Radio Buttons auf dieser Seite:

document.addEventListener("DOMContentLoaded", function () {
   var radioButtons_Nights = document.querySelectorAll(".custom-radio-button.group1");
   var radioButtons_Season = document.querySelectorAll(".custom-radio-button.group2");
   var selectField_Category = document.getElementById("option-set-df94d7e3772905b4d2d31f8d798ed2f8");
   var selectField_Nights = document.getElementById("option-set-c085c45f0dc9fd04675a15f2315d12a5");
   var selectField_Saison = document.getElementById("option-set-377b8b8db2bd6e32205ce1863c61919c");
   var InfosWinterSaison = $('[shop-selected-saison="winter"]');
   var InfosSommerSaison = $('[shop-selected-saison="sommer"]');
   var AnzahlNaechteElement = document.querySelector('[villa-custom-attribute="gutschein-number-of-nights"]');
   var preisAnzeige = $('[villa-custom-attribute="gutschein-preisanzeige"]');
   var isAnimating = false; // Variable zum Überwachen des Animationsstatus
   var InfosZimmerkategorie = document.querySelectorAll("[data-roomcategory]");
   var validationMessage_Category = $('[villa-custom-attribute="gutschein-validation-message-zimmerkategorie"]');
   var validationMessage_Nights = $('[villa-custom-attribute="gutschein-validation-message-nights"]');
   var validationMessage_Saison = $('[villa-custom-attribute="gutschein-validation-message-saison"]');
   var submitButton = document.querySelector('input[type="submit"]');

   selectField_Category.addEventListener("change", function () {
      // Eventuell eingeblendete Validation-Message wird wieder ausgeblendet, sobald eine Zimmerkategorie  ausgewählt wurde:
      validationMessage_Category.slideUp(430);
      // Infos für die gewählte Zimmerkategorie werden eingeblendet:
      var selectedCategory = selectField_Category.options[selectField_Category.selectedIndex].innerText;
      // Alle Zimmerinfos der zuvor gewählten Zimmerkategorie werden zunächst ausgeblendet:
      InfosZimmerkategorie.forEach(function (item) {
         item.style.display = "none";
      });
      // Jetzt werden die Infos für die gewählte Zimmerkategorie eingeblendet:
      var categoryToShow = document.querySelectorAll(`[data-roomcategory='${selectedCategory}']`);
      categoryToShow.forEach(function (item) {
         item.style.display = "block";
      });
   });

   // Wenn ein Button aus der Option-List geklickt wird, dann wird der Wert des Buttons in den auf "hide" gesetzten Select Lists (Anzahl Nächte + Saison) gesetzt
   function setSelectValue(selectElement, value) {
      var options = selectElement.options;
      for (var i = 0; i < options.length; i++) {
         if (options[i].text === value) {
            selectElement.selectedIndex = i;
            selectElement.dispatchEvent(new Event("change"));
            break;
         }
      }
   }

   // Für die Radio-Button-Group 1 (Anzahl Nächte)
   radioButtons_Nights.forEach(function (button) {
      button.addEventListener("click", function () {
         radioButtons_Nights.forEach(function (btn) {
            btn.classList.remove("selected");
         });
         this.classList.add("selected");
         // Der ausgewählte Wert wird an das Webflow Select Field (Product Options) für die Anzahl Nächte übertragen:
         setSelectValue(selectField_Nights, this.innerText);

         // Eventuell eingeblendete Validation-Message wird wieder ausgeblendet, sobald die Anzahl Nächte ausgewählt wurde:
         validationMessage_Nights.slideUp(430);

         // Die Auswahl der Anzahl Nächte wird in die Preisanzeige dynamisch übertragen:
         if (AnzahlNaechteElement) {
            AnzahlNaechteElement.innerText = this.innerText;
         }
      });
   });

   // Für die Radio-Button-Group 2 (Saison)
   radioButtons_Season.forEach(function (button) {
      button.addEventListener("click", function () {
         if (isAnimating) return; // Ignoriere Klicks, wenn eine Animation läuft

         radioButtons_Season.forEach(function (btn) {
            btn.classList.remove("selected");
         });
         this.classList.add("selected");
         // Der ausgewählte Wert wird an das Webflow Select Field (Product Options) für die Saison übertragen:
         setSelectValue(selectField_Saison, this.innerText);

         // Eventuell eingeblendete Validation-Message wird wieder ausgeblendet, sobald eine Saison ausgewählt wurde:
         validationMessage_Saison.slideUp(430);

         // Infos zu den Saison-Zeiten werden eingeblendet:
         var selectedSeason = this.innerText;
         var fadeInElement = selectedSeason === "Winter" ? InfosWinterSaison : InfosSommerSaison;
         var fadeOutElement = selectedSeason === "Winter" ? InfosSommerSaison : InfosWinterSaison;

         isAnimating = true; // Setze den Animationsstatus auf "läuft"

         fadeOutElement.fadeOut(350, function () {
            fadeInElement.fadeIn(350, function () {
               isAnimating = false; // Setze den Animationsstatus zurück, wenn die Animation beendet ist
            });
         });
      });
   });
   // Preis für den Hotelgutschein wird erst eingeblendet und Add-to-Cart-Button wird erst freigeschaltet, wenn alle erforderlichen Optionen ausgewählt wurden (Zimmerkategorie + Anzahl Nächte + Saison)
   // Wenn nicht alle erforderlichen Select Optionen gewählt wurden, dann wird die entsprechende Validierungsnachricht angezeigt
   function checkAllSelects() {
      let allSelected = true;

      // Zimmerkategorie
      if (!selectField_Category.value) {
         validationMessage_Category.slideDown(430);
         allSelected = false;
      } else {
         validationMessage_Category.hide();
      }

      // Anzahl Nächte
      if (!selectField_Nights.value) {
         validationMessage_Nights.slideDown(430);
         allSelected = false;
      } else {
         validationMessage_Nights.hide();
      }

      // Saison
      if (!selectField_Saison.value) {
         validationMessage_Saison.slideDown(430);
         allSelected = false;
      } else {
         validationMessage_Saison.hide();
      }

      return allSelected;
   }

   // Event-Listener für den Klick auf den Warenkorb-Button
   submitButton.addEventListener("click", function (e) {
      if (!checkAllSelects()) {
         e.preventDefault(); // Verhindern, dass das Formular abgesendet wird
         preisAnzeige.fadeOut(350);
      } else {
         preisAnzeige.fadeIn(350);
      }
   });
});

// Der gewünschte Placeholder-Text für das Zimmerkategorie-Dropdown wird gesetzt:

$(window).on("load", function () {
   // Ändern des Placeholder-Texts nach dem Laden der Seite
   $(".placeholder-text").text("Bitte wählen Sie!").css("color", "#777061");

   // Event-Handler für das Klicken auf ein Option-Element
   $(".dropdown-link").click(function () {
      var selectedText = $(this).text();
      $(".placeholder-text").text(selectedText);
   });
});
