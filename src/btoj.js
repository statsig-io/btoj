#!/usr/bin/env node

const fs = require("fs");
const { exit } = require("process");

fs.readFile("./binary.bin", "latin1", (re, d) => {
  if (re) {
    console.error(re);
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

    (we) => {
      if (we) {
        console.error(we);
        exit(1);
      }

      console.info(
        `Generated binary.js\nYou can now delete binary.bin from your project. The js file is all you need.`
      );
    }
  );
});
