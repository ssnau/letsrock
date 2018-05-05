var path = require('path');
var glob = require('glob');
var cwd = global.getCWD();
var webpack = require('webpack');
var uglify = require('uglify-js');
var fs = require('fs');
function getEntries(templatePath) {
  templatePath = templatePath.replace(/\/$/, '');
  var entries = {};
  glob
    .sync(templatePath + "/**")
    .filter(function (f) {
      return !/node_modules/.test(f)
    })
    .filter(function (f) {
      if (/index.jsx$/.test(f)) return true; // index.jsx is OK
      var parts = f.split(path.sep);
      var len = parts.length;
      // suppose folder name is qr and we accept qr/qr.jsx as the main point
      // for the reason we don't we index.jsx flood every tab
      if (parts[len - 1].replace(/.jsx$/, '') === parts[len - 2]) return true;
      return false;
    })
    .forEach(function (f) {
      var name = path.relative(templatePath, f).replace(/.(js|jsx)$/, '');
      entries[name] = [f];
    });
  return entries;
}

function r(loaders) {
  if (Array.isArray(loaders)) return loaders.map(x => require.resolve(x));
  return require.resolve(loaders);
}

function getWebpackEntries(opts, ext) {
  var templatePath = opts.from || opts.dir || opts.directory || opts.templatePath;
  var to = path.relative(cwd, opts.to);
  var alias = opts.alias || {};

  var entries = getEntries(templatePath);
  return opts.processWebpackConfig({
    entry: entries,
    module: {
      // Disable handling of unknown requires
      unknownContextRegExp: /$^/,
      unknownContextCritical: false,

      // Disable handling of requires with a single expression
      exprContextRegExp: /$^/,
      exprContextCritical: false,

      // Warn for every expression in require
      wrappedContextCritical: true,

      loaders: [
        {
          exclude: /node_modules/,
          loader: r('babel-loader'),
          query: opts.babelQuery,
          test: /\.(es6|js|jsx)$/
        },
        {
          exclude: /node_modules/,
          loaders: r([
            'json-loader'
          ]),
          test: /\.(json)$/
        },
        {
          loaders: r([
            'style-loader', 'css-loader'
          ]),
          test: /\.(css)$/
        },
        {
          loaders: r(['empty-loader']),
          test: /\.(less|scss|md)$/
        }
      ]
    },
    output: {
      path: to,
      filename: '[name].[hash].js', // Template based on keys in entry above
      chunkFilename: '[chunkhash].js'
    },
    resolve: {
      extensions: ['', '.js', '.jsx'],
      alias: alias
    },
    plugins: [
      global.__IS_DEV__ ? null: new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: "_commons",
        minChunks: 2
      }),
      function () {
        this.plugin("done", function (stats) {
          global.HASH = stats.hash;
          if (__IS_DEV__) return;
          glob
            .sync(to + "/**")
            .filter(f => /.js$/.test(f))
            .filter(f => !/.min.js$/.test(f))
            .forEach(f => {
              fs.writeFile(f.replace(/.js$/, '.min.js'), uglify.minify(f).code);
            });
        });
      }
    ].filter(Boolean),
    externals: [
      {
        config: "var {} " // 对于client端，config是空白
      }
    ]
  });
}

module.exports = getWebpackEntries;
