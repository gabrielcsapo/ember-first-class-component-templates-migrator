# stage-4-new-years

Have you made your resolutions? Well, your templates still need to! Now that the codemod has located the sources for as many of the names in your templates as it can, it's time to ask Ember to resolve (at runtime) any names that still don't have a source associated with them.

Basically, the following transforms are made for any names which the codemod recognizes as still unknown:

- unknown components: `<Foo />` → `{{#let (component "foo") as |Foo|}}<Foo />{{/let}}`
- unknown helpers: `(foo "bar")` → `((resolve "foo" type="helper") "bar")`
- unknown modifers: `<span {{foo}}>bar</span>` → `<span {{(resolve "foo" type="modifier")}}>bar</span>`
- unknown "curlies" (can be either components or helpers): `{{foo}}` →

  ```hbs
  {{#let
    (resolve "foo" type="helper")
    (resolve "foo" type="component")
    as |fooHelper fooComponent|
  }}{{if fooHelper fooHelper fooComponent}}{{/let}}
  ```

## Usage

```
npx ember-first-class-component-templates-migrator stage-4-new-years path/of/files/ or/some**/*glob.hbs

# or

yarn global add ember-first-class-component-templates-migrator
ember-first-class-component-templates-migrator stage-4-new-years path/of/files/ or/some**/*glob.hbs
```

## Local Usage

```
node ./bin/cli.js stage-4-new-years path/of/files/ or/some**/*glob.hbs
```

## Input / Output

<!--FIXTURES_TOC_START-->
* [basic](#basic)
<!--FIXTURES_TOC_END-->

<!--FIXTURES_CONTENT_START-->
---
<a id="basic">**basic**</a>

**Input** (<small>[basic.input.hbs](transforms/stage-4-new-years/__testfixtures__/basic.input.hbs)</small>):
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

**Output** (<small>[basic.output.hbs](transforms/stage-4-new-years/__testfixtures__/basic.output.hbs)</small>):
```hbs
{{#let (component "some-addon@some-component") as |SomeComponent|}}<SomeComponent attribute=value />{{/let}}

{{if (isHelper "some-addon@some-curly" (helper "some-addon@some-curly" "foo" ((resolve "bar" type="helper") "baz"))) (component "some-addon@some-curly" "foo" ((resolve "bar" type="helper") "baz"))}}

{{#if (helper "some-addon@some-helper" args)}}
  content1
{{/if}}

<div {{modifier "some-addon@some-modifier" args}}>content2</div>

{{#let (component "foo") as |Foo|}}<Foo />{{/let}}
{{#if ((resolve "baz" type="helper") whatever)}}content3{{/if}}
{{#let (resolve "bar" type="helper") (resolve "bar" type="component") as |barHelper barComponent|}}{{if barHelper barHelper barComponent}}{{/let}}
<div {{(resolve "wat" type="modifier")}}></div>

```
<!--FIXTURES_CONTENT_END-->
