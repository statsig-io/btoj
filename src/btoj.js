#!/usr/bin/env node

const encodings = ["latin1", "utf8", "base64", "utf16le", "ucs2", "ascii"];

const yargs = require("yargs");
const path = require("path");
const fs = require("fs");
const z = require("zlib");
const { exit } = require("process");

function getDelimiter(s) {
  return (s.match(/\'/g) || []).length >= (s.match(/\"/g) || []).length
    ? '"'
    : "'";
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
  .option("compress", {
    alias: "z",
    description:
      "Use NodeJS compression libraries.  The generated module will automatically decompress when exporting.`",
    required: false,
    type: "boolean",
  })
  .option("staging", {
    alias: "s",
    description:
      "Path to the staging directory, used to measure size of different encodings.  Defaults to `.btoj/`",
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

const stagingDir = path.resolve(argv.staging ?? ".btoj/");
if (fs.existsSync(stagingDir)) {
  console.error(`Staging directory '${stagingDir}' already exists.  Aborting.`);
  exit(1);
}

fs.mkdirSync(stagingDir);

const input = fs.readFileSync(inputPath);
const possibleEncodings = {};
for (const e of encodings) {
  let encodedInput;
  if (argv.compress) {
    encodedInput = z
      .brotliCompressSync(fs.readFileSync(inputPath, null))
      .toString(e);
  } else {
    encodedInput = fs.readFileSync(inputPath, e);
  }

  if (e.startsWith("base64")) {
    encodedInput = encodedInput.replaceAll("=", "");
  }

  const d = getDelimiter(encodedInput);
  const escaped = encodedInput
    .replaceAll("\\", "\\\\")
    .replaceAll(d, `\\${d}`)
    .replaceAll("\r", "\\r")
    .replaceAll("\n", "\\n");

  let out = "";
  if (argv.compress) {
    out += `let z=require(${d}zlib${d});`;
  }

  let hardcodedData = `Buffer.from(${d}${escaped}${d}, ${d}${e}${d})`;
  if (argv.compress) {
    hardcodedData = `z.brotliDecompressSync(${hardcodedData})`;
  }

  out += `module.exports=${hardcodedData};\n`;

  const outFile = path.resolve(stagingDir, `${e}.js`);
  fs.writeFileSync(outFile, out);
  try {
    if (Buffer.compare(require(outFile), input) === 0) {
      const size = fs.statSync(outFile).size;
      console.debug(`  '${e}'\trequires ${size} bytes.`);
      possibleEncodings[e] = size;
    } else {
      console.debug(`  '${e}'\twould cause corruption.`);
      possibleEncodings[e] = Number.MAX_VALUE;
    }
  } catch (ex) {
    console.debug(`  '${e}'\tfails with '${ex.code ?? "ERR_INVALID_JS"}'`);
  }
}

try {
  let bestEncoding = undefined;
  let bestSize = Number.MAX_VALUE;
  for (let e of encodings) {
    if (possibleEncodings[e] < bestSize) {
      bestEncoding = e;
      bestSize = possibleEncodings[e];
    }
  }

  fs.copyFileSync(
    path.resolve(stagingDir, `${bestEncoding}.js`),
    path.resolve(argv.output)
  );

  console.info(
    `Done!  You can remove '${inputPath}' from your project, '${argv.output}' is all you need.`
  );
  fs.rmSync(stagingDir, { recursive: true, force: true });
} catch (ex) {
  console.error(ex);
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
