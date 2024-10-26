// DOM Elements
const wordInput = document.getElementById("word-input");
const definitionInput = document.getElementById("definition-input");
const addWordBtn = document.getElementById("add-word-btn");
const wordList = document.getElementById("words");
const clearWordsBtn = document.getElementById("clear-words-btn");
const createCrosswordBtn = document.getElementById("create-crossword-btn");
const wordCountDisplay = document.getElementById("word-count");

// Word collection
let words = [];

// Load words from localStorage
function loadWords() {
  const storedWords = localStorage.getItem("crosswordWords");
  if (storedWords) {
    words = JSON.parse(storedWords);
    updateWordList();
    updateWordCount();
  }
}

// Save words to localStorage
function saveWords() {
  localStorage.setItem("crosswordWords", JSON.stringify(words));
}

// Add a new word
function addWord() {
  const word = wordInput.value.trim().toLowerCase();
  const definition = definitionInput.value.trim();

  if (validateWord(word)) {
    const newWord = {
      id: Date.now().toString(),
      word: word,
      definition: definition,
      dateAdded: new Date().toISOString(),
      timesUsed: 0,
      lastUsed: null
    };

    words.push(newWord);
    saveWords();
    updateWordList();
    updateWordCount();
    wordInput.value = "";
    definitionInput.value = "";
  }
}

// Validate word
function validateWord(word) {
  if (word.length < 3 || word.length > 15) {
    alert("Word must be between 3 and 15 characters long.");
    return false;
  }

  if (!/^[a-zA-Z]+$/.test(word)) {
    alert("Word must contain only letters.");
    return false;
  }

  if (words.some((w) => w.word.toLowerCase() === word.toLowerCase())) {
    alert("This word already exists in the list.");
    return false;
  }

  return true;
}

// Update word list display
function updateWordList() {
  const wordsList = document.getElementById("words");
  wordsList.innerHTML = "";
  words.forEach((word, index) => {
    const li = document.createElement("li");
    li.textContent = `${word.word}${
      word.definition ? ` - ${word.definition}` : ""
    }`;

    // Add remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.style.float = "right";
    removeBtn.style.padding = "0 6px";
    removeBtn.style.marginLeft = "10px";
    removeBtn.onclick = () => removeWord(index);

    li.appendChild(removeBtn);
    wordsList.appendChild(li);
  });
  updateWordCount();
}

// Add removeWord function
function removeWord(index) {
  words.splice(index, 1);
  saveWords();
  updateWordList();
}

// Update word count display
function updateWordCount() {
  wordCountDisplay.textContent = `Words: ${words.length}`;
}

// Clear all words
function clearWords() {
  if (confirm("Are you sure you want to clear all words?")) {
    words = [];
    saveWords();
    updateWordList();
    updateWordCount();
  }
}

// Event listeners
addWordBtn.addEventListener("click", addWord);
clearWordsBtn.addEventListener("click", clearWords);
createCrosswordBtn.addEventListener("click", initCrosswordCreation);

// DOM Elements for Crossword Creation Screen
const wordInputScreen = document.getElementById("word-input-screen");
const crosswordCreationScreen = document.getElementById(
  "crossword-creation-screen"
);
const crosswordGrid = document.getElementById("crossword-grid");
const availableWordsList = document.getElementById("available-words");
const clearCrosswordBtn = document.getElementById("clear-crossword-btn");
const savePuzzleBtn = document.getElementById("save-puzzle-btn");
const backToWordsBtn = document.getElementById("back-to-words-btn");
const orientationBtn = document.getElementById("orientation-btn");

// Crossword data
let crossword = {
  grid: [],
  words: [], // Words with their positions
  solution: [], // Complete solution grid
  playerGrid: [], // Player's current progress
  currentDirection: "horizontal" // Track current direction
};

// Add these variables at the top of the file, after crossword declaration
let minRow = 0;
let minCol = 0;

