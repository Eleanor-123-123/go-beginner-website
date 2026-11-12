(() => {
    'use strict';

    const intro = document.getElementById('site-intro');
    const skipButton = document.getElementById('site-intro-skip');

    if (!intro || !skipButton) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let hasClosed = false;
    let closeTimer;

    function closeIntro() {
        if (hasClosed) return;

        hasClosed = true;
        window.clearTimeout(closeTimer);
        window.removeEventListener('keydown', onKeydown);
        intro.classList.add('is-leaving');
        intro.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('site-intro-active');

        window.setTimeout(() => {
            intro.hidden = true;
            document.documentElement.classList.remove('intro-js');
            document.documentElement.classList.add('site-intro-complete');
        }, reduceMotion ? 0 : 700);
    }

    document.body.classList.add('site-intro-active');
    window.requestAnimationFrame(() => intro.classList.add('is-playing'));

    closeTimer = window.setTimeout(closeIntro, reduceMotion ? 900 : 4600);
    skipButton.addEventListener('click', closeIntro);

    function onKeydown(event) {
        if (event.key === 'Escape') closeIntro();
    }

    window.addEventListener('keydown', onKeydown);
})();
