const elements = {
  adminBadge: document.getElementById('adminBadge'),
  hostsBadge: document.getElementById('hostsBadge'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsDialog: document.getElementById('settingsDialog'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  strictReleaseDialog: document.getElementById('strictReleaseDialog'),
  closeStrictReleaseBtn: document.getElementById('closeStrictReleaseBtn'),
  strictConfirmToken: document.getElementById('strictConfirmToken'),
  strictReleaseInput: document.getElementById('strictReleaseInput'),
  strictReleaseStatus: document.getElementById('strictReleaseStatus'),
  cancelStrictReleaseBtn: document.getElementById('cancelStrictReleaseBtn'),
  confirmStrictReleaseBtn: document.getElementById('confirmStrictReleaseBtn'),
  languageSelect: document.getElementById('languageSelect'),
  startupToggle: document.getElementById('startupToggle'),
  startupStatus: document.getElementById('startupStatus'),
  updateStatus: document.getElementById('updateStatus'),
  checkUpdateBtn: document.getElementById('checkUpdateBtn'),
  downloadUpdateBtn: document.getElementById('downloadUpdateBtn'),
  installUpdateBtn: document.getElementById('installUpdateBtn'),
  statusLine: document.getElementById('statusLine'),
  wardStage: document.getElementById('wardStage'),
  progressRing: document.getElementById('progressRing'),
  countdown: document.getElementById('countdown'),
  sessionLabel: document.getElementById('sessionLabel'),
  integrityValue: document.getElementById('integrityValue'),
  integrityMeter: document.getElementById('integrityMeter'),
  interceptsValue: document.getElementById('interceptsValue'),
  interceptsMeter: document.getElementById('interceptsMeter'),
  levelValue: document.getElementById('levelValue'),
  levelMeter: document.getElementById('levelMeter'),
  sessionForm: document.getElementById('sessionForm'),
  durationButtons: Array.from(document.querySelectorAll('.duration-btn')),
  customDuration: document.getElementById('customDuration'),
  targetGroup: document.getElementById('targetGroup'),
  intention: document.getElementById('intention'),
  extraDomains: document.getElementById('extraDomains'),
  extraDomainInput: document.getElementById('extraDomainInput'),
  addDomainBtn: document.getElementById('addDomainBtn'),
  extraDomainList: document.getElementById('extraDomainList'),
  strictMode: document.getElementById('strictMode'),
  startBtn: document.getElementById('startBtn'),
  breakBtn: document.getElementById('breakBtn'),
  restoreBtn: document.getElementById('restoreBtn'),
  repairBtn: document.getElementById('repairBtn'),
  reportBox: document.getElementById('reportBox'),
  reportStamp: document.getElementById('reportStamp'),
  streakValue: document.getElementById('streakValue'),
  totalMinutes: document.getElementById('totalMinutes'),
  completedSessions: document.getElementById('completedSessions'),
  totalIntercepts: document.getElementById('totalIntercepts'),
  shieldStones: document.getElementById('shieldStones'),
  domainCount: document.getElementById('domainCount'),
  domainList: document.getElementById('domainList'),
  achievementCount: document.getElementById('achievementCount'),
  achievementList: document.getElementById('achievementList'),
  errorBox: document.getElementById('errorBox'),
  pathBox: document.getElementById('pathBox'),
};

const UI_TEXT = {
  'zh-CN': {
    appName: '专注结界',
    settings: '设置',
    integrity: '结界完整度',
    sessionIntercepts: '本次抵挡',
    wardLevel: '结界等级',
    duration: '守界时长',
    customDurationTitle: '自定义 1 到 480 分钟',
    customDurationAria: '自定义守界分钟数',
    minutesUnit: '分钟',
    targetWard: '目标结界',
    intentionLabel: '本局要守住什么',
    strictMode: '死守模式',
    strictHint: '提前解除需要确认文本',
    extraDomain: '附加域名',
    extraDomainPlaceholder: '输入域名或网址，例如 https://www.google.com/',
    add: '添加',
    startWard: '启动结界',
    breakEarly: '提前解除',
    restoreHosts: '恢复 hosts',
    reportTitle: '守界战报',
    noReportTitle: '还没有战报',
    noReportBody: '启动一次结界后，这里会记录结果。',
    repairRun: '开 10 分钟修复局',
    baseStatus: '基地状态',
    totalGuarded: '累计守住',
    completedRuns: '成功局数',
    resistedTemptations: '抵挡诱惑',
    shieldStones: '结界石',
    blockedList: '封锁清单',
    achievements: '成就',
    language: '语言',
    languageHint: '切换菜单和界面语言',
    startup: '开机自启',
    startupHint: '登录 Windows 后自动启动到托盘',
    closeSettings: '关闭设置',
    updateTitle: '版本更新',
    checkUpdate: '检查更新',
    downloadUpdate: '下载更新',
    installUpdate: '重启安装',
    waiting: '等待启动',
    needsRestore: '守界已结束，等待恢复 hosts',
    admin: '管理员权限',
    normal: '普通权限',
    checkingPermission: '权限检测中',
    hostsLocked: 'hosts 已封锁',
    hostsOpen: 'hosts 未封锁',
    enabled: '已开启',
    disabled: '未开启',
    day: '天',
    count: '次',
    items: '个',
    minutes: '分钟',
    noExtraDomains: '还没有添加额外域名',
    invalidDomain: '请输入有效域名，例如 bilibili.com',
    invalidDuration: '请输入 1 到 480 分钟之间的守界时长。',
    noAchievements: '等待第一次守界成功',
    updateIdle: '未检查',
    updateChecking: '正在检查更新...',
    updateNone: '当前已是最新版本',
    updateAvailable: (version) => `发现新版本 ${version}`,
    updateDownloading: (percent) => `正在下载 ${percent}%`,
    updateDownloaded: '更新已下载，重启后安装',
    updateManual: '免安装版请到 GitHub 下载新版',
    updateUnsupported: '开发模式不执行自动更新',
    updateError: (message) => `更新检查失败：${message}`,
    strictReleaseTitle: '提前解除死守模式',
    strictReleaseBody: '死守模式需要输入确认文本。确认后会提前解除本次结界，并记录为一次中断。',
    strictReleasePlaceholder: '输入上方确认文本',
    strictReleaseMismatch: '确认文本不一致，死守模式仍在继续。',
    strictReleaseFailed: '解除失败，请再试一次。',
    closeStrictRelease: '关闭确认',
    cancel: '取消',
    confirmRelease: '确认解除',
    breakConfirm: '提前解除会放弃本次守界奖励，确认解除吗？',
    repairIntention: '开一个修复局，把节奏拉回来',
  },
  'en-US': {
    appName: 'Focus Ward',
    settings: 'Settings',
    integrity: 'Ward integrity',
    sessionIntercepts: 'Blocked this run',
    wardLevel: 'Ward level',
    duration: 'Duration',
    customDurationTitle: 'Custom 1 to 480 minutes',
    customDurationAria: 'Custom ward minutes',
    minutesUnit: 'min',
    targetWard: 'Target ward',
    intentionLabel: 'What are you guarding?',
    strictMode: 'Strict mode',
    strictHint: 'Early release requires confirmation text',
    extraDomain: 'Extra domains',
    extraDomainPlaceholder: 'Domain or URL, e.g. https://www.google.com/',
    add: 'Add',
    startWard: 'Start ward',
    breakEarly: 'Release early',
    restoreHosts: 'Restore hosts',
    reportTitle: 'Ward report',
    noReportTitle: 'No report yet',
    noReportBody: 'Start a ward and the result will appear here.',
    repairRun: 'Start 10 min repair run',
    baseStatus: 'Base status',
    totalGuarded: 'Total guarded',
    completedRuns: 'Completed runs',
    resistedTemptations: 'Temptations blocked',
    shieldStones: 'Ward stones',
    blockedList: 'Blocked list',
    achievements: 'Achievements',
    language: 'Language',
    languageHint: 'Switch menu and interface language',
    startup: 'Launch at startup',
    startupHint: 'Start in tray after Windows login',
    closeSettings: 'Close settings',
    updateTitle: 'Updates',
    checkUpdate: 'Check',
    downloadUpdate: 'Download',
    installUpdate: 'Restart',
    waiting: 'Waiting',
    needsRestore: 'Ward ended, waiting to restore hosts',
    admin: 'Admin',
    normal: 'Standard',
    checkingPermission: 'Checking permission',
    hostsLocked: 'hosts locked',
    hostsOpen: 'hosts open',
    enabled: 'Enabled',
    disabled: 'Disabled',
    day: 'day(s)',
    count: 'time(s)',
    items: 'item(s)',
    minutes: 'min',
    noExtraDomains: 'No extra domains yet',
    invalidDomain: 'Enter a valid domain, e.g. bilibili.com',
    invalidDuration: 'Enter a duration between 1 and 480 minutes.',
    noAchievements: 'Complete your first ward',
    updateIdle: 'Not checked',
    updateChecking: 'Checking for updates...',
    updateNone: 'You are up to date',
    updateAvailable: (version) => `New version ${version} available`,
    updateDownloading: (percent) => `Downloading ${percent}%`,
    updateDownloaded: 'Downloaded, restart to install',
    updateManual: 'Portable build needs a manual download from GitHub',
    updateUnsupported: 'Auto update is disabled in dev mode',
    updateError: (message) => `Update failed: ${message}`,
    strictReleaseTitle: 'Release strict mode',
    strictReleaseBody: 'Strict mode requires the confirmation text. Releasing now ends this ward and records an interruption.',
    strictReleasePlaceholder: 'Enter the confirmation text above',
    strictReleaseMismatch: 'Confirmation text does not match. Strict mode is still active.',
    strictReleaseFailed: 'Release failed. Please try again.',
    closeStrictRelease: 'Close confirmation',
    cancel: 'Cancel',
    confirmRelease: 'Confirm release',
    breakConfirm: 'Release early and lose this run reward?',
    repairIntention: 'Start a repair run and regain rhythm',
  },
};

let selectedDuration = 25;
let selectedDurationMode = 'preset';
const PRESET_DURATIONS = new Set([10, 25, 50, 90]);
let latestState = null;
let formHydrated = false;
let formHydratedLanguage = '';
let busy = false;
let pendingStrictRelease = false;

function setBusy(nextBusy) {
  busy = nextBusy;
  render(latestState);
}

function setLocalError(message) {
  elements.errorBox.textContent = message || '';
}

function getLanguage() {
  return latestState && latestState.language === 'en-US' ? 'en-US' : 'zh-CN';
}

function t(key, ...args) {
  const value = (UI_TEXT[getLanguage()] && UI_TEXT[getLanguage()][key]) || UI_TEXT['zh-CN'][key] || key;
  return typeof value === 'function' ? value(...args) : value;
}

function applyLanguage() {
  document.documentElement.lang = getLanguage();
  document.title = t('appName');
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });
}

