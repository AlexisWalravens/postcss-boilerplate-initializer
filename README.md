# PostCSS Boilerplate Initializer

* [How to use](#how-to-use)
* [Requirements](#requirements)
* [Caveats](#caveats)

## Why
This is a tool to help you setup a **design system** boilerplate which aims to replace the use of SASS/SCSS preprocessors by only using present and future **CSSWG standards** with the help of **PostCSS** and [**style-dictionary**](https://www.npmjs.com/package/style-dictionary).

This is the quote about CSS preprocessors from [ViteJS's doc](https://vitejs.dev/guide/features.html#css-pre-processors) that motivated me to create this boilerplate :

> Because Vite targets modern browsers only, it is recommended to use native CSS variables with PostCSS plugins that implement CSSWG drafts (e.g. postcss-nesting) and author plain, future-standards-compliant CSS.

For an overwiew of all the features available, check [postcss-preset-env](https://preset-env.cssdb.org/features#stage-1).

### Design tokens

This boilerplate uses [design tokens](https://amzn.github.io/style-dictionary/#/tokens) to generate the CSS variables (custom properties). You will be able to edit the tokens in the json files as you want and generate a `variables.css` from them.

### What it will do
* Copy the styles folder containing the base css files for a new project.
* Install [`style-dictionary`](https://www.npmjs.com/package/style-dictionary), [`postcss-import`](https://www.npmjs.com/package/postcss-import) and [`postcss-preset-env`](https://www.npmjs.com/package/postcss-preset-env).
* Add a config file for [`style-dictionary`](https://www.npmjs.com/package/style-dictionary).
* Add a browserslist to your `package.json`.  
([`postcss-preset-env`](https://www.npmjs.com/package/postcss-preset-env#browsers) will use it to define how it should polyfill your css).  
**You can edit it later if the one provided doesn't fit your needs.**
* Add a script to your `package.json` to rebuild your variables.css from the design tokens you defined.

### What it will not do
* Install PostCSS (check [requirements](#requirements))

## How to use
run `npx @alexiswalravens/post-css-boilerplate init`

It will ask you where is you styles folder and copy the content of `src/styles` in it.

You will then be able to run:  
```bash
# yarn
yarn css:generate
# npm
npm run css:generate
```
Which will regenerate `variables.css` from the design tokens you defined in the `tokens` folder.

Finally, don't forget to add `main.css` as a global stylesheet.

---

If you didn't choose to install the PostCSS config you can see the default one here.

<details>
  <summary>Default PostCSS config</summary>
  
```javascript
module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-preset-env': {
      stage: 1,
      features: {
        'focus-visible-pseudo-class': {
          // To use https://www.npmjs.com/package/focus-visible
          // with a JS framework
          replaceWith: '[data-focus-visible-added]'
        },
        'custom-media-queries': {
          // Useful if you use a form of scoped CSS (CSS Modules for example).
          importFrom: 'src/styles/media-queries.css'
        }
      }
    }
  }
}

```
</details>

## How to deal with opacity in colors?
If you need to use color or background colors with **opacity** you can add [`postcss-color-mod-function`](https://www.npmjs.com/package/postcss-color-mod-function) to your PostCSS config.  
This adds the support to the `color-mod` function.
```bash
# yarn
yarn add -D postcss-color-mod-function
# npm
npm install -D postcss-color-mod-function
```

Add it to `postcss.config.js`:
```javascript
'postcss-color-mod-function': {},
```

The `color-mod()` function accepts the following color adjusters.
* `red()`
*  `green()`
*  `blue()`
*  `a()` / `alpha()`
*  `rgb()`
*  `h()` / `hue()`
*  `s()` / `saturation()`
*  `l()` / `lightness()`
*  `w()` / `whiteness()`
*  `b()` / `blackness()`
*  `tint()`
*  `shade()`
*  `blend()`
*  `blenda()`
*  `contrast()`

To add opacity to a color use it this way:
```css
color: color-mod(var("your-color") a(0.5));
```
I'll let you discover the other adjusters.

## Requirements
### PostCSS
Your project must use **PostCSS 8** to process CSS.  
If you use one of the following:
* ViteJS
* Vue-CLI
* NextJS
* NuxtJS

you already have PostCSS installed, and you should be able to setup this fairly quickly, as you just have to install the plugins and copy the postcss config (you may have to adapt your config as it can have different forms).

### PostCSS Plugins
The tool will install [`postcss-import`](https://www.npmjs.com/package/postcss-import) and [`postcss-preset-env`](https://www.npmjs.com/package/postcss-preset-env) as they are required.

**Note:** There's no need to add `autoprefixer` it's built-in in [`postcss-preset-env`](https://www.npmjs.com/package/postcss-preset-env#autoprefixer).

Optionally you can install [`postcss-combine-duplicated-selectors`](https://www.npmjs.com/package/postcss-combine-duplicated-selectors) which will automatically detect and combine duplicated css selectors so you don't have to.

```bash
# yarn
yarn add -D postcss-combine-duplicated-selectors
# npm
npm install -D postcss-combine-duplicated-selectors
```
Add it to `postcss.config.js`:
```javascript
'postcss-combine-duplicated-selectors': {}
```

---

## Caveats
### Media-queries breakpoints

Media queries are defined with the `@custom-query` [specification](https://drafts.csswg.org/mediaqueries-5/#at-ruledef-custom-media) in the `media-queries.css` file.

They are not using CSS custom properties as breakpoints because media-queries do not inherit from the `:root` selector as they are not HTML elements.

So, if you need to edit them you have to do it manually, hopefully you shouldn't edit a project's breakpoints too often.

### @custom-query in scoped CSS
Another thing is that if you use a form of scoped CSS like in Vue or CSS Module in React, you should add the `importFrom` option from `postcss-preset-env`'s `custom-media-queries` feature.
```javascript
  postcssPresetEnv({
    stage: 1,
    features: {
      'custom-media-queries': {
        importFrom: 'path/to/media-queries.css'
      }
    }
  })
```
This is because this feature is not yet supported on live browsers, and postcss-preset-env has to polyfill when you use them by replacing the content of your media-queries by the one set in the @custom-query.
```css
@custom-media --small-viewport (max-width: 30em);

@media (--small-viewport) {
  /* styles for small viewport */
}

/* becomes */

@media (max-width: 30em) {
  /* styles for small viewport */
}
```
And because media-queries are set in file apart from your scoped css when postcss processes your component, it doesn't have access to the set custom-queries.
This is resolved by setting the `importFrom` option.