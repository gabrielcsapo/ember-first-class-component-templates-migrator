const fs = require('node:fs');
const path = require('node:path');

module.exports = {
  getPackageRoot(startPath) {
    return module.exports.searchAncestors(startPath, 'package.json');
  },

  searchAncestors(startPath, targetPath) {
    let current = path.resolve(startPath);

    while (!fs.existsSync(path.join(current, targetPath))) {
      const parent = path.dirname(current);

      if (parent === current) {
        // This indicates we hit a root (e.g. `/` or `C:\`), which means we've run
        // out of places to look.

        throw new Error(`Could not find '${targetPath}' in the ancestors of '${startPath}'.`);
      }

      current = parent;
    }

    return current;
  },
};
