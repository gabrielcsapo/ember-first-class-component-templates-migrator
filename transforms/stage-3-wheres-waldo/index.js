const fs = require('node:fs');
const path = require('node:path');
// const rawEmberMappings = require('ember-rfc176-data');

// const emberMappings = Object.fromEntries(
//   rawEmberMappings.map((mapping) => [mapping.localName ?? mapping.export, mapping])
// );

const UNKNOWN = Symbol('unknown source or type');

const CONTENT_TYPES = {
  components: 'curlyComponents',
  helpers: 'helpers',
  modifiers: 'modifiers',
  templates: 'curlyComponents',
};

const INPUT_TYPES = {
  ambiguousCurlies: [UNKNOWN],
  angleComponents: ['components', 'templates'],
  helpers: ['helpers'],
  modifiers: ['modifiers'],
};

const SCRIPT_EXTS = ['.ts', '.js'];

/** Locator for the source files associated with the names in a template.
 *
 * Members whose names start with an underscore are internal API, exposed only
 * for testing.
 */
class ContentResolver {
  constructor() {
    this._resolveContent = memoize(this._resolveContent);
  }

  /** Find the root directory of an Ember addon.
   *
   * @param {string} name The name of the addon to find.
   * @returns {string|null} The path to the addon, if it can be found. Null,
   * otherwise.
   */
  _findAddon(name) {
    try {
      const pathInAddon = require.resolve(name, { paths: [this.packagePath] });

      return this._findPackageRoot(pathInAddon);
    } catch {
      return null;
    }
  }

  findContent(templatePath, name, addon, type) {
    const packageRoot = this._findPackageRoot(templatePath);

    return this._resolveContent(packageRoot, name, addon, type);
  }

  /** Find the root directory of the package containing a path.
   *
   * @param {string} pathInPackage Any path within the package.
   * @returns {string} The path to a directory containing a `package.json` file.
   */
  _findPackageRoot(pathInPackage) {
    let current = pathInPackage;

    while (!fs.existsSync(path.join(current, 'package.json'))) {
      const parent = path.dirname(current);

      if (parent === current) {
        // This indicates we hit a root (e.g. `/` or `C:\`), which means we've run
        // out of places to look.

        throw new Error(
          `Could not find a file named 'package.json' in the ancestors of '${pathInPackage}'.`
        );
      }

      current = parent;
    }

    return current;
  }

  /** Locate the directory containing a package's Ember content.
   *
   * @param {string} packageRoot The path to the package's root directory.
   * @returns {string} The path to a folder containing Ember content.
   * @throws {Error} If `packageRoot` is not a package, its `package.json` is
   * invalid, or if a content directory cannot be found.
   */
  _getContentRoot(packageRoot) {
    const packageJson = this._readJson(path.join(packageRoot, 'package.json'));
    const projectRoot = packageJson['ember-addon']?.projectRoot ?? packageRoot;
    const addon = path.join(projectRoot, 'addon');

    if (fs.existsSync(addon)) {
      return addon;
    }

    const app = path.join(projectRoot, 'app');

    if (fs.existsSync(app)) {
      return app;
    }

    throw new Error(
      `Could not find Ember content directory ("addon" or "app") in '${packageRoot}'`
    );
  }

  /** Produce a "fuzzy" matcher for a name.
   *
   * This is done by separating the name into alphanumeric "words" and then
   * creating a case-insensitive expression which matches those words, optionally
   * separated by non-alphanumeric characters.
   *
   * @param {string} name The name to be matched.
   * @returns {RegExp} An expression which matches the name and its variants.
   */
  _getRegExpForName(name) {
    const words = name
      // Non-alphanumeric characters are taken as "word" delimiters, so insert
      // artificial ones into CamelCase and pascalCase.
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      // Split into alphanumeric "words",
      .split(/[^0-9A-Z]+/gi)
      // Remove empty strings which may exist at the beginning or end.
      .filter(Boolean);

    return new RegExp(['^', ...words, '$'].join('[^0-9A-Z]*'), 'i');
  }

  /** Read a file as JSON.
   *
   * @param {string} jsonPath The path to a file containing JSON.
   * @returns {unknown} The data contained in the file.
   * @throws If the file cannot be found or read.
   * @throws If the file's contents are not valid JSON.
   */
  _readJson(jsonPath) {
    try {
      return JSON.parse(fs.readFileSync(jsonPath), 'utf8');
    } catch (error) {
      // Errors thrown by `readFileSync` are system errors, which aren't a
      // subclass of `Error`, but can be identified by the presence of a
      // `syscall` property.
      if ('syscall' in error) {
        throw new Error(`Could not read '${jsonPath}': "${error}"`);
      }

      // The JSON parser throws instances of `SyntaxError`.
      if (error instanceof SyntaxError) {
        throw new Error(`'${jsonPath}' does not appear to be valid JSON: "${error}"`);
      }

      throw error;
    }
  }

