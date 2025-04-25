$(document).ready(function() {   
    // Beim Hovern des Quote Sliders wird der Slider nicht mehr automatisch gestoppt
    setTimeout(function () {
     $('.quotes-slider').unbind('mouseenter mouseleave touchstart');
   })
}); 