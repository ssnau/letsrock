/* eslint-disable */
const path = require('path');
const fs = require('fs');


module.exports = function (cwd) {
  function read(file) {
    try {
      const rc = fs.readFileSync(path.join(cwd, file));
      return eval(`(${rc})`);
    } catch (e) {
      return {};
    }
  }

  return Object.assign(
    {},
    read('.rcrc'),  // in your repo
    read('.rcrc_local'), // on your server
    {}
  );
};
