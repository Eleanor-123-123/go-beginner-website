
/* ==========================================
   GO BEGINNER - Multi-page Cyber-Zen JS
========================================== */


/* ==========================================
   1. BASIC BOARD FUNCTIONS
========================================== */

function createEmptyBoard(size) {
    return Array.from(
        { length: size },
        () => Array(size).fill(null)
    );
}


function cloneBoard(board) {
    return board.map(row => [...row]);
}


function boardToString(board) {
    return JSON.stringify(board);
}


function getNeighbors(row, col, size) {
    const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    return directions
        .map(([dr, dc]) => [row + dr, col + dc])
        .filter(([r, c]) =>
            r >= 0 &&
            r < size &&
            c >= 0 &&
            c < size
        );
}


/* ==========================================
   2. BOARD RENDERING
========================================== */

function renderBoard(
    container,
    board,
    onPointClick,
    options = {}
) {
    const size = board.length;

    container.innerHTML = "";

    container.style.gridTemplateColumns =
        `repeat(${size}, minmax(0, 1fr))`;

    container.style.gridTemplateRows =
        `repeat(${size}, minmax(0, 1fr))`;

    const starPoints = size === 19
        ? [3, 9, 15]
        : size === 9
            ? [2, 4, 6]
            : [];

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {

            const point = document.createElement("button");

            point.type = "button";
            point.className = "board-point";

            point.dataset.row = row;
            point.dataset.col = col;

            // Draw star points.
            if (
                starPoints.includes(row) &&
                starPoints.includes(col)
            ) {
                const star = document.createElement("span");

                Object.assign(star.style, {
                    position: "absolute",
                    width: size === 19 ? "24%" : "20%",
                    height: size === 19 ? "24%" : "20%",
                    background: "#59432a",
                    borderRadius: "50%",
                    zIndex: "2",
                    pointerEvents: "none"
                });

                point.appendChild(star);
            }

            // Draw stones.
            const stone = board[row][col];

            if (stone) {
                const stoneElement =
                    document.createElement("span");

                stoneElement.className =
                    `stone ${stone}`;

                point.appendChild(stoneElement);
            }

            // Highlight liberties.
            if (
                options.liberties &&
                options.liberties.has(`${row},${col}`)
            ) {
                point.classList.add("liberty-highlight");
            }

            // Highlight stones marked as dead.
            if (
                options.deadStones &&
                options.deadStones.has(`${row},${col}`)
            ) {
                point.classList.add("dead-stone-point");
            }

            // Mark the last move.
            if (
                options.lastMove &&
                options.lastMove.row === row &&
                options.lastMove.col === col
            ) {
                const marker = document.createElement("span");

                marker.className = "last-move-marker";

                point.appendChild(marker);
            }

            // Handle point clicks.
            point.addEventListener("click", () => {
                onPointClick(row, col);
            });

            container.appendChild(point);
        }
    }
}


/* ==========================================
   3. CHAPTER 1 - GO BOARD EXPLORER
========================================== */

let diagramBoard = createEmptyBoard(19);

let diagramColor = "black";

let diagramCursor = null;


// ------------------------------------------
// 3.1 STONE CURSOR PREVIEW
// ------------------------------------------

function initDiagramStoneCursor() {
    const board = document.getElementById("diagram-board");

    if (!board) return;

    if (diagramCursor) return;

    diagramCursor = document.createElement("div");

    diagramCursor.className =
        `stone-cursor-preview ${diagramColor}`;

    document.body.appendChild(diagramCursor);

    board.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "mouse") return;

        diagramCursor.style.display = "block";
    });

    board.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "mouse") {
            diagramCursor.style.display = "none";
            return;
        }

        diagramCursor.style.display = "block";

        diagramCursor.style.left = `${event.clientX}px`;
        diagramCursor.style.top = `${event.clientY}px`;
    });

    board.addEventListener("pointerleave", () => {
        diagramCursor.style.display = "none";
    });
}


function updateDiagramCursorColor() {
    if (!diagramCursor) return;

    diagramCursor.classList.remove("black", "white");
    diagramCursor.classList.add(diagramColor);
}


function setDiagramColor(color) {
    diagramColor = color;

    const bTool = document.getElementById("black-tool");
    const wTool = document.getElementById("white-tool");

    if (bTool) {
        bTool.classList.toggle("active", color === "black");
    }

    if (wTool) {
        wTool.classList.toggle("active", color === "white");
    }

    updateDiagramCursorColor();
}


