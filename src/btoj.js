const fs = require("fs");
const { exit } = require("process");

fs.readFile("./binary.bin", "latin1", (e, d) => {
  if (e) {
    console.error(e);
    exit(1);
  }

  const data = d
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\r", "\\r")
    .replaceAll("\b", "\\b")
    .replaceAll("\f", "\\f")
    .replaceAll("\v", "\\v")
    .replaceAll("\t", "\\t")
    .replaceAll("\n", "\\n");

  fs.writeFile(
    "./binary.js",
    `const data = Buffer.from("${data}", "latin1");
module.exports = data;
`,
    (e) => {
      if (e) {
        console.error(e);
        exit(1);
      }
    }
  );
});
