(() => {
    'use strict';

    const form = document.getElementById('ai-chat-form');
    const input = document.getElementById('ai-question');
    const sendButton = document.getElementById('ai-send-button');
    const clearButton = document.getElementById('ai-clear-button');
    const chatLog = document.getElementById('ai-chat-log');
    const characterCount = document.getElementById('ai-character-count');
    const modeBadge = document.getElementById('ai-mode-badge');
    const typingTemplate = document.getElementById('ai-typing-template');
    const apiBase = document.body.dataset.apiBase || 'http://127.0.0.1:8000';

    if (!form || !input || !chatLog) return;

    const welcomeMessage = 'Welcome, challenger. Ask me about the board, liberties, capturing, legal moves, scoring, or your next practice plan.';
    const history = [];
    let backendAvailable = false;
    let isSending = false;

    const lessonRoutes = {
        board: { href: 'chapter1.html', label: 'OPEN CHAPTER 01' },
        liberties: { href: 'chapter2.html#liberty-board', label: 'EXPLORE LIBERTIES' },
        capture: { href: 'chapter2.html#capture-board', label: 'PRACTICE CAPTURING' },
        rules: { href: 'chapter3.html#play-board', label: 'OPEN PRACTICE BOARD' },
        scoring: { href: 'chapter3.html#outcome-title', label: 'READ VICTORY RULES' },
        practice: { href: 'chapter3.html#play-board', label: 'START PRACTICING' }
    };

    const demoAnswers = {
        board: {
            en: 'Go stones are placed on intersections, not inside squares. A standard board has 19 × 19 lines, but a 9 × 9 board is ideal for your first games because every move has an immediate effect.',
            zh: '围棋棋子放在线与线的交叉点上，而不是格子里面。标准棋盘是19路，但初学者更适合先用9路棋盘，因为每一步的影响更容易看清。'
        },
        liberties: {
            en: 'A liberty is an empty intersection directly above, below, left, or right of a stone or connected group. Diagonal points do not count. When a group loses its final liberty, it is captured.',
            zh: '“气”是棋子或相连棋块上、下、左、右相邻的空交叉点，斜线方向不算气。当一块棋失去最后一口气时，它就会被提走。'
        },
        capture: {
            en: 'A stone is captured when every one of its liberties is occupied by the opponent. Before each move, count the target group’s liberties and look for the move that removes the final one.',
            zh: '当一颗棋或一整块棋的所有气都被对方占据时，它就会被提走。落子前先数清目标有几口气，再寻找堵住最后一口气的位置。'
        },
        rules: {
            en: 'A move can be illegal when the point is occupied, when it creates a forbidden self-capture, or when it immediately recreates the previous board position under the ko rule.',
            zh: '不能落子的常见原因有三个：该点已经被占用、落子后形成被禁止的自杀棋，或者违反劫争中不能立即还原上一局面的规则。'
        },
        scoring: {
            en: 'A game usually ends after both players pass. The exact count depends on the rule set, but territory, living stones, captures, and komi determine the adjusted result. The higher score wins.',
            zh: '棋局通常在双方连续停一手后结束。具体计分取决于采用的规则，但领地、存活棋子、提子和贴目会共同决定最终结果，分数更高者获胜。'
        },
        practice: {
            en: 'Start on 9 × 9 and review every game. After each move ask: Which group is weakest? How many liberties does it have? Can one move defend me while pressuring the opponent?',
            zh: '建议从9路棋盘开始，并在每局结束后复盘。每下一步都问自己：哪块棋最弱？它还有几口气？有没有一步棋能同时保护自己并给对手压力？'
        },
        fallback: {
            en: 'I am in local demo mode and could not confidently match that question. Try asking about the board, liberties, capturing, legal moves, scoring, or beginner practice. Connect the backend to let a language model answer open-ended questions.',
            zh: '我现在处于本地演示模式，暂时无法准确理解这个问题。你可以询问棋盘、气、提子、落子规则、胜负计算或初学者练习。连接后端后，大语言模型可以回答更开放的问题。'
        }
    };

    function containsChinese(text) {
        return /[\u3400-\u9fff]/.test(text);
    }

    function detectIntent(text) {
        const normalized = text.toLowerCase();
        const groups = [
            ['liberties', ['liberty', 'liberties', 'breath', '气', '没气']],
            ['capture', ['capture', 'captured', 'surround', 'remove', '吃', '提子', '被吃', '包围']],
            ['scoring', ['score', 'scoring', 'territory', 'win', 'winner', 'komi', '胜负', '计分', '领地', '贴目', '怎么赢']],
            ['rules', ['illegal', 'legal', 'cannot play', "can't play", 'suicide', 'ko', '不能落子', '不合法', '禁入点', '自杀', '劫']],
            ['practice', ['practice', 'improve', 'strategy', 'train', 'opening', 'beginner', '练习', '提高', '策略', '训练', '入门']],
            ['board', ['board', 'intersection', 'star point', 'place a stone', '棋盘', '交叉点', '星位', '落子']]
        ];

        const match = groups.find(([, words]) => words.some(word => normalized.includes(word)));
        return match ? match[0] : 'fallback';
    }

    function createLocalAnswer(question) {
        const language = containsChinese(question) ? 'zh' : 'en';
        const intent = detectIntent(question);
        return {
            reply: demoAnswers[intent][language],
            lesson: lessonRoutes[intent] || null,
            mode: 'demo'
        };
    }

    function setMode(mode) {
        modeBadge.classList.toggle('is-live', mode === 'live');
        modeBadge.classList.toggle('is-demo', mode !== 'live');
        modeBadge.innerHTML = `<i></i> ${mode === 'live' ? 'LIVE AI' : 'LOCAL DEMO'}`;
    }

    function appendMessage(role, text, lesson) {
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
        name.textContent = role === 'assistant' ? 'AI GO TUTOR' : 'YOUR QUESTION';

        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble';

        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        bubble.appendChild(paragraph);

        if (lesson && lesson.href) {
            const link = document.createElement('a');
            link.href = lesson.href;
            link.className = 'ai-message-lesson';
            link.textContent = `${lesson.label || 'OPEN LESSON'} →`;
            bubble.appendChild(link);
        }

        content.append(name, bubble);
        message.append(avatar, content);
        chatLog.appendChild(message);
        chatLog.scrollTop = chatLog.scrollHeight;
        return message;
    }

    function showTyping() {
        const typing = typingTemplate.content.firstElementChild.cloneNode(true);
        chatLog.appendChild(typing);
        chatLog.scrollTop = chatLog.scrollHeight;
        return typing;
    }

    async function requestTutor(question) {
        if (!backendAvailable) return createLocalAnswer(question);

        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 25000);

        try {
            const response = await fetch(`${apiBase}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...history, { role: 'user', content: question }].slice(-10)
                }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error(`Tutor request failed: ${response.status}`);
            const data = await response.json();
            setMode(data.mode === 'live' ? 'live' : 'demo');
            return {
                reply: data.reply,
                lesson: data.lesson || null,
                mode: data.mode || 'demo'
            };
        } catch (error) {
            backendAvailable = false;
            setMode('demo');
            return createLocalAnswer(question);
        } finally {
            window.clearTimeout(timer);
        }
    }

    async function sendQuestion(question) {
        if (isSending) return;
        isSending = true;
        sendButton.disabled = true;
        input.disabled = true;

        appendMessage('user', question);
        const typing = showTyping();

        const answer = await requestTutor(question);
        await new Promise(resolve => window.setTimeout(resolve, 280));
        typing.remove();
        appendMessage('assistant', answer.reply, answer.lesson);

        history.push(
            { role: 'user', content: question },
            { role: 'assistant', content: answer.reply }
        );

        if (history.length > 12) history.splice(0, history.length - 12);

        isSending = false;
        sendButton.disabled = false;
        input.disabled = false;
        input.focus();
    }

    function resetChat() {
        history.length = 0;
        chatLog.innerHTML = '';
        appendMessage('assistant', welcomeMessage);
        input.value = '';
        characterCount.textContent = '0';
        input.focus();
    }

    async function checkBackend() {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 1400);

        try {
            const response = await fetch(`${apiBase}/api/health`, { signal: controller.signal });
            if (!response.ok) throw new Error('Backend unavailable');
            const data = await response.json();
            backendAvailable = true;
            setMode(data.mode === 'live' ? 'live' : 'demo');
        } catch (error) {
            backendAvailable = false;
            setMode('demo');
        } finally {
            window.clearTimeout(timer);
        }
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question || isSending) return;
        input.value = '';
        characterCount.textContent = '0';
        sendQuestion(question);
    });

    input.addEventListener('input', () => {
        characterCount.textContent = String(input.value.length);
    });

    input.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            form.requestSubmit();
        }
    });

    clearButton.addEventListener('click', resetChat);

    document.querySelectorAll('[data-ai-prompt]').forEach(button => {
        button.addEventListener('click', () => {
            if (isSending) return;
            input.value = button.dataset.aiPrompt;
            characterCount.textContent = String(input.value.length);
            form.requestSubmit();
        });
    });

    checkBackend();
})();
