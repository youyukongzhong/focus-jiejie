const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, Tray } = require('electron');

const hostsManager = require('./hostsManager');

const BROWSER_RESTART_NOTICE = '如果封锁网站已经在浏览器中打开，旧连接可能继续可用；请重启浏览器或新开浏览器后再验证。';
const STARTUP_ARG = '--startup';

const TARGET_GROUPS = [
  {
    id: 'bilibili',
    name: 'B站结界',
    subtitle: '封住视频、直播、短链和常见 CDN',
    domains: [
      'bilibili.com',
      'www.bilibili.com',
      'm.bilibili.com',
      't.bilibili.com',
      'space.bilibili.com',
      'search.bilibili.com',
      'live.bilibili.com',
      'message.bilibili.com',
      'member.bilibili.com',
      'account.bilibili.com',
      'passport.bilibili.com',
      'api.bilibili.com',
      'app.bilibili.com',
      'b23.tv',
      'www.b23.tv',
      'hdslb.com',
      'i0.hdslb.com',
      'i1.hdslb.com',
      'i2.hdslb.com',
      's1.hdslb.com',
      'upos-hz-mirrorakam.akamaized.net',
      'bilivideo.com',
      'biliapi.com',
      'biliapi.net',
      'acgvideo.com',
    ],
  },
  {
    id: 'wide-focus',
    name: '娱乐网站结界',
    subtitle: 'B站、微博、知乎热榜、抖音网页版',
    domains: [
      'bilibili.com',
      'www.bilibili.com',
      'b23.tv',
      'hdslb.com',
      'bilivideo.com',
      'acgvideo.com',
      'weibo.com',
      'www.weibo.com',
      'm.weibo.cn',
      'zhihu.com',
      'www.zhihu.com',
      'hot.zhihu.com',
      'douyin.com',
      'www.douyin.com',
      'iesdouyin.com',
    ],
  },
];

const DEFAULT_STORE = {
  schemaVersion: 1,
  currentSession: null,
  lastReport: null,
  settings: {
    extraDomains: '',
    lastDurationMinutes: 25,
    strictMode: false,
  },
  stats: {
    totalMinutes: 0,
    completedSessions: 0,
    interruptedSessions: 0,
    resistedImpulses: 0,
    shieldStones: 0,
    wardXp: 0,
    wardLevel: 1,
    towersLit: 0,
    streakDays: 0,
    lastCompletionDate: null,
    dailyMinutes: {},
    achievements: [],
  },
};

const STRICT_CONFIRM_TEXT = '我确认放弃本次守界';

let mainWindow;
let tray;
let storePath;
let backupDir;
let store = structuredClone(DEFAULT_STORE);
let adminStatus = false;
let lastError = '';
let completingSession = false;
let isQuitting = false;
let httpBlockServer = null;
let httpsProbeServer = null;
let interceptStatus = {
  http: { listening: false, error: '' },
  https: { listening: false, error: '' },
};
const lastInterceptAt = new Map();

function mergeStore(defaults, loaded) {
  if (!loaded || typeof loaded !== 'object') {
    return structuredClone(defaults);
  }

  return {
    ...structuredClone(defaults),
    ...loaded,
    settings: {
      ...defaults.settings,
      ...(loaded.settings || {}),
    },
    stats: {
      ...defaults.stats,
      ...(loaded.stats || {}),
      dailyMinutes: {
        ...defaults.stats.dailyMinutes,
        ...((loaded.stats && loaded.stats.dailyMinutes) || {}),
      },
      achievements: Array.isArray(loaded.stats && loaded.stats.achievements)
        ? loaded.stats.achievements
        : [],
    },
  };
}

function loadStore() {
  try {
    if (fs.existsSync(storePath)) {
      store = mergeStore(DEFAULT_STORE, JSON.parse(fs.readFileSync(storePath, 'utf8')));
    } else {
      store = structuredClone(DEFAULT_STORE);
    }
  } catch (error) {
    lastError = `读取本地数据失败：${error.message}`;
    store = structuredClone(DEFAULT_STORE);
  }
}