// Function to automatically arrange words into a crossword
function generateCrossword() {
  if (words.length === 0) {
    alert("Please add some words first!");
    return;
  }

  // Initialize crossword data
  crossword = {
    grid: [],
    words: [],
    solution: [],
    playerGrid: [],
    currentDirection: "horizontal" // Track current direction
  };

  // Sort words by length (longer words first)
  const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);

  // Place first word horizontally in the center
  const firstWord = sortedWords[0];
  if (!firstWord) return;

  // Place first word at position (1,1) to allow for expansion
  placeWordInCrossword(
    {
      word: firstWord.word,
      definition: firstWord.definition
    },
    1,
    1,
    true
  );

  // Try to place remaining words
  for (let i = 1; i < sortedWords.length; i++) {
    const currentWord = sortedWords[i];
    if (!currentWord) continue;

    let placed = false;

    // Try to find intersections with already placed words
    for (const placedWord of crossword.words) {
      // Find matching letters between current word and placed word
      const currentLetters = currentWord.word.toUpperCase().split("");
      const placedLetters = placedWord.word.toUpperCase().split("");

      for (let ci = 0; ci < currentLetters.length && !placed; ci++) {
        for (let pi = 0; pi < placedLetters.length && !placed; pi++) {
          if (currentLetters[ci] === placedLetters[pi]) {
            // Try placing current word vertically if placed word is horizontal
            if (placedWord.horizontal) {
              const newRow = Math.max(0, placedWord.row - ci);
              const newCol = placedWord.col + pi;
              if (canPlaceWordVertically(currentWord.word, newRow, newCol)) {
                placeWordInCrossword(
                  {
                    word: currentWord.word,
                    definition: currentWord.definition
                  },
                  newRow,
                  newCol,
                  false
                );
                placed = true;
              }
            }
            // Try placing current word horizontally if placed word is vertical
            else {
              const newRow = placedWord.row + pi;
              const newCol = Math.max(0, placedWord.col - ci);
              if (canPlaceWordHorizontally(currentWord.word, newRow, newCol)) {
                placeWordInCrossword(
                  {
                    word: currentWord.word,
                    definition: currentWord.definition
                  },
                  newRow,
                  newCol,
                  true
                );
                placed = true;
              }
            }
          }
        }
      }
    }

    // If word couldn't be placed with intersections, place it below
    if (!placed) {
      const lastWord = crossword.words[crossword.words.length - 1];
      const newRow =
        lastWord.row + (lastWord.horizontal ? 2 : lastWord.word.length + 1);
      placeWordInCrossword(
        {
          word: currentWord.word,
          definition: currentWord.definition
        },
        newRow,
        1,
        true
      );
    }
  }

  normalizeGrid();
  createGrids();
  drawCrossword();
  showDefinitions();
}

// Add new function to find the best placement for a word
function findBestPlacement(newWord, placedWords) {
  const word = newWord.word.toUpperCase();
  let bestPlacement = null;
  let maxIntersections = 0;

  // For each placed word, try to find intersections
  crossword.words.forEach((placedWord) => {
    const placedString = placedWord.word.toUpperCase();

    // Find all possible intersections between the two words
    for (let i = 0; i < word.length; i++) {
      for (let j = 0; j < placedString.length; j++) {
        if (word[i] === placedString[j]) {
          // Try horizontal placement
          if (placedWord.horizontal) {
            const row = placedWord.row;
            const col = placedWord.col + j - i;
            if (canPlaceWordHorizontally(word, row, col)) {
              const intersections = countIntersections(word, row, col, true);
              if (intersections > maxIntersections) {
                maxIntersections = intersections;
                bestPlacement = { row, col, horizontal: true };
              }
            }
          }

          // Try vertical placement
          const row = placedWord.row + j - i;
          const col = placedWord.col;
          if (canPlaceWordVertically(word, row, col)) {
            const intersections = countIntersections(word, row, col, false);
            if (intersections > maxIntersections) {
              maxIntersections = intersections;
              bestPlacement = { row, col, horizontal: false };
            }
          }
        }
      }
    }
  });

  return bestPlacement;
}

// Add function to count intersections for a potential placement
function countIntersections(word, startRow, startCol, horizontal) {
  let intersections = 0;

  for (let i = 0; i < word.length; i++) {
    const row = horizontal ? startRow : startRow + i;
    const col = horizontal ? startCol + i : startCol;

    if (crossword.grid[row] && crossword.grid[row][col] === word[i]) {
      intersections++;
    }
  }

  return intersections;
}

