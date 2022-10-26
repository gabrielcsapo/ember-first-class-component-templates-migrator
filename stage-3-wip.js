const fsPromises = require('node:fs/promises');

const transform = require('./transforms/stage-3-wheres-waldo/index');

async function main() {
  console.log(transform({ source: await fsPromises.readFile('stage-3-wip.json', 'utf8') }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
