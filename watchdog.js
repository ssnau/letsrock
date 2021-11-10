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
    require(f);
  } catch (e) {
    console.log(e);
    return null;
  }
}

const reverseDeps = {};
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
  console.log("start analyzing deps");
  files.forEach(analyzeFile);

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
      // 必须分成两片来执行。
      // 确保不会一边delete，一边require
      // 导致trigger的文件对另一个文件引用是失效的
      revDeps.forEach((dep) => {
        analyzeFile(dep);
        app.triggerWatch(dep);
        // eslint-disable-next-line
        safeRequire(dep);
      });

      analyzeFile(f);
    });
  });
};