// ------------------------------------------
// 3.2 PLACE STONES
// ------------------------------------------

function placeDiagramStone(row, col) {
    diagramBoard[row][col] =
        diagramBoard[row][col] ? null : diagramColor;

    drawDiagramBoard();
}


// ------------------------------------------
// 3.3 DRAW AND RESET BOARD
// ------------------------------------------

function drawDiagramBoard() {
    const container = document.getElementById("diagram-board");

    if (!container) return;

    renderBoard(
        container,
        diagramBoard,
        placeDiagramStone
    );
}


function clearDiagram() {
    diagramBoard = createEmptyBoard(19);

    drawDiagramBoard();
}


/* ==========================================
   4. CHAPTER 2 - LIBERTIES & CAPTURING
========================================== */


/* ------------------------------------------
   4.1 FIND CONNECTED GROUPS AND LIBERTIES
------------------------------------------ */

function getGroup(board, startRow, startCol) {
    const size = board.length;

    const color = board[startRow][startCol];

    if (!color) {
        return {
            stones: [],
            liberties: new Set()
        };
    }

    const visited = new Set();
    const liberties = new Set();
    const stones = [];

    const queue = [[startRow, startCol]];

    visited.add(`${startRow},${startCol}`);

    while (queue.length > 0) {
        const [row, col] = queue.shift();

        stones.push([row, col]);

        for (const [r, c] of getNeighbors(row, col, size)) {
            const key = `${r},${c}`;

            const neighborColor = board[r][c];

            // Empty intersections are liberties.
            if (neighborColor === null) {
                liberties.add(key);
            }

            // Connected stones of the same color.
            else if (
                neighborColor === color &&
                !visited.has(key)
            ) {
                visited.add(key);
                queue.push([r, c]);
            }
        }
    }

    return {
        stones,
        liberties
    };
}


/* ------------------------------------------
   4.2 LIBERTY BOARD STATE
------------------------------------------ */

let libertyBoard = createEmptyBoard(9);

let libertyCurrentPlayer = "black";

let libertySelected = null;

let libertyBlackCaptures = 0;
let libertyWhiteCaptures = 0;

let libertyNotice = "";


/* ------------------------------------------
   4.3 HANDLE BOARD INTERACTIONS
------------------------------------------ */

function placeLibertyStone(row, col) {

    // Select an existing stone and its group.
    if (libertyBoard[row][col] !== null) {
        libertySelected = {
            row,
            col
        };

        libertyNotice = "";

        drawLibertyBoard();

        return;
    }

    const candidate = cloneBoard(libertyBoard);

    const color = libertyCurrentPlayer;

    const opponent =
        color === "black" ? "white" : "black";

    candidate[row][col] = color;

    // Find opponent groups with zero liberties.
    const capturedGroups = [];

    const checked = new Set();

    for (const [r, c] of getNeighbors(row, col, 9)) {

        if (candidate[r][c] !== opponent) continue;

        const key = `${r},${c}`;

        if (checked.has(key)) continue;

        const group = getGroup(candidate, r, c);

        group.stones.forEach(([gr, gc]) => {
            checked.add(`${gr},${gc}`);
        });

        if (group.liberties.size === 0) {
            capturedGroups.push(...group.stones);
        }
    }

    // Remove captured stones.
    capturedGroups.forEach(([r, c]) => {
        candidate[r][c] = null;
    });

    // Check suicide.
    const newGroup = getGroup(
        candidate,
        row,
        col
    );

    if (
        newGroup.liberties.size === 0 &&
        capturedGroups.length === 0
    ) {
        libertyNotice =
            "Illegal move: this stone would have no liberties.";

        drawLibertyBoard();

        return;
    }

    // Save the new board.
    libertyBoard = candidate;

    libertySelected = {
        row,
        col
    };

    // Update captures.
    if (color === "black") {
        libertyBlackCaptures += capturedGroups.length;
    } else {
        libertyWhiteCaptures += capturedGroups.length;
    }

    // Feedback.
    if (capturedGroups.length > 0) {
        libertyNotice =
            `${color.toUpperCase()} captured ` +
            `${capturedGroups.length} stone(s)!`;
    } else {
        libertyNotice = "";
    }

    // Switch players.
    libertyCurrentPlayer = opponent;

    drawLibertyBoard();
}


/* ------------------------------------------
   4.4 DRAW THE LIBERTY BOARD
------------------------------------------ */

