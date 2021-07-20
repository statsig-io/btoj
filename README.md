# **btoj**

**btoj** (Binary to JavaScript) is a utility that converts binary files into pure JavaScript modules exporting those files as Buffers.

## Usage

```console
$ npm install --global btoj
$ btoj location_data.bin -o location_data.js [--compress]
generated 'location_data.js'
You can now delete 'location_data.bin' from your project. The js file is all you need.
```

```js
import location_data from "location_data";

// `location_data` will hold the same Buffer as if you had done
//
// const buffer = await fs.readFile(
//   path.resolve("./location_data.bin")
// );
//
// Note that the binary file is no longer needed--the js module has its data.
```

## Compatibility

**btoj** is likely compatible with your system. If not, send a PR!

Compression currently requires [NodeJS's `zlib` library](https://nodejs.org/api/zlib.html#zlib_zlib_brotlicompresssync_buffer_options) and won't work on browser environments.

## Benchmarks

TODO!

## Why?

It can be tricky to load binary files in some environments, either because a file system is not available, or because of some transpilation step such as webpack. **btoj** was made to _simplify_ binary file usage in these cases, by making the file be treated as any other JavaScript code.

**btoj** was _not_ made to optimize binary file usage. Any text encoding will be larger than pure binary file, as it includes the same bits plus escape characters. However, we do try to keep **btoj**'s overhead as small as possible.

Note that in most environments it is possible to make binary files work without using a tool such as **btoj**, even when they don't work out of the box. Common workarounds include downloading binaries from the network, or listing packages with binary dependencies as externals in the compilation toolchain. Those workarounds have their benefits, but they also increase setup burden for your users. If you value a simple integration experience for your package, consider **btoj**.
