const elements = {
  adminBadge: document.getElementById('adminBadge'),
  hostsBadge: document.getElementById('hostsBadge'),
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

let selectedDuration = 25;
let selectedDurationMode = 'preset';
const PRESET_DURATIONS = new Set([10, 25, 50, 90]);
let latestState = null;
let formHydrated = false;
let busy = false;

function setBusy(nextBusy) {
  busy = nextBusy;
  render(latestState);
}

function setLocalError(message) {
  elements.errorBox.textContent = message || '';
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
    throw new Error('请输入 1 到 480 分钟之间的守界时长。');
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
    setLocalError('请输入有效域名，例如 bilibili.com');
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
    elements.extraDomainList.innerHTML = '<li class="empty">还没有添加额外域名</li>';
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
  if (!state || formHydrated) {
    return;
  }

  elements.targetGroup.innerHTML = '';

  for (const group of state.targetGroups || []) {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = group.name;
    elements.targetGroup.appendChild(option);
  }

  elements.extraDomains.value = state.settings.extraDomains || '';
  renderExtraDomainList();
  elements.strictMode.checked = Boolean(state.settings.strictMode);
  const savedDuration = sanitizeDuration(state.settings.lastDurationMinutes) || 25;
  selectedDuration = savedDuration;
  selectedDurationMode = PRESET_DURATIONS.has(savedDuration) ? 'preset' : 'custom';
  elements.customDuration.value = String(PRESET_DURATIONS.has(savedDuration) ? 30 : savedDuration);
  formHydrated = true;
}

function render(state) {
  if (!state) {
    return;
  }

  latestState = state;
  hydrateForm(state);

  const session = state.currentSession;
  const active = session && session.status === 'active';
  const needsRestore = session && session.status === 'needs-restore';
  const lastOutcome = state.lastReport && state.lastReport.outcome;
  const integrity = active ? session.integrity : lastOutcome === 'breach' ? 44 : 100;
  const intercepts = active ? session.intercepts : state.lastReport ? state.lastReport.intercepts || 0 : 0;

  elements.adminBadge.textContent = state.isAdmin ? '管理员权限' : '普通权限';
  elements.adminBadge.className = `status-pill ${state.isAdmin ? 'good' : 'warn'}`;
  elements.hostsBadge.textContent = state.hostsManaged ? 'hosts 已封锁' : 'hosts 未封锁';
  elements.hostsBadge.className = `status-pill ${state.hostsManaged ? 'warn' : 'good'}`;

  if (active) {
    elements.statusLine.textContent = `${session.targetName}守界中，剩余 ${session.remainingText}`;
  } else if (needsRestore) {
    elements.statusLine.textContent = '守界已结束，等待恢复 hosts';
  } else {
    elements.statusLine.textContent = '等待启动';
  }

  elements.wardStage.classList.toggle('active', Boolean(active));
  elements.wardStage.classList.toggle('breach', lastOutcome === 'breach');
  elements.wardStage.classList.toggle('success', lastOutcome === 'success');
  elements.progressRing.style.setProperty('--progress-deg', `${Math.round((active ? session.progress : 0) * 360)}deg`);
  elements.countdown.textContent = active ? session.remainingText : '00:00';
  elements.sessionLabel.textContent = active ? session.intention : needsRestore ? '等待恢复' : '未启动';

  elements.integrityValue.textContent = `${Math.round(integrity)}%`;
  elements.integrityMeter.style.width = `${Math.max(0, Math.min(100, integrity))}%`;
  elements.interceptsValue.textContent = `${intercepts} 次`;
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
  elements.restoreBtn.disabled = busy || (!state.hostsManaged && !needsRestore);
  elements.repairBtn.disabled = active || busy || needsRestore;

  renderReport(state.lastReport);
  renderStats(state.stats, session);
  renderExtraDomainList();
  renderDomains(getPreviewDomains());
  renderAchievements(state.stats.achievements || []);

  const portNotes = [];
  if (state.interceptStatus.http.error) {
    portNotes.push(`80端口：${state.interceptStatus.http.error}`);
  }
  if (state.interceptStatus.https.error) {
    portNotes.push(`443端口：${state.interceptStatus.https.error}`);
  }

  elements.errorBox.textContent = state.lastError || portNotes.join('  ');
  elements.pathBox.textContent = state.paths ? `hosts: ${state.hostsPath}` : '';
}

function renderReport(report) {
  if (!report) {
    elements.reportStamp.textContent = '暂无';
    elements.reportBox.innerHTML = '<strong>还没有战报</strong><p>启动一次结界后，这里会记录结果。</p>';
    return;
  }

  const date = report.completedAt ? new Date(report.completedAt) : null;
  elements.reportStamp.textContent = date ? date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '刚刚';

  const rewards = (report.rewards || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const browserNotice = report.browserNotice
    ? `<p class="report-hint">${escapeHtml(report.browserNotice)}</p>`
    : '';
  const meta = report.outcome === 'success'
    ? `专注 ${report.durationMinutes || 0} 分钟，抵挡 ${report.intercepts || 0} 次`
    : report.outcome === 'breach'
      ? `守住 ${report.guardedMinutes || 0} 分钟，抵挡 ${report.intercepts || 0} 次`
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

function renderStats(stats, session) {
  const liveUncounted = session && session.status === 'active'
    ? Math.max(0, (session.intercepts || 0) - (session.interceptsCounted || 0))
    : 0;

  elements.streakValue.textContent = `${stats.streakDays || 0} 天`;
  elements.totalMinutes.textContent = `${stats.totalMinutes || 0} 分钟`;
  elements.completedSessions.textContent = String(stats.completedSessions || 0);
  elements.totalIntercepts.textContent = String((stats.resistedImpulses || 0) + liveUncounted);
  elements.shieldStones.textContent = String(stats.shieldStones || 0);
}

function renderDomains(domains) {
  elements.domainCount.textContent = `${domains.length} 个`;
  elements.domainList.innerHTML = domains
    .map((domain) => `<li title="${escapeHtml(domain)}">${escapeHtml(domain)}</li>`)
    .join('');
}

function renderAchievements(achievements) {
  elements.achievementCount.textContent = String(achievements.length);

  if (!achievements.length) {
    elements.achievementList.innerHTML = '<li>等待第一次守界成功</li>';
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

  let phrase = '';

  if (latestState.currentSession.strictMode) {
    phrase = window.prompt(`输入确认文本：${latestState.strictConfirmText}`) || '';
  } else if (!window.confirm('提前解除会放弃本次守界奖励，确认解除吗？')) {
    return;
  }

  setBusy(true);

  try {
    const state = await window.focusJiejie.breakSession(phrase);
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
  elements.intention.value = '开一个修复局，把节奏拉回来';
  elements.sessionForm.requestSubmit();
});

window.focusJiejie.onStateUpdated(render);
refresh();