function drawLibertyBoard() {
    const container = document.getElementById("liberty-board");

    if (!container) return;

    const statusEl =
        document.getElementById("liberty-status");

    let highlighted = new Set();

    let statusMessage = "";

    // Find selected group's liberties.
    if (libertySelected) {
        const { row, col } = libertySelected;

        const selectedColor = libertyBoard[row][col];

        if (selectedColor !== null) {
            const group = getGroup(
                libertyBoard,
                row,
                col
            );

            highlighted = group.liberties;

            statusMessage =
                `Selected ${selectedColor.toUpperCase()} group: ` +
                `${group.stones.length} stone(s), ` +
                `${group.liberties.size} liberties. `;
        }
    }

    // Count occupied intersections.
    const occupiedCount =
        libertyBoard
            .flat()
            .filter(stone => stone !== null)
            .length;

    if (occupiedCount === 0) {
        statusMessage =
            "The board is empty. Black plays first. " +
            "Click any intersection to place a stone.";
    } else {
        statusMessage +=
            `${libertyCurrentPlayer.toUpperCase()} to play next. `;
    }

    // Display captured stones.
    statusMessage +=
        `Captured — Black: ${libertyBlackCaptures}, ` +
        `White: ${libertyWhiteCaptures}.`;

    // Display additional feedback.
    if (libertyNotice) {
        statusMessage =
            `${libertyNotice} ${statusMessage}`;
    }

    if (statusEl) {
        statusEl.textContent = statusMessage;
    }

    renderBoard(
        container,
        libertyBoard,
        placeLibertyStone,
        {
            liberties: highlighted,
            lastMove: libertySelected
        }
    );
}


/* ------------------------------------------
   4.5 RESET THE LIBERTY DEMONSTRATION
------------------------------------------ */

function resetLibertyDemo() {
    libertyBoard = createEmptyBoard(9);

    libertyCurrentPlayer = "black";

    libertySelected = null;

    libertyBlackCaptures = 0;
    libertyWhiteCaptures = 0;

    libertyNotice = "";

    drawLibertyBoard();
}


/* ==========================================
   5. CHAPTER 2 - CAPTURE DEMONSTRATION
========================================== */

const captureSteps = [
    {
        title: "Start with a White Stone",
        description: "The white stone has four liberties.",
        black: [],
        white: [[4, 4]],
        captured: false
    },
    {
        title: "Black Takes First Liberty",
        description: "Black places a stone above.",
        black: [[3, 4]],
        white: [[4, 4]],
        captured: false
    },
    {
        title: "Black Takes Second Liberty",
        description: "Black places a stone to the left.",
        black: [[3, 4], [4, 3]],
        white: [[4, 4]],
        captured: false
    },
    {
        title: "Only One Liberty Remains",
        description: "Black occupies the bottom intersection.",
        black: [[3, 4], [4, 3], [5, 4]],
        white: [[4, 4]],
        captured: false
    },
    {
        title: "White Stone Captured!",
        description: "Black takes the final liberty.",
        black: [[3, 4], [4, 3], [5, 4], [4, 5]],
        white: [],
        captured: true
    }
];


let captureStepIndex = 0;


// ------------------------------------------
// 5.1 DRAW CAPTURE DEMONSTRATION
// ------------------------------------------

function drawCaptureBoard() {
    const container = document.getElementById("capture-board");

    if (!container) return;

    const step = captureSteps[captureStepIndex];

    const board = createEmptyBoard(9);

    step.black.forEach(([r, c]) => {
        board[r][c] = "black";
    });

    step.white.forEach(([r, c]) => {
        board[r][c] = "white";
    });

    renderBoard(
        container,
        board,
        () => {}
    );

    const stepEl =
        document.getElementById("capture-step");

    const titleEl =
        document.getElementById("capture-title");

    const descriptionEl =
        document.getElementById("capture-description");

    const statusEl =
        document.getElementById("capture-status");

    if (stepEl) {
        stepEl.textContent =
            `STEP ${captureStepIndex + 1} / ${captureSteps.length}`;
    }

    if (titleEl) {
        titleEl.textContent = step.title;
    }

    if (descriptionEl) {
        descriptionEl.textContent = step.description;
    }

    if (statusEl) {
        statusEl.textContent = step.captured
            ? "Captured! The white stone has been removed."
            : "Watch liberties disappear.";
    }

    const nextButton =
        document.getElementById("capture-next");

    if (nextButton) {
        nextButton.disabled =
            captureStepIndex === captureSteps.length - 1;
    }
}


// ------------------------------------------
// 5.2 NEXT CAPTURE STEP
// ------------------------------------------

