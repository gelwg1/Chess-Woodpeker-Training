const fs = require('fs');
const { parse } = require('csv-parse');

const filePath = './lichess_db_puzzle.csv'; // Adjust path if needed
const outputPath = './public/lichess_puzzles.json'; // Output file

const minRating = 900;
const maxRating = 1500;
const sampleSize = 200;
const takeChance = 0.2; // 20% chance

const selectedRows = [];

const parser = parse({
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true
});

fs.createReadStream(filePath)
  .pipe(parser)
  .on('data', (row) => {
    const rating = parseInt(row.Rating, 10);
    if (
      rating >= minRating &&
      rating <= maxRating &&
      Math.random() < takeChance
    ) {
      // Reservoir sampling: keep only up to sampleSize
      if (selectedRows.length < sampleSize) {
        selectedRows.push({
          fen: row.FEN,
          solution: row.Moves
        });
      } else {
        parser.end(); // This will stop the parser and trigger the 'end' event
      }
    }
  })
  .on('end', () => {
    fs.writeFileSync(outputPath, JSON.stringify(selectedRows, null, 2), 'utf8');
    console.log(`Wrote ${selectedRows.length} records to ${outputPath}`);
  })
  .on('error', (err) => {
    console.error('Error:', err.message);
  });
