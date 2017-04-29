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

if you wanna run some code at startup, please add a file named `_startup.js` under your project root folder. If `_startup.js` exports a promise, the bootstrap will wait for the promise resolved.

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

## How to config head metas?

edit `.rcrc`.

```javascript
{
  "metas": `
    <meta name="viewport" content="width=device-width, initial-scale=1">
  `
}
```

If you only want your current page use the meta, you can create a file "meta.js" under your page folder.

```
module.exports = {
  metas: `
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
    .good {
      color: red;
    }
    </style>
  `
};
```

## How to get project root dir?

```
this.config.base
```

## How to get request body?

inject `request` object in your controller.

```

async function (request, response) {
  var body = await request.getBody();
}
```

## How to response in JSON?

```
response.ok({
  name: 'jack',
  age: 18
});
// will get: {status: 0, data: {name: 'jack', age: 18}}
response.fail({
  msg: 'you do not have the right to do it'
});
// will get: {status: 1, msg: 'you do not have the right to do it'}
response.fail({
  status: 9,
  msg: 'internal error'
});
// will get: {status: 9, msg: 'internal error'}
response.json({
  name: 'jack',
  age: 18
});
// will get: {name: 'jack', age: 18}
```

## How to get render data in client?

look for "window._STATE" variable.

## How to setup favicon?

Create a file named either `favicon.ico`, `favicon.png` or `favicon.jpg` under your project root.

## How can I know if it is ran by `letsrock dev`?

check if `global.__IS_DEV__` is `true`.

## How to get unminified file online?

simply add a query "?debug=1" with your url. If you dont like `debug=1` and can debug your own flag under `.rcrc`.

```
{
  debug_flag: 3
}
```

In such case, you should query `?debug=3`.

## Can I use handlebars as template engine for lightweight pages?

Yes. Simply put a file name "index.hbs" instead of "index.jsx". If an `index.jsx` or `index.jsx` being presented, it will be
compiled but will not be auto-included by the page. In this case, you need to manually declare it via `js` helper.

Here is some useful builtin helpers.

```
{{js "name/path.js"}}
{{css "name/path.css"}}
```

Also, you can declare two files `inline.js` and `inline.css` under the same folder, they will be automatically included into the page.

warning: the `inline.js` will not be compiled, be carefully!!

## Can I add something to the built-in webpack config?

Sure thing. Edit your `.rcrc` file like following:

```
{
  processWebpackConfig: function (webpackConfig) {
    webpackConfig.plugins = ....
    return webpackConfig;  // do not forget this line
  }
}

```

License
----
MIT
