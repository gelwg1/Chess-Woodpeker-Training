import { editEntryByFen } from "./db";

export async function uploadPuzzlesToDB(newPuzzles) {
  if (newPuzzles.length) {
    for (const puzzle of newPuzzles) {
      const puzzleData = {
        fen: puzzle.fen,
        solution: puzzle.solution || [],
        tag: "chesstempo",
        rep: 0,
      };
      await editEntryByFen(puzzleData);
    }
    alert("All puzzles uploaded to IndexedDB!");
  }
}

export function shuffle(puzzles) {
  const weights = puzzles.map((item, index) => ({
    index,
    weight: 1 / (item.rep + 1) // +1 to avoid division by zero
  }));
  weights.sort((a, b) => b.weight - a.weight);

  const shuffled = [];
  const tempArray = [...puzzles];
  
  while (tempArray.length > 0) {
    const totalWeight = tempArray.reduce((sum, item) => sum + (1 / (item.rep + 1)), 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    let weightSum = 1 / (tempArray[0].rep + 1);
    while (random > weightSum && selectedIndex < tempArray.length - 1) {
      selectedIndex++;
      weightSum += 1 / (tempArray[selectedIndex].rep + 1);
    }
    shuffled.push(tempArray[selectedIndex]);
    tempArray.splice(selectedIndex, 1);
  }
  puzzles.length = 0;
  puzzles.push(...shuffled);
}

export const initializeBoard = (tactic, chess, ground, movesHistory, status) => {
  const puzzle = tactic;
  chess.load(puzzle.fen);
  movesHistory.length = 0;
  if (typeof puzzle.solution === "string") puzzle.solution = puzzle.solution.split(" ");
  if (Array.isArray(puzzle.solution)) {
    puzzle.solution = puzzle.solution
      .map(s => typeof s === "string" ? s.trim() : s)
      .filter(s => s && s !== "");
  }
  const turn = puzzle.fen.split(" ")[1];
  const isWhite = turn === "w";
  const isComputerMove = puzzle.tag.includes("lichess") || puzzle.tag.includes("chesstempo");
  const newOrien = isComputerMove ? (isWhite ? "black" : "white") : (isWhite ? "white" : "black");
  ground.set({
    fen: puzzle.fen,
    orientation: newOrien,
    turnColor: isWhite ? "white" : "black",
    lastMove: [],
    check: chess.isCheck(),
    movable: {
      color: isWhite ? "white" : "black",
      free: false,
      dests: getLegalDests(chess),
      events: {
        after: (orig, dest, capturedPiece) =>
          onUserMove(orig, dest, capturedPiece, chess, ground, status, movesHistory, tactic),
      },
      draggable: { showGhost: true },
    },
  });
  console.log(puzzle);
  const hasSolution = puzzle.solution?.length;
  let turnColor = isWhite ? "white" : "black";
  status.textContent = hasSolution 
    ? `${(turnColor = isComputerMove ? (isWhite ? "black" : "white") : turnColor).charAt(0).toUpperCase() + turnColor.slice(1)} to move`
    : "This puzzle doesn't have solution!";
  status.className = hasSolution ? `glow-${turnColor}` : "glow-yellow";
  if (isComputerMove) setTimeout(()=>computerMove(tactic, chess, ground, movesHistory), 500);
};

function getLegalDests(chess) {
  const dests = new Map();
  const legalMoves = chess.moves({ verbose: true })
  for (const move of legalMoves) {
    const from = move.from;
    if (!dests.has(from)) dests.set(from, []);
    dests.get(from).push(move.to);
  }
  return dests;
}

function onUserMove(orig, dest, capturedPiece, chess, ground, status, movesHistory, tactic) {
  try {
    const isPromotion = chess.get(orig)?.type === 'p' && (
      (chess.turn() === 'w' && dest[1] === '8') ||
      (chess.turn() === 'b' && dest[1] === '1')
    );
    let promotion = '';
    if (isPromotion) {
      // Prompt user for promotion piece
      const choice = window.prompt("Promote to (q)ueen or (n)ight?", "q");
      if (choice && choice.toLowerCase() === 'n') {
        promotion = 'n';
      } else {
        promotion = 'q'
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
          dests: getLegalDests(chess)
        }
      });
      // Get current puzzle's solution array
      const solution = tactic.solution || [];

      const userMoveIndex = movesHistory.length - 1;

      const userMoveUci = move.from + move.to;

      // Check if user move matches the solution
      if (solution[userMoveIndex] && move.san !== solution[userMoveIndex] && userMoveUci+promotion!==solution[userMoveIndex] ) {
        // alert('Incorrect move! Try again.');
        status.textContent = "Incorrect";
        status.className = 'glow-red';
        // Optionally, undo the move
        undoMove(chess, ground, movesHistory);
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
      computerMove(tactic, chess, ground, movesHistory);

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

let undoMove = (chess, ground, movesHistory) => {
  chess.undo();
  movesHistory.pop();
  ground.set({
    fen: chess.fen(),
    check: false,
    lastMove: [], // Clear last move highlights
    turnColor: chess.turn() === "w" ? "white" : "black",
    movable: {
      color: chess.turn() === "w" ? "white" : "black",
      dests: getLegalDests(chess),
    },
  });
};

export const computerMove = (tactic, chess, ground, movesHistory) => {
  let solution = tactic.solution;
  const moveSan = solution[movesHistory.length];
  if (moveSan) {
    const currentMove = chess.move(moveSan);
    if (currentMove) {
      movesHistory.push(currentMove.san);
      ground.set({
        fen: chess.fen(),
        turnColor: chess.turn() === "w" ? "white" : "black",
        lastMove: [currentMove.from, currentMove.to],
        check: chess.isCheck(),
        movable: {
          color: chess.turn() === "w" ? "white" : "black",
          dests: getLegalDests(chess),
        },
      });
    }
  }
};
