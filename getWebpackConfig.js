var path = require('path');
var glob = require('glob');
function getEntries(templatePath) {
    templatePath = templatePath.replace(/\/$/, '');
    var entries = {};
    glob
      .sync(templatePath + "/**")
      .filter(function (f) {
        return !/node_modules/.test(f)
      })
      .filter(function (f) {
        return /index.jsx$/.test(f)
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

function getWebpackEntries(opts) {
    var templatePath = opts.from || opts.dir || opts.directory || opts.templatePath;
    var to = path.relative(process.cwd(), opts.to);
    var alias = opts.alias || {};
    return {
      entry: getEntries(templatePath),
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
        filename: '[name].js' // Template based on keys in entry above
      },
      resolve: {
        extensions: ['', '.js', '.jsx'],
        alias: alias
      },
      externals: [
        {
          config: "var {} " // 对于client端，config是空白
        }
      ]
    }
}

module.exports = getWebpackEntries;
