module.exports = {
  /** Get the lowercase words delimited in a name.
   *
   * Words are split on non-alphanumerics, before a capital letter which doesn't follow another
   * capital letter iff it is also followed by a lowercase letter, and after numbers which have a
   * non-number after them.
   *
   * @param {string} name The name to split.
   * @returns {string[]} An array of lowercase words.
   */
  getWords(name) {
    return name
      .replace(/([0-9a-z])([A-Z])/g, '$1\0$2') // split before upper after non-upper
      .replace(/([A-Z])([A-Z][a-z])/g, '$1\0$2') // split before (upper then lower) after upper
      .replace(/([0-9])([^0-9])/g, '$1\0$2') // split after number followed by non-number
      .replace(/[^0-9A-Za-z]+/g, '\0') // split on non-alphanumerics
      .split('\0')
      .filter(Boolean) // remove empty "words" from beginning/end
      .map((word) => word.toLowerCase());
  },

  /** Convert a name in any casing style to camelCase.
   *
   * @param {string} name The name to convert.
   * @returns {string} The name in camelCase.
   */
  toCamelCase(name) {
    return module.exports
      .getWords(name)
      .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join('');
  },

  /** Convert a name in any casing style to kebab-case.
   *
   * @param {string} name The name to convert.
   * @returns {string} The name in kebab-case.
   */
  toKebabCase(name) {
    return module.exports.getWords(name).join('-');
  },

  /** Convert a name in any casing style to PascalCase.
   *
   * @param {string} name The name to convert.
   * @returns {string} The name in PascalCase.
   */
  toPascalCase(name) {
    return module.exports
      .getWords(name)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  },
};
