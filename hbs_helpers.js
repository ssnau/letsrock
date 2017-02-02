module.exports = function (hbs, util, opts) {
  hbs.registerHelper('js', function (text, data) {
    var context = this.$context;
    var hash = global.HASH + ((!__IS_DEV__ && context.query.debug != opts.debug_flag) ? '.min' : '');
    var hashify = str => str.replace(/.js$/, `.${hash}.js`);
    var url = hashify(util.js(text));
    if (text.indexOf('//') == 0 || /^http/.test(text)) {
      url = text;
    }
    var attrKeys = Object.keys(data.hash);
    var attrs = attrKeys.map(x => `${x}="${data.hash[x]}"`).join(' ');
    return new hbs.SafeString(
      `<script src="${url}" ${attrs}></script>`
    );
  });

  hbs.registerHelper('css', function (text) {
    return new hbs.SafeString(
      `<link href="${util.res(text)}" rel="stylesheet" type="text/css" />`
    );
  });
}