function saveStore() {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
}

function getRasterIconPath() {
  const candidates = [
    path.join(process.resourcesPath || '', 'assets', 'icon.png'),
    path.resolve(__dirname, '..', 'assets', 'icon.png'),
    path.resolve(__dirname, '..', 'assets', 'icon-256.png'),
  ];

  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || '';
}

function createFallbackIcon() {
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="5" y1="4" x2="27" y2="29" gradientUnits="userSpaceOnUse">
          <stop stop-color="#193238"/>
          <stop offset="1" stop-color="#0f1b1e"/>
        </linearGradient>
        <linearGradient id="ward" x1="8" y1="7" x2="24" y2="25" gradientUnits="userSpaceOnUse">
          <stop stop-color="#26484f"/>
          <stop offset="1" stop-color="#13272b"/>
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="29" height="29" rx="6.5" fill="url(#bg)" stroke="#30c8a6" stroke-opacity=".46"/>
      <path d="M16 5.2 26.8 16 16 26.8 5.2 16Z" fill="url(#ward)" stroke="#30c8a6" stroke-opacity=".74"/>
      <path d="M16 9 23 16 16 23 9 16Z" fill="none" stroke="#f2bf4d" stroke-opacity=".36"/>
      <circle cx="16" cy="16" r="5.1" fill="#30c8a6"/>
      <circle cx="16" cy="16" r="2.6" fill="#10191c" fill-opacity=".82"/>
      <rect x="6.8" y="13.4" width="5.1" height="5.1" rx="1.4" transform="rotate(45 9.35 15.95)" fill="#f2bf4d"/>
      <rect x="20.1" y="13.4" width="5.1" height="5.1" rx="1.4" transform="rotate(45 22.65 15.95)" fill="#f2bf4d"/>
    </svg>`;
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
}

function createAppIcon() {
  const iconPath = getRasterIconPath();

  if (iconPath) {
    const image = nativeImage.createFromPath(iconPath);

    if (!image.isEmpty()) {
      return image;
    }
  }

  return createFallbackIcon();
}

function shouldStartHidden() {
  return process.argv.includes(STARTUP_ARG);
}

function getStartupSettings() {
  if (process.platform !== 'win32') {
    return {
      supported: false,
      enabled: false,
      error: '当前仅支持 Windows 开机自启。',
    };
  }

  try {
    const settings = app.getLoginItemSettings({
      path: process.execPath,
      args: [STARTUP_ARG],
    });

    return {
      supported: true,
      enabled: Boolean(settings.openAtLogin),
      error: '',
    };
  } catch (error) {
    return {
      supported: false,
      enabled: false,
      error: error.message,
    };
  }
}

function setStartupEnabled(enabled) {
  if (process.platform !== 'win32') {
    throw new Error('当前仅支持 Windows 开机自启。');
  }

  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    path: process.execPath,
    args: [STARTUP_ARG],
  });

  return getStartupSettings();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 960,
    minHeight: 680,
    show: !shouldStartHidden(),
    title: '专注结界',
    backgroundColor: '#0f1518',
    icon: createAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function updateTrayMenu() {
  if (!tray) {
    return;
  }

  const active = isSessionActive();
  const menu = Menu.buildFromTemplate([
    {
      label: active ? `守界中：${formatRemaining(getRemainingSeconds())}` : '打开专注结界',
      click: showWindow,
    },
    {
      label: '开始 25 分钟 B站结界',
      enabled: !active,
      click: () => startSession({
        durationMinutes: 25,
        targetGroupId: 'bilibili',
        intention: '守住这一小段工作时间',
        strictMode: store.settings.strictMode,
        extraDomains: store.settings.extraDomains,
      }).catch(setError),
    },
    {
      label: '立即恢复 hosts',
      click: () => restoreNow().catch(setError),
    },
    { type: 'separator' },
    {
      label: isStrictSessionActive() ? '死守模式中不可退出' : '退出',
      enabled: !isStrictSessionActive(),
      click: async () => {
        if (isStrictSessionActive()) {
          showStrictQuitBlocked();
          return;
        }

        if (isSessionActive()) {
          const choice = dialog.showMessageBoxSync(mainWindow, {
            type: 'warning',
            title: '退出前恢复 hosts',
            message: '当前仍在守界中，退出前需要先恢复 hosts。',
            detail: '这样可以避免应用退出后网站仍被系统 hosts 文件封锁。',
            buttons: ['继续运行', '恢复 hosts 并退出'],
            defaultId: 0,
            cancelId: 0,
          });

          if (choice !== 1) {
            return;
          }

          try {
            await restoreNow();
          } catch (error) {
            setError(error);
            return;
          }
        }

        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
  tray.setToolTip(active ? `专注结界：剩余 ${formatRemaining(getRemainingSeconds())}` : '专注结界');
}

function createTray() {
  tray = new Tray(createAppIcon());
  tray.on('click', showWindow);
  updateTrayMenu();
}

function showWindow() {
  if (!mainWindow) {
    return;
  }

  mainWindow.show();
  mainWindow.focus();
}

function parseExtraDomains(value) {
  return String(value || '')
    .split(/[\s,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getTargetGroup(id) {
  return TARGET_GROUPS.find((group) => group.id === id) || TARGET_GROUPS[0];
}

function newSessionId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isSessionActive() {
  return store.currentSession && store.currentSession.status === 'active';
}

function isStrictSessionActive() {
  return isSessionActive() && store.currentSession.strictMode;
}

function showStrictQuitBlocked() {
  lastError = '死守模式正在运行，倒计时结束或提前解除后才能退出。';
  showWindow();
  broadcastState();

  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '死守模式正在运行',
      message: '死守模式中不能直接退出专注结界。',
      detail: '先完成倒计时，或回到主界面输入确认文本提前解除。',
      buttons: ['继续守界'],
      defaultId: 0,
    }).catch(() => {});
  }
}

function getRemainingSeconds() {
  if (!isSessionActive()) {
    return 0;
  }

  return Math.max(0, Math.ceil((store.currentSession.endsAt - Date.now()) / 1000));
}

function formatRemaining(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yesterdayKey(date = new Date()) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - 1);
  return localDateKey(copy);
}

function addAchievement(id, title) {
  if (!store.stats.achievements.some((achievement) => achievement.id === id)) {
    store.stats.achievements.push({
      id,
      title,
      unlockedAt: new Date().toISOString(),
    });
    return title;
  }

  return null;
}

function updateSuccessStats(session) {
  const stats = store.stats;
  const today = localDateKey();
  const completedMinutes = session.durationMinutes;
  const stones = Math.max(1, Math.round(completedMinutes / 25));
  const towerReward = completedMinutes >= 50 ? 1 : 0;
  const xp = completedMinutes + session.intercepts * 6 + (session.strictMode ? 8 : 0);
  const uncountedIntercepts = Math.max(0, (session.intercepts || 0) - (session.interceptsCounted || 0));
  const newlyUnlocked = [];

  stats.completedSessions += 1;
  stats.totalMinutes += completedMinutes;
  stats.resistedImpulses += uncountedIntercepts;
  stats.shieldStones += stones;
  stats.towersLit += towerReward;
  stats.wardXp += xp;
  stats.wardLevel = Math.max(1, Math.floor(stats.wardXp / 150) + 1);
  stats.dailyMinutes[today] = (stats.dailyMinutes[today] || 0) + completedMinutes;

  if (stats.lastCompletionDate === today) {
    // Same-day completions keep the current streak.
  } else if (stats.lastCompletionDate === yesterdayKey()) {
    stats.streakDays += 1;
  } else {
    stats.streakDays = 1;
  }

  stats.lastCompletionDate = today;

  [
    [stats.completedSessions >= 1, 'first-guard', '第一次守界成功'],
    [stats.completedSessions >= 3, 'three-guards', '三次守界'],
    [stats.streakDays >= 3, 'three-day-streak', '连续三天守界'],
    [stats.resistedImpulses >= 10, 'resist-ten', '抵挡十次诱惑'],
    [(stats.dailyMinutes[today] || 0) >= 120, 'two-hour-day', '单日守住两小时'],
    [stats.wardLevel >= 3, 'level-three', '结界升到 3 级'],
  ].forEach(([condition, id, title]) => {
    if (condition) {
      const unlocked = addAchievement(id, title);
      if (unlocked) {
        newlyUnlocked.push(unlocked);
      }
    }
  });

  return {
    stones,
    towerReward,
    xp,
    newlyUnlocked,
  };
}

function updateInterruptionStats() {
  store.stats.interruptedSessions += 1;
}

function makeSuccessReport(session, reward) {
  const integrity = Math.max(72, 100 - session.intercepts * 4);

  return {
    id: session.id,
    outcome: 'success',
    title: '守界成功',
    subtitle: session.intercepts > 0
      ? `诱惑来了 ${session.intercepts} 次，你都挡住了。`
      : '这一局很安静，结界没有被冲击。',
    durationMinutes: session.durationMinutes,
    guardedMinutes: session.durationMinutes,
    intercepts: session.intercepts,
    integrity,
    targetName: session.targetName,
    intention: session.intention,
    completedAt: new Date().toISOString(),
    rewards: [
      `结界石 x${reward.stones}`,
      reward.towerReward ? '守界塔 +1' : null,
      `经验 +${reward.xp}`,
      ...reward.newlyUnlocked.map((title) => `成就：${title}`),
    ].filter(Boolean),
  };
}

function makeBreachReport(session) {
  const guardedMinutes = Math.max(0, Math.floor((Date.now() - session.startedAt) / 60000));

  return {
    id: session.id,
    outcome: 'breach',
    title: '结界被冲破',
    subtitle: `这次守住了 ${guardedMinutes} 分钟，已经不是 0。`,
    durationMinutes: session.durationMinutes,
    guardedMinutes,
    intercepts: session.intercepts,
    integrity: Math.max(15, 80 - session.intercepts * 8),
    targetName: session.targetName,
    intention: session.intention,
    completedAt: new Date().toISOString(),
    rewards: ['保留本次记录', '可立刻开 10 分钟修复局'],
  };
}

function startInterceptServers() {
  stopInterceptServers();
  interceptStatus = {
    http: { listening: false, error: '' },
    https: { listening: false, error: '' },
  };
  lastInterceptAt.clear();

  httpBlockServer = http.createServer((request, response) => {
    const host = request.headers.host || 'blocked-site';
    recordIntercept('http', host);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    response.end(renderBlockedPage(host));
  });

  httpBlockServer.on('error', (error) => {
    interceptStatus.http = { listening: false, error: error.message };
    broadcastState();
  });

  httpBlockServer.listen(80, '127.0.0.1', () => {
    interceptStatus.http = { listening: true, error: '' };
    broadcastState();
  });

  httpsProbeServer = net.createServer((socket) => {
    recordIntercept('https', 'https');
    socket.destroy();
  });

  httpsProbeServer.on('error', (error) => {
    interceptStatus.https = { listening: false, error: error.message };
    broadcastState();
  });

  httpsProbeServer.listen(443, '127.0.0.1', () => {
    interceptStatus.https = { listening: true, error: '' };
    broadcastState();
  });
}

function stopInterceptServers() {
  if (httpBlockServer) {
    httpBlockServer.close();
    httpBlockServer = null;
  }

  if (httpsProbeServer) {
    httpsProbeServer.close();
    httpsProbeServer = null;
  }

  interceptStatus = {
    http: { listening: false, error: '' },
    https: { listening: false, error: '' },
  };
}

function recordIntercept(kind, host) {
  if (!isSessionActive()) {
    return;
  }

  const key = `${kind}:${host}`;
  const now = Date.now();
  const last = lastInterceptAt.get(key) || 0;

  if (now - last < 3500) {
    return;
  }

  lastInterceptAt.set(key, now);
  const previousIntercepts = store.currentSession.intercepts || 0;
  const previousCounted = store.currentSession.interceptsCounted || 0;
  const uncountedBefore = Math.max(0, previousIntercepts - previousCounted);

  store.currentSession.intercepts = previousIntercepts + 1;
  store.currentSession.interceptsCounted = store.currentSession.intercepts;
  store.stats.resistedImpulses += uncountedBefore + 1;
  store.currentSession.integrity = Math.max(35, 100 - store.currentSession.intercepts * 4);
  saveStore();
  broadcastState();
}

function renderBlockedPage(host) {
  const remaining = formatRemaining(getRemainingSeconds());
  const intercepts = store.currentSession ? store.currentSession.intercepts : 0;
  const session = store.currentSession;
  const integrity = session ? Math.round(session.integrity) : 100;
  const progress = session
    ? Math.round(Math.min(1, Math.max(0, 1 - getRemainingSeconds() / (session.durationMinutes * 60))) * 100)
    : 0;
  const intention = session ? session.intention : '守住这一段专注时间';

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>诱惑已被结界挡住</title>
    <style>
      :root{--bg:#0f1518;--panel:#152326;--line:#31524c;--text:#edf5f3;--muted:#b8cbc7;--subtle:#718884;--teal:#30c8a6;--amber:#f2bf4d;--coral:#ef6f5e}
      *{box-sizing:border-box}
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,rgba(48,200,166,.16),transparent 38%),var(--bg);color:var(--text);font-family:"Microsoft YaHei",Segoe UI,sans-serif;letter-spacing:0}
      main{width:min(760px,calc(100vw - 36px));display:grid;grid-template-columns:240px 1fr;gap:26px;align-items:center;border:1px solid var(--line);background:rgba(21,35,38,.94);padding:30px;border-radius:8px;box-shadow:0 24px 90px rgba(0,0,0,.42)}
      .ward{position:relative;width:220px;aspect-ratio:1;display:grid;place-items:center}
      .ward:before{content:"";position:absolute;inset:18px;transform:rotate(45deg);border:1px solid rgba(48,200,166,.28);border-radius:14px;background:linear-gradient(135deg,rgba(36,66,69,.76),rgba(15,27,30,.94));box-shadow:inset 0 0 0 8px rgba(10,18,21,.34)}
      .stone{position:absolute;width:34px;aspect-ratio:1;transform:rotate(45deg);border:1px solid rgba(242,191,77,.42);border-radius:8px;background:radial-gradient(circle,var(--amber),#243b3f 58%);box-shadow:0 0 20px rgba(242,191,77,.28)}
      .s1{top:16px}.s2{right:16px}.s3{bottom:16px}.s4{left:16px}
      .core{position:relative;z-index:2;width:146px;aspect-ratio:1;display:grid;place-items:center;border-radius:50%;background:conic-gradient(var(--teal) ${progress}%,#26383c 0);box-shadow:0 0 44px rgba(48,200,166,.24)}
      .core-inner{width:calc(100% - 14px);aspect-ratio:1;display:grid;place-items:center;align-content:center;border-radius:50%;background:#10191c;border:1px solid rgba(237,245,243,.08)}
      .time{font-size:38px;line-height:1;font-weight:900;font-variant-numeric:tabular-nums}
      .small{margin-top:8px;color:var(--subtle);font-size:12px}
      h1{margin:0 0 12px;font-size:30px;line-height:1.15}
      p{margin:8px 0;color:var(--muted);line-height:1.7}
      .host{font-family:Consolas,monospace;color:var(--amber)}
      .chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:22px}
      .chip{min-height:68px;display:grid;align-content:center;gap:5px;padding:10px 12px;border:1px solid rgba(49,82,76,.82);border-radius:8px;background:#10191c}
      .chip span{color:var(--subtle);font-size:12px}
      .chip strong{font-size:20px}
      .note{margin-top:18px;padding:12px 14px;border-left:3px solid var(--teal);background:rgba(48,200,166,.08);color:#d7fff4}
      @media (max-width:700px){main{grid-template-columns:1fr;padding:24px}.ward{margin:auto}.chips{grid-template-columns:1fr}}
    </style>
  </head>
  <body>
    <main>
      <section class="ward" aria-hidden="true">
        <i class="stone s1"></i><i class="stone s2"></i><i class="stone s3"></i><i class="stone s4"></i>
        <div class="core"><div class="core-inner"><div class="time">${remaining}</div><div class="small">${progress}%</div></div></div>
      </section>
      <section>
        <h1>诱惑来袭，结界已挡住</h1>
        <p>访问 <span class="host">${escapeHtml(host)}</span> 已被记录为一次抵挡。</p>
        <p>${escapeHtml(intention)}</p>
        <div class="chips">
          <div class="chip"><span>本次抵挡</span><strong>${intercepts} 次</strong></div>
          <div class="chip"><span>结界完整度</span><strong>${integrity}%</strong></div>
          <div class="chip"><span>剩余时间</span><strong>${remaining}</strong></div>
        </div>
        <p class="note">回到手头那件事。等倒计时结束，这次抵挡会进入你的守界战报。</p>
      </section>
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setError(error) {
  lastError = error && error.message ? error.message : String(error || '');
  broadcastState();
}

async function startSession(payload) {
  if (isSessionActive()) {
    throw new Error('当前已经在守界中。');
  }

  const durationMinutes = Number(payload.durationMinutes);

  if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 480) {
    throw new Error('守界时长需要在 1 到 480 分钟之间。');
  }

  const targetGroup = getTargetGroup(payload.targetGroupId);
  const extraDomains = parseExtraDomains(payload.extraDomains);
  const domains = hostsManager.normalizeDomains([...targetGroup.domains, ...extraDomains]);
  const now = Date.now();
  const session = {
    id: newSessionId(),
    status: 'active',
    targetGroupId: targetGroup.id,
    targetName: targetGroup.name,
    intention: String(payload.intention || '').trim() || '守住这一段专注时间',
    strictMode: Boolean(payload.strictMode),
    durationMinutes,
    startedAt: now,
    endsAt: now + durationMinutes * 60 * 1000,
    intercepts: 0,
    interceptsCounted: 0,
    integrity: 100,
    domains,
  };

  store.settings.strictMode = Boolean(payload.strictMode);
  store.settings.extraDomains = String(payload.extraDomains || '');
  store.settings.lastDurationMinutes = durationMinutes;
  saveStore();

  const result = hostsManager.applyBlock({
    domains,
    sessionId: session.id,
    backupDir,
  });

  store.currentSession = session;
  store.lastReport = {
    outcome: 'started',
    title: '结界已启动',
    subtitle: `${targetGroup.name} 已封锁，倒计时开始。`,
    browserNotice: BROWSER_RESTART_NOTICE,
    completedAt: new Date().toISOString(),
    rewards: [],
  };
  lastError = '';
  saveStore();
  startInterceptServers();
  updateTrayMenu();
  broadcastState();

  return {
    ...getPublicState(),
    operation: result,
  };
}

async function completeSession() {
  if (!isSessionActive() || completingSession) {
    return getPublicState();
  }

  completingSession = true;
  const session = { ...store.currentSession };
  stopInterceptServers();
  const reward = updateSuccessStats(session);

  try {
    const restoreResult = hostsManager.restoreBlock({ backupDir });
    store.currentSession = null;
    store.lastReport = {
      ...makeSuccessReport(session, reward),
      restoreResult,
    };
    lastError = '';
  } catch (error) {
    store.currentSession = {
      ...session,
      status: 'needs-restore',
      endedAt: Date.now(),
    };
    store.lastReport = {
      ...makeSuccessReport(session, reward),
      title: '守界完成，等待恢复',
      subtitle: '倒计时结束了，但 hosts 还没有恢复。请点击立即恢复。',
    };
    setError(error);
  } finally {
    completingSession = false;
    saveStore();
    updateTrayMenu();
    broadcastState();
  }

  return getPublicState();
}

async function breakSession(phrase) {
  if (!store.currentSession) {
    return getPublicState();
  }

  const session = { ...store.currentSession };

  if (session.strictMode && phrase !== STRICT_CONFIRM_TEXT) {
    throw new Error(`死守模式需要输入：${STRICT_CONFIRM_TEXT}`);
  }

  const restoreResult = hostsManager.restoreBlock({ backupDir });
  stopInterceptServers();
  updateInterruptionStats();
  store.currentSession = null;
  store.lastReport = {
    ...makeBreachReport(session),
    restoreResult,
  };
  lastError = '';
  saveStore();
  updateTrayMenu();
  broadcastState();

  return getPublicState();
}

async function restoreNow() {
  const restoreResult = hostsManager.restoreBlock({ backupDir });
  stopInterceptServers();

  if (store.currentSession) {
    store.lastReport = {
      outcome: 'restored',
      title: 'hosts 已恢复',
      subtitle: '当前托管封锁已移除。',
      completedAt: new Date().toISOString(),
      rewards: [],
      restoreResult,
    };
  }

  store.currentSession = null;
  lastError = '';
  saveStore();
  updateTrayMenu();
  broadcastState();

  return getPublicState();
}

function tick() {
  if (isSessionActive() && Date.now() >= store.currentSession.endsAt) {
    completeSession().catch(setError);
    return;
  }

  updateTrayMenu();
  broadcastState();
}

function getPublicState() {
  const active = isSessionActive();
  const remainingSeconds = getRemainingSeconds();
  const progress = active
    ? Math.min(1, Math.max(0, 1 - remainingSeconds / (store.currentSession.durationMinutes * 60)))
    : 0;

  return {
    appName: '专注结界',
    version: app.getVersion(),
    isAdmin: adminStatus,
    hostsPath: hostsManager.HOSTS_PATH,
    hostsManaged: hostsManager.hasManagedBlock(),
    strictConfirmText: STRICT_CONFIRM_TEXT,
    targetGroups: TARGET_GROUPS,
    currentSession: store.currentSession
      ? {
          ...store.currentSession,
          remainingSeconds,
          remainingText: formatRemaining(remainingSeconds),
          progress,
        }
      : null,
    lastReport: store.lastReport,
    settings: store.settings,
    stats: store.stats,
    interceptStatus,
    startup: getStartupSettings(),
    lastError,
    paths: {
      storePath,
      backupDir,
    },
  };
}

function broadcastState() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('state-updated', getPublicState());
  }
}

function registerIpc() {
  ipcMain.handle('app:getState', () => getPublicState());
  ipcMain.handle('app:startSession', (_event, payload) => startSession(payload));
  ipcMain.handle('app:breakSession', (_event, phrase) => breakSession(phrase));
  ipcMain.handle('app:restoreNow', () => restoreNow());
  ipcMain.handle('app:completeSession', () => completeSession());
  ipcMain.handle('app:setStartupEnabled', (_event, enabled) => {
    setStartupEnabled(enabled);
    return getPublicState();
  });
  ipcMain.handle('app:showWindow', () => {
    showWindow();
    return getPublicState();
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId('FocusJiejie.App');
  storePath = path.join(app.getPath('userData'), 'state.json');
  backupDir = path.join(app.getPath('userData'), 'hosts-backups');
  adminStatus = hostsManager.isAdmin();
  loadStore();

  if (isSessionActive() && Date.now() < store.currentSession.endsAt) {
    startInterceptServers();
  }

  registerIpc();
  createWindow();
  createTray();
  setInterval(tick, 1000);
  broadcastState();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    showWindow();
  }
});

app.on('before-quit', (event) => {
  if (isStrictSessionActive()) {
    event.preventDefault();
    isQuitting = false;
    showStrictQuitBlocked();
    return;
  }

  isQuitting = true;
  stopInterceptServers();
});

app.on('window-all-closed', () => {
});
