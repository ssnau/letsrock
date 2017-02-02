module.exports = function (hbs, util, context, opts) {
  hbs.registerHelper('js', function (text, xx) {
    console.log(xx);
    var hash = global.HASH + ((!__IS_DEV__ && context.query.debug != opts.debug_flag) ? '.min' : '');
    var hashify = str => str.replace(/.js$/, `.${hash}.js`);
    var url = hashify(util.js(text));
    if (text.indexOf('//') == 0 || /^http/.test(text)) {
      url = text;
    }
    return new hbs.SafeString(
      `<script src="${url}"></script>`
    );
  });

  hbs.registerHelper('css', function (text) {
    return new hbs.SafeString(
      `<link href="${util.res(text)}" rel="stylesheet" type="text/css" />`
    );
  });
}
