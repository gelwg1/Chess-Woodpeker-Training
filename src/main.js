import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.brown.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import { Chessground } from '@lichess-org/chessground';
import { Chess } from 'chess.js';
import { editEntryByFen, getAllEntries, incrementRepById, uploadPuzzlesToDB, changeFen, changeTag, makeComputerMoveFirst } from './db'; 
import { computerMove, getAllTags, initializeBoard, shuffle, undoMove } from './library';
import { createCheckboxList, getCheckedTags } from './userInterface';

const boardElement = document.getElementById('board');
const nextPuzzleBtn = document.getElementById('nextPuzzle');
const currentIndex = document.getElementById('currentIndex');
const resetBtn = document.getElementById('reset');
const status = document.getElementById('status');
const enterUpdateModeBtn = document.getElementById('enterUpdateMode');
const updateSolutionBtn = document.getElementById('updateSolution');
const cancelUpdateBtn = document.getElementById('cancelUpdate');
const computerMoveBtn = document.getElementById('computerMove');
const moveBackBtn = document.getElementById('moveBack');
const moveForwardBtn = document.getElementById('moveForward');
const checkboxContainer = document.getElementById('checkboxContainer');
const shuffleBtn = document.getElementById('shuffle');

let tactics = await getAllEntries();
let newPuzzles = []
let fenIndex = 0;
let tags = getAllTags(tactics);
const state = {
  isUpdatingSolution : false
} 
const chess = new Chess();
const movesHistory = [];
const ground = Chessground(boardElement);
//TODO: Create a button for remove the problem from db.
//TODO: Add "Add solution" button (and hide Update button) if the problem doesn't have solution
//TODO: Add a "Previous" button to go back to previous puzzle.
//TODO: Too many request to the db. Modify the code so that it will call the db only once.

currentIndex.textContent = tactics.length;
uploadPuzzlesToDB(newPuzzles, "Polgar 4", false);
shuffle(tactics);
initializeBoard(tactics[fenIndex], chess, ground, movesHistory, status, state);
createCheckboxList(checkboxContainer, tags);

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
    initializeBoard(tactics[fenIndex], chess, ground, movesHistory, status, state);
  }
  currentIndex.textContent = tactics.length-fenIndex;
});
resetBtn.addEventListener('click', async () => {
  initializeBoard(tactics[fenIndex], chess, ground, movesHistory, status, state);
});
enterUpdateModeBtn.addEventListener('click', async () => {
  boardElement.classList.add("glow-blue-board")
  status.textContent = "Updating...";
  status.className = "glow-blue"; 
  state.isUpdatingSolution = true;
  enterUpdateModeBtn.style.display = 'none';
  let updateButtonGroup = document.getElementById("updateButtonGroup");
  updateButtonGroup.style.display = 'inline-block';
});
updateSolutionBtn.addEventListener('click', async () => {
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
  }
  boardElement.classList.remove("glow-blue-board")
  state.isUpdatingSolution = false;
  enterUpdateModeBtn.style.display = 'inline-block';
  let updateButtonGroup = document.getElementById("updateButtonGroup");
  updateButtonGroup.style.display = 'none';
  tactics[fenIndex].solution = [...movesHistory];
});
cancelUpdate.addEventListener('click', async () => {
  boardElement.classList.remove("glow-blue-board")
  state.isUpdatingSolution = false;
  enterUpdateModeBtn.style.display = 'inline-block';
  let updateButtonGroup = document.getElementById("updateButtonGroup");
  updateButtonGroup.style.display = 'none';
  
});
moveBackBtn.addEventListener('click', async () => {
  undoMove(chess, ground, movesHistory);
});
moveForwardBtn.addEventListener('click', async () => {
  computerMove(tactics[fenIndex], chess, ground, movesHistory);
});
shuffleBtn.addEventListener('click', async () => {
  let checkedTags = getCheckedTags();
  tactics = await getAllEntries(checkedTags);
  currentIndex.textContent = tactics.length;
  shuffle(tactics);
  fenIndex = 0;
  initializeBoard(tactics[fenIndex], chess, ground, movesHistory, status, state);
});
computerMoveFirst.addEventListener('click', async () => {
  await makeComputerMoveFirst(tactics[fenIndex]);
  initializeBoard(tactics[fenIndex], chess, ground, movesHistory, status, state);
});
prevPuzzle.addEventListener('click', async () => {
  fenIndex--;
  initializeBoard(tactics[fenIndex], chess, ground, movesHistory, status, state);
  currentIndex.textContent = tactics.length-fenIndex;
});