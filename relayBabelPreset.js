/* eslint-disable import/no-dynamic-require */
const path = require('path');
const getbabelRelayPlugin = require('babel-relay-plugin');

const cwd = global.getCWD();
const rc = require('./getRC')(cwd);

module.exports = getbabelRelayPlugin(require(path.join(cwd, rc.relay)).data);
