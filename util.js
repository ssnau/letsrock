module.exports = {
  safe(fn) {
    try {
      return fn();
    } catch (e) {
      return undefined;
    }
  },
  time(action, fn) {
    console.log(`[${action}] start`);
    fn();
    console.log(`[${action}] end`);
  },
  emptyStr: v => (v || ''),
};
