// Function, mit der bei den Preisen, die aus dem Webflow CMS importiert werden, ein Punkt als Tausender-Trennzeichen eingefügt wird
document.addEventListener("DOMContentLoaded", function () {
   function RoomPriceConverter(selector) {
      let number = $(selector).text();
      let decimals = 0; // Anzahl der gewünschten Nachkommastellen
      let decpoint = ","; // Trennzeichen für Nachkommastellen
      let thousand = "."; // Trennzeichen für Tausenderzahlen

      let n = Math.abs(number).toFixed(decimals).split(".");
      n[0] = n[0]
         .split("")
         .reverse()
         .map((c, i, a) => (i > 0 && i < a.length && i % 3 == 0 ? c + thousand : c))
         .reverse()
         .join("");
      let final = (Math.sign(number) < 0 ? "-" : "") + n.join(decpoint);
      $(selector).text(final);
   }

   // Bei den Zimmerpreisen wird ein Punkt als Tausender-Trennzeichen eingefügt (unsere Custom Function "RoomPriceConverter()" haben wir in unserer "script.js" hinterlegt):
   let roomPriceElements = document.querySelectorAll(".room-price");
   roomPriceElements.forEach(function (element) {
      RoomPriceConverter(element);
   });
});