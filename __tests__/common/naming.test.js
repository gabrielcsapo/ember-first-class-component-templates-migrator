const naming = require('../../common/naming');

describe('naming', () => {
  describe('getWords', () => {
    it('can get words from camelCased names', () => {
      expect(naming.getWords('camelCasedName')).toEqual(['camel', 'cased', 'name']);
    });

    it('can get words from dot.cased names', () => {
      expect(naming.getWords('dot.cased.name')).toEqual(['dot', 'cased', 'name']);
    });

    it('can get words from kebab-case names', () => {
      expect(naming.getWords('kebab-cased-name')).toEqual(['kebab', 'cased', 'name']);
    });

    it('can get words from PascalCased names', () => {
      expect(naming.getWords('PascalCasedName')).toEqual(['pascal', 'cased', 'name']);
    });

    it('can get words from snake_cased names', () => {
      expect(naming.getWords('snake_cased_name')).toEqual(['snake', 'cased', 'name']);
    });

    it('can get words from a mixed case name', () => {
      expect(naming.getWords('Very-long_mixed.caseName')).toEqual([
        'very',
        'long',
        'mixed',
        'case',
        'name',
      ]);
    });

    it('attaches numbers to the previous word', () => {
      expect(naming.getWords('this123THAT456Other789a1b2c3d')).toEqual([
        'this123',
        'that456',
        'other789',
        'a1',
        'b2',
        'c3',
        'd',
      ]);
    });

    it('correctly handles sequences of delimiters in a name', () => {
      expect(naming.getWords('__foo..bar--baz__quux..')).toEqual(['foo', 'bar', 'baz', 'quux']);
    });

    it('correctly handles sequences of capital letters at the  beginning of a name', () => {
      expect(naming.getWords('HTTPRequest')).toEqual(['http', 'request']);
    });

    it('correctly handles sequences of capital letters in the middle of a name', () => {
      expect(naming.getWords('xmlHTTPRequest')).toEqual(['xml', 'http', 'request']);
    });

    it('correctly handles sequences of capital letters at the end of a name', () => {
      expect(naming.getWords('xmlHTTP')).toEqual(['xml', 'http']);
    });

    it('correctly handles single-letter words', () => {
      expect(naming.getWords('A.b-c_dE')).toEqual(['a', 'b', 'c', 'd', 'e']);
    });
  });

  // All remaining tests use the same input, which is also one of the inputs explicitly checked for
  // getName above, so that only output style is tested below and input style is tested above.

  describe('toCamelCase', () => {
    it('produces camelCased output', () => {
      expect(naming.toCamelCase('Very-long_mixed.caseName')).toEqual('veryLongMixedCaseName');
    });
  });

  describe('toKebabCase', () => {
    it('produces kebab-cased output', () => {
      expect(naming.toKebabCase('Very-long_mixed.caseName')).toEqual('very-long-mixed-case-name');
    });
  });

  describe('toPascalCase', () => {
    it('produces PascalCased output', () => {
      expect(naming.toPascalCase('Very-long_mixed.caseName')).toEqual('VeryLongMixedCaseName');
    });
  });
});
