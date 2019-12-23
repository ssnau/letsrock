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
    if (!this.parsed) {
      this.parsed = true;
      this.body = await parse(this.context);
    }
    return this.body;
  }
}

export default Request;