function nextCaptureStep() {
    if (captureStepIndex < captureSteps.length - 1) {
        captureStepIndex++;

        drawCaptureBoard();
    }
}


// ------------------------------------------
// 5.3 RESET CAPTURE DEMONSTRATION
// ------------------------------------------

function resetCaptureDemo() {
    captureStepIndex = 0;

    drawCaptureBoard();
}


/* ==========================================
   6. CHAPTER 3 - PLAYABLE GO BOARD
   Dead Stone Agreement & Area Scoring
========================================== */

let game = {};


/* ==========================================
   6.1 CREATE NEW GAME
========================================== */

function createNewGame() {
    return {
        board: createEmptyBoard(19),

        currentPlayer: "black",

        blackCaptures: 0,
        whiteCaptures: 0,

        lastMove: null,
        previousBoard: null,

        consecutivePasses: 0,

        // playing -> marking-black -> marking-white -> finished
        phase: "playing",
        gameOver: false,

        deadStones: new Set(),

        blackConfirmation: null,
        whiteConfirmation: null,

        score: null,

        statusMessage:
            "Black plays first. Choose an empty intersection.",

        undoStack: [],
        moveHistory: []
    };
}


/* ==========================================
   6.2 SAVE AND RESTORE GAME STATE
========================================== */

function saveGameState() {
    game.undoStack.push({
        board: cloneBoard(game.board),

        currentPlayer: game.currentPlayer,

        blackCaptures: game.blackCaptures,
        whiteCaptures: game.whiteCaptures,

        lastMove: game.lastMove
            ? { ...game.lastMove }
            : null,

        previousBoard: game.previousBoard
            ? cloneBoard(game.previousBoard)
            : null,

        consecutivePasses: game.consecutivePasses,

        phase: game.phase,
        gameOver: game.gameOver,

        deadStones: new Set(game.deadStones),

        blackConfirmation: game.blackConfirmation
            ? [...game.blackConfirmation]
            : null,

        whiteConfirmation: game.whiteConfirmation
            ? [...game.whiteConfirmation]
            : null,

        score: game.score
            ? { ...game.score }
            : null,

        statusMessage: game.statusMessage,

        moveHistory: [...game.moveHistory]
    });
}


function restoreGameState(state) {
    game.board = cloneBoard(state.board);

    game.currentPlayer = state.currentPlayer;

    game.blackCaptures = state.blackCaptures;
    game.whiteCaptures = state.whiteCaptures;

    game.lastMove = state.lastMove
        ? { ...state.lastMove }
        : null;

    game.previousBoard = state.previousBoard
        ? cloneBoard(state.previousBoard)
        : null;

    game.consecutivePasses = state.consecutivePasses;

    game.phase = state.phase;
    game.gameOver = state.gameOver;

    game.deadStones = new Set(state.deadStones);

    game.blackConfirmation = state.blackConfirmation
        ? [...state.blackConfirmation]
        : null;

    game.whiteConfirmation = state.whiteConfirmation
        ? [...state.whiteConfirmation]
        : null;

    game.score = state.score
        ? { ...state.score }
        : null;

    game.statusMessage = state.statusMessage;

    game.moveHistory = [...state.moveHistory];
}


/* ==========================================
   6.3 BASIC HELPERS
========================================== */

function getPlayerName(color) {
    return color === "black" ? "Black" : "White";
}


function getMoveCoordinate(row, col) {
    const letters = "ABCDEFGHJKLMNOPQRST";

    return `${letters[col]}${game.board.length - row}`;
}


function getOpponent(color) {
    return color === "black" ? "white" : "black";
}


function normalizeDeadStones(stones) {
    return [...stones].sort();
}


function sameDeadStones(first, second) {
    if (!first || !second) return false;

    const a = normalizeDeadStones(new Set(first));
    const b = normalizeDeadStones(new Set(second));

    return JSON.stringify(a) === JSON.stringify(b);
}


/* ==========================================
   6.4 PLAY A NORMAL MOVE
========================================== */

