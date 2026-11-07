
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


            // --------------------------------------
            // Draw star points
            // --------------------------------------

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


            // --------------------------------------
            // Draw stones
            // --------------------------------------

            const stone = board[row][col];

            if (stone) {

                const stoneElement =
                    document.createElement("span");

                stoneElement.className =
                    `stone ${stone}`;

                point.appendChild(stoneElement);

            }


            // --------------------------------------
            // Highlight liberties
            // --------------------------------------

            if (
                options.liberties &&
                options.liberties.has(`${row},${col}`)
            ) {

                point.classList.add("liberty-highlight");

            }


            // --------------------------------------
            // Mark the last move
            // --------------------------------------

            if (
                options.lastMove &&
                options.lastMove.row === row &&
                options.lastMove.col === col
            ) {

                const marker = document.createElement("span");

                marker.className = "last-move-marker";

                point.appendChild(marker);

            }


            // --------------------------------------
            // Handle point clicks
            // --------------------------------------

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


// ------------------------------------------
// Stone Cursor Preview
// ------------------------------------------

let diagramCursor = null;


// Create the custom stone cursor

function initDiagramStoneCursor() {

    const board = document.getElementById("diagram-board");

    if (!board) return;

    // Prevent creating duplicate cursors
    if (diagramCursor) return;

    // Create the cursor element
    diagramCursor = document.createElement("div");

    diagramCursor.className =
        `stone-cursor-preview ${diagramColor}`;

    document.body.appendChild(diagramCursor);


    // Show the stone cursor when entering the board

    board.addEventListener("pointerenter", (event) => {

        if (event.pointerType !== "mouse") return;

        diagramCursor.style.display = "block";

    });


    // Make the stone follow the mouse

    board.addEventListener("pointermove", (event) => {

        // Only use the custom cursor for a mouse
        if (event.pointerType !== "mouse") {

            diagramCursor.style.display = "none";

            return;

        }

        diagramCursor.style.display = "block";

        diagramCursor.style.left = `${event.clientX}px`;

        diagramCursor.style.top = `${event.clientY}px`;

    });


    // Hide the stone cursor when leaving the board

    board.addEventListener("pointerleave", () => {

        diagramCursor.style.display = "none";

    });

}


// Update the cursor color

function updateDiagramCursorColor() {

    if (!diagramCursor) return;

    diagramCursor.classList.remove("black", "white");

    diagramCursor.classList.add(diagramColor);

}


// Change the selected stone color

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

    // Synchronize the mouse cursor color
    updateDiagramCursorColor();

}


// Place a stone on the diagram board

function placeDiagramStone(row, col) {

    diagramBoard[row][col] =
        diagramBoard[row][col] ? null : diagramColor;

    drawDiagramBoard();

}


// Draw the Chapter 1 board

function drawDiagramBoard() {

    const container = document.getElementById("diagram-board");

    if (container) {

        renderBoard(
            container,
            diagramBoard,
            placeDiagramStone
        );

    }

}


// Reset the Chapter 1 board

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

// Find a connected group and all its liberties.

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


            // Empty intersections are liberties

            if (neighborColor === null) {

                liberties.add(key);

            }

            // Connected stones of the same color
            // belong to the same group.

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

// Create the liberty demonstration board.

let libertyBoard = createEmptyBoard(9);


// Black always plays first.

let libertyCurrentPlayer = "black";


// Currently selected stone.

let libertySelected = null;


// Captured stone counts.

let libertyBlackCaptures = 0;

let libertyWhiteCaptures = 0;


// Feedback messages.

let libertyNotice = "";


/* ------------------------------------------
   4.3 HANDLE BOARD INTERACTIONS
------------------------------------------ */

