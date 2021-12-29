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
          importFrom: '%stylesDirectory%/media-queries.css'
        }
      }
    }
  }
}
