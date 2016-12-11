Install
------

```
npm install letsrock -g
```

Start
----

```bash
letsrock init your_project
cd your_project
letsrock dev
```

Config
-----

You can add a `.rcrc` file to indicate you config.
```javascript
{
  "autoMount": true, // true to auto mount page for specific urls, it will bypass your custom controller
  "serverRender": false, // enable server render or not
  "port": 9988  // port to listen
}
```

Server Code
------

Add the following 3 folders to enable server side logic.

```
middleware
service
controller
```

if you wanna run some code at startup, please add a file named `_startup.js` under your project root folder.

Builtin Injectors
-----

```
request
 - request.getBody
response
 - response.render(data, tpl, opts)
context
app
```


FAQ
-----

## How to specify css style for a particular page?

`letsrock` use webpack to pack your stylesheet so it is safe to call `import "./index.css"` under a jsx file.

## Where to put static files?

create a folder named "/_res" and put your files under this file.

```
<img src={$res("/head.png")} />
```

License
----
MIT
