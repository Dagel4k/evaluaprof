const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../faculty-pulse-app/src/mocks/raw-schedule.json');

try {
    const content = fs.readFileSync(filePath, 'utf-8');
    JSON.parse(content);
    console.log('JSON file parsed successfully by Node.js');
} catch (e) {
    console.error('Failed to parse JSON file:', e);
}