// Update canPlaceWordHorizontally function
function canPlaceWordHorizontally(word, startRow, startCol) {
  const wordUpper = word.toUpperCase();

  // Check if word fits and doesn't overlap incorrectly
  for (let i = 0; i < wordUpper.length; i++) {
    const col = startCol + i;

    // Check if current cell is already occupied
    if (
      crossword.grid[startRow]?.[col] &&
      crossword.grid[startRow][col] !== wordUpper[i]
    ) {
      return false;
    }

    // Check cells above and below (no adjacent words)
    if (
      (crossword.grid[startRow - 1]?.[col] &&
        !crossword.grid[startRow]?.[col]) ||
      (crossword.grid[startRow + 1]?.[col] && !crossword.grid[startRow]?.[col])
    ) {
      return false;
    }
  }

  // Check cells before and after the word
  if (
    crossword.grid[startRow]?.[startCol - 1] ||
    crossword.grid[startRow]?.[startCol + wordUpper.length]
  ) {
    return false;
  }

  return true;
}

// Update canPlaceWordVertically function
function canPlaceWordVertically(word, startRow, startCol) {
  const wordUpper = word.toUpperCase();

  // Check if word fits and doesn't overlap incorrectly
  for (let i = 0; i < wordUpper.length; i++) {
    const row = startRow + i;

    // Check if current cell is already occupied
    if (
      crossword.grid[row]?.[startCol] &&
      crossword.grid[row][startCol] !== wordUpper[i]
    ) {
      return false;
    }

    // Check cells to left and right (no adjacent words)
    if (
      (crossword.grid[row]?.[startCol - 1] &&
        !crossword.grid[row]?.[startCol]) ||
      (crossword.grid[row]?.[startCol + 1] && !crossword.grid[row]?.[startCol])
    ) {
      return false;
    }
  }

  // Check cells before and after the word
  if (
    crossword.grid[startRow - 1]?.[startCol] ||
    crossword.grid[startRow + wordUpper.length]?.[startCol]
  ) {
    return false;
  }

  return true;
}

function hasConflict(row, col, letter) {
  if (row < 0 || col < 0) return true;

  // Check if the cell already has a different letter
  if (crossword.grid[row] && crossword.grid[row][col]) {
    return crossword.grid[row][col] !== letter;
  }

  // Check adjacent cells only if we're placing a new letter
  if (!crossword.grid[row] || !crossword.grid[row][col]) {
    const adjacentCells = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1]
    ];

    for (let [adjRow, adjCol] of adjacentCells) {
      if (
        crossword.grid[adjRow] &&
        crossword.grid[adjRow][adjCol] &&
        crossword.grid[adjRow][adjCol] !== "#"
      ) {
        return true;
      }
    }
  }

  return false;
}

function placeWordInCrossword(wordObj, row, col, horizontal) {
  if (!wordObj || !wordObj.word) {
    console.error("Invalid word object:", wordObj);
    return;
  }

  const word = wordObj.word.toUpperCase();

  // Initialize grid if empty
  if (crossword.grid.length === 0) {
    const initialSize = Math.max(word.length + 2, 10);
    for (let i = 0; i < initialSize; i++) {
      crossword.grid[i] = Array(initialSize).fill("");
    }
  }

  // Ensure positive coordinates
  row = Math.max(0, row);
  col = Math.max(0, col);

  // Expand grid if needed
  const neededRows = row + (horizontal ? 1 : word.length) + 1;
  const neededCols = col + (horizontal ? word.length : 1) + 1;

  // Add rows if needed
  while (crossword.grid.length < neededRows) {
    crossword.grid.push(Array(crossword.grid[0].length).fill(""));
  }

  // Add columns if needed
  for (let i = 0; i < crossword.grid.length; i++) {
    while (crossword.grid[i].length < neededCols) {
      crossword.grid[i].push("");
    }
  }

  // Place the word
  for (let i = 0; i < word.length; i++) {
    const currentRow = horizontal ? row : row + i;
    const currentCol = horizontal ? col + i : col;
    crossword.grid[currentRow][currentCol] = word[i];
  }

  crossword.words.push({
    word: word,
    definition: wordObj.definition || word,
    row,
    col,
    horizontal
  });
}

