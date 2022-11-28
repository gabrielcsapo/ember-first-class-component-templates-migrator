#!/usr/bin/env node
'use strict';

function codemodCli() {
  require('codemod-cli').runTransform(
    __dirname,
    process.argv[2] /* transform name */,
    process.argv.slice(3) /* paths or globs */
  );
}

// codemod-cli accepts transforms as either a bare name (e.g. "stage-1-foo") or
// as a path to the transform folder (which must be either absolute or
// explicitly relative, e.g. "./transforms/stage-1-foo").
const STAGE_PATTERN = /(?:(?:^\.)?\/transforms)?stage-(\d+)[^/]*(?:\/$)?/;

switch (STAGE_PATTERN.exec(process.argv[2])?.[1]) {
  case '2':
    {
      const fs = require('node:fs');
      const path = require('node:path');
      const execa = require('execa');
      const tmp = require('tmp');

      const constants = require('../common/constants');

      const tempdir = tmp.dirSync({
        prefix: 'ember-fcctm-stage-2',

        // The transform must leave its temporary files intact so that they can
        // be read afterward; they'll need cleaned up when the directory is.
        unsafeCleanup: true,
      }).name;

      // This is basically the same as what codemod-cli does, but adding the
      // `--dry` flag and setting an environment variable pointing to the temp
      // directory.
      execa.sync(
        'ember-template-recast',
        [
          '--dry',
          '-t',
          path.join(path.dirname(__dirname), 'transforms/stage-2-dummy/index.js'),
          process.argv.slice(3),
        ],
        { env: { EMBER_FCCTM_TEMPDIR: tempdir }, preferLocal: true, stdio: 'inherit' }
      );

      const merged = {};

      for (const tempfile of fs.readdirSync(tempdir)) {
        Object.assign(merged, JSON.parse(fs.readFileSync(path.join(tempdir, tempfile), 'utf8')));
      }

      for (const [packageRoot, names] of Object.entries(merged)) {
        fs.writeFileSync(
          path.join(packageRoot, constants.nameMapFile),
          JSON.stringify(names, null, 4)
        );
      }
    }

    break;

  case '3':
    {
      const constants = require('../common/constants');
      const { searchAncestors } = require('../common/filesystem');
      const { readJsonFile, writeJsonFile } = require('../common/json');
      const transform = require('../transforms/stage-3-wheres-waldo');

      const raw_inputs = process.argv.slice(3);
      const inputs = new Set();

      for (const input of raw_inputs.length === 1 ? [raw_inputs] : raw_inputs) {
        inputs.add(searchAncestors(input, constants.nameMapFile));
      }

      for (const input of inputs) {
        writeJsonFile(input, transform(readJsonFile(input)));
      }
    }

    break;

  default:
    codemodCli();
}
