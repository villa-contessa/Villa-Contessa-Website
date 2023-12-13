// Für die Custom Radio Buttons auf dieser Seite:

document.addEventListener("DOMContentLoaded", function () {
   var radioButtons_Nights = document.querySelectorAll(".custom-radio-button.group1");
   var radioButtons_Season = document.querySelectorAll(".custom-radio-button.group2");
   var selectField_Category = document.getElementById("option-set-df94d7e3772905b4d2d31f8d798ed2f8");
   var selectField_Nights = document.getElementById("option-set-c085c45f0dc9fd04675a15f2315d12a5");
   var selectField_Saison = document.getElementById("option-set-377b8b8db2bd6e32205ce1863c61919c");
   var AnzahlNaechteElement = document.querySelector('[villa-custom-attribute="gutschein-number-of-nights"]');
   var preisAnzeige = $('[villa-custom-attribute="gutschein-preisanzeige"]');
   var isAnimating = false; // Variable zum Überwachen des Animationsstatus
   var InfosZimmerkategorie = document.querySelectorAll("[data-roomcategory]");
   var validationMessage_Category = $('[villa-custom-attribute="gutschein-validation-message-zimmerkategorie"]');
   var validationMessage_Nights = $('[villa-custom-attribute="gutschein-validation-message-nights"]');
   var validationMessage_Saison = $('[villa-custom-attribute="gutschein-validation-message-saison"]');
   var selectField_RoomCategory_InfosSection = document.querySelector('[data-vc-shop-element="select-roomcategory-section-zimmerinfos"]');
   var submitButton = document.querySelector('input[type="submit"]');

   selectField_Category.addEventListener("change", function () {
      // Eventuell eingeblendete Validation-Message wird wieder ausgeblendet, sobald eine Zimmerkategorie  ausgewählt wurde:
      validationMessage_Category.slideUp(430);
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

      // Überträgt die ausgewählte Zimmerkategorie auch im Select-Field in der Section "Informationen Zimmerkategorie":
      if (selectField_RoomCategory_InfosSection) {
         selectField_RoomCategory_InfosSection.value = selectedCategory;
         selectField_RoomCategory_InfosSection.dispatchEvent(new Event("change"));
      }
   });

   // Wird über das Select Field in der Section "Informationen Zimmerkategorie" eine Zimmerkategorie ausgewählt,
   // dann werden die Infos für diese Zimmerkategorie eingeblendet:
   selectField_RoomCategory_InfosSection.addEventListener("change", function () {
      var selectedCategory = selectField_RoomCategory_InfosSection.options[selectField_RoomCategory_InfosSection.selectedIndex].innerText;
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
      });
   });

   // Der Preis für den Gutschein wird erst angezeit, wenn alle erforderlichen Optionen ausgewählt wurden (Zimmerkategorie + Anzahl Nächte + Saison)
   [selectField_Category, selectField_Nights, selectField_Saison].forEach((field) => {
      field.addEventListener("change", function () {
         if (selectField_Category.value && selectField_Nights.value && selectField_Saison.value) {
            preisAnzeige.fadeIn(350);
         } else {
            preisAnzeige.fadeOut(350);
         }
      });
   });

   // Der Add-to-Cart-Button wird erst freigeschaltet, wenn alle erforderlichen Optionen ausgewählt wurden (Zimmerkategorie + Anzahl Nächte + Saison)
   // Wenn nicht alle erforderlichen Select Optionen gewählt wurden, dann wird die entsprechende Validierungsnachricht angezeigt
   submitButton.addEventListener("click", function (e) {
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

      if (!allSelected) {
         e.preventDefault(); // Verhindern, dass das Formular abgesendet wird
         preisAnzeige.fadeOut(350);
      } else {
         preisAnzeige.fadeIn(350);
      }
   });

   // Der gewünschte Placeholder-Text für das Zimmerkategorie-Dropdown wird gesetzt:
   var selectElement_Roomcategory_AddToCart = document.getElementById("option-set-df94d7e3772905b4d2d31f8d798ed2f8");
   var selectElement_Roomcategory_RoomInfos = document.getElementById("select-field_roomcategory_roominfos");
   var custom_placeholder_Roomcategory_AddToCart = $('[data-vc-shop-element="placeholder_roomcategory_addtocart"]');

   function updatePlaceholderText() {
      var screenWidth = window.innerWidth;
      var Placeholder_Roomcategory_AddToCart = selectElement_Roomcategory_AddToCart.options[0];
      var Placeholder_Roomcategory_RoomInfos = selectElement_Roomcategory_RoomInfos.options[0];

      if (screenWidth >= 500) {
         // Placeholder-Text für größere Screens:
         Placeholder_Roomcategory_AddToCart.textContent = "Bitte wählen Sie eine Zimmerkategorie!";
         Placeholder_Roomcategory_RoomInfos.textContent = "Bitte wählen Sie eine Zimmerkategorie!";
      } else {
         // Placeholder-Text für kleine Screens:
         Placeholder_Roomcategory_AddToCart.textContent = "Bitte wählen Sie!";
         Placeholder_Roomcategory_RoomInfos.textContent = "Bitte wählen Sie!";
      }
   }

   // Setzen des Placeholder-Texts nach dem Laden der Seite:
   updatePlaceholderText();
   $(custom_placeholder_Roomcategory_AddToCart).css("color", "#777061").fadeIn(800);
});

$(window).on("load", function () {
   // Event-Handler für das Klicken auf ein Option-Element
   $('[data-vc-shop-element="zimmerkategorie-dropdown-link"]').click(function () {
      var selectedText = $(this).text();
      $(".placeholder-text").text(selectedText);
   });
});