function createGrids() {
  // Create solution grid
  crossword.solution = crossword.grid.map((row) => [...row]);

  // Create empty player grid
  crossword.playerGrid = crossword.grid.map((row) =>
    row.map((cell) => (cell === "" ? "#" : ""))
  );
}

function showDefinitions() {
  console.log("Showing definitions"); // Debug log
  const acrossList = document.querySelector(
    "#across-definitions .definitions-list"
  );
  const downList = document.querySelector(
    "#down-definitions .definitions-list"
  );

  if (!acrossList || !downList) {
    console.error("Definition lists not found!"); // Debug log
    return;
  }

  // Clear existing definitions
  acrossList.innerHTML = "";
  downList.innerHTML = "";

  // Get numbered cells for reference
  const numberedCells = getNumberedCells();
  console.log("Numbered cells:", numberedCells); // Debug log

  // Sort words by their cell numbers
  const acrossWords = crossword.words
    .filter((word) => word.horizontal)
    .map((word) => ({
      ...word,
      number: numberedCells.find(
        (nc) => nc.row === word.row && nc.col === word.col
      )?.number
    }))
    .filter((word) => word.number) // Only include words that got a number
    .sort((a, b) => a.number - b.number);

  const downWords = crossword.words
    .filter((word) => !word.horizontal)
    .map((word) => ({
      ...word,
      number: numberedCells.find(
        (nc) => nc.row === word.row && nc.col === word.col
      )?.number
    }))
    .filter((word) => word.number) // Only include words that got a number
    .sort((a, b) => a.number - b.number);

  console.log("Across words:", acrossWords); // Debug log
  console.log("Down words:", downWords); // Debug log

  // Add definitions with word lengths
  acrossWords.forEach((word) => {
    const def = document.createElement("div");
    def.textContent = `${word.number}. ${word.definition || word.word} (${
      word.word.length
    })`;
    acrossList.appendChild(def);
  });

  downWords.forEach((word) => {
    const def = document.createElement("div");
    def.textContent = `${word.number}. ${word.definition || word.word} (${
      word.word.length
    })`;
    downList.appendChild(def);
  });
}

// Update the handleCellInput function
function handleCellInput(event, row, col) {
  const input = event.target;
  let value = input.value.toUpperCase();

  // Handle backspace/delete
  if (value === "") {
    crossword.playerGrid[row][col] = "";
    input.parentElement.style.backgroundColor = "white";

    // Find previous input in current word
    const prevInput = findPreviousInWord(row, col);
    if (prevInput) {
      setTimeout(() => prevInput.focus(), 0);
    }
    return;
  }

  // Only take the last character if multiple characters are pasted
  value = value.slice(-1);

  // Only allow letters
  if (/^[A-Z]$/.test(value)) {
    crossword.playerGrid[row][col] = value;
    input.value = value;

    // Check word completion
    crossword.words.forEach((word) => {
      if (isPartOfWord(row, col, word)) {
        const isWordCorrect = checkWord(word);
        if (isWordCorrect) {
          highlightWord(word, true);
        }
      }
    });

    // Find next input in current word
    const nextInput = findNextInWord(row, col);
    if (nextInput) {
      setTimeout(() => nextInput.focus(), 0);
    }
  } else {
    // Reset invalid input
    input.value = crossword.playerGrid[row][col] || "";
  }
}

// Add function to find the word at current position
function findWordAtPosition(row, col) {
  // First try to find a word in the current direction
  let word = crossword.words.find((w) => {
    if (crossword.currentDirection === "horizontal") {
      return (
        w.horizontal &&
        w.row === row &&
        col >= w.col &&
        col < w.col + w.word.length
      );
    } else {
      return (
        !w.horizontal &&
        w.col === col &&
        row >= w.row &&
        row < w.row + w.word.length
      );
    }
  });

  // If no word found in current direction, try the other direction
  if (!word) {
    word = crossword.words.find((w) => {
      if (crossword.currentDirection === "horizontal") {
        return (
          !w.horizontal &&
          w.col === col &&
          row >= w.row &&
          row < w.row + w.word.length
        );
      } else {
        return (
          w.horizontal &&
          w.row === row &&
          col >= w.col &&
          col < w.col + w.word.length
        );
      }
    });

    // If found word in other direction, switch direction
    if (word) {
      crossword.currentDirection =
        crossword.currentDirection === "horizontal" ? "vertical" : "horizontal";
    }
  }

  return word;
}

