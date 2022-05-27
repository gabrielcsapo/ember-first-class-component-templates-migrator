# stage-1-batman-begone

It's this summer's blockbuster sequel to [ember-holy-futuristic-template-namespacing-batman](https://github.com/rwjblue/ember-holy-futuristic-template-namespacing-batman) — batman-begone!

The first stage in migrating your codebase to first-class templates is to migrate any usages of "batman syntax" (e.g. `<div {{some-addon$some-modifier args}}>content</div>`) to equivalent invokations using core Ember features (e.g. `<div {{modifier "some-addon@some-modifier" args}}>content</div>`). This puts all scoped references on equal footing for later codemods and allows the removal of ember-holy-futuristic-template-namespacing-batman from your package.

Note that batman-begone will bulk up templates which were using Batman syntax by a bit ([see the examples below](#input--output)). But don't worry! This is only temporary, and later transforms in the codemod will remove all that ugly boilerplate amd leave your code beautiful again.

## Usage

```
npx ember-first-class-component-templates-migrator stage-1-batman-begone path/of/files/ or/some**/*glob.hbs

# or

yarn global add ember-first-class-component-templates-migrator
ember-first-class-component-templates-migrator stage-1-batman-begone path/of/files/ or/some**/*glob.hbs
```

## Local Usage

```
node ./bin/cli.js stage-1-batman-begone path/of/files/ or/some**/*glob.hbs
```

## Input / Output

<!--FIXTURES_TOC_START-->
* [basic](#basic)
<!--FIXTURES_TOC_END-->

## <!--FIXTURES_CONTENT_START-->
---
<a id="basic">**basic**</a>

**Input** (<small>[basic.input.hbs](transforms/stage-1-batman-begone/__testfixtures__/basic.input.hbs)</small>):
```hbs
<SomeAddon$SomeComponent attribute=value />

{{some-addon$some-curly "foo" (bar "baz")}}

{{#if (some-addon$some-helper args)}}
  content1
{{/if}}

<div {{some-addon$some-modifier args}}>content2</div>

<Foo />
{{#if (baz whatever)}}content3{{/if}}
{{bar}}
<div {{wat}}></div>

```

**Output** (<small>[basic.output.hbs](transforms/stage-1-batman-begone/__testfixtures__/basic.output.hbs)</small>):
```hbs
{{#let (component "some-addon@some-component") as |SomeComponent|}}<SomeComponent attribute=value />{{/let}}

{{if (isHelper "some-addon@some-curly" (helper "some-addon@some-curly" "foo" (bar "baz"))) (component "some-addon@some-curly" "foo" (bar "baz"))}}

{{#if (helper "some-addon@some-helper" args)}}
  content1
{{/if}}

<div {{modifier "some-addon@some-modifier" args}}>content2</div>

<Foo />
{{#if (baz whatever)}}content3{{/if}}
{{bar}}
<div {{wat}}></div>

```
<!--FIXTURES_CONTENT_END-->
