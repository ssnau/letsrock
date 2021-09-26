import { Middleware } from "koa";
const mw: Middleware = async function (next) {
  // do nothing
  await next;
}
export default mw;
