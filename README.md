# ember-first-class-component-templates-migrator

A collection of codemods for transforming existing Ember components to use first-class templates. After applying these codemods, your components will have templates embedded directly in their script files, using the new `<template>` element introduced in [RFC 0779](https://emberjs.github.io/rfcs/0779-first-class-component-templates.html).

## Usage

This codemod contains seven transforms, which are intended to be run on your package in order. To help keep the size of the resulting commit(s) down and to make them easier to review, it's recommended that you also `git commit` the changes between transforms. This also makes it easier to rewind if something goes wrong!

A typical run of this codemod from the root of your package might look something like this:

```sh
npx ember-first-class-component-templates-migrator stage-1-batman-begone .
git add . && git commit -m 'Apply stage 1 of first-class templates migration.'
npx ember-first-class-component-templates-migrator stage-2-clever-name .
git add . && git commit -m 'Apply stage 2 of first-class templates migration.'
npx ember-first-class-component-templates-migrator stage-3-clever-name .
# At this point, you should take a look at foo.json and add any resolutions the codemod couldn't find on its own.
git add . && git commit -m 'Apply stage 3 of first-class templates migration.'
npx ember-first-class-component-templates-migrator stage-4-clever-name .
git add . && git commit -m 'Apply stage 4 of first-class templates migration.'
npx ember-first-class-component-templates-migrator stage-5-clever-name.
git add . && git commit -m 'Apply stage 5 of first-class templates migration.'
npx ember-first-class-component-templates-migrator stage-6-clever-name .
git add . && git commit -m 'Apply stage 6 of first-class templates migration.'
npx ember-first-class-component-templates-migrator stage-7-clever-name .
git add . && git commit -m 'Apply stage 7 of first-class templates migration.'
```

## Local Usage

```sh
node ./bin/cli.js <TRANSFORM NAME> path/of/files/ or/some**/*glob.js
```

## Transforms

<!--TRANSFORMS_START-->
<!--TRANSFORMS_END-->

## Contributing

### Installation

- clone the repo
- change into the repo directory
- `yarn`

### Running tests

- `yarn test`

### Update Documentation

- `yarn update-docs`
