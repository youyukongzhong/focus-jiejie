const fs = require('fs');
const path = require('path');
const { setExecutableIcon } = require('./icon-resource');

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') {
    return;
  }

  const exeName = fs.readdirSync(context.appOutDir).find((name) => name.toLowerCase().endsWith('.exe'));
  if (!exeName) {
    throw new Error(`Cannot find Windows executable in ${context.appOutDir}`);
  }

  setExecutableIcon(context, path.join(context.appOutDir, exeName));
};

module.exports.default = module.exports;
