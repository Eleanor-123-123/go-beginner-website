(() => {
    'use strict';

    const body = document.body;
    const stage = document.getElementById('legacy-stage');
    const cards = [...document.querySelectorAll('[data-legacy-card]')];
    const status = document.getElementById('legacy-status');
    const burst = document.getElementById('legacy-burst');
    const skipButton = document.getElementById('legacy-skip');
    const replayButton = document.getElementById('legacy-replay');
    const skipLink = document.querySelector('.skip-link');
    const finalMessage = document.getElementById('legacy-final-message');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!stage || cards.length === 0 || !status || !burst || !finalMessage) return;

    const phaseClasses = [
        'phase-opening', 'phase-cards', 'phase-gather', 'phase-stone',
        'phase-burst', 'phase-gate', 'phase-final'
    ];
    const timers = [];
    let runId = 0;

    const cardAnnouncements = [
        'Ancient beginnings: the first records of Go.',
        'The eighteenth century: the Ten Games at Danghu.',
        '1846: the Ear-Reddening Game.',
        '1933: the Shin-Fuseki challenge.',
        '2016: Move 37 opens a new era.'
    ];

    function schedule(callback, delay, id) {
        const timer = window.setTimeout(() => {
            if (id === runId) callback();
        }, delay);
        timers.push(timer);
    }

    function clearTimeline() {
        timers.splice(0).forEach(timer => window.clearTimeout(timer));
    }

    function setPhase(phase) {
        phaseClasses.forEach(className => body.classList.remove(className));
        body.classList.add(phase);
    }

    function createBurstPieces() {
        if (burst.children.length) return;

        const fragment = document.createDocumentFragment();
        const pieceTypes = ['stone-black', 'stone-white', 'gold-line', 'paper', 'gold-line', 'stone-black'];
        const reach = Math.max(window.innerWidth, window.innerHeight);

        for (let index = 0; index < 58; index += 1) {
            const piece = document.createElement('i');
            const angle = ((Math.PI * 2) / 58) * index + ((index % 4) - 1.5) * 0.035;
            const distance = reach * (0.24 + (index % 9) * 0.025);
            const lift = index % 2 === 0 ? -18 : 18;
            piece.className = `legacy-particle legacy-particle--${pieceTypes[index % pieceTypes.length]}`;
            piece.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            piece.style.setProperty('--ty', `${Math.sin(angle) * distance + lift}px`);
            piece.style.setProperty('--turn', `${(index % 2 ? 1 : -1) * (180 + (index % 7) * 55)}deg`);
            piece.style.setProperty('--delay', `${(index % 8) * 0.018}s`);
            fragment.appendChild(piece);
        }

        burst.appendChild(fragment);
    }

    function resetCards() {
        cards.forEach(card => card.classList.remove('is-active', 'is-archived', 'is-gathering'));
    }

    function showCard(index) {
        setPhase('phase-cards');
        cards.forEach((card, cardIndex) => {
            card.classList.toggle('is-active', cardIndex === index);
            card.classList.toggle('is-archived', cardIndex < index);
            card.classList.remove('is-gathering');
        });
        status.textContent = cardAnnouncements[index];
    }

    function gatherGames() {
        setPhase('phase-gather');
        cards.forEach(card => {
            card.classList.remove('is-active', 'is-archived');
            card.classList.add('is-gathering');
        });
        status.textContent = 'Every game becomes part of the next.';
    }

    function formStone() {
        setPhase('phase-stone');
        status.textContent = 'A thousand years gather into a single stone.';
    }

    function burstOpen() {
        setPhase('phase-burst');
        status.textContent = 'The stone breaks open the next path.';
    }

    function openGate() {
        setPhase('phase-gate');
        status.textContent = 'The gate to the world of Go is opening.';
    }

    function showFinal(options = {}) {
        clearTimeline();
        runId += 1;
        setPhase('phase-final');
        resetCards();
        finalMessage.setAttribute('aria-hidden', 'false');
        status.textContent = 'The gate to the world of Go is now open.';
        skipButton?.classList.add('is-hidden');

        if (options.focus) {
            const heading = finalMessage.querySelector('h2');
            heading?.setAttribute('tabindex', '-1');
            heading?.focus({ preventScroll: true });
        }
    }

    function startTimeline() {
        clearTimeline();
        runId += 1;
        const id = runId;

        resetCards();
        setPhase('phase-opening');
        finalMessage.setAttribute('aria-hidden', 'true');
        skipButton?.classList.remove('is-hidden');
        status.textContent = 'The history of Go begins to unfold.';

        if (reduceMotion) {
            schedule(() => showFinal(), 120, id);
            return;
        }

        schedule(() => showCard(0), 1250, id);
        schedule(() => showCard(1), 2450, id);
        schedule(() => showCard(2), 3650, id);
        schedule(() => showCard(3), 4850, id);
        schedule(() => showCard(4), 6050, id);
        schedule(gatherGames, 7400, id);
        schedule(formStone, 8350, id);
        schedule(burstOpen, 9250, id);
        schedule(openGate, 10100, id);
        schedule(() => showFinal(), 10950, id);
    }

    function replay() {
        startTimeline();
    }

    createBurstPieces();
    skipButton?.addEventListener('click', () => showFinal({ focus: true }));
    replayButton?.addEventListener('click', replay);

    skipLink?.addEventListener('click', event => {
        event.preventDefault();
        showFinal({ focus: true });
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !body.classList.contains('phase-final')) {
            showFinal({ focus: true });
        }
    });

    startTimeline();
})();