// Add function to find next input in current word
function findNextInWord(row, col) {
  const currentWord = findWordAtPosition(row, col);
  if (!currentWord) return null;

  if (currentWord.horizontal) {
    // If we're not at the end of the word
    if (col < currentWord.col + currentWord.word.length - 1) {
      return document.querySelector(
        `.grid-cell[style*="grid-area: ${row + 1} / ${col + 2}"] input`
      );
    }
  } else {
    // If we're not at the end of the word
    if (row < currentWord.row + currentWord.word.length - 1) {
      return document.querySelector(
        `.grid-cell[style*="grid-area: ${row + 2} / ${col + 1}"] input`
      );
    }
  }
  return null;
}

// Add function to find previous input in current word
function findPreviousInWord(row, col) {
  const currentWord = findWordAtPosition(row, col);
  if (!currentWord) return null;

  if (currentWord.horizontal) {
    // If we're not at the start of the word
    if (col > currentWord.col) {
      return document.querySelector(
        `.grid-cell[style*="grid-area: ${row + 1} / ${col}"] input`
      );
    }
  } else {
    // If we're not at the start of the word
    if (row > currentWord.row) {
      return document.querySelector(
        `.grid-cell[style*="grid-area: ${row} / ${col + 1}"] input`
      );
    }
  }
  return null;
}

// Update addKeyboardNavigation function
function addKeyboardNavigation() {
  document.addEventListener("keydown", (e) => {
    const activeElement = document.activeElement;
    if (!activeElement.matches(".cell-input")) return;

    const cell = activeElement.parentElement;
    const currentRow = parseInt(cell.style.gridArea.split(" / ")[0]) - 1;
    const currentCol = parseInt(cell.style.gridArea.split(" / ")[1]) - 1;

    switch (e.key) {
      case "ArrowRight":
        crossword.currentDirection = "horizontal";
        break;
      case "ArrowDown":
        crossword.currentDirection = "vertical";
        break;
      case "Backspace":
        if (activeElement.value === "") {
          e.preventDefault();
          const prevInput = findPreviousInWord(currentRow, currentCol);
          if (prevInput) {
            prevInput.focus();
          }
        }
        break;
    }
  });
}

// Update the drawCrossword function
function drawCrossword() {
  const crosswordGrid = document.getElementById("crossword-grid");
  crosswordGrid.innerHTML = "";
  crosswordGrid.style.background = "transparent";

  // Create a map of cells that are part of words
  const usedCells = new Map();
  crossword.words.forEach((word) => {
    const wordLength = word.word.length;
    for (let i = 0; i < wordLength; i++) {
      const row = word.horizontal ? word.row : word.row + i;
      const col = word.horizontal ? word.col + i : word.col;
      const key = `${row},${col}`;
      usedCells.set(key, true);
    }
  });

  // Find dimensions
  let minRow = Infinity,
    maxRow = -Infinity;
  let minCol = Infinity,
    maxCol = -Infinity;

  usedCells.forEach((_, key) => {
    const [row, col] = key.split(",").map(Number);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
  });

  // Set grid template
  const rows = maxRow - minRow + 1;
  const cols = maxCol - minCol + 1;
  crosswordGrid.style.gridTemplateColumns = `repeat(${cols}, 50px)`;
  crosswordGrid.style.gridTemplateRows = `repeat(${rows}, 50px)`;
  crosswordGrid.style.gap = "5px"; // Add some space between cells

  // Create only the cells that are part of words
  usedCells.forEach((_, key) => {
    const [row, col] = key.split(",").map(Number);
    const cellDiv = document.createElement("div");
    cellDiv.className = "grid-cell";
    cellDiv.style.gridArea = `${row + 1} / ${col + 1}`; // Use grid-area instead of separate row/column

    // Add number if this cell starts a word
    const cellNumber = getNumberedCells().find(
      (nc) => nc.row === row && nc.col === col
    )?.number;

    if (cellNumber) {
      const numberSpan = document.createElement("span");
      numberSpan.className = "number";
      numberSpan.textContent = cellNumber;
      cellDiv.appendChild(numberSpan);
    }

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 1;
    input.className = "cell-input";
    input.value = crossword.playerGrid[row]?.[col] || "";
    input.addEventListener("input", (e) => handleCellInput(e, row, col));

    cellDiv.appendChild(input);
    crosswordGrid.appendChild(cellDiv);
  });

  // Initialize keyboard navigation
  addKeyboardNavigation();
}

