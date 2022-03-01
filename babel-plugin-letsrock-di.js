/* eslint-disable global-require, no-param-reassign, no-console, func-names */
// THIS FILE IS RETIRED.

const path = require('path');


function getDeclaration(varName, varType) {
  // ast for:
  // const varName = await context.getInjection(varType);
  return {
    type: 'VariableDeclaration',
    declarations: [
      {
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: varName,
        },
        init: {
          type: 'AwaitExpression',
          argument: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              object: {
                type: 'Identifier',
                name: 'this',
              },
              property: {
                type: 'Identifier',
                name: 'getInjection',
              },
              computed: false,
            },
            arguments: [
              {
                type: 'Identifier',
                name: varType,
              },
            ],
          },
        },
      },
    ],
    kind: 'const',
  };
}


module.exports = function (babel) {
  babel.assertVersion(7);
  return {
    visitor: {
      Program: {
        enter(_path) {
          const { file } = _path.hub;
          const filepath = file.opts.filename;
          const controllerDir = path.join(global.APP_BASE, 'controller');
          const serviceDir = path.join(global.APP_BASE, 'serviceDir');
          const valid = filepath.indexOf(controllerDir) === 0 || filepath.indexOf(serviceDir) === 0;
          if (!valid) return;

          _path.traverse({
            ObjectMethod: {
              enter(__path) {
                if (!__path.node.key.name === 'controller') return;
                const { params } = __path.node;
                const untypeds = params.map((p) => {
                  const { name } = p;
                  if (!p.typeAnnotation) return name;
                  if (!p.typeAnnotation.typeAnnotation) return name;
                  return null;
                }).filter(Boolean);
                let hasContext = false;
                const prependNodes = params.map((p) => {
                  const { name } = p;
                  if (!p.typeAnnotation) return null;
                  if (!p.typeAnnotation.typeAnnotation) return null;
                  const typeName = p.typeAnnotation.typeAnnotation.typeName.name;
                  if (name === 'context') {
                    hasContext = true;
                    return null;
                  }
                  return getDeclaration(name, typeName);
                }).filter(Boolean);
                // re-write to only keep un-typed parameter.
                __path.node.params = untypeds.map(u => ({
                  type: 'Identifier',
                  name: u,
                }));
                // since Context is an interface, we cannot handle at runtime.
                if (hasContext && __path.node.params.map(x => x.name).indexOf('context') === -1) {
                  __path.node.params.push({
                    type: 'Identifier',
                    name: 'context',
                  });
                }
                __path.node.body.body.unshift(...prependNodes);
              },
            },
          });
        },
      },
    },
  };
};

