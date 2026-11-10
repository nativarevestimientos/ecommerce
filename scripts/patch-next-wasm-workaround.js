const fs = require("fs");
const path = require("path");

const replacements = [
  {
    file: path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "build",
      "swc",
      "index.js",
    ),
    changes: [
      {
        from:
          '        const shouldLoadWasmFallbackFirst = !disableWasmFallback && unsupportedPlatform && useWasmBinary || isWebContainer;\n' +
          '        if (!unsupportedPlatform && useWasmBinary) {\n' +
          '            _log.warn(`experimental.useWasmBinary is not an option for supported platform ${PlatformName}/${ArchName} and will be ignored.`);\n' +
          "        }\n",
        to:
          '        const shouldLoadWasmFallbackFirst = !disableWasmFallback || isWebContainer;\n' +
          '        _log.warn(`Local workaround active for ${PlatformName}/${ArchName}: trying wasm bindings before native to bypass blocked SWC binary.`);\n',
      },
      {
        from:
          "            let pkgPath = pkg;\n" +
          "            if (importPath) {\n" +
          "                // the import path must be exact when not in node_modules\n" +
          '                pkgPath = _path.default.join(importPath, pkg, "wasm.js");\n' +
          "            }\n" +
          "            let bindings = await import((0, _url.pathToFileURL)(pkgPath).toString());\n",
        to:
          '            let pkgPath = importPath ? _path.default.join(importPath, pkg, "wasm.js") : require.resolve(pkg);\n' +
          "            let bindings = await import((0, _url.pathToFileURL)(pkgPath).toString());\n",
      },
    ],
  },
  {
    file: path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "esm",
      "build",
      "swc",
      "index.js",
    ),
    changes: [
      {
        from:
          '        const shouldLoadWasmFallbackFirst = !disableWasmFallback && unsupportedPlatform && useWasmBinary || isWebContainer;\n' +
          '        if (!unsupportedPlatform && useWasmBinary) {\n' +
          '            Log.warn(`experimental.useWasmBinary is not an option for supported platform ${PlatformName}/${ArchName} and will be ignored.`);\n' +
          "        }\n",
        to:
          '        const shouldLoadWasmFallbackFirst = !disableWasmFallback || isWebContainer;\n' +
          '        Log.warn(`Local workaround active for ${PlatformName}/${ArchName}: trying wasm bindings before native to bypass blocked SWC binary.`);\n',
      },
      {
        from:
          "            let pkgPath = pkg;\n" +
          "            if (importPath) {\n" +
          "                // the import path must be exact when not in node_modules\n" +
          '                pkgPath = path.join(importPath, pkg, "wasm.js");\n' +
          "            }\n" +
          "            let bindings = await import(pathToFileURL(pkgPath).toString());\n",
        to:
          '            let pkgPath = importPath ? path.join(importPath, pkg, "wasm.js") : require.resolve(pkg);\n' +
          "            let bindings = await import(pathToFileURL(pkgPath).toString());\n",
      },
    ],
  },
];

let patchedFiles = 0;

for (const target of replacements) {
  if (!fs.existsSync(target.file)) {
    continue;
  }

  let content = fs.readFileSync(target.file, "utf8");
  let changed = false;

  for (const change of target.changes) {
    if (content.includes(change.to)) {
      continue;
    }
    if (!content.includes(change.from)) {
      continue;
    }
    content = content.replace(change.from, change.to);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(target.file, content, "utf8");
    patchedFiles += 1;
  }
}

process.stdout.write(
  `[next-wasm-workaround] patched ${patchedFiles} file(s)\n`,
);
