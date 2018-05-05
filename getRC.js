/* eslint-disable */
const path = require('path');
const fs = require('fs');

module.exports = function (cwd) {
  try {
    const rc = fs.readFileSync(path.join(cwd, '.rcrc'));
    return eval(`(${rc})`);
  } catch (e) {
    return {};
  }
};
