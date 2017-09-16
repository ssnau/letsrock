var path = require('path');
var getbabelRelayPlugin = require('babel-relay-plugin');
var cwd = global.getCWD();
var rc = require("./getRC")(cwd);
const valueFn = x => x;
module.exports = {
  from: path.join(cwd, rc.src || 'src'),
  to: path.join(cwd, rc.dist || 'dist'),

  port: rc.port || 9898,

  autoMount: rc.autoMount,       // should only use on fast prototyping
  serverRender: rc.serverRender, // not work currently

  babelQuery: require('./babelQuery'),

  serveFilePath: '/__files' || rc.serveFilePath,

  cdnPrefix: rc.cdnPrefix,   // user-provided fn to determine where the static file is

  metas: rc.metas,

  debug_flag: rc.debug_flag || 1,

  processWebpackConfig: rc.processWebpackConfig || valueFn,

  serviceLowerCasify: rc.serviceLowerCasify,

  static: rc.static,
};
