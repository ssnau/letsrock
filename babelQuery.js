const r = name => require.resolve(name);
const rc = require('./getRC')(global.getCWD());

const valfn = x => x;
const postProcessBabelQuery = rc.postProcessBabelQuery || valfn;

module.exports = postProcessBabelQuery({
  passPerPreset: true,
  presets: [
    r('@babel/preset-typescript'),
    r('@babel/preset-react'),
  ].filter(Boolean),
  plugins: [
    r('@babel/plugin-proposal-optional-chaining'),
    r('@babel/plugin-proposal-nullish-coalescing-operator'),
    r('@babel/plugin-proposal-class-properties'),
  ].filter(Boolean),
});
