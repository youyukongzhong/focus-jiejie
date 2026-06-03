const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function getProjectDir(context) {
  return (context.packager && context.packager.projectDir) || context.projectDir || path.resolve(__dirname, '..');
}

function getIconPath(context) {
  return path.join(getProjectDir(context), 'assets', 'icon.ico');
}

function getRceditPath(context) {
  return path.join(getProjectDir(context), 'node_modules', 'electron-winstaller', 'vendor', 'rcedit.exe');
}

function setExecutableIcon(context, exePath) {
  const iconPath = getIconPath(context);
  const rceditPath = getRceditPath(context);

  if (!fs.existsSync(exePath)) {
    throw new Error(`Cannot set icon; executable does not exist: ${exePath}`);
  }
  if (!fs.existsSync(iconPath)) {
    throw new Error(`Cannot set icon; icon does not exist: ${iconPath}`);
  }
  if (!fs.existsSync(rceditPath)) {
    throw new Error(`Cannot set icon; rcedit does not exist: ${rceditPath}`);
  }

  const needsAsciiCopy = /[^\x00-\x7f]/.test(exePath);
  const editPath = needsAsciiCopy
    ? path.join(path.dirname(exePath), `focus-jiejie-icon-edit-${Date.now()}.exe`)
    : exePath;

  if (needsAsciiCopy) {
    fs.copyFileSync(exePath, editPath);
  }

  const result = spawnSync(rceditPath, [editPath, '--set-icon', iconPath], {
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error([
      `rcedit failed for ${exePath}`,
      result.stdout || '',
      result.stderr || '',
    ].filter(Boolean).join('\n'));
  }

  if (needsAsciiCopy) {
    fs.copyFileSync(editPath, exePath);
    fs.unlinkSync(editPath);
  }

  console.log(`  • embedded app icon  file=${path.relative(getProjectDir(context), exePath)}`);
}

module.exports = {
  setExecutableIcon,
};
