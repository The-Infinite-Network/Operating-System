const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
const newContentPath = path.join(__dirname, '../mission_view_new.txt');

const appContent = fs.readFileSync(appPath, 'utf8');
const newContent = fs.readFileSync(newContentPath, 'utf8');

// Find the START of the block
const splitStr = '{rootView === "missions" && (';
const startIdx = appContent.indexOf(splitStr);

if (startIdx === -1) {
    console.error('Could not find start of mission block');
    process.exit(1);
}

// Find the END of the block using regex to be safe about whitespace
// Looking for </section> followed by optional whitespace and )}
const endRegex = /<\/section>\s*\)\}/g;
endRegex.lastIndex = startIdx; // Start searching from startIdx

const match = endRegex.exec(appContent);

if (!match) {
    console.error('Could not find end of mission block');
    process.exit(1);
}

const endIdx = match.index;
const matchLen = match[0].length;

// Check if we captured too much?
const nextStart = appContent.indexOf(splitStr, startIdx + 1);
if (nextStart !== -1 && nextStart < endIdx) {
    console.warn('Warning: found another mission block start before the end marker. This shouldn\'t happen if the first block is closed properly.');
}

const before = appContent.substring(0, startIdx);
const after = appContent.substring(endIdx + matchLen);

const finalContent = before + newContent + after;

fs.writeFileSync(appPath, finalContent, 'utf8');
console.log('Successfully refactored App.tsx');
