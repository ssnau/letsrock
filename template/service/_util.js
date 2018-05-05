// @flow
module.exports = {
  safe(fn) {
    try {
      return fn();
    } catch (e) {
      return undefined;
    }
  },
  empty_str: v => (v || ''),
};

export type innerUtil = {};
