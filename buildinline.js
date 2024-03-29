/* eslint-disable no-console, import/no-dynamic-require, global-require, consistent-return */
const glob = require('glob');
const fs = require('fs');
const { formatSize, getFilesizeInBytes, minifyJS, minifyCSS } = require('./util');
const chalk = require('chalk');

const r = name => require.resolve(name);

function build(tpath) {
  console.log('[builder] build inline');
  const templatePath = tpath.replace(/\/$/, '');
  const startTime = Date.now();
  glob
    .sync(`${templatePath}/**`)
    .filter(f => !/node_modules/.test(f))
    .filter((f) => {
      if (/\/inline.js$/.test(f)) return true; // must be inline.js
      if (/\/inline.css$/.test(f)) return true; // must be inline.js
      return false;
    })
    .forEach((absfile) => {
      const content = fs.readFileSync(absfile, 'utf8');
      const out = (() => {
        if (/.js$/.test(absfile)) return minifyJS(content);
        if (/.css$/.test(absfile)) return minifyCSS(content);
        return content;
      })();
      const outfile = (() => {
        if (/.js$/.test(absfile)) return absfile.replace(/.js$/, '.min.js');
        if (/.css$/.test(absfile)) return absfile.replace(/.css$/, '.min.css');
        return '';
      })();
      if (!outfile) return;
      fs.writeFileSync(outfile, out, 'utf8');
      const osize = chalk.red(formatSize(getFilesizeInBytes(absfile)));
      const size = chalk.green(formatSize(getFilesizeInBytes(outfile)));
      console.log(`* ${outfile} / ${osize} -> ${size}`);
    });
  const totalTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
  console.log(`[done] build inline, totally ${totalTime}.`);
}

module.exports = build;
