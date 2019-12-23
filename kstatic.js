'use strict'

/////////////////////////////////////
//  namespaced version koa-static  //
/////////////////////////////////////

/**
 * Module dependencies.
 */

const debug = require('debug')('koa-static')
const { resolve } = require('path')
const assert = require('assert')
const send = require('koa-send')

/**
 * Expose `serve()`.
 */

module.exports = serve

/**
 * Serve static files from `root`.
 *
 * @param {String} root
 * @param {Object} [opts]
 * @return {Function}
 * @api public
 */

function serve (root, opts) {
  opts = Object.assign({}, opts)

  assert(root, 'root directory is required to serve files')

  // options
  debug('static "%s" %j', root, opts)
  opts.root = resolve(root)
  var namespace = (opts.namespace || '/').trim();
  if (namespace.charAt(0) !== '/') namespace = '/' + namespace; // prefix with /

  if (opts.index !== false) opts.index = opts.index || 'index.html'

  function getPath(ctx) {
    return ctx.path.replace(namespace, '/').replace('//', '/')
  }

  if (!opts.defer) {
    return async function serve (ctx, next) {

      // check namespace first
      if (ctx.path.indexOf(namespace) !== 0) {
        await next();
        return;
      }

      let done = false

      if (ctx.method === 'HEAD' || ctx.method === 'GET') {
        try {
          done = await send(ctx, getPath(ctx), opts)
        } catch (err) {
          if (err.status !== 404) {
            throw err
          }
        }
      }

      if (!done) {
        await next()
      }
    }
  }

  return async function serve (ctx, next) {
    await next()

    if (ctx.path.indexOf(namespace) !== 0) return;
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return
    // response is already handled
    if (ctx.body != null || ctx.status !== 404) return // eslint-disable-line

    try {
      await send(ctx, ctx.path, opts)
    } catch (err) {
      if (err.status !== 404) {
        throw err
      }
    }
  }
}
