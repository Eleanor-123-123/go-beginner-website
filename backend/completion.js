(() => {
    'use strict';

    const confettiLayer = document.getElementById('completion-confetti');
    const firstLine = document.getElementById('completion-first');
    const secondLine = document.getElementById('completion-second');
    const choices = document.getElementById('completion-choice');
    const skipButton = document.getElementById('completion-skip');

    if (!confettiLayer || !firstLine || !secondLine || !choices || !skipButton) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colors = ['#cfa12c', '#f2d77e', '#ffffff', '#111113'];
    const shapes = ['square', 'strip', 'circle'];
    const timers = [];

    function buildConfetti() {
        const fragment = document.createDocumentFragment();
        const pieceCount = reduceMotion ? 0 : 86;

        for (let index = 0; index < pieceCount; index += 1) {
            const piece = document.createElement('i');
            const duration = 4.2 + Math.random() * 3.8;
            const delay = Math.random() * 2.1;
            const drift = -120 + Math.random() * 240;
            const rotation = 360 + Math.random() * 900;

            piece.className = `completion-confetti-piece is-${shapes[index % shapes.length]}`;
            piece.style.setProperty('--confetti-x', `${Math.random() * 100}%`);
            piece.style.setProperty('--confetti-delay', `${delay}s`);
            piece.style.setProperty('--confetti-duration', `${duration}s`);
            piece.style.setProperty('--confetti-drift', `${drift}px`);
            piece.style.setProperty('--confetti-rotation', `${rotation}deg`);
            piece.style.setProperty('--confetti-color', colors[index % colors.length]);
            fragment.appendChild(piece);
        }

        confettiLayer.appendChild(fragment);
    }

    function revealAll() {
        timers.forEach(timer => window.clearTimeout(timer));
        firstLine.classList.add('is-visible');
        secondLine.classList.add('is-visible');
        choices.classList.add('is-visible');
        skipButton.classList.add('is-hidden');
    }

    function startSequence() {
        buildConfetti();

        if (reduceMotion) {
            revealAll();
            return;
        }

        timers.push(window.setTimeout(() => firstLine.classList.add('is-visible'), 520));
        timers.push(window.setTimeout(() => secondLine.classList.add('is-visible'), 2150));
        timers.push(window.setTimeout(() => choices.classList.add('is-visible'), 4300));
        timers.push(window.setTimeout(() => skipButton.classList.add('is-hidden'), 4700));
    }

    skipButton.addEventListener('click', revealAll);
    startSequence();
})();