function normalizeDomainList(domains) {
  const seen = new Set();
  const normalized = [];

  for (const rawDomain of domains || []) {
    const domain = String(rawDomain)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split(':')[0]
      .replace(/^\*\./, '');

    if (!domain || !domain.includes('.') || seen.has(domain)) {
      continue;
    }

    seen.add(domain);
    normalized.push(domain);
  }

  return normalized.sort();
}

function sanitizeDuration(value) {
  const duration = Number.parseInt(String(value), 10);

  if (!Number.isFinite(duration)) {
    return null;
  }

  return Math.max(1, Math.min(480, duration));
}

function getDurationToStart() {
  const duration = sanitizeDuration(selectedDurationMode === 'custom' ? elements.customDuration.value : selectedDuration);

  if (!duration) {
    throw new Error(t('invalidDuration'));
  }

  return duration;
}

function parseExtraDomains() {
  return normalizeDomainList(
    elements.extraDomains.value
      .split(/[\s,，;；]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function setExtraDomains(domains) {
  const normalized = normalizeDomainList(domains);
  elements.extraDomains.value = normalized.join('\n');
  renderExtraDomainList();
  return normalized;
}

function addExtraDomainsFromInput() {
  const additions = normalizeDomainList(String(elements.extraDomainInput.value || '').split(/[\s,，;；]+/));

  if (!additions.length) {
    setLocalError(t('invalidDomain'));
    elements.extraDomainInput.focus();
    return;
  }

  setExtraDomains([...parseExtraDomains(), ...additions]);
  elements.extraDomainInput.value = '';
  setLocalError('');
  render(latestState);
}

function removeExtraDomain(domain) {
  setExtraDomains(parseExtraDomains().filter((item) => item !== domain));
  render(latestState);
}

function renderExtraDomainList() {
  const domains = parseExtraDomains();
  const session = latestState && latestState.currentSession;
  const locked = Boolean((session && session.status === 'active') || busy);

  elements.extraDomainList.classList.toggle('locked', locked);

  if (!domains.length) {
    elements.extraDomainList.innerHTML = `<li class="empty">${escapeHtml(t('noExtraDomains'))}</li>`;
    return;
  }

  elements.extraDomainList.innerHTML = domains
    .map((domain) => `
      <li>
        <span title="${escapeHtml(domain)}">${escapeHtml(domain)}</span>
        <button type="button" data-remove-domain="${escapeHtml(domain)}" aria-label="移除 ${escapeHtml(domain)}" ${locked ? 'disabled' : ''}>x</button>
      </li>
    `)
    .join('');
}

function getSelectedGroup() {
  const groups = (latestState && latestState.targetGroups) || [];
  return groups.find((group) => group.id === elements.targetGroup.value) || groups[0];
}

function getPreviewDomains() {
  const activeDomains = latestState && latestState.currentSession && latestState.currentSession.domains;

  if (activeDomains && activeDomains.length) {
    return activeDomains;
  }

  const group = getSelectedGroup();
  return normalizeDomainList([...(group ? group.domains : []), ...parseExtraDomains()]);
}

function hydrateForm(state) {
  if (!state) {
    return;
  }

  const language = state.language || 'zh-CN';
  const previousTarget = elements.targetGroup.value;

  if (formHydrated && formHydratedLanguage === language) {
    return;
  }

  elements.targetGroup.innerHTML = '';

  for (const group of state.targetGroups || []) {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = group.name;
    elements.targetGroup.appendChild(option);
  }

  if (previousTarget && Array.from(elements.targetGroup.options).some((option) => option.value === previousTarget)) {
    elements.targetGroup.value = previousTarget;
  }

  if (!formHydrated) {
    elements.extraDomains.value = state.settings.extraDomains || '';
    renderExtraDomainList();
    elements.strictMode.checked = Boolean(state.settings.strictMode);
    const savedDuration = sanitizeDuration(state.settings.lastDurationMinutes) || 25;
    selectedDuration = savedDuration;
    selectedDurationMode = PRESET_DURATIONS.has(savedDuration) ? 'preset' : 'custom';
    elements.customDuration.value = String(PRESET_DURATIONS.has(savedDuration) ? 30 : savedDuration);
    formHydrated = true;
  }

  formHydratedLanguage = language;
}

function render(state) {
  if (!state) {
    return;
  }

  latestState = state;
  applyLanguage();
  hydrateForm(state);

  const session = state.currentSession;
  const active = session && session.status === 'active';
  const needsRestore = session && session.status === 'needs-restore';
  const lastOutcome = state.lastReport && state.lastReport.outcome;
  const integrity = active ? session.integrity : lastOutcome === 'breach' ? 44 : 100;
  const intercepts = active ? session.intercepts : state.lastReport ? state.lastReport.intercepts || 0 : 0;

  elements.languageSelect.value = getLanguage();
  elements.adminBadge.textContent = state.isAdmin ? t('admin') : t('normal');
  elements.adminBadge.className = `status-pill ${state.isAdmin ? 'good' : 'warn'}`;
  elements.hostsBadge.textContent = state.hostsManaged ? t('hostsLocked') : t('hostsOpen');
  elements.hostsBadge.className = `status-pill ${state.hostsManaged ? 'warn' : 'good'}`;

  if (active) {
    elements.statusLine.textContent = getLanguage() === 'en-US'
      ? `${session.targetName} active, ${session.remainingText} left`
      : `${session.targetName}守界中，剩余 ${session.remainingText}`;
  } else if (needsRestore) {
    elements.statusLine.textContent = t('needsRestore');
  } else {
    elements.statusLine.textContent = t('waiting');
  }

  elements.wardStage.classList.toggle('active', Boolean(active));
  elements.wardStage.classList.toggle('breach', lastOutcome === 'breach');
  elements.wardStage.classList.toggle('success', lastOutcome === 'success');
  elements.progressRing.style.setProperty('--progress-deg', `${Math.round((active ? session.progress : 0) * 360)}deg`);
  elements.countdown.textContent = active ? session.remainingText : '00:00';
  elements.sessionLabel.textContent = active ? session.intention : needsRestore ? t('restoreHosts') : t('waiting');

  elements.integrityValue.textContent = `${Math.round(integrity)}%`;
  elements.integrityMeter.style.width = `${Math.max(0, Math.min(100, integrity))}%`;
  elements.interceptsValue.textContent = `${intercepts} ${t('count')}`;
  elements.interceptsMeter.style.width = `${Math.min(100, intercepts * 14)}%`;
  elements.levelValue.textContent = `Lv.${state.stats.wardLevel}`;
  elements.levelMeter.style.width = `${Math.min(100, (state.stats.wardXp % 150) / 1.5)}%`;

  elements.durationButtons.forEach((button) => {
    button.classList.toggle('active', selectedDurationMode === 'preset' && Number(button.dataset.duration) === selectedDuration);
    button.disabled = active || busy;
  });
  elements.customDuration.disabled = active || busy;
  elements.customDuration.parentElement.classList.toggle('active', selectedDurationMode === 'custom');
  elements.targetGroup.disabled = active || busy;
  elements.intention.disabled = active || busy;
  elements.extraDomains.disabled = active || busy;
  elements.extraDomainInput.disabled = active || busy;
  elements.addDomainBtn.disabled = active || busy;
  elements.strictMode.disabled = active || busy;
  elements.startBtn.disabled = active || busy || needsRestore;
  elements.breakBtn.disabled = !active || busy;
  elements.restoreBtn.disabled = active || busy || (!state.hostsManaged && !needsRestore);
  elements.repairBtn.disabled = active || busy || needsRestore;

  if (!active) {
    closeStrictReleaseDialog();
  }

  const startup = state.startup || { supported: false, enabled: false, error: '' };
  elements.startupToggle.checked = Boolean(startup.enabled);
  elements.startupToggle.disabled = busy || !startup.supported;
  elements.startupStatus.textContent = startup.error || (startup.enabled ? t('enabled') : t('disabled'));
  renderUpdateStatus(state.update || {});

  renderReport(state.lastReport);
  renderStats(state.stats, session);
  renderExtraDomainList();
  renderDomains(getPreviewDomains());
  renderAchievements(state.stats.achievements || []);

  const portNotes = [];
  if (state.interceptStatus.http.error) {
    portNotes.push(`80: ${state.interceptStatus.http.error}`);
  }
  if (state.interceptStatus.https.error) {
    portNotes.push(`443: ${state.interceptStatus.https.error}`);
  }

  elements.errorBox.textContent = state.lastError || portNotes.join('  ');
  elements.pathBox.textContent = state.paths ? `hosts: ${state.hostsPath}` : '';
}

function renderReport(report) {
  if (!report) {
    elements.reportStamp.textContent = getLanguage() === 'en-US' ? 'None' : '暂无';
    elements.reportBox.innerHTML = `<strong>${escapeHtml(t('noReportTitle'))}</strong><p>${escapeHtml(t('noReportBody'))}</p>`;
    return;
  }

  const date = report.completedAt ? new Date(report.completedAt) : null;
  elements.reportStamp.textContent = date ? date.toLocaleTimeString(getLanguage(), { hour: '2-digit', minute: '2-digit' }) : getLanguage() === 'en-US' ? 'Now' : '刚刚';

  const rewards = (report.rewards || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const browserNotice = report.browserNotice
    ? `<p class="report-hint">${escapeHtml(report.browserNotice)}</p>`
    : '';
  const meta = report.outcome === 'success'
    ? getLanguage() === 'en-US'
      ? `Focused ${report.durationMinutes || 0} min, blocked ${report.intercepts || 0} time(s)`
      : `专注 ${report.durationMinutes || 0} 分钟，抵挡 ${report.intercepts || 0} 次`
    : report.outcome === 'breach'
      ? getLanguage() === 'en-US'
        ? `Guarded ${report.guardedMinutes || 0} min, blocked ${report.intercepts || 0} time(s)`
        : `守住 ${report.guardedMinutes || 0} 分钟，抵挡 ${report.intercepts || 0} 次`
      : report.subtitle || '';
  const subtitle = report.subtitle || meta;
  const metaLine = meta && meta !== subtitle ? `<p>${escapeHtml(meta)}</p>` : '';

  elements.reportBox.innerHTML = `
    <strong>${escapeHtml(report.title || '守界战报')}</strong>
    <p>${escapeHtml(subtitle)}</p>
    ${metaLine}
    ${browserNotice}
    ${rewards ? `<ul>${rewards}</ul>` : ''}
  `;
}

function renderUpdateStatus(update) {
  let message = t('updateIdle');

  if (update.state === 'checking') {
    message = t('updateChecking');
  } else if (update.state === 'none') {
    message = t('updateNone');
  } else if (update.state === 'available') {
    message = t('updateAvailable', update.version || '');
  } else if (update.state === 'downloading') {
    message = t('updateDownloading', update.percent || 0);
  } else if (update.state === 'downloaded') {
    message = t('updateDownloaded');
  } else if (update.state === 'manual-download') {
    message = t('updateManual');
  } else if (update.state === 'unsupported') {
    message = t('updateUnsupported');
  } else if (update.state === 'error') {
    message = t('updateError', update.error || '');
  }

  elements.updateStatus.textContent = message;
  elements.downloadUpdateBtn.hidden = update.state !== 'available';
  elements.installUpdateBtn.hidden = update.state !== 'downloaded';
  elements.checkUpdateBtn.disabled = busy || update.state === 'checking' || update.state === 'downloading';
  elements.downloadUpdateBtn.disabled = busy;
  elements.installUpdateBtn.disabled = busy;
}

function renderStats(stats, session) {
  const liveUncounted = session && session.status === 'active'
    ? Math.max(0, (session.intercepts || 0) - (session.interceptsCounted || 0))
    : 0;

  elements.streakValue.textContent = `${stats.streakDays || 0} ${t('day')}`;
  elements.totalMinutes.textContent = `${stats.totalMinutes || 0} ${t('minutes')}`;
  elements.completedSessions.textContent = String(stats.completedSessions || 0);
  elements.totalIntercepts.textContent = String((stats.resistedImpulses || 0) + liveUncounted);
  elements.shieldStones.textContent = String(stats.shieldStones || 0);
}

function renderDomains(domains) {
  elements.domainCount.textContent = `${domains.length} ${t('items')}`;
  elements.domainList.innerHTML = domains
    .map((domain) => `<li title="${escapeHtml(domain)}">${escapeHtml(domain)}</li>`)
    .join('');
}

function renderAchievements(achievements) {
  elements.achievementCount.textContent = String(achievements.length);

  if (!achievements.length) {
    elements.achievementList.innerHTML = `<li>${escapeHtml(t('noAchievements'))}</li>`;
    return;
  }

  elements.achievementList.innerHTML = achievements
    .slice()
    .reverse()
    .map((achievement) => `<li>${escapeHtml(achievement.title)}</li>`)
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openStrictReleaseDialog() {
  if (!latestState || !latestState.currentSession || busy) {
    return;
  }

  elements.strictConfirmToken.textContent = latestState.strictConfirmText || '';
  elements.strictReleaseInput.value = '';
  elements.strictReleaseStatus.textContent = '';
  elements.strictReleaseDialog.hidden = false;
  window.setTimeout(() => elements.strictReleaseInput.focus(), 0);
}

function closeStrictReleaseDialog() {
  if (!elements.strictReleaseDialog.hidden) {
    elements.strictReleaseDialog.hidden = true;
  }

  elements.strictReleaseStatus.textContent = '';
  pendingStrictRelease = false;
}

async function submitStrictRelease() {
  if (!latestState || !latestState.currentSession || pendingStrictRelease) {
    return;
  }

  const phrase = elements.strictReleaseInput.value.trim();

  if (phrase !== latestState.strictConfirmText) {
    elements.strictReleaseStatus.textContent = t('strictReleaseMismatch');
    elements.strictReleaseInput.focus();
    elements.strictReleaseInput.select();
    return;
  }

  pendingStrictRelease = true;
  setBusy(true);

  try {
    const state = await window.focusJiejie.breakSession(phrase);
    closeStrictReleaseDialog();
    render(state);
  } catch (error) {
    elements.strictReleaseStatus.textContent = error.message || t('strictReleaseFailed');
  } finally {
    pendingStrictRelease = false;
    setBusy(false);
  }
}

async function refresh() {
  try {
    const state = await window.focusJiejie.getState();
    render(state);
  } catch (error) {
    setLocalError(error.message);
  }
}

elements.durationButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedDuration = Number(button.dataset.duration);
    selectedDurationMode = 'preset';
    render(latestState);
  });
});

elements.customDuration.addEventListener('focus', () => {
  selectedDurationMode = 'custom';
  render(latestState);
});

elements.customDuration.addEventListener('input', () => {
  selectedDurationMode = 'custom';
  const duration = sanitizeDuration(elements.customDuration.value);

  if (duration) {
    selectedDuration = duration;
  }

  render(latestState);
});

elements.customDuration.addEventListener('blur', () => {
  const duration = sanitizeDuration(elements.customDuration.value);

  if (!duration) {
    elements.customDuration.value = String(selectedDuration || 25);
    return;
  }

  elements.customDuration.value = String(duration);
  selectedDuration = duration;
});

elements.targetGroup.addEventListener('change', () => render(latestState));
elements.extraDomains.addEventListener('input', () => render(latestState));
elements.addDomainBtn.addEventListener('click', addExtraDomainsFromInput);
elements.extraDomainInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addExtraDomainsFromInput();
  }
});
elements.extraDomainList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-domain]');

  if (!button || button.disabled) {
    return;
  }

  removeExtraDomain(button.dataset.removeDomain);
});

