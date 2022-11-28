module.exports = {
  parserOptions: {
    ecmaVersion: 'latest',
  },

  plugins: ['prettier', 'node'],
  extends: ['eslint:recommended', 'plugin:prettier/recommended', 'plugin:node/recommended'],
  env: {
    node: true,
  },
  rules: {},
  overrides: [
    {
      files: ['__tests__/**/*.js'],
      env: {
        jest: true,
      },
    },
  ],
};
