const fs = require('fs');
const content = fs.readFileSync('src/template.html', 'utf8');
const regex = /<script type="application\/ld\+json">\s*(\[[\s\S]*?\])\s*<\/script>/;
const match = content.match(regex);
if (match) {
  const arr = JSON.parse(match[1]);
  // Remove @context from each element if we put it at the root? Yes.
  arr.forEach(item => delete item['@context']);
  const newObj = { "@context": "https://schema.org", "@graph": arr };
  const newJsonStr = JSON.stringify(newObj, null, 2);
  const newContent = content.replace(regex, `<script type="application/ld+json">\n${newJsonStr}\n</script>`);
  fs.writeFileSync('src/template.html', newContent);
  console.log("Updated template.html with @graph");
}