// Helper function to find adjacent cell
function findAdjacentCell(row, col, direction) {
  const key = `${row},${col + direction}`;
  const cell = document.querySelector(
    `.grid-cell[style*="grid-row: ${row - minRow + 1}"][style*="grid-column: ${
      col - minCol + direction + 1
    }"] input`
  );
  return cell;
}

// Check if solution is correct
function checkSolution() {
  let isComplete = true;
  let allCorrect = true;

  // Check each word
  crossword.words.forEach((word) => {
    for (let i = 0; i < word.word.length; i++) {
      const row = word.horizontal ? word.row : word.row + i;
      const col = word.horizontal ? word.col + i : word.col;

      // Find the cell by grid-area
      const cell = document.querySelector(
        `.grid-cell[style*="grid-area: ${row + 1} / ${col + 1}"]`
      );

      // If we found the cell, check its input
      if (cell) {
        const input = cell.querySelector("input");
        const value = input?.value?.toUpperCase() || "";
        const expectedValue = word.word[i].toUpperCase();

        if (!value) {
          console.log(`Empty cell at position ${row + 1},${col + 1}`);
          isComplete = false;
        } else if (value !== expectedValue) {
          console.log(
            `Incorrect value at position ${row + 1},${
              col + 1
            }: expected ${expectedValue}, got ${value}`
          );
          allCorrect = false;
        }
      } else {
        console.log(`Cell not found at position ${row + 1},${col + 1}`);
        isComplete = false;
      }
    }
  });

  if (!isComplete) {
    alert("Please fill in all the cells!");
  } else if (!allCorrect) {
    alert("Some answers are incorrect. Keep trying!");
  } else {
    alert("Congratulations! You solved the crossword!");
    // Highlight all words in green when solved correctly
    crossword.words.forEach((word) => highlightWord(word, true));
  }
}

// Add function to check if a word is complete and correct
function checkWord(word) {
  let isCorrect = true;
  const cells = document.querySelectorAll(".grid-cell");

  for (let i = 0; i < word.word.length; i++) {
    const row = word.horizontal ? word.row : word.row + i;
    const col = word.horizontal ? word.col + i : word.col;
    const cellIndex = row * crossword.grid[0].length + col;
    const cell = cells[cellIndex];
    const input = cell?.querySelector("input");

    if (
      !input ||
      !input.value ||
      input.value.toUpperCase() !== word.word[i].toUpperCase()
    ) {
      isCorrect = false;
      break;
    }
  }
  return isCorrect;
}

// Modify the initCrosswordCreation function
function initCrosswordCreation() {
  console.log("Initializing crossword creation"); // Debug log
  const crosswordCreationScreen = document.getElementById(
    "crossword-creation-screen"
  );
  const wordInputScreen = document.getElementById("word-input-screen");

  if (!crosswordCreationScreen || !wordInputScreen) {
    console.error("Screen elements not found!"); // Debug log
    return;
  }

  crosswordCreationScreen.style.display = "block";
  wordInputScreen.style.display = "none";
  generateCrossword();
}

// Update the normalizeGrid function to set minRow and minCol
function normalizeGrid() {
  // Find the minimum row and column
  minRow = Infinity;
  minCol = Infinity;

  crossword.words.forEach((word) => {
    minRow = Math.min(minRow, word.row);
    minCol = Math.min(minCol, word.col);
  });

  // Adjust all coordinates
  crossword.words = crossword.words.map((word) => ({
    ...word,
    row: word.row - minRow,
    col: word.col - minCol
  }));

  // Adjust the grid
  const newGrid = [];
  for (let i = 0; i < crossword.grid.length; i++) {
    for (let j = 0; j < crossword.grid[i].length; j++) {
      if (crossword.grid[i][j]) {
        const newRow = i - minRow;
        const newCol = j - minCol;
        if (!newGrid[newRow]) newGrid[newRow] = [];
        newGrid[newRow][newCol] = crossword.grid[i][j];
      }
    }
  }
  crossword.grid = newGrid;

  // Reset minRow and minCol after normalization
  minRow = 0;
  minCol = 0;
}

