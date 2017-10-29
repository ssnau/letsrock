import type { Context } from '../types/builtin';

const parse = require('co-body');
const co = require('co');

class Request {
  parsed: bool;
  body: any;
  context: Context;

  constructor(context) {
    this.context = context;
  }

  async getBody() : any {
    const me = this;
    return co(function* () {
      if (!me.parsed) {
        me.parsed = true;
        me.body = yield parse(me.context);
      }
      return me.body;
    });
  }
}

export default Request;