function playMove(row, col) {

    if (game.phase !== "playing") return;

    if (game.board[row][col] !== null) {
        game.statusMessage =
            "This intersection is already occupied.";

        updateGameInformation();

        return;
    }

    const size = game.board.length;

    const candidate = cloneBoard(game.board);

    const color = game.currentPlayer;
    const opponent = getOpponent(color);

    const boardBeforeMove = cloneBoard(game.board);

    candidate[row][col] = color;

    // Find adjacent opponent groups with zero liberties.
    const capturedGroups = [];

    const checked = new Set();

    for (const [r, c] of getNeighbors(row, col, size)) {

        if (candidate[r][c] !== opponent) continue;

        const key = `${r},${c}`;

        if (checked.has(key)) continue;

        const group = getGroup(candidate, r, c);

        group.stones.forEach(([gr, gc]) => {
            checked.add(`${gr},${gc}`);
        });

        if (group.liberties.size === 0) {
            capturedGroups.push(...group.stones);
        }
    }

    // Remove captured stones.
    capturedGroups.forEach(([r, c]) => {
        candidate[r][c] = null;
    });

    // Check suicide.
    const newGroup = getGroup(candidate, row, col);

    if (
        newGroup.liberties.size === 0 &&
        capturedGroups.length === 0
    ) {
        game.statusMessage =
            "Illegal move! Your new group would have no liberties.";

        updateGameInformation();

        return;
    }

    // Check simple Ko.
    if (
        game.previousBoard &&
        boardToString(candidate) ===
        boardToString(game.previousBoard)
    ) {
        game.statusMessage =
            "Illegal move! The Ko rule prevents immediate repetition.";

        updateGameInformation();

        return;
    }

    saveGameState();

    game.board = candidate;

    game.previousBoard = boardBeforeMove;

    game.lastMove = { row, col };

    game.consecutivePasses = 0;

    // Update capture counts.
    if (color === "black") {
        game.blackCaptures += capturedGroups.length;
    } else {
        game.whiteCaptures += capturedGroups.length;
    }

    // Record the move.
    game.moveHistory.push({
        type: "move",
        color,
        row,
        col,
        coordinate: getMoveCoordinate(row, col),
        captured: capturedGroups.length
    });

    // Switch players.
    game.currentPlayer = opponent;

    // Feedback.
    if (capturedGroups.length > 0) {
        game.statusMessage =
            `${getPlayerName(color)} captured ` +
            `${capturedGroups.length} stone(s)!`;
    } else {
        game.statusMessage =
            `${getPlayerName(opponent)} to play next.`;
    }

    renderGameBoard();

    updateGameInformation();
}


/* ==========================================
   6.5 PASS TURN
========================================== */

function passTurn() {

    if (game.phase !== "playing") return;

    const color = game.currentPlayer;
    const opponent = getOpponent(color);

    saveGameState();

    game.moveHistory.push({
        type: "pass",
        color
    });

    game.consecutivePasses++;

    // Passing clears the immediate Ko restriction.
    game.previousBoard = null;
    game.lastMove = null;

    game.currentPlayer = opponent;

    if (game.consecutivePasses >= 2) {

        // Both players have passed.
        // Start the dead-stone marking stage.
        game.phase = "marking-black";

        game.deadStones = new Set();

        game.blackConfirmation = null;
        game.whiteConfirmation = null;

        game.statusMessage =
            "Both players passed. Black, review the board and mark dead groups.";

    } else {

        game.statusMessage =
            `${getPlayerName(color)} passed. ` +
            `${getPlayerName(opponent)} to play.`;
    }

    renderGameBoard();

    updateGameInformation();
}


/* ==========================================
   6.6 MARK OR UNMARK DEAD GROUPS
========================================== */

function toggleDeadGroup(row, col) {

    if (
        game.phase !== "marking-black" &&
        game.phase !== "marking-white"
    ) {
        return;
    }

    const color = game.board[row][col];

    if (!color) {
        game.statusMessage =
            "Select an occupied intersection to mark a dead group.";

        updateGameInformation();

        return;
    }

    const group = getGroup(game.board, row, col);

    const groupKeys = group.stones.map(
        ([r, c]) => `${r},${c}`
    );

    const allMarked = groupKeys.every(
        key => game.deadStones.has(key)
    );

    saveGameState();

    if (allMarked) {

        groupKeys.forEach(key => {
            game.deadStones.delete(key);
        });

        game.statusMessage =
            `${getPlayerName(color)} group marking removed.`;

    } else {

        groupKeys.forEach(key => {
            game.deadStones.add(key);
        });

        game.statusMessage =
            `${getPlayerName(color)} group marked as dead.`;
    }

    renderGameBoard();

    updateGameInformation();
}


/* ==========================================
   6.7 HANDLE BOARD CLICKS
========================================== */

function handleGameBoardClick(row, col) {

    if (game.phase === "playing") {
        playMove(row, col);
        return;
    }

    if (
        game.phase === "marking-black" ||
        game.phase === "marking-white"
    ) {
        toggleDeadGroup(row, col);
    }
}


