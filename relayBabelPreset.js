var path =require('path');
var getbabelRelayPlugin = require('babel-relay-plugin');
var r = name => require.resolve(name);
var rc = require("./getRC")(process.cwd());
module.exports = getbabelRelayPlugin(require(path.join(process.cwd(), rc.relay)).data)
