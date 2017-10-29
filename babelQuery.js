var path = require('path');
var getbabelRelayPlugin = require('babel-relay-plugin');
var r = name => require.resolve(name);
var rc = require("./getRC")(global.getCWD());

// if relay enabled
var relayPreset, flowPreset;
if (rc.relay) {
  relayPreset = {
    "plugins": [
      r('./relayBabelPreset')
    ]
  };
}
if (rc.flow) {
  flowPreset = r('babel-preset-flow')
}
var valfn = x => x;
var postProcessBabelQuery = rc.postProcessBabelQuery || valfn;
const isdev = global.__IS_DEV__

module.exports = postProcessBabelQuery({
  passPerPreset: true,
  presets: [
    relayPreset,
    flowPreset,
    r("babel-preset-react"),
    r("babel-preset-turbo"),  // transform into es5
  ].filter(Boolean),
  plugins: [
    isdev ? [r('babel-plugin-react-transform'), {
      transforms: [{
        transform: r('react-transform-hmr'),
        imports: ['react'],
        locals: ['module']
      }, {
        transform: r('react-transform-catch-errors'),
        imports: ['react', r('redbox-react')]
      }]
    }].filter(Boolean) : null,
  ].filter(Boolean)
});
