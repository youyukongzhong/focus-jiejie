const path = require('path');
const { app, BrowserWindow } = require('electron');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function nextPaint(win) {
  return win.webContents.executeJavaScript(
    'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
    true
  );
}

async function inspectLayout(win) {
  return win.webContents.executeJavaScript(`(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        top: box.top,
        bottom: box.bottom,
        left: box.left,
        right: box.right,
        width: box.width,
        height: box.height,
      };
    };
    const noOverlap = (a, b) => Boolean(a && b && (a.bottom <= b.top + 1 || b.bottom <= a.top + 1));
    const sections = Array.from(document.querySelectorAll('.side-panel > section')).map((element) => {
      const box = element.getBoundingClientRect();
      return {
        className: element.className,
        top: box.top,
        bottom: box.bottom,
        height: box.height,
      };
    });
    const panelBodies = Array.from(document.querySelectorAll('.side-panel .panel-body')).map((element) => ({
      parent: element.closest('section')?.className || '',
      overflowY: getComputedStyle(element).overflowY,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    const repairButton = rect('#repairBtn');
    const reportPanel = rect('.report-panel');
    const controlPanel = rect('.control-panel');
    const buttonRow = rect('.button-row');
    const formScroll = rect('.form-scroll');
    const domainEditor = rect('.domain-editor');
    const domainAddRow = rect('.domain-add-row');
    const switchRow = rect('.switch-row');
    const footer = rect('.footer');
    const brandText = document.querySelector('.brand-mark')?.textContent.trim();
    const metricRects = Array.from(document.querySelectorAll('.metric')).map((element) => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
      };
    });
    return {
      viewport: { width: innerWidth, height: innerHeight },
      repairVisibleInPanel: Boolean(
        repairButton &&
        reportPanel &&
        repairButton.top >= reportPanel.top &&
        repairButton.bottom <= reportPanel.bottom
      ),
      noSectionOverlap: sections.every((item, index) => index === 0 || item.top >= sections[index - 1].bottom - 1),
      metricNoOverlap: metricRects.every((item, index) => index === 0 || item.left >= metricRects[index - 1].right - 1),
      actionRowVisibleInPanel: Boolean(
        buttonRow &&
        controlPanel &&
        buttonRow.top >= controlPanel.top &&
        buttonRow.bottom <= controlPanel.bottom + 1
      ),
      domainAndSwitchNoOverlap: noOverlap(domainEditor, switchRow),
      strictAndDomainInputNoOverlap: Boolean(switchRow && domainAddRow && switchRow.bottom <= domainAddRow.top + 1),
      switchAndButtonsNoOverlap: Boolean(formScroll && buttonRow && formScroll.bottom <= buttonRow.top + 1),
      sidePanelBodiesScroll: panelBodies.length === 4 && panelBodies.every((item) => item.overflowY === 'auto'),
      footerStable: Boolean(footer && footer.height <= 35),
      brandHasGraphic: Boolean(document.querySelector('.brand-shield') && document.querySelector('.brand-core') && brandText === ''),
      addDomainButtonExists: Boolean(document.getElementById('addDomainBtn')),
      settingsButtonExists: Boolean(document.getElementById('settingsBtn')),
      startupToggleExists: Boolean(document.getElementById('startupToggle')),
      strictReleaseDialogExists: Boolean(document.getElementById('strictReleaseDialog')),
      restoreDisabled: Boolean(document.getElementById('restoreBtn')?.disabled),
      reportHintVisible: Boolean(document.querySelector('.report-hint')),
      sections,
      panelBodies,
      metricRects,
    };
  })()`, true);
}

async function testAddDomain(win) {
  return win.webContents.executeJavaScript(`(() => {
    const input = document.getElementById('extraDomainInput');
    input.value = 'https://www.google.com/';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('addDomainBtn').click();
    return {
      hidden: document.getElementById('extraDomains').value,
      extraItems: Array.from(document.querySelectorAll('#extraDomainList li')).map((item) => item.textContent.trim()),
      previewHasGoogle: Array.from(document.querySelectorAll('#domainList li')).some((item) => item.textContent.trim() === 'www.google.com'),
      domainCount: document.getElementById('domainCount').textContent.trim(),
    };
  })()`, true);
}

async function testStartupSetting(win) {
  return win.webContents.executeJavaScript(`(() => {
    document.getElementById('settingsBtn').click();
    const dialog = document.getElementById('settingsDialog');
    const toggle = document.getElementById('startupToggle');
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
    return new Promise((resolve) => setTimeout(() => resolve({
      dialogVisible: !dialog.hidden,
      toggleChecked: toggle.checked,
      statusText: document.getElementById('startupStatus').textContent.trim(),
    }), 60));
  })()`, true);
}

