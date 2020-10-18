// ------------------------------------------------------------------------
// ------------------GAME FLOW MODULE--------------------------------------
// ------------------------------------------------------------------------

const gameFlowController = (function () {
  function squarePress(position) {
    if (gameBoard.isPositionFree(position)) {
      boardUI.deactivateSquare(position);
      _placeMark(position);
      _handleWinOrTie();
    }
  }

  function replay() {
    gameBoard.wipeBoard();
    boardUI.resetBoard();
    playerController.resetPlayers();
    playerCreationUI.showCreationUI();
  }

  function _placeMark(position) {
    const player = playerController.getActivePlayer();
    gameBoard.addMark(player.getMark(), position);
    boardUI.displayBoard(gameBoard.getBoardState());
  }

  function _handleWinOrTie() {
    const gameStatus = gameBoard.isGameFinished();
    if (gameStatus.finished) {
      boardUI.deactivateBoard();
      let winningPlayer = gameStatus.won
        ? playerController.getActivePlayer()
        : null;
      messageDisplay.displayWinOrTie(winningPlayer);
    } else {
      _playNextTurn();
    }
  }

  function _playNextTurn() {
    playerController.switchPlayers();
    upperDisplayUI.displayCurrentPlayer();
  }

  return { squarePress, replay };
})();

// ------------------------------------------------------------------------
// ------------------GAME BOARD MODULE-------------------------------------
// ------------------------------------------------------------------------

const gameBoard = (function () {
  let boardState = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];

  let marksCount = 0;

  function getBoardState() {
    return boardState;
  }
  Error;
  function getMarksCount() {
    return marksCount;
  }

  function addMark(mark, position) {
    let postionOnBoard = boardState[position[0]][position[1]];
    if (!postionOnBoard) {
      boardState[position[0]][position[1]] = mark;
      marksCount++;
    }
  }

  function isPositionFree(position) {
    return !boardState[position[0]][position[1]];
  }

  function isGameFinished() {
    let gameStatus = {
      finished: false,
      won: false,
    };
    let lines = _generateLines();
    lines.forEach((line) => {
      let uniqueEntries = Array.from(new Set(line));
      if (uniqueEntries.length === 1 && uniqueEntries[0] !== "") {
        gameStatus.finished = true;
        gameStatus.won = true;
      }
    });
    if (_countBoard() === 9) {
      gameStatus.finished = true;
    }

    return gameStatus;
  }

  function _generateLines() {
    let rows = boardState;
    let columns = _generateColumns(rows);
    let cross = _generateCross(rows);
    let joined = [...rows, ...columns, ...cross];
    return joined;
  }

  function _generateColumns(arr) {
    let columns = arr.reduce(
      (acc, row) => {
        for (let i = 0; i < row.length; i++) {
          acc[i].push(row[i]);
        }
        return acc;
      },
      [[], [], []]
    );
    return columns;
  }

  function _generateCross(arr) {
    cross = [
      [arr[0][0], arr[1][1], arr[2][2]],
      [arr[0][2], arr[1][1], arr[2][0]],
    ];
    return cross;
  }

  function _countBoard() {
    let count = 0;
    boardState.forEach((row) => {
      row.forEach((square) => (square !== "" ? count++ : null));
    });
    return count;
  }

  function wipeBoard() {
    boardState = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];
  }

  return {
    addMark,
    getBoardState,
    getMarksCount,
    isPositionFree,
    isGameFinished,
    wipeBoard,
  };
})();

// ------------------------------------------------------------------------
// ------------------BOARD UI MODULE---------------------------------------
// ------------------------------------------------------------------------

const boardUI = (function () {
  let boardActive = true;
  const squares = document.querySelectorAll(".square");

  squares.forEach((square) => {
    square.addEventListener("click", _handleSquarePress);
  });

  function _handleSquarePress(e) {
    if (boardActive) {
      const currPosition = [e.target.dataset.x, e.target.dataset.y];
      gameFlowController.squarePress(currPosition);
    }
  }

  function displayBoard(board) {
    squares.forEach((square) => {
      let x = square.dataset.x;
      let y = square.dataset.y;
      square.innerText = board[x][y];
    });
  }

  function deactivateSquare(position) {
    squares.forEach((square) => {
      if (square.dataset.x == position[0] && square.dataset.y == position[1]) {
        square.classList.remove("active");
      }
    });
  }

  function deactivateBoard() {
    boardActive = false;
    squares.forEach((square) => square.classList.remove("active"));
  }

  function activateBoard() {
    boardActive = true;
    squares.forEach((square) => square.classList.add("active"));
  }

  function resetBoard() {
    squares.forEach((square) => (square.innerText = ""));
  }

  return {
    displayBoard,
    deactivateSquare,
    deactivateBoard,
    resetBoard,
    activateBoard,
  };
})();

// ------------------------------------------------------------------------
// ------------------PLAYER CONTROLLER MODULE------------------------------
// ------------------------------------------------------------------------

