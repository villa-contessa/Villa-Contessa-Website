document.addEventListener("DOMContentLoaded", function () {
   var lightboxLinks = document.querySelectorAll(".lightbox-link");

   // Für die Nutzung von Fancybox, um alle Fotos einer Zimmerkategorie innerhalb einer Fancybox verfügbar zu machen (Fancybox Gallery)
   lightboxLinks.forEach(function (link) {
      // Die Zimmerkategorie wird aus dem Attribut des Collection List Items ausgelesen:
      var roomCategoryElement = link.closest("[data-roomcategory]");
      var roomCategory = roomCategoryElement.getAttribute("data-roomcategory");

      // Das 'data-lightbox'-Attribut wird für Lightbox-Link innerhalb eines Collection List Items hinzugefügt:
      var imgSrc = link.querySelector("img").getAttribute("src");
      link.setAttribute("data-fancybox", roomCategory);
      link.setAttribute("href", imgSrc);
      link.setAttribute("data-thumb", imgSrc);
      link.setAttribute("data-src", imgSrc);
   });

   // Konfiguration von Fancybox:
   Fancybox.bind(".lightbox-link", {
      defaultDisplay: "flex",
      backdropClick: "close",
      dragToClose: false,
      Toolbar: {
         display: {
            left: [],
            middle: [],
            right: ["close"],
         },
      },
      contentClick: false,
      closeButton: false,
      idle: false,
      Thumbs: {
         type: "classic",
      },
      wheel: false,
      on: {
         load: function (fancybox, slide) {
            document.body.classList.add("hidden");
         },
         destroy: function (fancybox, slide) {
            document.body.classList.remove("hidden");
         },
      },
   });

   // Beim Klick auf einen Fotogalerie-Link wird die Lightbox / Fancybox ebenfalls geöffnet:
   var galleryLinks = document.querySelectorAll(".photo-gallery-link");

   galleryLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
         e.preventDefault();
         var zimmerPhotos = this.closest(".zimmer-photos");
         var nearestLightboxLink = zimmerPhotos.querySelector(".lightbox-link");
         if (nearestLightboxLink) {
            nearestLightboxLink.click();
         }
      });
   });
});