elements.settingsBtn.addEventListener('click', () => {
  elements.settingsDialog.hidden = false;
});

elements.closeSettingsBtn.addEventListener('click', () => {
  elements.settingsDialog.hidden = true;
});

elements.settingsDialog.addEventListener('click', (event) => {
  if (event.target === elements.settingsDialog) {
    elements.settingsDialog.hidden = true;
  }
});

elements.closeStrictReleaseBtn.addEventListener('click', closeStrictReleaseDialog);
elements.cancelStrictReleaseBtn.addEventListener('click', closeStrictReleaseDialog);
elements.confirmStrictReleaseBtn.addEventListener('click', submitStrictRelease);
elements.strictReleaseDialog.addEventListener('click', (event) => {
  if (event.target === elements.strictReleaseDialog) {
    closeStrictReleaseDialog();
  }
});
elements.strictReleaseInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitStrictRelease();
  } else if (event.key === 'Escape') {
    closeStrictReleaseDialog();
  }
});

elements.languageSelect.addEventListener('change', async () => {
  const language = elements.languageSelect.value;
  setBusy(true);

  try {
    const state = await window.focusJiejie.setLanguage(language);
    formHydratedLanguage = '';
    render(state);
  } catch (error) {
    setLocalError(error.message);
  } finally {
    setBusy(false);
  }
});

