const fs = require('fs');

// Array of puzzles: should copy this from browser's console log.
const data = [
]

const jsonData = JSON.stringify(data, null, 2);

console.log('NO of PUZZLES: ' + data.length);

fs.writeFile('./public/puzzles.json', jsonData, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Data written to puzzles.json successfully!');
  }
});