// Add this new function to get numbered cells
function getNumberedCells() {
  const numbered = [];
  let number = 1;

  crossword.words
    .sort((a, b) => {
      if (a.row === b.row) return a.col - b.col;
      return a.row - b.row;
    })
    .forEach((word) => {
      const cellNumber = numbered.find(
        (n) => n.row === word.row && n.col === word.col
      )?.number;
      if (!cellNumber) {
        numbered.push({
          row: word.row,
          col: word.col,
          number: number++
        });
      }
    });

  return numbered;
}

// Initialize
loadWords();

// Add these event listeners after the existing ones
clearCrosswordBtn.addEventListener("click", clearAnswers);
backToWordsBtn.addEventListener("click", () => {
  crosswordCreationScreen.style.display = "none";
  wordInputScreen.style.display = "block";
});
document
  .getElementById("check-solution-btn")
  .addEventListener("click", checkSolution);

// Add this new function to clear answers
function clearAnswers() {
  const cells = document.querySelectorAll(".grid-cell");
  cells.forEach((cell) => {
    const input = cell.querySelector("input");
    if (input) {
      input.value = "";
    }
    cell.style.backgroundColor = "white";
  });

  // Reset player grid
  crossword.playerGrid = crossword.grid.map((row) =>
    row.map((cell) => (cell === "" ? "#" : ""))
  );
}

// Update the showDefinitions function
function showDefinitions() {
  const acrossList = document.querySelector(
    "#across-definitions .definitions-list"
  );
  const downList = document.querySelector(
    "#down-definitions .definitions-list"
  );

  // Clear existing definitions
  acrossList.innerHTML = "";
  downList.innerHTML = "";

  // Get numbered cells for reference
  const numberedCells = getNumberedCells();

  // Sort words by their cell numbers
  const acrossWords = crossword.words
    .filter((word) => word.horizontal)
    .map((word) => ({
      ...word,
      number: numberedCells.find(
        (nc) => nc.row === word.row && nc.col === word.col
      ).number
    }))
    .sort((a, b) => a.number - b.number);

  const downWords = crossword.words
    .filter((word) => !word.horizontal)
    .map((word) => ({
      ...word,
      number: numberedCells.find(
        (nc) => nc.row === word.row && nc.col === word.col
      ).number
    }))
    .sort((a, b) => a.number - b.number);

  // Add definitions with word lengths
  acrossWords.forEach((word) => {
    const def = document.createElement("div");
    def.textContent = `${word.number}. ${word.definition || word.word} (${
      word.word.length
    })`;
    acrossList.appendChild(def);
  });

  downWords.forEach((word) => {
    const def = document.createElement("div");
    def.textContent = `${word.number}. ${word.definition || word.word} (${
      word.word.length
    })`;
    downList.appendChild(def);
  });
}

// Update the checkSolution function
function checkSolution() {
  let isComplete = true;
  let allCorrect = true;

  // Check each word
  crossword.words.forEach((word) => {
    for (let i = 0; i < word.word.length; i++) {
      const row = word.horizontal ? word.row : word.row + i;
      const col = word.horizontal ? word.col + i : word.col;

      // Find the cell by grid-area
      const cell = document.querySelector(
        `.grid-cell[style*="grid-area: ${row + 1} / ${col + 1}"]`
      );

      // If we found the cell, check its input
      if (cell) {
        const input = cell.querySelector("input");
        const value = input?.value?.toUpperCase() || "";
        const expectedValue = word.word[i].toUpperCase();

        if (!value) {
          console.log(`Empty cell at position ${row + 1},${col + 1}`);
          isComplete = false;
        } else if (value !== expectedValue) {
          console.log(
            `Incorrect value at position ${row + 1},${
              col + 1
            }: expected ${expectedValue}, got ${value}`
          );
          allCorrect = false;
        }
      } else {
        console.log(`Cell not found at position ${row + 1},${col + 1}`);
        isComplete = false;
      }
    }
  });

  if (!isComplete) {
    alert("Please fill in all the cells!");
  } else if (!allCorrect) {
    alert("Some answers are incorrect. Keep trying!");
  } else {
    alert("Congratulations! You solved the crossword!");
    // Highlight all words in green when solved correctly
    crossword.words.forEach((word) => highlightWord(word, true));
  }
}

