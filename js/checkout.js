// Floating Form Labels:
window.CodeCrumbs.FloatLabels({
   inputSelector: ".input",
   labelActiveClass: "active",
});

document.addEventListener("DOMContentLoaded", function () {
   // Beim Select Field für das Land wird "Germany" zu "Deutschland" übersetzt:
   var selectCountry = document.querySelector('select[name="address_country"]');

   if (selectCountry) {
      selectCountry.querySelectorAll("option").forEach(function (option) {
         if (option.value === "DE" && option.textContent === "Germany") {
            option.textContent = "Deutschland";
         }
      });
   }
   // Wenn ein Input Field beim Laden der Seite schon einen Wert enthält
   // (z.B. weil der User auf diese Seite zurückkehrt und beim vorherigen Besuch schon Eingaben gemacht hat),
   // dann werden die Floating Form Labels für das entsprechende Input Field richtig positioniert (damit sie den Wert des Input Fields nicht verdecken)
   setTimeout(function () {
      var textInputs = document.querySelectorAll('input[type="text"].input');

      textInputs.forEach(function (input) {
         var label = input.closest(".input-container").querySelector(".input-label");
         if (input.value && label) {
            label.classList.add("active");
         }
      });
   }, 700);
});
