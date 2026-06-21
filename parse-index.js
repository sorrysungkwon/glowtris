const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<script>([\s\S]*?)<\/script>/g;
let match;
let i = 0;
while ((match = regex.exec(html)) !== null) {
  const code = match[1];
  try {
    new Function(code);
    console.log(`Script ${i} OK`);
  } catch(e) {
    console.log(`Script ${i} ERROR:`, e.message);
    const lines = code.split('\n');
    const errLine = e.lineNumber || 0; // Not perfectly accurate but let's check
    console.log(code.substring(0, 200) + '...');
  }
  i++;
}
