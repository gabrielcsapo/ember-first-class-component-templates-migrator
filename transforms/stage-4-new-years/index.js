const path = require('node:path');

const { nameMapFile } = require('../../common/constants');
const { getPackageRoot } = require('../../common/filesystem');
const { readJsonFile } = require('../../common/json');
const { toKebabCase } = require('../../common/naming');

function buildResolver(b, name, type) {
  return b.sexpr('resolve', [b.string(name)], b.hash([b.pair('type', b.string(type))]));
}

function getUnknownNames(namesByAddon) {
  const unknownNames = Object.create(null);

  for (const [type, names] of Object.entries(namesByAddon.unknown)) {
    for (const name of names) {
      if (!(name in unknownNames)) {
        unknownNames[name] = [];
      }

      unknownNames[name].push(type);
    }
  }

  return unknownNames;
}

function isDefinedByLet(node, nodePath) {
  let current = nodePath;

  while (current) {
    if (
      current.node.type === 'BlockStatement' &&
      current.node.path.original === 'let' &&
      current.node.program.blockParams.includes(node.tag)
    ) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

module.exports = function ({ source, path: templatePath }, { parse, visit }) {
  const absTemplatePath = path.resolve(templatePath);
  const packageRoot = getPackageRoot(absTemplatePath);
  const pathFromRoot = path.relative(packageRoot, absTemplatePath);
  const namesMapPath = path.join(packageRoot, nameMapFile);
  const namesMap = readJsonFile(namesMapPath);

  if (!(pathFromRoot in namesMap)) {
    console.error(
      `Skipping '${templatePath}' because it could not be found in its package's names map` +
        ` ('${namesMapPath}'). Make sure stages 2 and 3 completed successfully.`
    );

    return;
  }

  const unknownNames = getUnknownNames(namesMap[pathFromRoot]);
  const ast = parse(source);

  return visit(ast, (env) => {
    let { builders: b } = env.syntax;

    return {
      ElementModifierStatement(node) {
        if (!(node.path.original in unknownNames)) {
          return;
        }

        if (!unknownNames[node.path.original].includes('modifiers')) {
          console.error(
            `In '${templatePath}', '${node.path.original}' is being used as a modifier, but it is` +
              ` not listed as one in the package's names map ('${namesMapPath}'). Make sure` +
              ` stages 2 and 3 completed successfully.`
          );

          return;
        }

        node.path = buildResolver(b, node.path.original, 'modifier');
      },

      ElementNode(node, nodePath) {
        if (!(node.tag in unknownNames)) {
          return;
        }

        if (!unknownNames[node.tag].includes('angleComponents')) {
          console.error(
            `In '${templatePath}', '${node.tag}' is being used as a component, but it is` +
              ` not listed as one in the package's names map ('${namesMapPath}'). Make sure` +
              ` stages 2 and 3 completed successfully.`
          );

          return;
        }

        if (isDefinedByLet(node, nodePath)) {
          return;
        }

        return b.block(
          'let',
          [b.sexpr('component', [b.string(`${toKebabCase(node.tag)}`)])],
          undefined,
          b.blockItself([node], [node.tag])
        );
      },

      MustacheStatement(node) {
        if (!(node.path.original in unknownNames)) {
          return;
        }

        if (!unknownNames[node.path.original].includes('ambiguousCurlies')) {
          console.error(
            `In '${templatePath}', '${node.path.original}' is being used as ambiguous helper or` +
              " component, but it is not listed as one in the package's names map" +
              ` ('${namesMapPath}'). Make sure stages 2 and 3 completed successfully.`
          );

          return;
        }

        const nameAsHelper = node.path.original + 'Helper';
        const nameAsComponent = node.path.original + 'Component';
        const hasParams = node.params?.length || node.hash?.pairs?.length;

        const nodeAsHelper = hasParams
          ? b.sexpr(nameAsHelper, node.params, node.hash)
          : b.path(nameAsHelper);

        const nodeAsComponent = hasParams
          ? b.sexpr(nameAsComponent, [b.path(nameAsComponent), ...node.params], node.hash)
          : b.path(nameAsComponent);

        return b.block(
          'let',
          [
            buildResolver(b, node.path.original, 'helper'),
            buildResolver(b, node.path.original, 'component'),
          ],
          undefined,
          b.blockItself(
            [b.mustache('if', [b.path(nameAsHelper), nodeAsHelper, nodeAsComponent])],
            [nameAsHelper, nameAsComponent]
          )
        );
      },

      SubExpression(node) {
        if (!(node.path.original in unknownNames)) {
          return;
        }

        if (!unknownNames[node.path.original].includes('helpers')) {
          console.error(
            `In '${templatePath}', '${node.path.original}' is being used as a helper, but it is` +
              ` not listed as one in the package's names map ('${namesMapPath}'). Make sure` +
              ` stages 2 and 3 completed successfully.`
          );

          return;
        }

        node.path = buildResolver(b, node.path.original, 'helper');
      },
    };
  });
};

module.exports.type = 'hbs';
