import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.brown.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import { Chessground } from '@lichess-org/chessground';
import { Chess } from 'chess.js';
import { getAllEntries, editEntryByFen, clearAllEntries, incrementRepById, uploadPuzzlesToDB } from './db'; 
import { computerMove, initializeBoard, shuffle, undoMove } from './library';

const boardElement = document.getElementById('board');
const nextPuzzleBtn = document.getElementById('nextPuzzle');
const clearDbBtn = document.getElementById('clearDB');
const currentIndex = document.getElementById('currentIndex');
const resetBtn = document.getElementById('reset');
const status = document.getElementById('status');
const updateSolution = document.getElementById('updateSolution');
const computerMoveBtn = document.getElementById('computerMove');
const moveBackBtn = document.getElementById('moveBack');
const moveForwardBtn = document.getElementById('moveForward');

let tactics = await getAllEntries(["Polgar 2"]);
let newPuzzles = [];
let fenIndex = 0;
const chess = new Chess();
const movesHistory = [];
const ground = Chessground(boardElement);

currentIndex.textContent = tactics.length;
uploadPuzzlesToDB(newPuzzles);
shuffle(tactics);
initializeBoard(tactics[fenIndex], chess, ground, movesHistory, status);

nextPuzzleBtn.addEventListener('click', async () => {
  if(tactics[fenIndex].id){
    incrementRepById(tactics[fenIndex].id)
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
  if (fenIndex >= tactics.length) alert("No more puzzle!!");
  else {
    initializeBoard(tactics[fenIndex], chess, ground, movesHistory, status);
  }
  currentIndex.textContent = tactics.length-fenIndex;
});
clearDbBtn.addEventListener('click', async () => {
  const confirmed = window.confirm('Are you sure you want to clear all data?');
  if (confirmed) {
    await clearAllEntries();
    alert('All database entries have been cleared.');
  }
});
resetBtn.addEventListener('click', async () => {
  initializeBoard(tactics[fenIndex], chess, ground, movesHistory, status);
});
updateSolution.addEventListener('click', async () => {
  if (movesHistory.length) {
    const puzzleData = {
      fen: tactics[fenIndex].fen,
      solution: [...movesHistory],
      tag: tactics[fenIndex].tag,
      rep: tactics[fenIndex].rep,
    };
    await editEntryByFen(puzzleData);
    status.textContent = "Solution updated!";
    status.className = "glow-blue"; 
    console.log(movesHistory);
  }
});
computerMoveBtn.addEventListener('click', async () => {
  computerMove(tactics[fenIndex], chess, ground, movesHistory);
});
moveBackBtn.addEventListener('click', async () => {
  undoMove(chess, ground, movesHistory);
});
moveForwardBtn.addEventListener('click', async () => {
  computerMove(tactics[fenIndex], chess, ground, movesHistory);
});