/* ==========================================
   6.8 CONFIRM DEAD STONES
========================================== */

function confirmDeadStones() {

    // Black confirms first.
    if (game.phase === "marking-black") {

        saveGameState();

        game.blackConfirmation =
            normalizeDeadStones(game.deadStones);

        game.phase = "marking-white";

        game.currentPlayer = "white";

        game.statusMessage =
            "Black has confirmed. White, review the markings and make your decision.";

        renderGameBoard();

        updateGameInformation();

        return;
    }

    // White confirms second.
    if (game.phase === "marking-white") {

        saveGameState();

        game.whiteConfirmation =
            normalizeDeadStones(game.deadStones);

        // Compare both players' decisions.
        const agreement = sameDeadStones(
            game.blackConfirmation,
            game.whiteConfirmation
        );

        // Case A: The players disagree.
        if (!agreement) {

            game.phase = "playing";

            game.gameOver = false;

            game.currentPlayer = "black";

            game.consecutivePasses = 0;

            game.deadStones.clear();

            game.blackConfirmation = null;
            game.whiteConfirmation = null;

            game.score = null;

            game.moveHistory.push({
                type: "resume"
            });

            game.statusMessage =
                "The players disagree about the dead stones. " +
                "The markings have been cancelled. " +
                "The game resumes with Black to play.";

            renderGameBoard();

            updateGameInformation();

            return;
        }

        // Case B: The players agree.
        finishGame();
    }
}


/* ==========================================
   6.9 CALCULATE AREA SCORE
========================================== */

function calculateAreaScore(board) {

    const size = board.length;

    let blackStones = 0;
    let whiteStones = 0;

    let blackTerritory = 0;
    let whiteTerritory = 0;

    let neutralPoints = 0;

    // Count living stones.
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {

            if (board[r][c] === "black") {
                blackStones++;
            }

            if (board[r][c] === "white") {
                whiteStones++;
            }
        }
    }

    // Find every connected empty region.
    const visited = new Set();

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {

            if (board[row][col] !== null) continue;

            const startKey = `${row},${col}`;

            if (visited.has(startKey)) continue;

            const queue = [[row, col]];

            const region = [];

            const borderingColors = new Set();

            visited.add(startKey);

            while (queue.length > 0) {

                const [r, c] = queue.shift();

                region.push([r, c]);

                for (const [nr, nc] of getNeighbors(r, c, size)) {

                    const neighbor = board[nr][nc];

                    const key = `${nr},${nc}`;

                    if (neighbor === null) {

                        if (!visited.has(key)) {
                            visited.add(key);
                            queue.push([nr, nc]);
                        }

                    } else {

                        borderingColors.add(neighbor);
                    }
                }
            }

            // A region bordered by only Black belongs to Black.
            if (
                borderingColors.size === 1 &&
                borderingColors.has("black")
            ) {

                blackTerritory += region.length;

            }

            // A region bordered by only White belongs to White.
            else if (
                borderingColors.size === 1 &&
                borderingColors.has("white")
            ) {

                whiteTerritory += region.length;

            }

            // Otherwise, it is neutral.
            else {

                neutralPoints += region.length;
            }
        }
    }

    // Beginner-friendly Chinese-style area scoring.
    const komi = 7.5;

    const blackTotal =
        blackStones + blackTerritory;

    const whiteTotal =
        whiteStones + whiteTerritory + komi;

    return {
        blackStones,
        whiteStones,

        blackTerritory,
        whiteTerritory,

        neutralPoints,

        blackTotal,
        whiteTotal,

        komi,

        winner: blackTotal > whiteTotal
            ? "Black"
            : whiteTotal > blackTotal
                ? "White"
                : "Draw",

        margin: Math.abs(blackTotal - whiteTotal)
    };
}


/* ==========================================
   6.10 FINISH GAME
========================================== */

function finishGame() {

    // Remove the agreed dead stones.
    game.deadStones.forEach(key => {

        const [row, col] = key.split(",").map(Number);

        game.board[row][col] = null;
    });

    game.deadStones.clear();

    game.phase = "finished";

    game.gameOver = true;

    game.score = calculateAreaScore(game.board);

    game.moveHistory.push({
        type: "finished"
    });

    if (game.score.winner === "Draw") {

        game.statusMessage =
            "The game is a draw.";

    } else {

        game.statusMessage =
            `${game.score.winner} wins by ` +
            `${game.score.margin.toFixed(1)} points!`;
    }

    renderGameBoard();

    updateGameInformation();
}


