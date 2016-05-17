var path = require('path');
var fs = require('fs');
module.exports = function (cwd) {
  try {
    var rc = fs.readFileSync(path.join(cwd, '.rcrc'))
    return eval('(' + rc + ')');
  } catch (e) {
    return {};
  }
}
