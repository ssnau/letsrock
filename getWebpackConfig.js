const path = require('path');
const glob = require('glob');

const cwd = global.getCWD();
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
  const to = path.relative(cwd, opts.to);
  const alias = opts.alias || {};

  const entries = getEntries(templatePath);
  return opts.processWebpackConfig({
    entry: entries,
    optimization: {
      splitChunks: {
        chunks: "all"
      }
    },
    module: {
      rules: [{
        test: /\.(es6|js|jsx)$/,
        exclude: [/node_modules/],
        use: {
          loader: ('babel-loader'),
          options: opts.babelQuery
        },
      }],
      /*
      rules: [{
        test: /\.(es6|js|jsx)$/,
        exclude: [/node_modules/],
        use: {
          loader: r('babel-loader'),
          options: opts.babelQuery
        }
      }, {
        test: /\.(json)$/,
        exclude: [/node_modules/],
        use: {
          loader: r([ 'json-loader', ]),
        }
      }, {
        test: /\.(css)$/,
        use: {
          loaders: r([ 'style-loader', 'css-loader', ]),
        }
      }, {
        test: /\.(less|scss|md)$/,
        use: {
          loader: r(['empty-loader']),
        }
      }],
      */

      /*
      loaders: [
        {
          exclude: /node_modules/,
          loader: r('babel-loader'),
          query: opts.babelQuery,
          test: /\.(es6|js|jsx)$/,
        },
        {
          exclude: /node_modules/,
          loaders: r([ 'json-loader', ]),
          test: /\.(json)$/,
        },
        {
          loaders: r([ 'style-loader', 'css-loader', ]),
          test: /\.(css)$/,
        },
        {
          loaders: r(['empty-loader']),
          test: /\.(less|scss|md)$/,
        },
      ],
      */
    },
    output: {
      path: to,
      filename: '[name].[hash].js', // Template based on keys in entry above
      chunkFilename: '[chunkhash].js',
    },
    resolve: {
      //extensions: ['', '.js', '.jsx'],
      alias,
    },
    plugins: [
      global.__IS_DEV__ ? null : new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production'),
        },
      }),
      /*
      new webpack.optimize.splitChunks({
        name: '_commons',
        minChunks: 2,
      }),
      */
      function doneIt() {
        this.plugin('done', (stats) => {
          global.HASH = stats.hash;
          if (__IS_DEV__) return;
          glob
            .sync(`${to}/**`)
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