async function testLanguageSwitch(win) {
  return win.webContents.executeJavaScript(`(() => {
    document.getElementById('settingsBtn').click();
    const select = document.getElementById('languageSelect');
    select.value = 'en-US';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return new Promise((resolve) => setTimeout(() => resolve({
      appName: document.querySelector('h1').textContent.trim(),
      settingsButton: document.getElementById('settingsBtn').textContent.trim(),
      startButton: document.getElementById('startBtn').textContent.trim(),
      languageValue: document.getElementById('languageSelect').value,
    }), 80));
  })()`, true);
}

async function testUpdateErrorIsolation(win) {
  return win.webContents.executeJavaScript(`window.focusJiejie.setSmokeState({
    lastError: '',
    update: {
      state: 'error',
      error: 'very long updater failure '.repeat(40)
    }
  }).then((state) => {
    window.render(state);
    const footer = document.querySelector('.footer').getBoundingClientRect();
    return {
      footerHeight: footer.height,
      errorText: document.getElementById('errorBox').textContent.trim(),
      updateText: document.getElementById('updateStatus').textContent.trim()
    };
  })`, true);
}

async function testStrictReleaseFlow(win) {
  return win.webContents.executeJavaScript(`(async () => {
    document.getElementById('settingsDialog').hidden = true;

    const restoreDisabledBeforeClick = document.getElementById('restoreBtn').disabled;
    let restoreError = '';
    try {
      await window.focusJiejie.restoreNow();
    } catch (error) {
      restoreError = error.message;
    }

    document.getElementById('breakBtn').click();
    await new Promise((resolve) => setTimeout(resolve, 80));

    const dialog = document.getElementById('strictReleaseDialog');
    const input = document.getElementById('strictReleaseInput');
    const status = document.getElementById('strictReleaseStatus');
    const confirmButton = document.getElementById('confirmStrictReleaseBtn');
    const opened = !dialog.hidden;
    const token = document.getElementById('strictConfirmToken').textContent.trim();

    input.value = 'wrong';
    confirmButton.click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    const wrongRejected = Boolean(status.textContent.trim());
    const stillActiveAfterWrong = Boolean((await window.focusJiejie.getState()).currentSession);

    input.value = 'confirm';
    confirmButton.click();
    await new Promise((resolve) => setTimeout(resolve, 120));
    const finalState = await window.focusJiejie.getState();

    return {
      restoreDisabledBeforeClick,
      restoreError,
      opened,
      token,
      wrongRejected,
      stillActiveAfterWrong,
      dialogHiddenAfterConfirm: dialog.hidden,
      sessionEnded: finalState.currentSession === null,
      hostsManaged: finalState.hostsManaged,
    };
  })()`, true);
}

