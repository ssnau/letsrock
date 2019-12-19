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
    // babel-plugin-transform-async-to-generator-2
    // babel-plugin-turbo-name
  //  r('babel-preset-turbo'), // transform into es5
  ].filter(Boolean),
  plugins: [
    r('./babel-plugin-letsrock-ssr'),
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
  ].filter(Boolean),
});
