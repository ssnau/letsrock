/* eslint-disable no-console, import/no-dynamic-require, global-require, consistent-return */

const path = require('path');
const glob = require('glob');

const webpack = require('webpack');
const WebpackBar = require('webpackbar');
const uglify = require('uglify-es');
const fs = require('fs');
const chalk = require('chalk');
const { formatSize, getFilesizeInBytes } = require('./util');

function getEntries(tpath) {
  const templatePath = tpath.replace(/\/$/, '');
  const entries = {};
  glob
    .sync(`${templatePath}/**`)
    .filter(f => !/node_modules/.test(f))
    .filter((f) => {
      if (/index.jsx$/.test(f)) return true; // index.jsx is OK
      if (/index.tsx$/.test(f)) return true; // index.tsx is OK
      const parts = f.split(path.sep);
      const len = parts.length;
      // suppose folder name is qr and we accept qr/qr.jsx as the main point
      // for the reason we don't we index.jsx flood every tab
      if (parts[len - 1].replace(/.jsx$/, '') === parts[len - 2]) return true;
      if (parts[len - 1].replace(/.tsx$/, '') === parts[len - 2]) return true;
      return false;
    })
    .forEach((f) => {
      const name = path.relative(templatePath, f).replace(/.(js|jsx|tsx)$/, '');
      entries[name] = [f];
    });
  return entries;
}

function r(loaders) {
  if (Array.isArray(loaders)) return loaders.map(x => require.resolve(x));
  return require.resolve(loaders);
}

function getWebpackConfig(opts) {
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
        test: /\.(es6|js|jsx|ts|tsx)$/,
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
      extensions: ['.js', '.jsx', '.tsx', '.ts'],
      alias,
    },
    plugins:
    (global.__IS_DEV__ ? [ ] : [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
      ]).concat([
        new WebpackBar(),
        function doneIt() {
          this.plugin('done', (stats) => {
            global.HASH = stats.hash;
            if (__IS_DEV__) return;

            console.log('[webpack] minify files');
            const startTime = Date.now();
            glob
              .sync(`${opts.to}/**`)
              .filter(f => /.js$/.test(f))
              .filter(f => !/.min.js$/.test(f))
              .forEach((f) => {
                const c = fs.readFileSync(f, 'utf8');
                const outfile = f.replace(/.js$/, '.min.js');
                fs.writeFileSync(outfile, uglify.minify(c).code);

                const osize = chalk.red(formatSize(getFilesizeInBytes(f)));
                const size = chalk.green(formatSize(getFilesizeInBytes(outfile)));
                console.log(`* ${outfile} / ${osize} -> ${size}`);
              });
            const totalTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
            console.log(`[webpack] minify done, totally ${totalTime}.`);
          });
        },
      ]).filter(Boolean),
    externals: [
      {
        config: 'var {} ', // 对于client端，config是空白
      },
    ],
  });
}

module.exports = getWebpackConfig;
