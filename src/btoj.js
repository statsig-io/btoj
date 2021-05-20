#!/usr/bin/env node

const yargs = require("yargs");
const fs = require("fs");
const { exit } = require("process");

function getDelimiter(s) {
  return (s.match(/\'/g)||[]).length >= (s.match(/\"/g)||[]).length ? '"' : "'";
}

const argv = yargs
  .usage(
    `Usage:
  $ btoj someInput.bin -o binary.js`
  )
  .option("output", {
    alias: "o",
    description: "Path to the output js module.",
    required: true,
    type: "string",
  })
  .help()
  .alias("help", "h").argv;

const inputPath = argv._[0];
if (!inputPath) {
  yargs.showHelp();
  exit(1);
}

fs.readFile(inputPath, "latin1", (re, d) => {
  if (re) {
    console.error(re);
    exit(1);
  }

  const delimiter = getDelimiter(d);
  const data = d
    .replaceAll("\\", "\\\\")
    .replaceAll(delimiter, `\\${delimiter}`)
    .replaceAll("\r", "\\r")
    .replaceAll("\b", "\\b")
    .replaceAll("\f", "\\f")
    .replaceAll("\v", "\\v")
    .replaceAll("\t", "\\t")
    .replaceAll("\n", "\\n");

  fs.writeFile(
    argv.output,
    `module.exports = Buffer.from(${delimiter}${data}${delimiter}, ${delimiter}latin1${delimiter});\n`,
    (we) => {
      if (we) {
        console.error(we);
        exit(1);
      }

      console.info(
        `Generated '${argv.output}'\nYou can now delete '${inputPath}' from your project. The js file is all you need.`
      );
    }
  );
});
