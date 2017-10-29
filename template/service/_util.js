module.exports = {
  safe: function (fn) {
    try {
      return fn();
    } catch (e) {
      return;
    }
  },
  empty_str: v => (v || '')
};

export type inner_util = {};
