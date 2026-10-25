
/* ==========================================
   GO BEGINNER
   Interactive Go Learning Platform
========================================== */


/* ==========================================
   1. PAGE NAVIGATION
========================================== */

function showHome(event) {

    if (event) event.preventDefault();

    document.getElementById("home-page").hidden = false;
    document.getElementById("learning-page").hidden = true;

    window.scrollTo(0, 0);
}


function showLearning(event) {

    if (event) event.preventDefault();

    document.getElementById("home-page").hidden = true;
    document.getElementById("learning-page").hidden = false;

    openChapter(1);

    window.scrollTo(0, 0);
}


function openChapter(number) {

    // Hide all chapters
    document.querySelectorAll(".chapter-content").forEach(chapter => {
        chapter.hidden = true;
    });

    // Display selected chapter
    const selected = document.getElementById(`chapter-${number}`);

    if (!selected) return;

    selected.hidden = false;

    // Update navigation tabs
    document.querySelectorAll(".chapter-tab").forEach(tab => {

        tab.classList.remove("active");

        if (Number(tab.dataset.chapter) === number) {
            tab.classList.add("active");
        }

    });

    window.scrollTo(0, 0);
}


/* ==========================================
   2. BOARD UTILITIES
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
            r >= 0 && r < size &&
            c >= 0 && c < size
        );

}


/*
   Generate a visual Go board.

   Each intersection is represented
   by one HTML button.
*/

function renderBoard(container, board, onPointClick, options = {}) {

    const size = board.length;

    container.innerHTML = "";

    container.style.gridTemplateRows =
        `repeat(${size}, minmax(0, 1fr))`;

    container.style.aspectRatio = "1 / 1";

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

            point.setAttribute(
                "aria-label",
                `Intersection row ${row + 1}, column ${col + 1}`
            );

            // Star points
            if (
                starPoints.includes(row) &&
                starPoints.includes(col)
            ) {

                const star = document.createElement("span");

                star.className = "star-marker";

                Object.assign(star.style, {
                    position: "absolute",
                    width: "20%",
                    height: "20%",
                    background: "#59432a",
                    borderRadius: "50%",
                    zIndex: "2",
                    pointerEvents: "none"
                });

                point.appendChild(star);

            }

            // Existing stone
            const stone = board[row][col];

            if (stone) {

                const stoneElement = document.createElement("span");

                stoneElement.className = `stone ${stone}`;

                point.appendChild(stoneElement);

            }

            // Highlight liberties
            if (
                options.liberties &&
                options.liberties.has(`${row},${col}`)
            ) {

                point.classList.add("liberty-highlight");

            }

            // Highlight the last move
            if (
                options.lastMove &&
                options.lastMove.row === row &&
                options.lastMove.col === col
            ) {

                const marker = document.createElement("span");

                marker.className = "last-move-marker";

                point.appendChild(marker);

            }

            // Click event
            point.addEventListener("click", () => {

                onPointClick(row, col);

            });

            container.appendChild(point);

        }

    }

}


/* ==========================================
   3. CHAPTER 1
   BOARD EXPLORER
========================================== */

let diagramBoard = createEmptyBoard(19);

let diagramColor = "black";


function setDiagramColor(color) {

    diagramColor = color;

    document.getElementById("black-tool")
        .classList.toggle("active", color === "black");

    document.getElementById("white-tool")
        .classList.toggle("active", color === "white");

}


function placeDiagramStone(row, col) {

    // Clicking an occupied point removes its stone
    if (diagramBoard[row][col]) {

        diagramBoard[row][col] = null;

    } else {

        diagramBoard[row][col] = diagramColor;

    }

    drawDiagramBoard();

}


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
   4. LIBERTY CALCULATION
========================================== */

