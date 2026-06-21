const template = "HELLO <!--BUILD_JS--> WORLD";
const js = "var $ = 1; var y = $&2;";
console.log(template.replace('<!--BUILD_JS-->', js));
