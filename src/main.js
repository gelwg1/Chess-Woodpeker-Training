import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.brown.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import { Chessground } from '@lichess-org/chessground';
import { Chess } from 'chess.js';
import { addEntry, getAllEntries, editEntryByFen, clearAllEntries, incrementRepById } from './db'; 

const boardElement = document.getElementById('board');
const nextPuzzleBtn = document.getElementById('nextPuzzle');
const clearDbBtn = document.getElementById('clearDB');
const currentIndex = document.getElementById('currentIndex');
const resetBtn = document.getElementById('reset');
const status = document.getElementById('status');
const updateSolution = document.getElementById('updateSolution');
const computerMoveBtn = document.getElementById('computerMove');

let initialFen = await getAllEntries(["lichess puzzle"]);

// async function uploadAllToIndexedDB() {
//   for (const fenRecord of initialFen) {
//     const puzzleData = {
//       fen: fenRecord.fen,
//       solution: fenRecord.solution || [],
//       tag: 'lichess puzzle',
//       rep: 0
//     };
//     await editEntryByFen(puzzleData);
//   }
//   alert('All puzzles uploaded to IndexedDB!');
// }
// uploadAllToIndexedDB()

shuffleInitialFen();
let fenIndex = 0;
const chess = new Chess();
const movesHistory = [];
currentIndex.textContent = initialFen.length;

const computerMove = () => {
  let solution = initialFen[fenIndex].solution;
  const computerMoveSan = solution[movesHistory.length];
  if (computerMoveSan) {
    const computerMove = chess.move(computerMoveSan);
    if (computerMove) {
      movesHistory.push(computerMove.san);
      ground.set({
        fen: chess.fen(),
        turnColor: chess.turn() === "w" ? "white" : "black",
        lastMove: [computerMove.from, computerMove.to],
        check: chess.isCheck(),
        movable: {
          color: chess.turn() === "w" ? "white" : "black",
          dests: getLegalDests(),
        },
      });
    }
  }
};
const ground = Chessground(boardElement);

let initializeBoard = () => {
  const puzzle = initialFen[fenIndex];
  chess.load(puzzle.fen);
  movesHistory.length = 0;
  if (typeof puzzle.solution === "string") puzzle.solution = puzzle.solution.split(" ");
  const turn = puzzle.fen.split(" ")[1];
  const isWhite = turn === "w";
  const isLichess = puzzle.tag === "lichess puzzle";
  const newOrien = isLichess ? (isWhite ? "black" : "white") : (isWhite ? "white" : "black");
  ground.set({
    fen: puzzle.fen,
    orientation: newOrien,
    turnColor: isWhite ? "white" : "black",
    lastMove: [],
    check: chess.isCheck(),
    movable: {
      color: isWhite ? "white" : "black",
      free: false,
      dests: getLegalDests(),
      events: { after: onUserMove },
      draggable: { showGhost: true },
    },
  });
  console.log(puzzle);
  const hasSolution = puzzle.solution?.length;
  let turnColor = isWhite ? "white" : "black";
  status.textContent = hasSolution 
    ? `${(turnColor = isLichess ? (isWhite ? "black" : "white") : turnColor).charAt(0).toUpperCase() + turnColor.slice(1)} to move`
    : "This puzzle doesn't have solution!";
  status.className = hasSolution ? `glow-${turnColor}` : "glow-yellow";
  if (isLichess) setTimeout(computerMove, 500);
};
initializeBoard();

let undoMove = () => {
  chess.undo();
  movesHistory.pop();
  ground.set({
    fen: chess.fen(),
    check: false,
    lastMove: [], // Clear last move highlights
    turnColor: chess.turn() === "w" ? "white" : "black",
    movable: {
      color: chess.turn() === "w" ? "white" : "black",
      dests: getLegalDests(),
    },
  });
};

function getLegalDests() {
  const dests = new Map();
  for (const move of chess.moves({ verbose: true })) {
    const from = move.from;
    if (!dests.has(from)) dests.set(from, []);
    dests.get(from).push(move.to);
  }
  return dests;
}

