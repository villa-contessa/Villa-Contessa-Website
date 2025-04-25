$(document).ready(function() {   
    // Beim Hovern des Quote- und Testimonials-Sliders wird der Slider nicht mehr automatisch gestoppt
    setTimeout(function () {
        $('.quotes-slider, .testimonials_slider').unbind('mouseenter mouseleave touchstart');
    });
});
