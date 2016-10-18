var path =require('path');
var getbabelRelayPlugin = require('babel-relay-plugin');
var cwd = global.getCWD();
var rc = require("./getRC")(cwd);

module.exports = {
  from: path.join(cwd, rc.src || 'src'),
  to: path.join(cwd, rc.dist || 'dist'),

  port: rc.port || 9898,

  autoMount: rc.autoMount,       // should only use on fast prototyping
  serverRender: rc.serverRender, // not work currently

  babelQuery: require('./babelQuery'),

  serveFilePath: '/__files' || rc.serveFilePath,

  resourcePath: '/_res' || rc.resourcePath,

  getCDNLink: rc.getCDNLink,   // user-provided fn to determine where the static file is
};
