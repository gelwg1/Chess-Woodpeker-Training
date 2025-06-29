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

let initialFen = await getAllEntries();
console.log("Stored puzzles:", JSON.stringify(initialFen));
shuffleInitialFen();
let fenIndex = 0;
const chess = new Chess(initialFen[fenIndex].fen);
const movesHistory = [];
currentIndex.textContent = initialFen.length;


const ground = Chessground(boardElement, {
  fen: initialFen[fenIndex].fen,
  orientation: initialFen[fenIndex].fen.split(' ')[1] === 'w' ? 'white' : 'black',
  turnColor: initialFen[fenIndex].fen.split(' ')[1] === 'w' ? 'white' : 'black',
  movable: {
    color: initialFen[fenIndex].fen.split(' ')[1] === 'w' ? 'white' : 'black',
    free: false,
    dests: getLegalDests(),
    events: { after: onUserMove },
    draggable: { showGhost: true },
  },
});

function getLegalDests() {
  const dests = new Map();
  for (const move of chess.moves({ verbose: true })) {
    const from = move.from;
    if (!dests.has(from)) dests.set(from, []);
    dests.get(from).push(move.to);
  }
  return dests;
}

// function shuffleInitialFen() {
//   for (let i = initialFen.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [initialFen[i], initialFen[j]] = [initialFen[j], initialFen[i]];
//   }
// }

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
        turnColor: chess.turn() === 'w' ? 'white' : 'black',
        movable: {
          color: chess.turn() === 'w' ? 'white' : 'black',
          dests: getLegalDests()
        }
      });
      updateCheckHighlight();
            // Get current puzzle's solution array
      const solution = initialFen[fenIndex].solution || [];
      const userMoveIndex = movesHistory.length - 1;

      // Check if user move matches the solution
      if (solution[userMoveIndex] && move.san !== solution[userMoveIndex]) {
        // alert('Incorrect move! Try again.');
        status.textContent = "Incorrect";
        status.className = 'glow-red'; 
        // Optionally, undo the move
        chess.undo();
        movesHistory.pop();
        ground.set({
          fen: chess.fen(),
          check : false,
          lastMove: [], // Clear last move highlights
          turnColor: chess.turn() === 'w' ? 'white' : 'black',
          movable: {
            color: chess.turn() === 'w' ? 'white' : 'black',
            dests: getLegalDests()
          }
        });
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
      const computerMoveSan = solution[movesHistory.length];
      if (computerMoveSan) {
        const computerMove = chess.move(computerMoveSan);
        if (computerMove) {
          movesHistory.push(computerMove.san);
          ground.set({
            fen: chess.fen(),
            turnColor: chess.turn() === 'w' ? 'white' : 'black',
            movable: {
              color: chess.turn() === 'w' ? 'white' : 'black',
              dests: getLegalDests()
            }
          });
          updateCheckHighlight();
        }
      }

      // If after computer move we reach end of solution, alert success
      if (movesHistory.length >= solution.length) {
        alert('success');
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

function updateCheckHighlight() {
  ground.set({
    check: chess.isCheck()
  });
}

nextPuzzleBtn.addEventListener('click', async () => {
  if(initialFen[fenIndex].id){
    incrementRepById(initialFen[fenIndex].id)
  }
  const puzzleData = {
    fen: initialFen[fenIndex].fen,
    solution: [...movesHistory],
    tag: 'pin',
    rep: 0
  };
  if(movesHistory.length && !initialFen[fenIndex].solution.length){
    await editEntryByFen(puzzleData);
    alert("Puzzle pushed to the DB!")
  }

  const storedPuzzles = await getAllEntries();
  const storedFens = new Set(storedPuzzles.map(p => p.fen));
  //------This code is for when importing puzzles---------
  // do {
  //   fenIndex++;
  // } while (fenIndex < initialFen.length && storedFens.has(initialFen[fenIndex].fen));
  //---------------------------------------------------------
  //------This code is for when playing---------
  fenIndex++;
  //---------------------------------------------------------
  if (fenIndex >= initialFen.length) alert("No more puzzle!!");
  else {
    chess.load(initialFen[fenIndex].fen);
    movesHistory.length = 0;
    const turnColor = initialFen[fenIndex].fen.split(" ")[1] === "w" ? "white" : "black";
    ground.set({
      fen: initialFen[fenIndex].fen,
      lastMove: [], // Clear last move highlights
      check: false,
      orientation: turnColor,
      turnColor: turnColor,
      movable: {
        color: turnColor,
        dests: getLegalDests(),
        events: { after: onUserMove },
        draggable: { showGhost: true },
        free: false,
      },
    });
    if (initialFen[fenIndex].solution && initialFen[fenIndex].solution.length) {
      status.textContent = `${turnColor.charAt(0).toUpperCase() + turnColor.slice(1)} to move`;
      status.className = `glow-${turnColor}`;
    } else {
      status.textContent = "This puzzle doesn't have solution!";
      status.className = "glow-yellow";
    }
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
  chess.load(initialFen[fenIndex].fen);
  movesHistory.length = 0;
  const turnColor = initialFen[fenIndex].fen.split(" ")[1] === "w" ? "white" : "black";
  ground.set({
    fen: initialFen[fenIndex].fen,
    lastMove: [], // Clear last move highlights
    check: false,
    orientation: turnColor,
    turnColor: turnColor,
    movable: {
      color: turnColor,
      dests: getLegalDests(),
      events: { after: onUserMove },
      draggable: { showGhost: true },
      free: false,
    },
  });
});
updateSolution.addEventListener('click', async () => {
  if (movesHistory.length) {
    const puzzleData = {
      fen: initialFen[fenIndex].fen,
      solution: [...movesHistory],
      tag: initialFen[fenIndex].tag,
      rep: 0,
    };
    await editEntryByFen(puzzleData);
    alert("Puzzle pushed to the DB!");
  }
});