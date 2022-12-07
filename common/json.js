const fs = require('node:fs');

module.exports = {
  readJsonFile(jsonPath) {
    try {
      return JSON.parse(fs.readFileSync(jsonPath), 'utf8');
    } catch (error) {
      // Errors thrown by `readFileSync` are system errors, which aren't a
      // subclass of `Error`, but can be identified by the presence of a
      // `syscall` property.
      if ('syscall' in error) {
        throw new Error(`Could not read '${jsonPath}': "${error}"`);
      }

      // The JSON parser throws instances of `SyntaxError`.
      if (error instanceof SyntaxError) {
        throw new Error(`'${jsonPath}' does not appear to be valid JSON: "${error}"`);
      }

      throw error;
    }
  },

  writeJsonFile(jsonPath, data) {
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(data));
    } catch (error) {
      // Errors thrown by `readFileSync` are system errors, which aren't a
      // subclass of `Error`, but can be identified by the presence of a
      // `syscall` property.
      if ('syscall' in error) {
        throw new Error(`Could not read '${jsonPath}': "${error}"`);
      }

      throw error;
    }
  },
};
