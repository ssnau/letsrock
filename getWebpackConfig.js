const path = require('path');
const glob = require('glob');

const webpack = require('webpack');
const uglify = require('uglify-es');
const fs = require('fs');

function getEntries(tpath) {
  const templatePath = tpath.replace(/\/$/, '');
  const entries = {};
  glob
    .sync(`${templatePath}/**`)
    .filter(f => !/node_modules/.test(f))
    .filter((f) => {
      if (/index.jsx$/.test(f)) return true; // index.jsx is OK
      const parts = f.split(path.sep);
      const len = parts.length;
      // suppose folder name is qr and we accept qr/qr.jsx as the main point
      // for the reason we don't we index.jsx flood every tab
      if (parts[len - 1].replace(/.jsx$/, '') === parts[len - 2]) return true;
      return false;
    })
    .forEach((f) => {
      const name = path.relative(templatePath, f).replace(/.(js|jsx)$/, '');
      entries[name] = [f];
    });
  return entries;
}

function r(loaders) {
  if (Array.isArray(loaders)) return loaders.map(x => require.resolve(x));
  return require.resolve(loaders);
}

function getWebpackEntries(opts) {
  const templatePath = opts.from || opts.dir || opts.directory || opts.templatePath;
  const alias = opts.alias || {};
  const entries = getEntries(templatePath);
  return opts.processWebpackConfig({
    mode: 'none',
    entry: entries,
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: '/_commons',
            chunks: 'all',
          },
        },
      },
    },
    output: {
      path: opts.to,
      filename: '[name].[hash].js', // Template based on keys in entry above
      chunkFilename: '[name].[hash].js',
    },
    module: {
      rules: [{
        test: /\.(es6|js|jsx|ts)$/,
        exclude: [/node_modules/],
        use: {
          loader: r('babel-loader'),
          options: opts.babelQuery,
        },
      },
      {
        test: /\.css$/i,
        use: [r('style-loader'), r('css-loader')],
      },
      {
        test: /\.(less|scss|md)$/,
        use: [r('empty-loader')],
      },
      ],
    },
    target: 'web',
    devtool: 'source-map',
    resolve: {
      extensions: ['.js', '.jsx'],
      alias,
    },
    plugins: [
      global.__IS_DEV__ ? null : new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production'),
        },
      }),
      function doneIt() {
        this.plugin('done', (stats) => {
          global.HASH = stats.hash;
          if (__IS_DEV__) return;
          glob
            .sync(`${opts.to}/**`)
            .filter(f => /.js$/.test(f))
            .filter(f => !/.min.js$/.test(f))
            .forEach((f) => {
              const c = fs.readFileSync(f, 'utf8');
              fs.writeFileSync(f.replace(/.js$/, '.min.js'), uglify.minify(c).code);
            });
        });
      },
    ].filter(Boolean),
    externals: [
      {
        config: 'var {} ', // 对于client端，config是空白
      },
    ],
  });
}

module.exports = getWebpackEntries;
