const r = name => require.resolve(name);
const rc = require('./getRC')(global.getCWD());

// if relay enabled
let relayPreset;
let flowPreset;
if (rc.relay) {
  relayPreset = {
    plugins: [
      r('./relayBabelPreset'),
    ],
  };
}
if (rc.flow) {
  flowPreset = r('@babel/preset-flow');
}
const valfn = x => x;
const postProcessBabelQuery = rc.postProcessBabelQuery || valfn;
const isdev = global.__IS_DEV__;

module.exports = postProcessBabelQuery({
  passPerPreset: true,
  presets: [
    relayPreset,
    flowPreset,
    r('@babel/preset-react'),
  ].filter(Boolean),
  plugins: [
    r('@babel/plugin-transform-modules-commonjs'),
    r('./babel-plugin-letsrock-ssr'),
    r('react-hot-loader/babel'),
/*
    isdev ? [r('babel-plugin-react-transform'), {
      transforms: [{
        transform: r('react-transform-hmr'),
        imports: ['react'],
        locals: ['module'],
      }, {
        transform: r('react-transform-catch-errors'),
        imports: ['react', r('redbox-react')],
      }],
    }].filter(Boolean) : null,
*/
  ].filter(Boolean),
});
