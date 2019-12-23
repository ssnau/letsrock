const fs = require('fs');

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

module.exports = {
  safe(fn) {
    try {
      return fn();
    } catch (e) {
      return undefined;
    }
  },
  getFilesizeInBytes,
  formatSize,
  emptyStr: v => (v || ''),
};
