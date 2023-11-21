tippy(".tooltip", {
    content(reference) {
        const id = reference.getAttribute('aria-describedby');
        const tooltipElement = document.querySelector(`[tooltip-content="${id}"]`);
        return tooltipElement ? tooltipElement.innerHTML : '';
    },
   animation: "scale",
   duration: 200,
   arrow: true,
   delay: [0, 50],
   arrowType: "sharp",
   theme: "light",   
   allowHTML: true,
   interactive: true, 
    onShow(instance) {
        // Event-Listener für Links innerhalb des Tooltips hinzufügen
        const links = instance.popper.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                instance.hide();
            });
        });
    },
    onHidden(instance) {
        // Event-Listener von Links entfernen, um Memory Leaks zu vermeiden
        const links = instance.popper.querySelectorAll('a');
        links.forEach(link => {
            link.removeEventListener('click', () => {
                instance.hide();
            });
        });
    },
    // Max-Width des Popups setzen, abhängig von der Screen-Width
    popperOptions: {
        modifiers: [
            {
                name: 'setMaxWidth',
                enabled: true,
                phase: 'beforeWrite',
                requires: ['computeStyles'],
                fn({ state }) {
                    if (window.innerWidth < 500) {
                        state.styles.popper.maxWidth = '335px';
                    } else {
                        state.styles.popper.maxWidth = '500px';
                    }
                }
            },
            {
                name: 'preventOverflow',
                options: {
                    padding: { 
                        top: 25,
                        bottom: 25,
                        left: 25,
                        right: 25 
                    }
                }
            }
        ]
    }
});