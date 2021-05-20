#!/usr/bin/env node

const encodings = ['latin1', 'utf16le', 'ucs2', 'utf8', 'ascii', 'base64', 'base64url', 'hex'];
const yargs = require("yargs");
const path = require("path");
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
  .option("staging", {
    alias: "s",
    description: "Path to the staging directory, used to measure size of different encodings.  Defaults to `.btoj/`",
    required: false,
    type: "string",
  })
  .help()
  .alias("help", "h").argv;

const inputPath = argv._[0];
if (!inputPath) {
  yargs.showHelp();
  exit(1);
}

const stagingDir = path.resolve(argv.staging ?? '.btoj/');
if (fs.existsSync(stagingDir)){
  console.error(`Staging directory '${stagingDir}' already exists.  Aborting.`);
  exit(1);
}

fs.mkdirSync(stagingDir);

const data = fs.readFileSync(inputPath);
const possibleEncodings = {};
for (const e of encodings) {
  const encodedFile = path.resolve(stagingDir, `${e}.js`);
  const d = fs.readFileSync(inputPath, e);
  const delimiter = getDelimiter(d);
  const encoded = d
    .replaceAll("\\", "\\\\")
    .replaceAll(delimiter, `\\${delimiter}`)
    .replaceAll("\r", "\\r")
    .replaceAll("\b", "\\b")
    .replaceAll("\f", "\\f")
    .replaceAll("\v", "\\v")
    .replaceAll("\t", "\\t")
    .replaceAll("\n", "\\n");

  fs.writeFileSync(
    encodedFile,
    `module.exports = Buffer.from(${delimiter}${encoded}${delimiter}, ${delimiter}${e}${delimiter});\n`
  );

  try {
    if (Buffer.compare(require(encodedFile), data) === 0) {
      possibleEncodings[e] = fs.statSync(encodedFile).size;
    }
  } catch (e) {}
}

let bestEncoding;
let bestSize = Number.MAX_VALUE;
for (let e of encodings) {
  if (possibleEncodings[e] < bestSize) {
    bestEncoding = e;
    bestSize = possibleEncodings[e];
  }
}

fs.copyFileSync(path.resolve(stagingDir, `${bestEncoding}.js`), path.resolve(argv.output));
fs.rmSync(stagingDir, { recursive: true, force: true });

console.info(
  `Generated '${argv.output}'.  You can remove '${inputPath}' from your project, the .js file is all you need.`
);
