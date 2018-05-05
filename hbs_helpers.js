/* eslint-disable func-names */
module.exports = function (hbs, util, opts) {
  hbs.registerHelper('js', function (text, data) {
    const context = this.$context;
    const hash = global.HASH + ((!__IS_DEV__ && String(context.query.debug) !== String(opts.debug_flag)) ? '.min' : '');
    const hashify = str => str.replace(/.js$/, `.${hash}.js`);
    let url = hashify(util.js(text));
    if (text.indexOf('//') === 0 || /^http/.test(text)) {
      url = text;
    }
    const attrKeys = Object.keys(data.hash);
    const attrs = attrKeys.map(x => `${x}="${data.hash[x]}"`).join(' ');
    return new hbs.SafeString(`<script src="${url}" ${attrs}></script>`);
  });

  hbs.registerHelper('css', text => new hbs.SafeString(`<link href="${util.res(text)}" rel="stylesheet" type="text/css" />`));
};
