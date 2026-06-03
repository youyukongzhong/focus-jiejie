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
    const switchRow = rect('.switch-row');
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
      domainAndSwitchNoOverlap: Boolean(domainEditor && switchRow && domainEditor.bottom <= switchRow.top + 1),
      switchAndButtonsNoOverlap: Boolean(formScroll && buttonRow && formScroll.bottom <= buttonRow.top + 1),
      sidePanelBodiesScroll: panelBodies.length === 4 && panelBodies.every((item) => item.overflowY === 'auto'),
      brandHasGraphic: Boolean(document.querySelector('.brand-shield') && document.querySelector('.brand-core') && brandText === ''),
      addDomainButtonExists: Boolean(document.getElementById('addDomainBtn')),
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
  assert(desktopLayout.switchAndButtonsNoOverlap, 'strict mode overlaps action buttons in desktop layout');
  assert(desktopLayout.sidePanelBodiesScroll, 'right side panel bodies are not scrollable');
  assert(desktopLayout.brandHasGraphic, 'brand mark did not render the app graphic');
  assert(desktopLayout.addDomainButtonExists, 'domain add button is missing');

  const addDomain = await testAddDomain(win);
  assert(addDomain.hidden === 'www.google.com', `unexpected normalized domain payload: ${addDomain.hidden}`);
  assert(addDomain.previewHasGoogle, 'domain preview did not include the added domain');

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
    assert(layout.switchAndButtonsNoOverlap, `strict mode overlaps action buttons in ${label}`);
    assert(layout.reportHintVisible, `browser restart notice is missing in ${label}`);
  }

  console.log(JSON.stringify({ ok: true, desktopLayout, addDomain, activeLayouts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    app.quit();
  });
