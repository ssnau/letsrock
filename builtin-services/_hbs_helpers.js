module.exports = function (hbs, util, opts) {
  hbs.registerHelper('js', function (text, data) {
    var context = this.$context;
    // 判断query.debug是否等于debug_flag所指的字符
    let hash = global.HASH + ((!__IS_DEV__ && context.query.debug != opts.debug_flag) ? '.min' : '');
    let url = util.js(text).replace(/.js$/, `.${hash}.js`);
    // 如果是第三方的url，不要替换
    if (text.indexOf('//') == 0 || /^http/.test(text)) {
      url = text;
    }
    var attrKeys = Object.keys(data.hash);
    var attrs = attrKeys.map(x => `${x}="${data.hash[x]}"`).join(' ');
    return new hbs.SafeString(`<script src="${url}" ${attrs}></script>`);
  });

  hbs.registerHelper('css', function (text) {
    return new hbs.SafeString(
      `<link href="${util.res(text)}" rel="stylesheet" type="text/css" />`
    );
  });
}
