const { toKebabCase } = require('../../common/naming');

module.exports = function batmanBegone({ source /*, path*/ }, { parse, visit }) {
  const ast = parse(source);

  return visit(ast, (env) => {
    let { builders: b } = env.syntax;

    return {
      ElementModifierStatement(node) {
        if (!node.path.parts[0].includes('$')) {
          return;
        }

        const [addon, modifier] = node.path.parts[0].split('$');

        node.path = b.path('modifier');
        node.params.unshift(b.string(`${addon}@${modifier}`));
      },

      ElementNode(node) {
        if (!node.tag.includes('$')) {
          return;
        }

        const [addon, component] = node.tag.split('$');

        node.tag = component;

        return b.block(
          'let',
          [b.sexpr('component', [b.string(`${toKebabCase(addon)}@${toKebabCase(component)}`)])],
          b.hash(),
          b.blockItself([node], [component])
        );
      },

      MustacheStatement(node) {
        if (!node.path.parts[0].includes('$')) {
          return;
        }

        const [addon, curly] = node.path.parts[0].split('$');

        return b.mustache('if', [
          b.sexpr('isHelper', [
            b.string(`${addon}@${curly}`),
            b.sexpr('helper', [b.string(`${addon}@${curly}`), ...node.params]),
          ]),

          b.sexpr('component', [b.string(`${addon}@${curly}`), ...node.params]),
        ]);
      },

      SubExpression(node) {
        if (!node.path.parts[0].includes('$')) {
          return;
        }

        const [addon, helper] = node.path.parts[0].split('$');

        node.path = b.path('helper');
        node.params.unshift(b.string(`${addon}@${helper}`));
      },
    };
  });
};

module.exports.type = 'hbs';
