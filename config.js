var path =require('path');
var getbabelRelayPlugin = require('babel-relay-plugin');
var rc = require("./getRC")(process.cwd());

module.exports = {
  from: path.join(process.cwd(), rc.src || 'src'),
  to: path.join(process.cwd(), rc.dist || 'dist'),

  port: rc.port || 9898,
  
  autoMount: rc.autoMount,
  serverRender: rc.serverRender,

  babelQuery: require('./babelQuery'),

  serveFilePath: '/__files'
};
