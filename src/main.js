import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.brown.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import { Chessground } from '@lichess-org/chessground';
import { Chess } from 'chess.js';
import { addEntry, getAllEntries, editEntryByFen, clearAllEntries } from './db'; 

const boardElement = document.getElementById('board');
const nextPuzzleBtn = document.getElementById('nextPuzzle');
const clearDbBtn = document.getElementById('clearDB');
const currentIndex = document.getElementById('currentIndex');
const resetBtn = document.getElementById('reset');

let initialFen = [
    { fen: 'r4rk1/pp1nn1pp/2pqb3/3p1p2/1PPPpN2/P1N1P3/3QBPPP/R4RK1 w - - 0 1', solution: ""},
  { fen: 'r1q1k2r/pp1b1pp1/2p1p3/2Q1Pn1p/1B6/3B4/PP3PPP/R3K2R w KQkq - 0 1', solution: ""},
  { fen: '3r1rk1/p5np/1p3bp1/2p1p3/2P1N1q1/1P4P1/P1Q2PBP/3R1RK1 w - - 0 1', solution: ""},
  { fen: '2k5/pp1q2pp/6p1/2pr4/6n1/1P2P3/PPK1B1PP/3RQ3 w - - 0 1', solution: ""},
  { fen: 'rn1qkb1r/1pp1pppp/p4n2/4N2b/2B5/2N5/PPPP1PPP/R1BQK2R w KQkq - 0 1', solution: ""},
  { fen: '3r1k2/5p2/1b6/5q2/1PR5/4p3/1PQ5/4KN2 b - - 0 1', solution: ""},
  { fen: 'r1bk2r1/pppp1pBp/8/b2P4/2B4q/1Q6/PP3PP1/4R1K1 w - - 0 1', solution: "1st"},
  { fen: 'r3n2k/1p4pp/2p5/1q5N/8/P6P/1Q3PP1/4R1K1 w - - 0 1', solution: ""},
  { fen: '6k1/5p2/6p1/1p4N1/n2QPP2/qP5R/P1P3r1/1K6 b - - 0 1', solution: ""},
  { fen: '6qk/1r4pp/2p5/1b4N1/4Q3/7P/5PP1/R5K1 w - - 0 1', solution: ""},
  { fen: '2r2k2/p1n3qp/3p2p1/2p5/4R3/1BQ2P2/P5PP/6K1 w - - 0 1', solution: ""},
  { fen: '3qk2r/rp2bppp/2n1p3/8/4B3/2P3P1/1P1N1P1P/R2Q1RK1 w k - 0 1', solution: ""},
  { fen: 'r2b3k/6p1/1n4p1/2q1p3/4pR2/1B4P1/3Q1PK1/2N5 w - - 0 1', solution: ""},
  { fen: '2r2k2/p3qp2/1p3p1p/4n3/PQ6/1PB4P/1KP5/6R1 w - - 0 1', solution: ""},
  { fen: '4q2k/7p/6p1/2p2b2/1pB5/R4PB1/1P4K1/8 w - - 0 1', solution: ""},
  { fen: '2r2rk1/1p1q1pbp/p4np1/8/4N3/P4B1P/1P1Q1PP1/R4RK1 w - - 0 1', solution: "10th"},
  { fen: 'R4rk1/2pq2p1/1p2p2p/8/8/1bPBP2P/1P2Q1P1/6K1 w - - 0 1', solution: ""},
  { fen: 'r7/1b3pnk/1p2n2q/7P/4N3/6P1/1B1Q1P2/2R3K1 w - - 0 1', solution: ""},
  { fen: '4kr2/1pp3p1/3bP2p/3N2B1/1P6/6n1/1K2B1P1/8 w - - 0 1', solution: ""},
  { fen: 'r4r2/ppq1n1kp/2p2pp1/3b4/3N4/4PB2/PP2QPPP/R4RK1 w - - 0 1', solution: ""},
  { fen: '2r2rk1/1p2b1pp/p7/Q4q2/4p3/6P1/PP3PBP/2R2RK1 w - - 0 1', solution: ""},
  { fen: '2kr4/ppnb2p1/2p4p/8/3NN2Q/P2q4/1P3PPP/R5K1 w - - 0 1', solution: ""},
  { fen: '7R/k1ppr1p1/qp3n2/8/8/2PQ1NP1/1P3PK1/8 w - - 0 1', solution: ""},
  { fen: '4rk2/4qppp/1p4b1/p7/2P1Q3/2B4P/1P2RPP1/6K1 w - - 0 1', solution: ""},
  { fen: 'kr6/pb5p/1p1q2p1/3N1n2/4p3/Q6P/PP1B1PP1/5RK1 w - - 0 1', solution: ""},
  { fen: '4rk2/R4ppB/7p/1p2N1q1/nPbP1p2/2PQ1P2/6PP/6K1 w - - 0 1', solution: "20th"},
  { fen: 'r7/4q1np/3N2pk/2p5/1p4P1/3QpP2/1KP4P/2R5 w - - 0 1', solution: ""},
  { fen: 'r1n4r/pppk1Bb1/2qp2p1/4PbB1/8/2P2Q2/PP4P1/R4RK1 w - - 0 1', solution: ""},
  { fen: '7R/r4kp1/1p2qb2/2p5/2Q2Bn1/1PN3P1/2P5/2K5 w - - 0 1', solution: ""},
  { fen: '4r1kr/ppp2n1p/5p1B/2b2q1N/8/2P5/PP3PPP/R2Q2K1 w - - 0 1', solution: ""},
  { fen: 'r4knr/pp2ppbp/1q1p2p1/2pP4/Q2nP1b1/2P5/PP1N1PPP/R1B1KBNR b KQ - 0 1', solution: ""},
  { fen: '2R5/6pk/2Q4p/p3pp2/7P/1P1P2PK/r1P2P2/3q4 b - - 0 1', solution: ""},
  { fen: 'rnbqkbn1/ppppp3/7r/6pp/3P1p2/3BP1B1/PPP2PPP/RN1QK1NR w KQq - 0 1', solution: ""},
  { fen: 'rn1qk2r/p2b3p/1p2p1p1/4P2Q/4P3/B3n3/P1P3PP/R4RK1 w kq - 0 1', solution: ""},
  { fen: 'r1r3k1/pp3ppp/8/4qn2/4p3/2B1P3/PPQ2PPP/R2R2K1 w - - 0 1', solution: ""},
  { fen: '7k/p4rbp/2p3p1/3q4/8/P2Q2NP/KP4P1/5R2 w - - 0 1', solution: "30th"},
  { fen: '1R6/k3qp2/p3p1b1/2n5/2P5/1R2Q1Pp/PK6/7r w - - 0 1', solution: ""},
  { fen: 'r2qk2r/1ppn1ppp/p4n2/2B5/2B1p3/8/PPP1Q1PP/R4RK1 w kq - 0 1', solution: ""},
  { fen: '3q2r1/p6k/1p4p1/3p1b2/3Q4/1P6/PB4PP/4R2K w - - 0 1', solution: ""},
  { fen: '1b6/k5p1/1p3n2/p6R/8/1R3QP1/2qr1P2/6K1 w - - 0 1', solution: ""},
  { fen: 'r4rk1/pp2qpp1/2n2n1p/6N1/8/P1N5/1PQ2PPP/R4RK1 w - - 0 1', solution: ""},
  { fen: '8/3kqp2/1p1b2b1/3P4/8/6P1/1P3PK1/R3Q3 w - - 0 1', solution: ""},
  { fen: 'b3r1k1/p4ppp/1pq5/8/2N5/1P1P2P1/P1P2QNP/3B2K1 b - - 0 1', solution: ""},
  { fen: '8/8/1bb2p1k/1p4pq/1B2P3/1B6/4QPP1/6K1 w - - 0 1', solution: ""},
  { fen: 'q3B3/2p4p/kp4p1/5b2/7P/1P4P1/1KP5/4Q3 w - - 0 1', solution: ""},
  { fen: '3rk2r/pp2ppbp/5p2/q2N4/3Q1P2/8/PPP3PP/2KR3R w k - 0 1', solution: "40th"},
  { fen: 'k6r/p4r2/2n4p/1R1p4/2pPp1P1/q1P1Q1B1/2P5/1R4K1 w - - 0 1', solution: ""},
  { fen: '2r1r1k1/5p2/q2p2p1/3Qb1P1/1p2P3/1P6/1PP1N2R/1K5R w - - 0 1', solution: ""},
  { fen: '2kq2r1/1p1bbQ2/p7/4p3/4p3/1P2B3/1PP1N2P/1K1R4 w - - 0 1', solution: ""},
  { fen: 'r6r/7k/1p3Q2/p1b3pq/2P1R3/5P2/4K1P1/R7 w - - 0 1', solution: ""},
  { fen: 'r5k1/2q2pp1/2p5/6r1/P2QpN2/4PbP1/1P3P2/R1R3K1 b - - 0 1', solution: ""},
  { fen: '1k4r1/ppp4p/1n1b1p2/2Nq4/8/1QP4P/P3BPP1/4R2K w - - 0 1', solution: ""},
  { fen: '5rk1/1pq2pp1/4p2p/1R6/7P/P4QP1/1P3P2/2rR2K1 b - - 0 1', solution: ""},
  { fen: 'r4rk1/p1p2ppp/1p2pn2/3qP1Q1/3P4/2P2P1P/PP3BP1/4RRK1 w - - 0 1', solution: ""},
  { fen: 'r2qk2r/pppbnp1p/2np2p1/3N2B1/2BbP3/8/PPP2PPP/R2QK2R w KQkq - 0 1', solution: ""},
  { fen: '1rb2rk1/p4ppp/1p1R1n2/8/1P6/PqN3P1/5PBP/R1Q3K1 w - - 0 1', solution: ""},
]
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

function shuffleInitialFen() {
  for (let i = initialFen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [initialFen[i], initialFen[j]] = [initialFen[j], initialFen[i]];
  }
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
  const puzzleData = {
    fen: initialFen[fenIndex].fen,
    solution: [...movesHistory],
    tag: 'deflection',
    rep: 0
  };
  if(movesHistory.length){
    await editEntryByFen(puzzleData);
  }

  const storedPuzzles = await getAllEntries();
  const storedFens = new Set(storedPuzzles.map(p => p.fen));
  do {
    fenIndex++;
  } while (fenIndex < initialFen.length && storedFens.has(initialFen[fenIndex].fen));

  // fenIndex++;
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
  }
  currentIndex.textContent = initialFen.length-fenIndex;
  console.log("Stored puzzles:", storedPuzzles);
});

clearDbBtn.addEventListener('click', async () => {
  await clearAllEntries();
  alert('All database entries have been cleared.');
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
