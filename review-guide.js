(() => {
    'use strict';

    const chatLog = document.getElementById('review-chat-log');
    const resetButton = document.getElementById('review-reset-button');
    const topicButtons = [...document.querySelectorAll('[data-review-topic]')];

    if (!chatLog || !resetButton || topicButtons.length === 0) return;

    const welcomeMessage = 'Which part of your journey is still unclear? Choose one topic below. I will give you a quick reminder and point you back to the right lesson.';

    const topics = {
        board: {
            question: 'I am still unsure about the board and where stones are placed.',
            answer: 'Stones are placed on the intersections where lines cross—not inside the squares. Chapter 01 also introduces the 19 × 19 board, beginner-friendly 9 × 9 boards, and star points.',
            href: 'chapter1.html#diagram-board',
            label: 'REVIEW BOARD BASICS'
        },
        liberties: {
            question: 'I do not fully understand liberties yet.',
            answer: 'A liberty is an empty intersection directly above, below, left, or right of a stone or connected group. Diagonal points do not count. Chapter 02 lets you place a stone and see its liberties highlighted.',
            href: 'chapter2.html#liberty-heading',
            label: 'REVIEW LIBERTIES'
        },
        capturing: {
            question: 'I am confused about how capturing works.',
            answer: 'A stone or connected group is captured when its final liberty is filled by the opponent. The capture demonstration in Chapter 02 shows the surrounding moves one step at a time.',
            href: 'chapter2.html#capture-heading',
            label: 'REVIEW CAPTURING'
        },
        practice: {
            question: 'I know the ideas, but I am not sure how to practise.',
            answer: 'Use the 9 × 9 practice board and pause before every move. Ask which group has the fewest liberties, whether a stone needs help, and whether your move also pressures the opponent.',
            href: 'chapter3.html#play-board',
            label: 'OPEN PRACTICE BOARD'
        },
        outcome: {
            question: 'I do not understand how the game is won or lost.',
            answer: 'The practice game ends when both sides are finished. The beginner rule panel explains territory, captures, passing, and how the higher final result wins.',
            href: 'chapter3.html#outcome-title',
            label: 'REVIEW WINNING RULES'
        },
        everything: {
            question: 'I want to start again and review everything in order.',
            answer: 'That is a strong choice. Begin with the board and stones in Chapter 01, continue to liberties and capturing in Chapter 02, and then test the ideas on the Chapter 03 practice board.',
            href: 'chapter1.html',
            label: 'START FROM CHAPTER 01'
        }
    };

    function createMessage(role, text, destination) {
        const message = document.createElement('article');
        message.className = `ai-message ai-message--${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = role === 'assistant' ? '●' : 'YOU';

        const content = document.createElement('div');
        content.className = 'ai-message-content';

        const name = document.createElement('span');
        name.className = 'ai-message-name';
        name.textContent = role === 'assistant' ? 'GO REVIEW GUIDE' : 'YOUR CHOICE';

        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble';

        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        bubble.appendChild(paragraph);

        if (destination) {
            const link = document.createElement('a');
            link.className = 'ai-message-lesson';
            link.href = destination.href;
            link.textContent = `${destination.label} →`;
            bubble.appendChild(link);
        }

        content.append(name, bubble);
        message.append(avatar, content);
        chatLog.appendChild(message);
        chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: 'smooth' });
    }

    function selectTopic(topicKey, selectedButton) {
        const topic = topics[topicKey];
        if (!topic) return;

        topicButtons.forEach(button => {
            button.classList.toggle('is-selected', button === selectedButton);
            button.setAttribute('aria-pressed', String(button === selectedButton));
        });

        createMessage('user', topic.question);
        window.setTimeout(() => createMessage('assistant', topic.answer, topic), 240);
    }

    function resetReview() {
        chatLog.innerHTML = '';
        topicButtons.forEach(button => {
            button.classList.remove('is-selected');
            button.setAttribute('aria-pressed', 'false');
        });
        createMessage('assistant', welcomeMessage);
        topicButtons[0].focus();
    }

    topicButtons.forEach(button => {
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => selectTopic(button.dataset.reviewTopic, button));
    });

    resetButton.addEventListener('click', resetReview);
})();
