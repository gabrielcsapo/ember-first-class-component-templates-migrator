# ember-first-class-component-templates-migrator


A collection of codemods for ember-first-class-component-templates-migrator.

## Usage

To run a specific codemod from this project, you would run the following:

```
npx ember-first-class-component-templates-migrator <TRANSFORM NAME> path/of/files/ or/some**/*glob.js

# or

yarn global add ember-first-class-component-templates-migrator
ember-first-class-component-templates-migrator <TRANSFORM NAME> path/of/files/ or/some**/*glob.js
```

## Local Usage
```
node ./bin/cli.js <TRANSFORM NAME> path/of/files/ or/some**/*glob.js
```

## Transforms

<!--TRANSFORMS_START-->
* [stage-1-batman-begone](transforms/stage-1-batman-begone/README.md)
<!--TRANSFORMS_END-->

## Contributing

### Installation

* clone the repo
* change into the repo directory
* `yarn`

### Running tests

* `yarn test`

### Update Documentation

* `yarn update-docs`