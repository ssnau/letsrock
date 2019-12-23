/* eslint-disable no-console */
module.exports = function createEventStream(heartbeat) {
  let clientId = 0;
  const clients = {};

  function everyClient(fn) {
    Object.keys(clients).forEach((id) => {
      if (!clients[id]) return;
      if (clients[id].finished) return;
      try {
        fn(clients[id], id);
      } catch (e) {
        console.log('meet errors when call everyClient', e.stack);
      }
    });
  }

  setInterval(() => {
    everyClient((client) => {
      client.write('data: \uD83D\uDC93\n\n');
    });
  }, heartbeat).unref();
  function closeAll(pattern) {
    everyClient((client, id) => {
      if (id.indexOf(pattern || '') > -1) {
        client.end('');
        delete clients[id]; // clear clients
      }
    });
  }
  return {
    close: closeAll,
    handler(req, res) {
      const ua = req.headers['user-agent'];
      req.socket.setKeepAlive(true);
      // long enough (roughly 10 years) to make the socket never end..
      req.socket._idleTimeout = 1000 * 3600 * 24 * 7 * 30 * 12 * 365 * 10;
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/event-stream;charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });
      res.write('\n');
      closeAll(ua); // close all the connections relate to the ua
      ++clientId;
      const id = `${ua}-${clientId}`;
      clients[id] = res;
      req.on('close', () => {
        delete clients[id];
      });
    },
    publish(payload) {
      everyClient((client) => {
        client.write(`data: ${JSON.stringify(payload)}\n\n`);
      });
    },
  };
};