const playerController = (function () {
  let activePlayer = {};
  let unactivePlayer = {};

  const _playerFactory = function (name, mark, color) {
    function getName() {
      return name;
    }
    function getMark() {
      return mark;
    }
    function getColor() {
      return color;
    }
    return { getName, getMark, getColor };
  };

  function addPlayer(name, color) {
    if (Object.keys(activePlayer).length === 0) {
      activePlayer = _playerFactory(name, "X", color);
    } else if (Object.keys(unactivePlayer).length === 0) {
      unactivePlayer = _playerFactory(name, "O", color);
    }
  }

  function switchPlayers() {
    [activePlayer, unactivePlayer] = [unactivePlayer, activePlayer];
  }

  function getActivePlayer() {
    return activePlayer;
  }

  function resetPlayers() {
    activePlayer = {};
    unactivePlayer = {};
  }

  return { addPlayer, getActivePlayer, switchPlayers, resetPlayers };
})();

// ------------------------------------------------------------------------
// ------------------PLAYER CREATION UI------------------------------------
// ------------------------------------------------------------------------

const playerCreationUI = (function () {
  const creationWindow = document.querySelector(".creation-wrapper");
  const playerOneInput = document.querySelector(".player-one-name");
  const playerTwoInput = document.querySelector(".player-two-name");
  const createButton = document.querySelector(".create-players");
  const cancelButton = document.querySelector(".cancel");
  const exitButton = document.querySelector(".exit");

  createButton.addEventListener("click", _handleCreatePlayers);
  cancelButton.addEventListener("click", _cancelCreation);
  exitButton.addEventListener("click", _cancelCreation);
  creationWindow.addEventListener("click", _handleOutsideClick);

  function _handleCreatePlayers(e) {
    const playerOneForm = new FormData(
      document.querySelector(".player-one-form")
    );
    const playerTwoForm = new FormData(
      document.querySelector(".player-two-form")
    );
    if (_checkForm(playerOneForm) && _checkForm(playerTwoForm)) {
      const playerOneColor = document.querySelector(
        'input[name="player-one-color"]:checked'
      ).value;
      const playerTwoColor = document.querySelector(
        'input[name="player-two-color"]:checked'
      ).value;
      if (
        playerOneInput &&
        playerTwoInput &&
        playerOneColor &&
        playerTwoColor
      ) {
        playerController.addPlayer(playerOneInput.value, playerOneColor);
        playerController.addPlayer(playerTwoInput.value, playerTwoColor);
        upperDisplayUI.displayCurrentPlayer();
        creationWindow.classList.add("hidden");
        boardUI.activateBoard();
      }
    } else {
      _displayError("Fill out whole form!");
    }
  }

  function _checkForm(form) {
    let formChecked = true;
    for (let value of form.entries()) {
      console.log(value[1]);
      if (!value[1]) {
        formChecked = false;
      }
    }
    console.log(formChecked);
    return formChecked;
  }

  function _displayError(input) {
    const errorOutput = document.querySelector(".player-creation-error");
    errorOutput.innerText = input;
  }

  function _cancelCreation(e) {
    e.preventDefault();
    creationWindow.classList.add("hidden");
    _clearInputs();
  }

  function _handleOutsideClick(e) {
    if (e.target.classList.contains("creation-wrapper")) {
      _cancelCreation(e);
      _clearInputs();
    }
  }

  function _clearInputs() {
    playerOneInput.value = "";
    playerTwoInput.value = "";
    document.querySelector(
      'input[name="player-one-color"]:checked'
    ).checked = false;
    document.querySelector(
      'input[name="player-two-color"]:checked'
    ).checked = false;
    document.querySelector(
      'input[data-type="player-one-default"]'
    ).checked = true;
    document.querySelector(
      'input[data-type="player-two-default"]'
    ).checked = true;
  }

  function showCreationUI() {
    _clearInputs();
    creationWindow.classList.remove("hidden");
  }

  return { showCreationUI };
})();

// ------------------------------------------------------------------------
// ------------------MESSAGE DISPLAY UI MODULE-----------------------------
// ------------------------------------------------------------------------

const messageDisplay = (function () {
  const messageDisplay = document.querySelector(".message-container");
  const okButton = document.querySelector(".ok");

  okButton.addEventListener("click", _hideMessage);
  messageDisplay.addEventListener("click", _handleOutsideClick);

  function displayWinOrTie(player) {
    let output;
    if (player) {
      output = `${player.getName()} won! Congratulations!`;
    } else {
      output = "It's a tie!";
    }
    messageDisplay.querySelector(".message-display").innerText = output;
    messageDisplay.classList.remove("hidden");
  }

  function _hideMessage() {
    messageDisplay.classList.add("hidden");
  }

  function _handleOutsideClick(e) {
    if (e.target.classList.contains("message-container")) {
      _hideMessage();
    }
  }

  return { displayWinOrTie };
})();

// ------------------------------------------------------------------------
// ------------------UPPER DISPLAY UI MODULE-------------------------------
// ------------------------------------------------------------------------

const upperDisplayUI = (function () {
  const activePlayerDisplay = document.querySelector(".active-player");
  const newGameButton = document.querySelector(".new-game");

  newGameButton.addEventListener("click", gameFlowController.replay);

  function displayCurrentPlayer() {
    const player = playerController.getActivePlayer();
    activePlayerDisplay.innerText = player.getName();
    document.documentElement.style.setProperty(
      "--player",
      `${player.getColor()}`
    );
  }

  return { displayCurrentPlayer };
})();

boardUI.deactivateBoard(); // Initial deactivation of the board TODO make deactivated as default