  _resolveContent(packageRoot, name, addonName, type) {
    const sourceRoot = addonName === UNKNOWN ? this._findAddon(addonName) : packageRoot;
    const contentRoot = this._getContentRoot(sourceRoot);
    const nameMatcher = this._getRegExpForName(name);

    function searchDir(contentDir) {
      if (!fs.existsSync(contentDir)) {
        return null;
      }

      for (const entry in fs.readdirSync(contentDir, { encoding: 'utf8', withFileTypes: true })) {
        if (!entry.isFile()) {
          continue;
        }

        const extension = path.extname(entry.name);

        if (!SCRIPT_EXTS.includes(extension)) {
          continue;
        }

        if (nameMatcher.test(path.basename(entry.name, extension))) {
          return path.join(contentDir, entry.name);
        }
      }

      return null;
    }

    if (type === UNKNOWN) {
      for (const candidateType of Object.keys(CONTENT_TYPES)) {
        const script = searchDir(path.join(contentRoot, candidateType));

        if (script) {
          return { script, resolvedType: candidateType };
        }
      }

      return { script: null, resolvedType: null };
    } else {
      return { script: searchDir(path.join(contentRoot, type)), resolvedType: type };
    }
  }
}

/** Get the appropriate `relatedJs` value for a template.
 *
 * If a file exists with the same path and name as the template, but a `.js` or
 * `.ts` extension, the template is determined to have that file as its backing
 * class.
 *
 * If the template exists in a `templates` directory and a file with the same
 * name, but a `.js` or `.ts` extension exists in the corresponding `components`
 * directory, it is determined to be non-colocated. (Which indicates an error
 * that is not handled by this function.)
 *
 * Otherwise, the template is determined not to have a corresponding component.
 *
 * @param {string} templatePath The full path to the template.
 * @returns {RelatedJs} An object indicating what JS/TS file (if any) is
 * associated with the template
 */
function getRelatedJs(templatePath) {
  const parsedPath = path.parse(templatePath);

  // TODO?: balk if extension is not `.hbs`

  for (const ext in SCRIPT_EXTS) {
    const backingPath = path.format(Object.assign({}, parsedPath, { ext }));

    if (fs.existsSync(backingPath)) {
      return { type: 'backing-class', path: backingPath };
    }
  }

  const dirParts = parsedPath.dir.split(path.sep);

  if (dirParts.at(-1) === 'templates') {
    const componentDir = path.join(...dirParts.slice(0, -1).concat(['components']));

    for (const ext in SCRIPT_EXTS) {
      const componentPath = path.format(Object.assign({}, parsedPath, { dir: componentDir, ext }));

      if (fs.existsSync(componentPath)) {
        // This represents an error (the codemod requires that templates be
        // colocated), but doesn't throw here, so that processing continues.
        // Errors like this will be handled afterward.

        return { type: 'non-colocated' };
      }
    }
  }

  // No component class found.
  return { type: 'template-only' };
}

/** A dirt-simple memoization "decorator".
 *
 * Note that memoization keys are simple JSON representtions of the arguments
 * provided to the function. As a result, arrays and primitives are fine, but
 * objects are problematic, as they serialize with their key in insertion order,
 * which could differ between otherwise-equivalent instances.
 *
 * @param {Function} fn The function to memoize.
 * @returns A function which calls the input function iff it has not previously
 * been called with the same parameters.
 */
function memoize(fn) {
  const cache = Object.create(null);

  return function memoized() {
    const key = JSON.stringify(Array.from(arguments));

    if (!(key in cache)) {
      cache[key] = fn.apply(this, arguments);
    }

    return cache[key];
  };
}

module.exports = function wheresWaldo({ source /*, path*/ } /*, { parse, visit }*/) {
  const input = JSON.parse(source);
  const resolver = new ContentResolver();
  const problems = [];

  const resolved = Object.fromEntries(
    Object.entries(input).map(([templatePath, nameMaps]) => {
      const known = {};
      const unknown = {};

      function collectContentTypes(addon, typeMap) {
        for (const [inputType, names] of Object.entries(typeMap)) {
          const contentTypes = INPUT_TYPES[inputType];

          if (!contentTypes) {
            problems.push(`Not a recognized input type: '${inputType}'.`);

            continue;
          }

          for (const contentType of contentTypes) {
            for (const name of names) {
              const { script, resolvedType } = resolver.findContent(
                templatePath,
                name,
                addon,
                contentType
              );

              if (script) {
                if (!(addon in known)) {
                  known[addon] = {};
                }

                if (!(resolvedType in known[addon])) {
                  known[addon][resolvedType] = {};
                }

                known[addon][resolvedType][name] = script;
              } else {
                if (!(resolvedType in unknown)) {
                  unknown[resolvedType] = [];
                }

                unknown[resolvedType].push(name);
              }
            }
          }
        }
      }

      for (const [addon, typeMap] of Object.entries(nameMaps.known)) {
        collectContentTypes(addon, typeMap);
      }

      collectContentTypes(UNKNOWN, nameMaps.unknown);

      return [
        templatePath,
        {
          relatedJs: getRelatedJs(templatePath),
          known,
          unknown,
        },
      ];
    })
  );

  return JSON.stringify(resolved, null, 4);
};

module.exports.type = 'json';
