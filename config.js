const path = require('path');
const babelQuery = require('./babelQuery');
// const getbabelRelayPlugin = require('babel-relay-plugin');

const cwd = global.getCWD();
const rc = require('./getRC')(cwd);

const valueFn = x => x;
module.exports = {
  from: path.join(cwd, rc.src || 'src'),
  to: path.join(cwd, rc.dist || 'dist'),

  port: rc.port || 9898,

  autoMount: rc.autoMount, // should only use on fast prototyping

  babelQuery,

  serveFilePath: '/__files' || rc.serveFilePath,

  cdnPrefix: rc.cdnPrefix, // user-provided fn to determine where the static file is

  metas: rc.metas,

  debug_flag: rc.debug_flag || 1,

  processWebpackConfig: rc.processWebpackConfig || valueFn,

  skipBuildOnProduction: rc.skipBuildOnProduction,

  serviceLowerCasify: rc.serviceLowerCasify,

  static: rc.static,

  // free style app config
  // not used by letsrock
  app: rc.app || { __emptyConfig: true },
};
