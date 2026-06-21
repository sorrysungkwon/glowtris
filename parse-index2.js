const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<script>([\s\S]*?)<\/script>/g;
let match;
let i = 0;
while ((match = regex.exec(html)) !== null) {
  if (i === 3) {
    const code = match[1];
    fs.writeFileSync('script3.js', code);
    try {
      require('vm').runInNewContext(code);
    } catch(e) {
      console.log(e.stack);
    }
  }
  i++;
}
