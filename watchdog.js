const Analyzer = require("es6-deps");
const readdir = require("xkit/fs/readdir");
const uniq = require("lodash/uniq");
const fs = require("fs");
const path = require("path");
const os = require("os");
const chokidar = require("chokidar");

function _watch(dir, callback) {
  if (/linux/.test(os.platform())) {
    return chokidar
      .watch(dir, { persistent: true, usePolling: true })
      .on("all", (event, f) => {
        if (/add/.test(event)) return;
        callback(f);
      });
  }
  fs.watch(
    dir,
    { persistent: true, recursive: true },
    function (evt, filename) {
      callback(path.join(dir, filename));
    }
  );
}

function getFilesFromDir(dir) {
  const files = readdir(dir);
  return files.filter((x) => /[.](es6|ts|js|tsx|jsx)$/.test(x));
}

// eslint-disable-next-line consistent-return
function safeRequire(f) {
  try {
    // eslint-disable-next-line
    if (/\.spec\./.test(f)) return;
    require(f);
  } catch (e) {
    console.log(e);
    return null;
  }
}

const reverseDeps = {};
const normalDeps = {};
let analyzer;
function refreshAnalyzer() {
  analyzer = new Analyzer();
}
refreshAnalyzer();
function analyzeFile(file) {
  try {
    const deps = analyzer.getDeps(file, null, {
      ignoreBuiltin: true,
      supressNotFound: true,
      ignorePattern: /node_modules/,
    });
    normalDeps[file] = deps;
    // reverseDeps[a] = [b, c, d] means b or c or d has required a
    deps.forEach((d) => {
      reverseDeps[d] = reverseDeps[d] || [];
      reverseDeps[d].push(file);
      reverseDeps[d] = uniq(reverseDeps[d]);
    });
  } catch (e) {
    console.log("analyze error:", e);
  }
}

module.exports = function watch(opts, app) {
  const folders = []
    .concat(opts.watchFolders || [])
    .map((folder) => path.join(global.APP_BASE, folder));
  const files = [].concat(...folders.map(getFilesFromDir));
  // eslint-disable-next-line no-console
  console.log("start analyzing deps for " + files.length + ' files');
  const s = Date.now();
  files.forEach(analyzeFile);
  console.log('analyze deps done. ' + Math.round(Date.now() - s) / 1000  + 's');
  (opts.watchFolders || []).forEach((p) => {
    const base = global.APP_BASE;
    _watch(path.join(base, p), (f) => {
      refreshAnalyzer();
      const revDeps = reverseDeps[f] || [];
      delete require.cache[f];
      app.triggerWatch(f);

      // eslint-disable-next-line
      safeRequire(f);
      revDeps.forEach((dep) => {
        delete require.cache[dep];
        analyzeFile(dep);
      });
      // DFS reload.
      const hasLoaded = {};
      function reload(file) {
        if (hasLoaded[file]) return;
        // check if file was depended by others
        if (!normalDeps[file] || normalDeps[file].length === 0) {
          app.triggerWatch(file);
          safeRequire(file);
          hasLoaded[file] = true;
          return;
        }
        normalDeps[file].forEach(reload);
        if (!hasLoaded[file]) {
          app.triggerWatch(file);
          safeRequire(file);
          hasLoaded[file] = true;
        }
      }
      revDeps.forEach((dep) => {
        analyzeFile(dep);
        reload(dep);
      });
      analyzeFile(f);
    });
  });
};
