// @flow
module.exports = {
  safe(fn) {
    try {
      return fn();
    } catch (e) {
      return undefined;
    }
  },
  emptyStr: v => (v || ''),
};

export type innerUtil = {};
