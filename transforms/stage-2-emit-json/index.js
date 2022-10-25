module.exports = function emitJSON({ source, path: filePath }, { parse, visit }) {
  const ast = parse(source);

  function createBuckets() {
    return {
      ambiguousCurlies: [],
      angleComponents: [],
      helpers: [],
      modifiers: [],
    };
  }

  const jsonObject = {
    [filePath]: {
      known: {},
      unknown: createBuckets(),
    },
  };

  const emberTemplateHelpers = [
    'action',
    'array',
    'component',
    'concat',
    'debugger',
    'each',
    'each-in',
    'fn',
    'get',
    'has-block',
    'has-block-params',
    'hash',
    'if',
    'in-element',
    'input',
    'let',
    'link-to',
    'log',
    'mount',
    'mut',
    'on',
    'outlet',
    'page-title',
    'textarea',
    'unbound',
    'unique-id',
    'unless',
    'yield',
  ];

  const upperCaseRegex = /[A-Z]/;

  function getEntityName(node) {
    let entityPath = node.value;

    if (entityPath.includes('@')) {
      return entityPath.split('@');
    }

    return entityPath;
  }

  function hasAddonBeenSeen(addonName) {
    if (jsonObject[filePath].known[addonName] === undefined) {
      jsonObject[filePath].known[addonName] = createBuckets();
    }
  }

  function isEntityInAmbiguousCurlies(addonName, entityName) {
    return jsonObject[filePath].known[addonName].ambiguousCurlies.includes(entityName);
  }

  return visit(ast, () => {
    return {
      SubExpression(node) {
        if (node.path.parts.includes('component')) {
          const [addonName, componentName] = getEntityName(
            node.params.find((param) => param.type === 'StringLiteral')
          );
          hasAddonBeenSeen(addonName);
          if (!isEntityInAmbiguousCurlies(addonName, componentName)) {
            jsonObject[filePath].known[addonName].angleComponents.push(componentName);
          }
        }

        if (node.path.parts.includes('isHelper')) {
          const [addonName, componentName] = getEntityName(
            node.params.find((param) => param.type === 'StringLiteral')
          );
          hasAddonBeenSeen(addonName);
          jsonObject[filePath].known[addonName].ambiguousCurlies.push(componentName);
        }

        if (node.path.parts.includes('helper')) {
          const [addonName, componentName] = getEntityName(
            node.params.find((param) => param.type === 'StringLiteral')
          );
          hasAddonBeenSeen(addonName);
          if (!isEntityInAmbiguousCurlies(addonName, componentName)) {
            jsonObject[filePath].known[addonName].helpers.push(componentName);
          }
        }

        if (!emberTemplateHelpers.includes(node.path.parts[0])) {
          jsonObject[filePath].unknown.helpers.push(node.path.parts[0]);
        }

        return;
      },

      ElementNode(node) {
        const tag = node.tag;
        if (upperCaseRegex.test(tag.charAt(0))) {
          jsonObject[filePath].unknown.angleComponents.push(tag);
        }
        return;
      },

      ElementModifierStatement(node) {
        if (node.params.length) {
          const [addonName, componentName] = getEntityName(
            node.params.find((param) => param.type === 'StringLiteral')
          );
          hasAddonBeenSeen(addonName);
          jsonObject[filePath].known[addonName].modifiers.push(componentName);
        } else {
          jsonObject[filePath].unknown.modifiers.push(node.path.parts[0]);
        }
        return;
      },

      MustacheStatement(node) {
        const nodeName = node.path.parts[0];
        if (!emberTemplateHelpers.includes(nodeName)) {
          jsonObject[filePath].unknown.ambiguousCurlies = node.path.parts[0];
        }
        return;
      },
    };
  });
};

module.exports.type = 'hbs';