/*
   Find all stones connected to a given stone.

   Stones are connected horizontally
   and vertically, NOT diagonally.

   Also calculate all empty intersections
   adjacent to the connected group.
*/

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

        const neighbors = getNeighbors(row, col, size);

        for (const [r, c] of neighbors) {

            const key = `${r},${c}`;

            const neighborColor = board[r][c];

            if (neighborColor === null) {

                liberties.add(key);

            } else if (
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


/* ==========================================
   5. CHAPTER 2
   LIBERTY DEMONSTRATION
========================================== */

let libertyBoard = createEmptyBoard(9);


function placeLibertyStone(row, col) {

    // Only one black demonstration stone
    if (libertyBoard.flat().some(stone => stone !== null)) {

        return;

    }

    libertyBoard[row][col] = "black";

    drawLibertyBoard();

}


function drawLibertyBoard() {

    const container = document.getElementById("liberty-board");

    if (!container) return;

    let highlighted = new Set();

    const existingStone = libertyBoard.flat().some(
        stone => stone !== null
    );

    if (existingStone) {

        let row = libertyBoard.findIndex(
            line => line.includes("black")
        );

        let col = libertyBoard[row].indexOf("black");

        const group = getGroup(libertyBoard, row, col);

        highlighted = group.liberties;

        document.getElementById("liberty-status").textContent =
            `This black stone has ${highlighted.size} liberties remaining.`;

    } else {

        document.getElementById("liberty-status").textContent =
            "Select an intersection to place a black stone.";

    }

    renderBoard(
        container,
        libertyBoard,
        placeLibertyStone,
        { liberties: highlighted }
    );

}


function resetLibertyDemo() {

    libertyBoard = createEmptyBoard(9);

    drawLibertyBoard();

}


/* ==========================================
   6. CHAPTER 2
   CAPTURING DEMONSTRATION
========================================== */

/*
   The white stone starts at the center.

   Black gradually occupies its four liberties.

   When the last liberty disappears,
   the white stone is captured.
*/

const captureSteps = [

    {
        title: "Start with a White Stone",

        description:
            "The white stone has four liberties: " +
            "one above, one below, one on the left, " +
            "and one on the right.",

        black: [],

        white: [[4, 4]],

        captured: false

    },

    {
        title: "Black Takes the First Liberty",

        description:
            "Black places a stone above the white stone. " +
            "The white stone now has three liberties.",

        black: [[3, 4]],

        white: [[4, 4]],

        captured: false

    },

    {
        title: "Black Takes the Second Liberty",

        description:
            "Black places another stone to the left. " +
            "Only two liberties remain.",

        black: [[3, 4], [4, 3]],

        white: [[4, 4]],

        captured: false

    },

    {
        title: "Only One Liberty Remains",

        description:
            "Black occupies the intersection below " +
            "the white stone. It now has only one liberty.",

        black: [[3, 4], [4, 3], [5, 4]],

        white: [[4, 4]],

        captured: false

    },

    {
        title: "White Stone Captured!",

        description:
            "Black takes the final liberty. " +
            "The white stone has no liberties and " +
            "is removed from the board.",

        black: [[3, 4], [4, 3], [5, 4], [4, 5]],

        white: [],

        captured: true

    }

];


let captureStepIndex = 0;


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

    renderBoard(container, board, () => {});

    // Update step information
    document.getElementById("capture-step").textContent =
        `STEP ${captureStepIndex + 1} / ${captureSteps.length}`;

    document.getElementById("capture-title").textContent =
        step.title;

    document.getElementById("capture-description").textContent =
        step.description;

    document.getElementById("capture-status").textContent =
        step.captured
            ? "Captured! The white stone has been removed."
            : "Watch how black gradually reduces the white stone's liberties.";

    document.getElementById("capture-next").disabled =
        captureStepIndex === captureSteps.length - 1;

}


function nextCaptureStep() {

    if (captureStepIndex < captureSteps.length - 1) {

        captureStepIndex++;

        drawCaptureBoard();

    }

}


function resetCaptureDemo() {

    captureStepIndex = 0;

    drawCaptureBoard();

}


/* ==========================================
   7. CHAPTER 3
   PLAYABLE GO GAME
========================================== */

let game = {};

function createNewGame() {

    return {

        board: createEmptyBoard(9),

        currentPlayer: "black",

        blackCaptures: 0,

        whiteCaptures: 0,

        moveHistory: [],

        previousBoard: null,

        consecutivePasses: 0,

        gameOver: false,

        lastMove: null

    };

}


/* Save the complete game state before a move */

function saveGameState() {

    game.moveHistory.push({

        board: cloneBoard(game.board),

        currentPlayer: game.currentPlayer,

        blackCaptures: game.blackCaptures,

        whiteCaptures: game.whiteCaptures,

        previousBoard: game.previousBoard
            ? cloneBoard(game.previousBoard)
            : null,

        consecutivePasses: game.consecutivePasses,

        gameOver: game.gameOver,

        lastMove: game.lastMove
            ? { ...game.lastMove }
            : null

    });

}


/* ==========================================
   8. CAPTURE DETECTION
========================================== */

function findCapturedGroups(board, color) {

    const size = board.length;

    const visited = new Set();

    const captured = [];

    for (let row = 0; row < size; row++) {

        for (let col = 0; col < size; col++) {

            const key = `${row},${col}`;

            if (
                board[row][col] !== color ||
                visited.has(key)
            ) {

                continue;

            }

            const group = getGroup(board, row, col);

            group.stones.forEach(([r, c]) => {

                visited.add(`${r},${c}`);

            });

            if (group.liberties.size === 0) {

                captured.push(...group.stones);

            }

        }

    }

    return captured;

}


/* ==========================================
   9. PLAY A MOVE
========================================== */

function playMove(row, col) {

    if (game.gameOver) {

        updateGameStatus("The game has ended. Restart to play again.");

        return;

    }

    if (game.board[row][col] !== null) {

        updateGameStatus("This intersection is already occupied.");

        return;

    }

    const candidate = cloneBoard(game.board);

    const color = game.currentPlayer;

    const opponent = color === "black" ? "white" : "black";

    // Place the new stone
    candidate[row][col] = color;


    // Find adjacent opponent groups with no liberties
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


    // Remove captured opponent stones
    capturedGroups.forEach(([r, c]) => {

        candidate[r][c] = null;

    });


    // Check suicide rule after capturing
    const ownGroup = getGroup(candidate, row, col);

    if (ownGroup.liberties.size === 0) {

        updateGameStatus(
            "Illegal move! You cannot place a stone " +
            "with no liberties unless it captures opponent stones."
        );

        return;

    }


    // Simple ko rule
    if (
        game.previousBoard &&
        boardToString(candidate) ===
        boardToString(game.previousBoard)
    ) {

        updateGameStatus(
            "Illegal move! The Ko rule prevents " +
            "immediate repetition of the previous board position."
        );

        return;

    }


    // Save state before changing the game
    saveGameState();

    const oldBoard = cloneBoard(game.board);


    // Apply the move
    game.board = candidate;

    game.previousBoard = oldBoard;

    game.consecutivePasses = 0;

    game.lastMove = { row, col };


    // Update capture counters
    if (color === "black") {

        game.blackCaptures += capturedGroups.length;

    } else {

        game.whiteCaptures += capturedGroups.length;

    }


    // Switch player
    game.currentPlayer = opponent;


    // Update the screen
    renderGameBoard();

    updateGameInformation();

    if (capturedGroups.length > 0) {

        updateGameStatus(
            `${capturedGroups.length} stone(s) captured! ` +
            `${game.currentPlayer === "black" ? "Black" : "White"}'s turn.`
        );

    } else {

        updateGameStatus(
            `${color === "black" ? "Black" : "White"} played. ` +
            `${game.currentPlayer === "black" ? "Black" : "White"}'s turn.`
        );

    }

}


/* ==========================================
   10. GAME BOARD RENDERING
========================================== */

function renderGameBoard() {

    const container = document.getElementById("play-board");

    if (!container) return;

    renderBoard(
        container,
        game.board,
        playMove,
        { lastMove: game.lastMove }
    );

}


function updateGameInformation() {

    // Captured stones
    document.getElementById("black-captures").textContent =
        game.blackCaptures;

    document.getElementById("white-captures").textContent =
        game.whiteCaptures;


    // Current player
    const turnText = document.getElementById("turn-text");

    const turnStone = document.getElementById("turn-stone");

    turnText.textContent =
        game.currentPlayer === "black"
            ? "Black to play"
            : "White to play";

    turnStone.className =
        `turn-stone ${game.currentPlayer}-stone`;


    // Undo button
    document.getElementById("undo-button").disabled =
        game.moveHistory.length === 0;

}


function updateGameStatus(message) {

    document.getElementById("game-status").textContent =
        message;

}


/* ==========================================
   11. UNDO
========================================== */

function undoMove() {

    if (game.moveHistory.length === 0) {

        updateGameStatus("There is no move to undo.");

        return;

    }

    const previous = game.moveHistory.pop();

    game.board = previous.board;

    game.currentPlayer = previous.currentPlayer;

    game.blackCaptures = previous.blackCaptures;

    game.whiteCaptures = previous.whiteCaptures;

    game.previousBoard = previous.previousBoard;

    game.consecutivePasses = previous.consecutivePasses;

    game.gameOver = previous.gameOver;

    game.lastMove = previous.lastMove;

    renderGameBoard();

    updateGameInformation();

    updateGameStatus("Last move undone.");

}


/* ==========================================
   12. PASS TURN
========================================== */

function passTurn() {

    if (game.gameOver) {

        updateGameStatus("The game has already ended.");

        return;

    }

    saveGameState();

    game.consecutivePasses++;

    // Passing breaks the immediate ko restriction
    game.previousBoard = null;

    game.lastMove = null;

    if (game.consecutivePasses >= 2) {

        game.gameOver = true;

        updateGameStatus(
            "Game over! Both players passed consecutively. " +
            "The game has ended. Restart to play again."
        );

    } else {

        const passingPlayer = game.currentPlayer;

        game.currentPlayer =
            game.currentPlayer === "black"
                ? "white"
                : "black";

        updateGameStatus(
            `${passingPlayer === "black" ? "Black" : "White"} passed. ` +
            `${game.currentPlayer === "black" ? "Black" : "White"}'s turn.`
        );

    }

    renderGameBoard();

    updateGameInformation();

}


/* ==========================================
   13. RESTART GAME
========================================== */

function restartGame() {

    game = createNewGame();

    renderGameBoard();

    updateGameInformation();

    updateGameStatus("New game started. Black plays first.");

}


/* ==========================================
   14. INITIALIZE WEBSITE
========================================== */

function initializeWebsite() {

    // Chapter 1
    diagramBoard = createEmptyBoard(19);

    drawDiagramBoard();


    // Chapter 2
    libertyBoard = createEmptyBoard(9);

    drawLibertyBoard();

    captureStepIndex = 0;

    drawCaptureBoard();


    // Chapter 3
    game = createNewGame();

    renderGameBoard();

    updateGameInformation();

    updateGameStatus("Black's turn. Enjoy your first Go game!");

}


// Initialize after HTML has loaded
initializeWebsite();