// Update the drawCrossword function to ensure grid-area is set correctly
function drawCrossword() {
  const crosswordGrid = document.getElementById("crossword-grid");
  crosswordGrid.innerHTML = "";
  crosswordGrid.style.background = "transparent";

  // Create a map of cells that are part of words
  const usedCells = new Map();
  crossword.words.forEach((word) => {
    const wordLength = word.word.length;
    for (let i = 0; i < wordLength; i++) {
      const row = word.horizontal ? word.row : word.row + i;
      const col = word.horizontal ? word.col + i : word.col;
      const key = `${row},${col}`;
      usedCells.set(key, true);
    }
  });

  // Find dimensions
  let minRow = Infinity,
    maxRow = -Infinity;
  let minCol = Infinity,
    maxCol = -Infinity;

  usedCells.forEach((_, key) => {
    const [row, col] = key.split(",").map(Number);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
  });

  // Set grid template
  const rows = maxRow - minRow + 1;
  const cols = maxCol - minCol + 1;
  crosswordGrid.style.gridTemplateColumns = `repeat(${cols}, 50px)`;
  crosswordGrid.style.gridTemplateRows = `repeat(${rows}, 50px)`;

  // Create only the cells that are part of words
  usedCells.forEach((_, key) => {
    const [row, col] = key.split(",").map(Number);
    const cellDiv = document.createElement("div");
    cellDiv.className = "grid-cell";

    // Set grid-area explicitly
    cellDiv.style.gridArea = `${row + 1} / ${col + 1}`;

    // Add number if this cell starts a word
    const cellNumber = getNumberedCells().find(
      (nc) => nc.row === row && nc.col === col
    )?.number;

    if (cellNumber) {
      const numberSpan = document.createElement("span");
      numberSpan.className = "number";
      numberSpan.textContent = cellNumber;
      cellDiv.appendChild(numberSpan);
    }

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 1;
    input.className = "cell-input";
    input.value = crossword.playerGrid[row]?.[col] || "";
    input.addEventListener("input", (e) => handleCellInput(e, row, col));

    cellDiv.appendChild(input);
    crosswordGrid.appendChild(cellDiv);
  });

  // Initialize keyboard navigation
  addKeyboardNavigation();
}

// Update the CSS for grid cells
const style = document.createElement("style");
style.textContent = `
  #crossword-grid {
    display: grid;
    gap: 0;
    background: transparent;
    padding: 0;
    margin: 20px auto;
  }

  .grid-cell {
    width: 50px;
    height: 50px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    border: 1px solid #ccc;
  }

  .cell-input {
    width: 100%;
    height: 100%;
    border: none;
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    text-transform: uppercase;
    padding: 0;
    margin: 0;
    outline: none;
    background: white;
  }

  .grid-cell .number {
    position: absolute;
    top: 2px;
    left: 2px;
    font-size: 12px;
    color: #666;
    z-index: 1;
  }
`;
document.head.appendChild(style);

// Add isPartOfWord function
function isPartOfWord(row, col, word) {
  if (word.horizontal) {
    return (
      row === word.row && col >= word.col && col < word.col + word.word.length
    );
  } else {
    return (
      col === word.col && row >= word.row && row < word.row + word.word.length
    );
  }
}

// Add highlightWord function if missing
function highlightWord(word, isCorrect) {
  for (let i = 0; i < word.word.length; i++) {
    const row = word.horizontal ? word.row : word.row + i;
    const col = word.horizontal ? word.col + i : word.col;
    const cell = document.querySelector(
      `.grid-cell[style*="grid-area: ${row + 1} / ${col + 1}"]`
    );
    if (cell) {
      cell.style.backgroundColor = isCorrect ? "#e6ffe6" : "white";
    }
  }
}
