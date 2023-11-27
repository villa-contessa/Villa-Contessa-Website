// Für die Custom Radio Buttons auf dieser Seite:

document.addEventListener("DOMContentLoaded", function () {
   $(".placeholder-text").text("Bitte wählen Sie");

   var radioButtons_Nights = document.querySelectorAll(".custom-radio-button.group1");
   var radioButtons_Season = document.querySelectorAll(".custom-radio-button.group2");
   var selectField_Nights = document.getElementById("option-set-c085c45f0dc9fd04675a15f2315d12a5");
   var selectField_Saison = document.getElementById("option-set-377b8b8db2bd6e32205ce1863c61919c");
   var InfosWinterSaison = $('[shop-selected-saison="winter"]');
   var InfosSommerSaison = $('[shop-selected-saison="sommer"]');
   var AnzahlNaechteElement = document.querySelector('[villa-custom-attribute="gutschein-number-of-nights"]');

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
         setSelectValue(selectField_Nights, this.innerText);
         
         // Die Auswahl der Anzahl Nächte wird in die Preisanzeige dynamisch übertragen:
         if (AnzahlNaechteElement) {
            AnzahlNaechteElement.innerText = this.innerText;
         }
      });
   });

   // Für die Radio-Button-Group 2 (Saison)
   radioButtons_Season.forEach(function (button) {
      button.addEventListener("click", function () {
         radioButtons_Season.forEach(function (btn) {
            btn.classList.remove("selected");
         });
         this.classList.add("selected");
         setSelectValue(selectField_Saison, this.innerText);

         var selectedSeason = this.innerText;
         var fadeInElement = selectedSeason === "Winter" ? InfosWinterSaison : InfosSommerSaison;
         var fadeOutElement = selectedSeason === "Winter" ? InfosSommerSaison : InfosWinterSaison;

         fadeOutElement.fadeOut(350, function () {
            fadeInElement.fadeIn(350);
         });
      });
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
