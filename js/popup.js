  // Adds overflow hidden to the body prevent page scrolling when popup is open
  $('[data-vc-id="popup-button"]').on('click', function() {
    $('body').addClass('overflow-hidden');
  });

  // Removes overflow hidden from body if popup is closed
  $('[data-vc-id="popup-close"], [data-vc-id="popup-background"]').on('click', function() {
    $('body').removeClass('overflow-hidden');
  });