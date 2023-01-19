const fs = require('node:fs');
const tmp = require('tmp');

module.exports = function({ source, path }, { parse, visit }) {
  const tempdir = process.env.EMBER_FCCTM_TEMPDIR;

  if (!tempdir) {
    throw Error(
      'Could not locate the directory for temporary files. This transform must ' +
        'be run from the codemod CLI, **not** directly via ember-template-recast.'
    );
  }

  // Open the output file now, so that any error caused by doing so occurs
  // before all the work gets done. The file is kept so that the codemod can
  // read it after ember-template-recast finishes.
  const tempfileFd = tmp.fileSync({ keep: true, tmpdir: tempdir }).fd;

  const known = {};
  const unknown = [];

  const ast = visit(parse(source), (env) => {
    const addonName = 'addon';

    if (!(addonName in known)) {
      known[addonName] = [];
    }

    known[addonName].push('foo');
    unknown.push('bar');

    // This "transform" is meant to be used with the `--dry` flag to
    // ember-template-recast, so the returned value is irrelevant as long as
    // it's of the expected type.
    return {};
  });

  fs.writeFileSync(tempfileFd, JSON.stringify({ [path]: { known, unknown } }));

  return ast;
};

module.exports.type = 'hbs';
