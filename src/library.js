export function shuffle(puzzles, alpha = 3) {
  const shuffled = [];
  const temp = [...puzzles]; // Copy to preserve original
  while (temp.length > 0) {
    const totalWeight = temp.reduce(
      (sum, item) => sum + 1 / Math.pow(item.rep + 1, alpha),
      0
    );
    let r = Math.random() * totalWeight;
    let index = 0;
    while (r >= 0 && index < temp.length) {
      r -= 1 / Math.pow(temp[index].rep + 1, alpha);
      if (r < 0) break;
      index++;
    }
    shuffled.push(temp[index]);
    temp.splice(index, 1);
  }
  puzzles.length = 0;
  puzzles.push(...shuffled);
}

export const initializeBoard = (tactic, chess, ground, movesHistory, status, state) => {
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
  const playerOrien = isComputerMove ? (isWhite ? "black" : "white") : (isWhite ? "white" : "black");
  ground.set({
    fen: puzzle.fen,
    orientation: playerOrien,
    turnColor: isWhite ? "white" : "black",
    lastMove: [],
    check: chess.isCheck(),
    movable: {
      color: isWhite ? "white" : "black",
      free: false,
      dests: getLegalDests(chess),
      events: {
        after: (orig, dest, capturedPiece) =>
          onUserMove(orig, dest, capturedPiece, chess, ground, status, movesHistory, tactic, state),
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

function onUserMove(orig, dest, capturedPiece, chess, ground, status, movesHistory, tactic, state) {
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
      // A checkmate can't be wrong.
      if(chess.isCheckmate()){
        status.textContent = "Success";
        status.className = 'glow-green'; 
        return;
      }

      // Check if user move matches the solution
      if (
        solution[userMoveIndex] &&
        move.san !== solution[userMoveIndex] &&
        userMoveUci + promotion !== solution[userMoveIndex] &&
        state.isUpdatingSolution === false
      ) {
        status.textContent = "Incorrect";
        status.className = "glow-red";
        undoMove(chess, ground, movesHistory);
        return;
      }

      // If user or computer reaches end of solution, alert success
      if (movesHistory.length >= solution.length && solution.length) {
        status.textContent = "Success";
        status.className = 'glow-green'; 
        return;
      }

      // Computer move (next in solution)
      if(state.isUpdatingSolution === false){
        computerMove(tactic, chess, ground, movesHistory);
      }

      // If after computer move we reach end of solution, alert success
      if (movesHistory.length >= solution.length && solution.length) {
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

export let undoMove = (chess, ground, movesHistory) => {
  if(movesHistory.length < 1) return;
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

export const getAllTags = (tactics) => {
  const tagCount = tactics.reduce((count, tactic) => {
    count[tactic.tag] = (count[tactic.tag] || 0) + 1;
    return count;
  }, {});
  const result = Object.entries(tagCount).map(([tag, count]) => ({
    tag: tag,
    count
  }));
  return result
};