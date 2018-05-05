// @flow
import type { Context } from '../types/builtin';

const parse = require('co-body');
const co = require('co');

class Request {
  context: Context
  body: any
  parsed: boolean

  constructor(context) {
    this.context = context;
    this.body = null;
    this.parsed = false;
  }

  async getBody(): any {
    const me = this;
    return co(function* parseBody() {
      if (!me.parsed) {
        me.parsed = true;
        me.body = yield parse(me.context);
      }
      return me.body;
    });
  }
}

export default Request;