function placeLibertyStone(row, col) {


    // --------------------------------------
    // Clicking an existing stone
    // --------------------------------------

    // Select the stone's entire connected group
    // and display its shared liberties.

    if (libertyBoard[row][col] !== null) {

        libertySelected = {
            row,
            col
        };

        libertyNotice = "";

        drawLibertyBoard();

        return;

    }


    // --------------------------------------
    // Prepare a temporary board
    // --------------------------------------

    // We use a temporary board so that
    // illegal moves cannot modify the real board.

    const candidate = cloneBoard(libertyBoard);

    const color = libertyCurrentPlayer;

    const opponent =
        color === "black" ? "white" : "black";


    // Place the new stone.

    candidate[row][col] = color;


    // --------------------------------------
    // Check adjacent opponent groups
    // --------------------------------------

    const capturedGroups = [];

    const checked = new Set();


    for (const [r, c] of getNeighbors(row, col, 9)) {

        if (candidate[r][c] !== opponent) {

            continue;

        }

        const key = `${r},${c}`;

        if (checked.has(key)) {

            continue;

        }


        // Find the entire connected opponent group.

        const group = getGroup(candidate, r, c);


        // Mark every stone in this group as checked.

        group.stones.forEach(([gr, gc]) => {

            checked.add(`${gr},${gc}`);

        });


        // A group with zero liberties is captured.

        if (group.liberties.size === 0) {

            capturedGroups.push(...group.stones);

        }

    }


    // --------------------------------------
    // Remove captured opponent stones
    // --------------------------------------

    capturedGroups.forEach(([r, c]) => {

        candidate[r][c] = null;

    });


    // --------------------------------------
    // Check for suicidal moves
    // --------------------------------------

    const newGroup = getGroup(
        candidate,
        row,
        col
    );


    // A move is illegal if the new group
    // has no liberties and captures nothing.

    if (
        newGroup.liberties.size === 0 &&
        capturedGroups.length === 0
    ) {

        libertyNotice =
            "Illegal move: this stone would have no liberties.";

        drawLibertyBoard();

        return;

    }


    // --------------------------------------
    // Save the new board
    // --------------------------------------

    libertyBoard = candidate;

    libertySelected = {
        row,
        col
    };


    // --------------------------------------
    // Update captured stone counts
    // --------------------------------------

    if (color === "black") {

        libertyBlackCaptures += capturedGroups.length;

    } else {

        libertyWhiteCaptures += capturedGroups.length;

    }


    // --------------------------------------
    // Display move feedback
    // --------------------------------------

    if (capturedGroups.length > 0) {

        libertyNotice =
            `${color.toUpperCase()} captured ` +
            `${capturedGroups.length} stone(s)!`;

    } else {

        libertyNotice = "";

    }


    // --------------------------------------
    // Switch players
    // --------------------------------------

    libertyCurrentPlayer = opponent;


    // Redraw the board.

    drawLibertyBoard();

}


/* ------------------------------------------
   4.4 DRAW THE LIBERTY BOARD
------------------------------------------ */

function drawLibertyBoard() {

    const container = document.getElementById("liberty-board");

    if (!container) return;

    const statusEl = document.getElementById("liberty-status");


    // Set of highlighted liberty intersections.

    let highlighted = new Set();

    let statusMessage = "";


    // --------------------------------------
    // Find the selected group's liberties
    // --------------------------------------

    if (libertySelected) {

        const { row, col } = libertySelected;

        const selectedColor = libertyBoard[row][col];


        // Check that the selected stone still exists.

        if (selectedColor !== null) {

            const group = getGroup(
                libertyBoard,
                row,
                col
            );


            // Highlight every liberty of the group.

            highlighted = group.liberties;


            statusMessage =
                `Selected ${selectedColor.toUpperCase()} group: ` +
                `${group.stones.length} stone(s), ` +
                `${group.liberties.size} liberties. `;

        }

    }


    // --------------------------------------
    // Display board information
    // --------------------------------------

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


    // --------------------------------------
    // Display captured stone information
    // --------------------------------------

    statusMessage +=
        `Captured — Black: ${libertyBlackCaptures}, ` +
        `White: ${libertyWhiteCaptures}.`;


    // --------------------------------------
    // Display additional feedback
    // --------------------------------------

    if (libertyNotice) {

        statusMessage =
            `${libertyNotice} ${statusMessage}`;

    }


    if (statusEl) {

        statusEl.textContent = statusMessage;

    }


    // --------------------------------------
    // Render the board
    // --------------------------------------

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

    // Clear all stones.

    libertyBoard = createEmptyBoard(9);


    // Black starts again.

    libertyCurrentPlayer = "black";


    // Clear selected stone.

    libertySelected = null;


    // Reset captured stone counts.

    libertyBlackCaptures = 0;

    libertyWhiteCaptures = 0;


    // Clear feedback messages.

    libertyNotice = "";


    // Redraw the empty board.

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


// Draw the capture demonstration

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


    const stepEl = document.getElementById("capture-step");

    const titleEl = document.getElementById("capture-title");

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


    const nextButton = document.getElementById("capture-next");

    if (nextButton) {

        nextButton.disabled =
            captureStepIndex === captureSteps.length - 1;

    }

}


