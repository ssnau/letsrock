var path =require('path');
var getbabelRelayPlugin = require('babel-relay-plugin');
var r = name => require.resolve(name);
var rc = require("./getRC")(process.cwd());

// if relay enabled
var relayPreset;
if (rc.relay) {
  relayPreset =  {
    "plugins": [
      r('./relayBabelPreset')
    ]
  };
}
var valfn = x => x;
var postProcessBabelQuery = rc.postProcessBabelQuery || valfn;


module.exports = postProcessBabelQuery({
  passPerPreset: true,
  presets: [
    relayPreset,
    r("babel-preset-react"),
    r("babel-preset-turbo"),
  ].filter(Boolean),
  plugins: [
    [r('babel-plugin-react-transform'), {
      transforms: [{
        transform: r('react-transform-hmr'),
        imports: ['react'],
        locals: ['module']
      }, {
        transform: r('react-transform-catch-errors'),
        imports: ['react', r('redbox-react')]
      }]
    }].filter(Boolean)
  ]
});
