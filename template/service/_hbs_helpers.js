// @flow
/* eslint-disable func-names */
module.exports = function (hbs, util, opts) {
  hbs.registerHelper('js', function (text, data) {
    const context = this.$context;
    // 判断query.debug是否等于debug_flag所指的字符
    const hash = global.HASH + ((!__IS_DEV__ && String(context.query.debug) !== String(opts.debug_flag)) ? '.min' : '');
    let url = util.js(text).replace(/.js$/, `.${hash}.js`);
    // 如果是第三方的url，不要替换
    if (text.indexOf('//') === 0 || /^http/.test(text)) {
      url = text;
    }
    const attrKeys = Object.keys(data.hash);
    const attrs = attrKeys.map(x => `${x}="${data.hash[x]}"`).join(' ');
    return new hbs.SafeString(`<script src="${url}" ${attrs}></script>`);
  });

  hbs.registerHelper('css', text => new hbs.SafeString(`<link href="${util.res(text)}" rel="stylesheet" type="text/css" />`));
};

export type innerHbsHelper = {};