/* ==========================================
   6.11 UNDO LAST ACTION
========================================== */

function undoMove() {

    if (game.undoStack.length === 0) {

        game.statusMessage =
            "There is no previous action to undo.";

        updateGameInformation();

        return;
    }

    const previousState = game.undoStack.pop();

    restoreGameState(previousState);

    game.statusMessage =
        "Last action undone.";

    renderGameBoard();

    updateGameInformation();
}


/* ==========================================
   6.12 RENDER GAME BOARD
========================================== */

function renderGameBoard() {

    const container =
        document.getElementById("play-board");

    if (!container) return;

    renderBoard(
        container,
        game.board,
        handleGameBoardClick,
        {
            lastMove: game.lastMove,
            deadStones: game.deadStones
        }
    );
}


/* ==========================================
   6.13 RENDER MOVE HISTORY
========================================== */

function renderMoveHistory() {

    const container =
        document.getElementById("game-history-list");

    if (!container) return;

    container.innerHTML = "";

    if (game.moveHistory.length === 0) {

        const empty = document.createElement("p");

        empty.textContent =
            "No moves yet. Start playing!";

        container.appendChild(empty);

        return;
    }

    game.moveHistory.forEach((move, index) => {

        const item = document.createElement("div");

        item.className = "game-history-item";

        let description = "";

        if (move.type === "pass") {

            description =
                `${index + 1}. ${getPlayerName(move.color)} — Pass`;

        } else if (move.type === "move") {

            description =
                `${index + 1}. ${getPlayerName(move.color)} — ${move.coordinate}`;

            if (move.captured > 0) {
                description +=
                    ` (Captured ${move.captured})`;
            }

        } else if (move.type === "resume") {

            description =
                `${index + 1}. Dead-stone disagreement — Game resumed`;

        } else {

            description =
                `${index + 1}. Game finished`;
        }

        item.textContent = description;

        container.appendChild(item);
    });

    container.scrollTop = container.scrollHeight;
}


/* ==========================================
   6.14 RENDER FINAL SCORE
========================================== */

function renderFinalScore() {

    const panel =
        document.getElementById("game-score-panel");

    if (!panel) return;

    if (!game.score) {

        panel.hidden = true;

        panel.innerHTML = "";

        return;
    }

    panel.hidden = false;

    const s = game.score;

    panel.innerHTML = `
        <h3>Final Score</h3>

        <div class="score-result">
            ${s.winner === "Draw"
                ? "Draw"
                : `${s.winner} Wins`}
        </div>

        <table class="score-table">
            <thead>
                <tr>
                    <th>Score</th>
                    <th>Black</th>
                    <th>White</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>Living Stones</td>
                    <td>${s.blackStones}</td>
                    <td>${s.whiteStones}</td>
                </tr>

                <tr>
                    <td>Territory</td>
                    <td>${s.blackTerritory}</td>
                    <td>${s.whiteTerritory}</td>
                </tr>

                <tr>
                    <td>Komi</td>
                    <td>0</td>
                    <td>${s.komi}</td>
                </tr>

                <tr class="score-total">
                    <td>Total</td>
                    <td>${s.blackTotal}</td>
                    <td>${s.whiteTotal}</td>
                </tr>
            </tbody>
        </table>

        <p class="score-neutral">
            Neutral points: ${s.neutralPoints}
        </p>
    `;
}


/* ==========================================
   6.15 UPDATE GAME INFORMATION
========================================== */

function updateGameInformation() {

    const blackCaptures =
        document.getElementById("black-captures");

    const whiteCaptures =
        document.getElementById("white-captures");

    const turnText =
        document.getElementById("turn-text");

    if (blackCaptures) {
        blackCaptures.textContent = game.blackCaptures;
    }

    if (whiteCaptures) {
        whiteCaptures.textContent = game.whiteCaptures;
    }

    if (turnText) {

        if (game.phase === "playing") {

            turnText.textContent =
                `${getPlayerName(game.currentPlayer)} to play`;

        } else if (game.phase === "marking-black") {

            turnText.textContent =
                "Dead Stone Review — Black";

        } else if (game.phase === "marking-white") {

            turnText.textContent =
                "Dead Stone Review — White";

        } else {

            turnText.textContent = "Game Over";
        }
    }

    const feedback =
        document.getElementById("game-feedback");

    if (feedback) {
        feedback.textContent = game.statusMessage;
    }

    const undoButton =
        document.getElementById("undo-button");

    if (undoButton) {
        undoButton.disabled =
            game.undoStack.length === 0;
    }

    const passButton =
        document.getElementById("pass-button");

    if (passButton) {
        passButton.disabled =
            game.phase !== "playing";
    }

    const confirmButton =
        document.getElementById("confirm-dead-button");

    if (confirmButton) {

        const marking =
            game.phase === "marking-black" ||
            game.phase === "marking-white";

        confirmButton.hidden = !marking;

        confirmButton.textContent =
            game.phase === "marking-black"
                ? "Confirm Black's Marking"
                : "Confirm White's Marking";
    }

    renderMoveHistory();

    renderFinalScore();
}


