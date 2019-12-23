const fs = require('fs');
const uglifyJS = require('uglify-es');
const uglifyCSS = require('uglifycss');
const babel = require('@babel/core');
const r = name => require.resolve(name);

function formatSize(number) {
  const toFixed = f => f.toFixed(2);
  if (number < 1024) return `${number.toFixed(0)}b`;
  if (number > 1024 && number < 1024 * 1024) return `${toFixed(number / 1024)}kb`;
  return `${toFixed(number / 1024 / 1024)}mb`;
}

function getFilesizeInBytes(filename) {
  const stats = fs.statSync(filename);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

function es5ify(content) {
  return babel.transform(content, {
    presets: [
      [
        r('@babel/preset-env'),
        {
          targets: {
            chrome: '58',
            ie: '11',
          },
        },
      ],
    ],
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

module.exports = {
  safe(fn) {
    try {
      return fn();
    } catch (e) {
      return undefined;
    }
  },
  minifyJS,
  minifyCSS,
  getFilesizeInBytes,
  formatSize,
  emptyStr: v => (v || ''),
};