function shuffleInitialFen() {
  // First create an array of indices with their weights
  const weights = initialFen.map((item, index) => ({
    index,
    weight: 1 / (item.rep + 1) // +1 to avoid division by zero
  }));

  // Sort by weight descending (higher weight = lower rep = should appear earlier)
  weights.sort((a, b) => b.weight - a.weight);

  // Now do a weighted shuffle
  const shuffled = [];
  const tempArray = [...initialFen];
  
  while (tempArray.length > 0) {
    // Calculate total weight of remaining items
    const totalWeight = tempArray.reduce((sum, item) => sum + (1 / (item.rep + 1)), 0);
    
    // Pick a random number in this range
    let random = Math.random() * totalWeight;
    
    // Find which item this corresponds to
    let selectedIndex = 0;
    let weightSum = 1 / (tempArray[0].rep + 1);
    
    while (random > weightSum && selectedIndex < tempArray.length - 1) {
      selectedIndex++;
      weightSum += 1 / (tempArray[selectedIndex].rep + 1);
    }
    
    // Add the selected item to the result and remove it from temp array
    shuffled.push(tempArray[selectedIndex]);
    tempArray.splice(selectedIndex, 1);
  }
  
  // Replace the original array with the shuffled one
  initialFen.length = 0;
  initialFen.push(...shuffled);
}

function onUserMove(orig, dest, capturedPiece) {
  try {
    const isPromotion = chess.get(orig)?.type === 'p' && (
      (chess.turn() === 'w' && dest[1] === '8') ||
      (chess.turn() === 'b' && dest[1] === '1')
    );
    let promotion = 'q';
    if (isPromotion) {
      // Prompt user for promotion piece
      const choice = window.prompt("Promote to (q)ueen or (n)ight?", "q");
      if (choice && choice.toLowerCase() === 'n') {
        promotion = 'n';
      }
    }
    const move = chess.move({
      from: orig,
      to: dest,
      promotion: promotion
    });
    
    if (move) {
      movesHistory.push(move.san);
      ground.set({
        fen: chess.fen(),
        check: chess.isCheck(),
        turnColor: chess.turn() === 'w' ? 'white' : 'black',
        movable: {
          color: chess.turn() === 'w' ? 'white' : 'black',
          dests: getLegalDests()
        }
      });
      // Get current puzzle's solution array
      const solution = initialFen[fenIndex].solution || [];
      const userMoveIndex = movesHistory.length - 1;

      const userMoveUci = move.from + move.to;

      // Check if user move matches the solution
      if (solution[userMoveIndex] && move.san !== solution[userMoveIndex] && userMoveUci!==solution[userMoveIndex] ) {
        // alert('Incorrect move! Try again.');
        status.textContent = "Incorrect";
        status.className = 'glow-red'; 
        // Optionally, undo the move
        undoMove();
        return;
      }

      // If user or computer reaches end of solution, alert success
      if (movesHistory.length >= solution.length) {
        status.textContent = "Success";
        status.className = 'glow-green'; 
        // alert('success');
        return;
      }

      // Computer move (next in solution)
      computerMove();

      // If after computer move we reach end of solution, alert success
      if (movesHistory.length >= solution.length) {
        // alert('success');
        status.textContent = "Success";
        status.className = 'glow-green'; 
        return;
      }
    } else {
      ground.set({
        fen: chess.fen(),
        turnColor: chess.turn() === 'w' ? 'white' : 'black'
      });
    }
  } catch (e) {
    console.error("Invalid move:", e);
  }
}

nextPuzzleBtn.addEventListener('click', async () => {
  if(initialFen[fenIndex].id){
    incrementRepById(initialFen[fenIndex].id)
  }
  //------This code is for when importing puzzles---------
  // const storedPuzzles = await getAllEntries();
  // const storedFens = new Set(storedPuzzles.map(p => p.fen));
  // do {
  //   fenIndex++;
  // } while (fenIndex < initialFen.length && storedFens.has(initialFen[fenIndex].fen));
  //---------------------------------------------------------
  //------This code is for when playing---------
  fenIndex++;
  //---------------------------------------------------------
  if (fenIndex >= initialFen.length) alert("No more puzzle!!");
  else {
    initializeBoard();
  }
  currentIndex.textContent = initialFen.length-fenIndex;
});

clearDbBtn.addEventListener('click', async () => {
  const confirmed = window.confirm('Are you sure you want to clear all data?');
  if (confirmed) {
    await clearAllEntries();
    alert('All database entries have been cleared.');
  }
});
resetBtn.addEventListener('click', async () => {
  initializeBoard();
});
updateSolution.addEventListener('click', async () => {
  if (movesHistory.length) {
    const puzzleData = {
      fen: initialFen[fenIndex].fen,
      solution: [...movesHistory],
      tag: initialFen[fenIndex].tag,
      rep: initialFen[fenIndex].rep,
    };
    await editEntryByFen(puzzleData);
    console.log(movesHistory)
    alert("Puzzle pushed to the DB!");
  }
});
computerMoveBtn.addEventListener('click', async () => {
  computerMove();
});