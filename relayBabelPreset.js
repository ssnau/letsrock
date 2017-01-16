var path = require('path');
var getbabelRelayPlugin = require('babel-relay-plugin');
var r = name => require.resolve(name);
var cwd = global.getCWD();
var rc = require("./getRC")(cwd);
module.exports = getbabelRelayPlugin(require(path.join(cwd, rc.relay)).data)
