module.exports = function createEventStream(heartbeat) {
  var clientId = 0;
  var clients = {};

  function everyClient(fn) {
    Object.keys(clients).forEach(function (id) {
      if (!clients[id]) return;
      try {
        fn(clients[id], id);
      } catch (e) {
        console.log('meet errors when call everyClient', e.stack);
      }
    });
  }

  setInterval(function heartbeatTick() {
    everyClient(function (client) {
      client.write("data: \uD83D\uDC93\n\n");
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
    handler: function (req, res) {
      var ua = req.headers['user-agent'];
      req.socket.setKeepAlive(true);
      // long enough (roughly 10 years) to make the socket never end..
      req.socket._idleTimeout = 1000 * 3600 * 24 * 7 * 30 * 12 * 365 * 10;
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/event-stream;charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      });
      res.write('\n');
      closeAll(ua); // close all the connections relate to the ua
      ++clientId;
      var id = ua + "-" + clientId;
      clients[id] = res;
      req.on("close", function () {
        delete clients[id];
      });
    },
    publish: function (payload) {
      everyClient(function (client) {
        client.write("data: " + JSON.stringify(payload) + "\n\n");
      });
    }
  };
};
