const r = name => require.resolve(name);
require('@babel/register')({
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  presets: [
    r('@babel/preset-react'),
    r('@babel/preset-typescript'),
  ],
  plugins: [
    r('@babel/plugin-transform-modules-commonjs'),
    r('@babel/plugin-proposal-optional-chaining'),
    r('@babel/plugin-proposal-nullish-coalescing-operator'),
    r('@babel/plugin-proposal-class-properties'),
  ],
});
