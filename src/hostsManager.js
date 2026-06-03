const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const MARKER = 'FOCUS-JIEJIE';
const HOSTS_PATH = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts');

function normalizeDomains(domains) {
  const seen = new Set();
  const normalized = [];

  for (const rawDomain of domains || []) {
    const domain = String(rawDomain)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, 'www.')
      .split('/')[0]
      .split(':')[0]
      .replace(/^\*\./, '');

    if (!domain || domain.includes(' ') || !domain.includes('.')) {
      continue;
    }

    if (!seen.has(domain)) {
      seen.add(domain);
      normalized.push(domain);
    }
  }

  return normalized.sort();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLineEnding(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function stripManagedBlock(content) {
  const blockRegex = new RegExp(
    `(?:\\r?\\n)?# BEGIN ${escapeRegExp(MARKER)}[\\s\\S]*?# END ${escapeRegExp(MARKER)}(?:\\r?\\n)?`,
    'g'
  );

  return content.replace(blockRegex, (match) => (match.startsWith('\n') || match.startsWith('\r\n') ? '\n' : ''));
}

function buildManagedBlock(domains, sessionId, lineEnding) {
  const lines = [
    `# BEGIN ${MARKER}`,
    '# Managed by 专注结界. Delete this block or use Restore inside the app to unblock.',
    `# Session: ${sessionId || 'manual'}`,
    `# UpdatedAt: ${new Date().toISOString()}`,
    ...domains.map((domain) => `127.0.0.1 ${domain}`),
    `# END ${MARKER}`,
  ];

  return lines.join(lineEnding);
}

function ensureBackup(backupDir) {
  fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `hosts.${timestamp}.bak`);
  fs.copyFileSync(HOSTS_PATH, backupPath);
  return backupPath;
}

function flushDns() {
  const result = spawnSync('ipconfig', ['/flushdns'], {
    encoding: 'utf8',
    windowsHide: true,
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function readHosts() {
  return fs.readFileSync(HOSTS_PATH, 'utf8');
}

function writeHosts(content) {
  fs.writeFileSync(HOSTS_PATH, content, 'utf8');
}

function applyBlockDirect({ domains, sessionId, backupDir }) {
  const current = readHosts();
  const lineEnding = getLineEnding(current);
  const stripped = stripManagedBlock(current).trimEnd();
  const block = buildManagedBlock(domains, sessionId, lineEnding);
  const backupPath = ensureBackup(backupDir);
  const next = `${stripped}${lineEnding}${lineEnding}${block}${lineEnding}`;

  writeHosts(next);
  const dns = flushDns();

  return {
    ok: true,
    action: 'block',
    method: 'direct-admin',
    changed: true,
    backupPath,
    dns,
  };
}

function restoreBlockDirect({ backupDir }) {
  const current = readHosts();
  const backupPath = ensureBackup(backupDir);
  const stripped = stripManagedBlock(current).trimEnd();
  const lineEnding = getLineEnding(current);
  const next = stripped ? `${stripped}${lineEnding}` : '';

  writeHosts(next);
  const dns = flushDns();

  return {
    ok: true,
    action: 'restore',
    method: 'direct-admin',
    changed: current !== next,
    backupPath,
    dns,
  };
}

function psSingleQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function getBundledScriptPath() {
  return path.resolve(__dirname, '..', 'scripts', 'apply-hosts.ps1');
}

function getRunnableScriptPath() {
  const bundledPath = getBundledScriptPath();

  if (!bundledPath.includes('app.asar')) {
    return bundledPath;
  }

  const unpackedPath = bundledPath.replace('app.asar', 'app.asar.unpacked');

  if (fs.existsSync(unpackedPath)) {
    return unpackedPath;
  }

  const tempScriptDir = path.join(os.tmpdir(), 'focus-jiejie');
  const tempScriptPath = path.join(tempScriptDir, 'apply-hosts.ps1');
  fs.mkdirSync(tempScriptDir, { recursive: true });
  fs.copyFileSync(bundledPath, tempScriptPath);

  return tempScriptPath;
}

function runElevatedScript({ action, domains, sessionId, backupDir }) {
  const scriptPath = getRunnableScriptPath();
  const resultPath = path.join(os.tmpdir(), `focus-jiejie-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  const domainsBase64 = Buffer.from(JSON.stringify(domains || []), 'utf8').toString('base64');
  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scriptPath,
    '-Action',
    action,
    '-DomainsBase64',
    domainsBase64,
    '-BackupDir',
    backupDir,
    '-ResultPath',
    resultPath,
    '-Marker',
    MARKER,
    '-SessionId',
    sessionId || 'manual',
  ];
  const command = `Start-Process -FilePath powershell.exe -Verb RunAs -Wait -ArgumentList @(${args.map(psSingleQuote).join(', ')})`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error(`无法启动管理员权限脚本：${result.stderr || result.stdout || 'unknown error'}`);
  }

  if (!fs.existsSync(resultPath)) {
    throw new Error('没有收到管理员脚本结果。你可能取消了 UAC 授权。');
  }

  const payload = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  fs.rmSync(resultPath, { force: true });

  if (!payload.ok) {
    throw new Error(payload.error || '管理员脚本执行失败。');
  }

  return {
    ...payload,
    method: 'elevated-powershell',
  };
}

function isAdmin() {
  const script = '([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)';
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', script], {
    encoding: 'utf8',
    windowsHide: true,
  });

  return (result.stdout || '').trim().toLowerCase() === 'true';
}

function hasManagedBlock() {
  try {
    return readHosts().includes(`# BEGIN ${MARKER}`);
  } catch {
    return false;
  }
}

function applyBlock({ domains, sessionId, backupDir }) {
  const normalized = normalizeDomains(domains);

  if (!normalized.length) {
    throw new Error('没有可封锁的域名。');
  }

  if (isAdmin()) {
    return applyBlockDirect({ domains: normalized, sessionId, backupDir });
  }

  return runElevatedScript({ action: 'block', domains: normalized, sessionId, backupDir });
}

function restoreBlock({ backupDir }) {
  if (isAdmin()) {
    return restoreBlockDirect({ backupDir });
  }

  return runElevatedScript({ action: 'restore', domains: [], backupDir });
}

module.exports = {
  HOSTS_PATH,
  MARKER,
  applyBlock,
  hasManagedBlock,
  isAdmin,
  normalizeDomains,
  restoreBlock,
};