elements.startupToggle.addEventListener('change', async () => {
  const enabled = elements.startupToggle.checked;
  setBusy(true);

  try {
    const state = await window.focusJiejie.setStartupEnabled(enabled);
    render(state);
  } catch (error) {
    setLocalError(error.message);
    elements.startupToggle.checked = Boolean(latestState && latestState.startup && latestState.startup.enabled);
  } finally {
    setBusy(false);
  }
});

elements.checkUpdateBtn.addEventListener('click', async () => {
  setBusy(true);

  try {
    const state = await window.focusJiejie.checkForUpdates();
    render(state);
  } catch (error) {
    setLocalError(error.message);
  } finally {
    setBusy(false);
  }
});

elements.downloadUpdateBtn.addEventListener('click', async () => {
  setBusy(true);

  try {
    const state = await window.focusJiejie.downloadUpdate();
    render(state);
  } catch (error) {
    setLocalError(error.message);
  } finally {
    setBusy(false);
  }
});

elements.installUpdateBtn.addEventListener('click', async () => {
  try {
    await window.focusJiejie.installUpdate();
  } catch (error) {
    setLocalError(error.message);
  }
});

elements.sessionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setBusy(true);

  try {
    const durationMinutes = getDurationToStart();
    if (selectedDurationMode === 'custom') {
      elements.customDuration.value = String(durationMinutes);
      selectedDuration = durationMinutes;
    }

    const state = await window.focusJiejie.startSession({
      durationMinutes,
      targetGroupId: elements.targetGroup.value,
      intention: elements.intention.value,
      extraDomains: elements.extraDomains.value,
      strictMode: elements.strictMode.checked,
    });
    render(state);
  } catch (error) {
    setLocalError(error.message);
  } finally {
    setBusy(false);
  }
});

elements.breakBtn.addEventListener('click', async () => {
  if (!latestState || !latestState.currentSession) {
    return;
  }

  if (latestState.currentSession.strictMode) {
    openStrictReleaseDialog();
    return;
  }

  if (!window.confirm(t('breakConfirm'))) {
    return;
  }

  setBusy(true);

  try {
    const state = await window.focusJiejie.breakSession('');
    render(state);
  } catch (error) {
    setLocalError(error.message);
  } finally {
    setBusy(false);
  }
});

elements.restoreBtn.addEventListener('click', async () => {
  setBusy(true);

  try {
    const state = await window.focusJiejie.restoreNow();
    render(state);
  } catch (error) {
    setLocalError(error.message);
  } finally {
    setBusy(false);
  }
});

elements.repairBtn.addEventListener('click', async () => {
  selectedDuration = 10;
  selectedDurationMode = 'preset';
  elements.durationButtons.forEach((button) => {
    button.classList.toggle('active', selectedDurationMode === 'preset' && Number(button.dataset.duration) === selectedDuration);
  });
  elements.intention.value = t('repairIntention');
  elements.sessionForm.requestSubmit();
});

window.focusJiejie.onStateUpdated(render);
refresh();
