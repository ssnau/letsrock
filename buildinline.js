const uglifyJS = require('uglify-js');
const uglifyCSS = require('uglifycss');
const glob = require('glob');
const fs = require('fs');
const babel = require('babel-core');

const r = name => require.resolve(name);

function build(tpath) {
  const templatePath = tpath.replace(/\/$/, '');
  glob
    .sync(`${templatePath}/**`)
    .filter(f => !/node_modules/.test(f))
    .filter((f) => {
      if (/\/inline.js$/.test(f)) return true; // must be inline.js
      if (/\/inline.css$/.test(f)) return true; // must be inline.js
      return false;
    })
    .forEach(absfile => {
      const content = fs.readFileSync(absfile, 'utf8');
      const out = function () {
        if (/.js$/.test(absfile)) return minifyJS(content)
        if (/.css$/.test(absfile)) return minifyCSS(content)
        return content;
      }();
      const outfile = function () {
        if (/.js$/.test(absfile)) return absfile.replace(/.js$/, '.min.js');
        if (/.css$/.test(absfile)) return absfile.replace(/.css$/, '.min.css');
        return '';
      }();
      if (!outfile) return;
      fs.writeFileSync(outfile, out, 'utf8');
    });
}

function es5ify(content) {
  return babel.transform(content, {
    presets: [r('babel-preset-turbo')],
  }).code;
}

function minifyJS(content) {
  const source = es5ify(content);
  const { error, code } = uglifyJS.minify(source);
  if (error) {
    throw error;
  }
  return code;
}

function minifyCSS(content) {
  return uglifyCSS.processString(content);
}

build(__dirname);

module.exports = build;