// Move to the next capture step

function nextCaptureStep() {

    if (captureStepIndex < captureSteps.length - 1) {

        captureStepIndex++;

        drawCaptureBoard();

    }

}


// Reset the capture demonstration

function resetCaptureDemo() {

    captureStepIndex = 0;

    drawCaptureBoard();

}


/* ==========================================
   6. CHAPTER 3 - PLAYABLE GO BOARD
   Improved Game Logic
========================================== */

let game = {};


// ------------------------------------------
// 6.1 CREATE A NEW GAME
// ------------------------------------------

function createNewGame() {

    return {

        board: createEmptyBoard(19),

        currentPlayer: "black",

        blackCaptures: 0,

        whiteCaptures: 0,

        lastMove: null,

        previousBoard: null,

        consecutivePasses: 0,

        gameOver: false,

        statusMessage:
            "Black plays first. Choose an empty intersection.",

        undoStack: [],

        moveHistory: []

    };

}


// ------------------------------------------
// 6.2 SAVE GAME STATE
// ------------------------------------------

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

        gameOver: game.gameOver,

        statusMessage: game.statusMessage,

        moveHistory: [...game.moveHistory]

    });

}


// ------------------------------------------
// 6.3 RESTORE GAME STATE
// ------------------------------------------

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

    game.gameOver = state.gameOver;

    game.statusMessage = state.statusMessage;

    game.moveHistory = [...state.moveHistory];

}


// ------------------------------------------
// 6.4 GET PLAYER NAME
// ------------------------------------------

function getPlayerName(color) {

    return color === "black" ? "Black" : "White";

}


// ------------------------------------------
// 6.5 GET BOARD COORDINATES
// ------------------------------------------

function getMoveCoordinate(row, col) {

    const letters = "ABCDEFGHJKLMNOPQRST";

    const column = letters[col] || `${col + 1}`;

    const boardRow = game.board.length - row;

    return `${column}${boardRow}`;

}


// ------------------------------------------
// 6.6 PLAY A MOVE
// ------------------------------------------