async function main() {
  await app.whenReady();

  const win = new BrowserWindow({
    width: 1105,
    height: 676,
    useContentSize: true,
    show: false,
    backgroundColor: '#0f1518',
    webPreferences: {
      preload: path.join(__dirname, 'preload-ui-smoke.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'renderer', 'index.html'));
  await nextPaint(win);

  const desktopLayout = await inspectLayout(win);
  assert(desktopLayout.repairVisibleInPanel, 'repair button is clipped in desktop layout');
  assert(desktopLayout.noSectionOverlap, 'right side sections overlap in desktop layout');
  assert(desktopLayout.metricNoOverlap, 'metric cards overlap in desktop layout');
  assert(desktopLayout.actionRowVisibleInPanel, 'action buttons are clipped in desktop layout');
  assert(desktopLayout.domainAndSwitchNoOverlap, 'domain editor overlaps strict mode in desktop layout');
  assert(desktopLayout.strictAndDomainInputNoOverlap, 'strict mode overlaps the add-domain input row in desktop layout');
  assert(desktopLayout.switchAndButtonsNoOverlap, 'strict mode overlaps action buttons in desktop layout');
  assert(desktopLayout.sidePanelBodiesScroll, 'right side panel bodies are not scrollable');
  assert(desktopLayout.footerStable, 'footer is taller than expected in desktop layout');
  assert(desktopLayout.brandHasGraphic, 'brand mark did not render the app graphic');
  assert(desktopLayout.addDomainButtonExists, 'domain add button is missing');
  assert(desktopLayout.settingsButtonExists, 'settings button is missing');
  assert(desktopLayout.startupToggleExists, 'startup toggle is missing');
  assert(desktopLayout.strictReleaseDialogExists, 'strict release dialog is missing');

  const addDomain = await testAddDomain(win);
  assert(addDomain.hidden === 'www.google.com', `unexpected normalized domain payload: ${addDomain.hidden}`);
  assert(addDomain.previewHasGoogle, 'domain preview did not include the added domain');

  const startupSetting = await testStartupSetting(win);
  assert(startupSetting.dialogVisible, 'settings dialog did not open');
  assert(startupSetting.toggleChecked, 'startup toggle did not stay enabled');

  const languageSwitch = await testLanguageSwitch(win);
  assert(languageSwitch.languageValue === 'en-US', 'language selector did not switch to English');
  assert(languageSwitch.appName === 'Focus Ward', 'app title did not switch to English');
  assert(languageSwitch.settingsButton === 'Settings', 'settings button did not switch to English');
  assert(languageSwitch.startButton === 'Start ward', 'start button did not switch to English');

  const updateError = await testUpdateErrorIsolation(win);
  assert(updateError.footerHeight <= 35, 'footer grew after an update error');
  assert(updateError.errorText === '', 'update error leaked into the global footer error line');
  assert(updateError.updateText.includes('Update failed'), 'update error did not render in the settings update status');

  const activeState = await win.webContents.executeJavaScript(`window.focusJiejie.setSmokeState({
    hostsManaged: true,
    currentSession: {
      id: 'smoke-session',
      status: 'active',
      targetGroupId: 'wide-focus',
      targetName: 'Wide Focus',
      intention: 'Smoke active session',
      strictMode: true,
      durationMinutes: 1,
      startedAt: Date.now(),
      endsAt: Date.now() + 30000,
      remainingSeconds: 30,
      remainingText: '00:30',
      progress: 0.5,
      intercepts: 3,
      interceptsCounted: 3,
      integrity: 88,
      domains: ['bilibili.com', 'www.bilibili.com', 'www.google.com']
    },
    lastReport: {
      outcome: 'started',
      title: 'Smoke started',
      subtitle: 'Smoke session started',
      browserNotice: 'browser restart notice',
      completedAt: new Date().toISOString(),
      rewards: []
    }
  }).then((state) => {
    window.render(state);
    return state;
  })`, true);
  assert(activeState.currentSession.status === 'active', 'smoke active state was not applied');

  const sizeCases = [
    [1120, 780, 'default active layout'],
    [1105, 676, 'screenshot active layout'],
    [960, 680, 'narrow active layout'],
  ];

  const activeLayouts = [];
  for (const [width, height, label] of sizeCases) {
    win.setContentSize(width, height);
    await nextPaint(win);
    const layout = await inspectLayout(win);
    activeLayouts.push({ label, layout });
    assert(layout.repairVisibleInPanel, `repair button is clipped in ${label}`);
    assert(layout.noSectionOverlap, `right side sections overlap in ${label}`);
    assert(layout.metricNoOverlap, `metric cards overlap in ${label}`);
    assert(layout.actionRowVisibleInPanel, `action buttons are clipped in ${label}`);
    assert(layout.domainAndSwitchNoOverlap, `domain editor overlaps strict mode in ${label}`);
    assert(layout.strictAndDomainInputNoOverlap, `strict mode overlaps add-domain row in ${label}`);
    assert(layout.switchAndButtonsNoOverlap, `strict mode overlaps action buttons in ${label}`);
    assert(layout.footerStable, `footer grew unexpectedly in ${label}`);
    assert(layout.reportHintVisible, `browser restart notice is missing in ${label}`);
    assert(layout.restoreDisabled, `restore hosts is enabled during active session in ${label}`);
  }

  const strictRelease = await testStrictReleaseFlow(win);
  assert(strictRelease.restoreDisabledBeforeClick, 'restore hosts button is enabled during strict active session');
  assert(strictRelease.restoreError.includes('active session cannot restore hosts'), 'restore hosts IPC did not reject active session');
  assert(strictRelease.opened, 'strict release dialog did not open');
  assert(strictRelease.token === 'confirm', `unexpected strict confirmation token: ${strictRelease.token}`);
  assert(strictRelease.wrongRejected, 'wrong strict confirmation did not show an error');
  assert(strictRelease.stillActiveAfterWrong, 'wrong strict confirmation ended the session');
  assert(strictRelease.dialogHiddenAfterConfirm, 'strict release dialog stayed open after confirmation');
  assert(strictRelease.sessionEnded, 'strict release did not end the session');
  assert(strictRelease.hostsManaged === false, 'strict release did not clear managed hosts state');

  console.log(JSON.stringify({ ok: true, desktopLayout, addDomain, startupSetting, languageSwitch, updateError, activeLayouts, strictRelease }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    app.quit();
  });