/* ==========================================
   6.16 CREATE GAME CONTROLS
========================================== */

function createGameControls() {

    const board =
        document.getElementById("play-board");

    if (!board) return;

    // Prevent duplicate controls.
    if (document.getElementById("game-controls")) {
        return;
    }

    const panel = document.createElement("div");

    panel.id = "game-controls";

    panel.className = "game-controls";

    // Undo button.
    const undoButton = document.createElement("button");

    undoButton.id = "undo-button";

    undoButton.type = "button";

    undoButton.textContent = "Undo";

    undoButton.className = "game-control-button";

    undoButton.addEventListener("click", undoMove);

    // Pass button.
    const passButton = document.createElement("button");

    passButton.id = "pass-button";

    passButton.type = "button";

    passButton.textContent = "Pass";

    passButton.className = "game-control-button";

    passButton.addEventListener("click", passTurn);

    // Confirm dead-stone button.
    const confirmButton = document.createElement("button");

    confirmButton.id = "confirm-dead-button";

    confirmButton.type = "button";

    confirmButton.textContent = "Confirm Dead Stones";

    confirmButton.className =
        "game-control-button confirm-dead-button";

    confirmButton.hidden = true;

    confirmButton.addEventListener(
        "click",
        confirmDeadStones
    );

    panel.append(
        undoButton,
        passButton,
        confirmButton
    );

    // Insert controls below the game header if possible.
    const header =
        board.closest(".demo-panel")
            ?.querySelector(".game-header");

    if (header) {

        header.insertAdjacentElement(
            "afterend",
            panel
        );

    } else {

        board.insertAdjacentElement(
            "beforebegin",
            panel
        );
    }

    // Feedback message.
    const feedback = document.createElement("p");

    feedback.id = "game-feedback";

    feedback.className = "game-feedback";

    feedback.setAttribute("aria-live", "polite");

    panel.insertAdjacentElement(
        "afterend",
        feedback
    );

    // Final score panel.
    const scorePanel = document.createElement("section");

    scorePanel.id = "game-score-panel";

    scorePanel.className = "game-score-panel";

    scorePanel.hidden = true;

    feedback.insertAdjacentElement(
        "afterend",
        scorePanel
    );

    // Move history.
    const historySection = document.createElement("section");

    historySection.id = "game-history";

    historySection.className = "game-history";

    const historyTitle = document.createElement("h3");

    historyTitle.textContent = "Move History";

    const historyList = document.createElement("div");

    historyList.id = "game-history-list";

    historyList.className = "game-history-list";

    historySection.append(
        historyTitle,
        historyList
    );

    const sidebar =
        board.closest(".demo-panel")
            ?.querySelector(".game-sidebar-stats");

    if (sidebar) {

        sidebar.appendChild(historySection);

    } else {

        scorePanel.insertAdjacentElement(
            "afterend",
            historySection
        );
    }
}


/* ==========================================
   6.17 RESTART GAME
========================================== */

function restartGame() {

    game = createNewGame();

    renderGameBoard();

    updateGameInformation();
}


/* ==========================================
   6.18 INITIALIZE CHAPTER 3
========================================== */

function initializeGame() {

    game = createNewGame();

    createGameControls();

    renderGameBoard();

    updateGameInformation();
}


/* ==========================================
   7. PAGE INITIALIZATION
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // Chapter 1: Board Explorer.
    if (document.getElementById("diagram-board")) {

        drawDiagramBoard();

        initDiagramStoneCursor();
    }

    // Chapter 2: Liberties and Capturing.
    if (document.getElementById("liberty-board")) {

        drawLibertyBoard();

        drawCaptureBoard();
    }

    // Chapter 3: Playable Board.
    if (document.getElementById("play-board")) {

        initializeGame();
    }

});