function playMove(row, col) {

    if (game.gameOver) {

        return;

    }


    // Check occupied intersections.

    if (game.board[row][col] !== null) {

        game.statusMessage =
            "This intersection is already occupied. Choose an empty point.";

        updateGameInformation();

        return;

    }


    const size = game.board.length;

    const candidate = cloneBoard(game.board);

    const color = game.currentPlayer;

    const opponent =
        color === "black" ? "white" : "black";


    // Save the board before this move.

    const boardBeforeMove = cloneBoard(game.board);


    // Place the new stone.

    candidate[row][col] = color;


    // --------------------------------------
    // Check adjacent opponent groups
    // --------------------------------------

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


    // --------------------------------------
    // Remove captured stones
    // --------------------------------------

    capturedGroups.forEach(([r, c]) => {

        candidate[r][c] = null;

    });


    // --------------------------------------
    // Check suicide
    // --------------------------------------

    const newGroup = getGroup(
        candidate,
        row,
        col
    );


    if (
        newGroup.liberties.size === 0 &&
        capturedGroups.length === 0
    ) {

        game.statusMessage =
            "Illegal move! Your new group would have no liberties.";

        updateGameInformation();

        return;

    }


    // --------------------------------------
    // Check the simple Ko rule
    // --------------------------------------

    if (
        game.previousBoard &&
        boardToString(candidate) ===
        boardToString(game.previousBoard)
    ) {

        game.statusMessage =
            "Illegal move! The Ko rule prevents an immediate repetition.";

        updateGameInformation();

        return;

    }


    // --------------------------------------
    // Save state before changing the game
    // --------------------------------------

    saveGameState();


    // --------------------------------------
    // Update the board
    // --------------------------------------

    game.board = candidate;

    game.previousBoard = boardBeforeMove;

    game.lastMove = {
        row,
        col
    };


    // A normal move resets consecutive passes.

    game.consecutivePasses = 0;


    // --------------------------------------
    // Update capture counts
    // --------------------------------------

    if (color === "black") {

        game.blackCaptures += capturedGroups.length;

    } else {

        game.whiteCaptures += capturedGroups.length;

    }


    // --------------------------------------
    // Record the move
    // --------------------------------------

    game.moveHistory.push({

        type: "move",

        color,

        row,

        col,

        coordinate: getMoveCoordinate(row, col),

        captured: capturedGroups.length

    });


    // --------------------------------------
    // Switch players
    // --------------------------------------

    game.currentPlayer = opponent;


    // --------------------------------------
    // Update feedback
    // --------------------------------------

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


// ------------------------------------------
// 6.7 UNDO LAST ACTION
// ------------------------------------------

function undoMove() {

    if (game.undoStack.length === 0) {

        game.statusMessage =
            "There is no previous move to undo.";

        updateGameInformation();

        return;

    }


    const previousState = game.undoStack.pop();

    restoreGameState(previousState);


    game.statusMessage = "Last action undone.";

    renderGameBoard();

    updateGameInformation();

}


// ------------------------------------------
// 6.8 PASS TURN
// ------------------------------------------

function passTurn() {

    if (game.gameOver) {

        return;

    }


    const color = game.currentPlayer;

    const opponent =
        color === "black" ? "white" : "black";


    // Save the current state for Undo.

    saveGameState();


    // Record the pass.

    game.moveHistory.push({

        type: "pass",

        color

    });


    game.consecutivePasses++;


    // Passing resets the immediate Ko restriction.

    game.previousBoard = null;

    game.lastMove = null;


    // Switch players.

    game.currentPlayer = opponent;


    // Check consecutive passes.

    if (game.consecutivePasses >= 2) {

        game.gameOver = true;

        game.statusMessage =
            "Game over! Both players passed. You can review the game or restart.";

    } else {

        game.statusMessage =
            `${getPlayerName(color)} passed. ` +
            `${getPlayerName(opponent)} to play.`;

    }


    renderGameBoard();

    updateGameInformation();

}


// ------------------------------------------
// 6.9 RENDER THE GAME BOARD
// ------------------------------------------

function renderGameBoard() {

    const container = document.getElementById("play-board");

    if (!container) return;


    renderBoard(

        container,

        game.board,

        playMove,

        {

            lastMove: game.lastMove

        }

    );

}


// ------------------------------------------
// 6.10 RENDER MOVE HISTORY
// ------------------------------------------

function renderMoveHistory() {

    const historyContainer =
        document.getElementById("game-history-list");

    if (!historyContainer) return;


    historyContainer.innerHTML = "";


    if (game.moveHistory.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.textContent =
            "No moves yet. Start playing!";

        historyContainer.appendChild(emptyMessage);

        return;

    }


    game.moveHistory.forEach((move, index) => {

        const item = document.createElement("div");

        item.className = "game-history-item";


        const player = getPlayerName(move.color);

        let description;


        if (move.type === "pass") {

            description =
                `${index + 1}. ${player} — Pass`;

        } else {

            description =
                `${index + 1}. ${player} — ${move.coordinate}`;

            if (move.captured > 0) {

                description +=
                    ` (Captured ${move.captured})`;

            }

        }


        item.textContent = description;

        historyContainer.appendChild(item);

    });


    historyContainer.scrollTop =
        historyContainer.scrollHeight;

}


// ------------------------------------------
// 6.11 UPDATE GAME INFORMATION
// ------------------------------------------

function updateGameInformation() {

    const bCap =
        document.getElementById("black-captures");

    const wCap =
        document.getElementById("white-captures");


    if (bCap) {

        bCap.textContent = game.blackCaptures;

    }


    if (wCap) {

        wCap.textContent = game.whiteCaptures;

    }


    const turnText =
        document.getElementById("turn-text");


    if (turnText) {

        if (game.gameOver) {

            turnText.textContent = "Game Over";

        } else {

            turnText.textContent =
                `${getPlayerName(game.currentPlayer)} to play`;

        }

    }


    // Update feedback message.

    const feedback =
        document.getElementById("game-feedback");

    if (feedback) {

        feedback.textContent = game.statusMessage;

    }


    // Update Undo button.

    const undoButton =
        document.getElementById("undo-button");

    if (undoButton) {

        undoButton.disabled =
            game.undoStack.length === 0;

    }


    // Update Pass button.

    const passButton =
        document.getElementById("pass-button");

    if (passButton) {

        passButton.disabled = game.gameOver;

    }


    // Update move history.

    renderMoveHistory();

}


// ------------------------------------------
// 6.12 CREATE GAME CONTROLS
// ------------------------------------------

function createGameControls() {

    const board = document.getElementById("play-board");

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


    panel.appendChild(undoButton);

    panel.appendChild(passButton);


    // Insert controls below the game header if possible.

    const gameHeader =
        board.closest(".demo-panel")
            ?.querySelector(".game-header");


    if (gameHeader) {

        gameHeader.insertAdjacentElement(
            "afterend",
            panel
        );

    } else {

        board.insertAdjacentElement(
            "beforebegin",
            panel
        );

    }


    // --------------------------------------
    // Create feedback area
    // --------------------------------------

    const feedback = document.createElement("p");

    feedback.id = "game-feedback";

    feedback.className = "game-feedback";

    feedback.setAttribute("aria-live", "polite");

    feedback.textContent =
        "Black plays first. Choose an empty intersection.";


    panel.insertAdjacentElement(
        "afterend",
        feedback
    );


    // --------------------------------------
    // Create move history area
    // --------------------------------------

    const historySection =
        document.createElement("section");

    historySection.id = "game-history";

    historySection.className = "game-history";


    const historyTitle =
        document.createElement("h3");

    historyTitle.textContent = "Move History";


    const historyList =
        document.createElement("div");

    historyList.id = "game-history-list";

    historyList.className = "game-history-list";


    historySection.appendChild(historyTitle);

    historySection.appendChild(historyList);


    const sidebar =
        board.closest(".demo-panel")
            ?.querySelector(".game-sidebar-stats");


    if (sidebar) {

        sidebar.appendChild(historySection);

    } else {

        feedback.insertAdjacentElement(
            "afterend",
            historySection
        );

    }

}


// ------------------------------------------
// 6.13 RESTART GAME
// ------------------------------------------

function restartGame() {

    game = createNewGame();

    renderGameBoard();

    updateGameInformation();

}


// ------------------------------------------
// 6.14 INITIALIZE CHAPTER 3
// ------------------------------------------

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


    // --------------------------------------
    // Chapter 1: Board Explorer
    // --------------------------------------

    if (document.getElementById("diagram-board")) {

        drawDiagramBoard();

        initDiagramStoneCursor();

    }


    // --------------------------------------
    // Chapter 2: Liberties and Capturing
    // --------------------------------------

    if (document.getElementById("liberty-board")) {

        drawLibertyBoard();

        drawCaptureBoard();

    }


    // --------------------------------------
    // Chapter 3: Playable Board
    // --------------------------------------

    if (document.getElementById("play-board")) {

        initializeGame();

    }

});

