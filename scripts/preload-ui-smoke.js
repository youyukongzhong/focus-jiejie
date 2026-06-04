const { contextBridge } = require('electron');

const state = {
  isAdmin: false,
  hostsManaged: false,
  hostsPath: 'C:\\Windows\\System32\\drivers\\etc\\hosts',
  language: 'zh-CN',
  strictConfirmText: 'confirm',
  targetGroups: [
    {
      id: 'wide-focus',
      name: 'Wide Focus',
      domains: [
        'bilibili.com',
        'www.bilibili.com',
        'search.bilibili.com',
        'space.bilibili.com',
      ],
    },
  ],
  currentSession: null,
  lastReport: {
    outcome: 'success',
    title: 'Smoke report',
    subtitle: 'Layout stress text',
    durationMinutes: 1,
    guardedMinutes: 1,
    intercepts: 1,
    completedAt: new Date().toISOString(),
    rewards: Array.from({ length: 12 }, (_, index) => `reward-${index + 1}`),
  },
  settings: {
    extraDomains: '',
    lastDurationMinutes: 25,
    strictMode: false,
  },
  stats: {
    totalMinutes: 1,
    completedSessions: 1,
    interruptedSessions: 0,
    resistedImpulses: 1,
    shieldStones: 1,
    wardXp: 18,
    wardLevel: 1,
    towersLit: 0,
    streakDays: 1,
    lastCompletionDate: null,
    dailyMinutes: {},
    achievements: Array.from({ length: 10 }, (_, index) => ({
      id: `achievement-${index + 1}`,
      title: `achievement-${index + 1}`,
      unlockedAt: new Date().toISOString(),
    })),
  },
  interceptStatus: {
    http: { listening: false, error: '' },
    https: { listening: false, error: '' },
  },
  startup: {
    supported: true,
    enabled: false,
    error: '',
  },
  update: {
    state: 'idle',
    supported: true,
    portable: false,
    available: false,
    downloaded: false,
    version: '',
    percent: 0,
    error: '',
    lastCheckedAt: null,
  },
  lastError: '',
  paths: {
    storePath: 'smoke',
    backupDir: 'smoke',
  },
};

function mergeState(patch) {
  if (patch.currentSession !== undefined) {
    state.currentSession = patch.currentSession;
  }
  if (patch.lastReport) {
    state.lastReport = {
      ...state.lastReport,
      ...patch.lastReport,
    };
  }
  if (patch.settings) {
    state.settings = {
      ...state.settings,
      ...patch.settings,
    };
  }
  if (patch.stats) {
    state.stats = {
      ...state.stats,
      ...patch.stats,
    };
  }
  if (patch.hostsManaged !== undefined) {
    state.hostsManaged = patch.hostsManaged;
  }
  if (patch.lastError !== undefined) {
    state.lastError = patch.lastError;
  }
  if (patch.language) {
    state.language = patch.language;
  }
  if (patch.startup) {
    state.startup = {
      ...state.startup,
      ...patch.startup,
    };
  }
  if (patch.update) {
    state.update = {
      ...state.update,
      ...patch.update,
    };
  }
}

contextBridge.exposeInMainWorld('focusJiejie', {
  getState: async () => structuredClone(state),
  onStateUpdated: () => {},
  setSmokeState: async (patch) => {
    mergeState(patch || {});
    return structuredClone(state);
  },
  startSession: async () => structuredClone(state),
  breakSession: async (phrase) => {
    if (state.currentSession?.strictMode && phrase !== state.strictConfirmText) {
      throw new Error(`strict confirm required: ${state.strictConfirmText}`);
    }

    state.currentSession = null;
    state.hostsManaged = false;
    state.lastReport = {
      outcome: 'breach',
      title: 'Smoke released',
      subtitle: 'Smoke strict release',
      guardedMinutes: 0,
      intercepts: 0,
      completedAt: new Date().toISOString(),
      rewards: [],
    };
    return structuredClone(state);
  },
  restoreNow: async () => {
    if (state.currentSession?.status === 'active') {
      throw new Error('active session cannot restore hosts');
    }

    state.currentSession = null;
    state.hostsManaged = false;
    return structuredClone(state);
  },
  completeSession: async () => structuredClone(state),
  setStartupEnabled: async (enabled) => {
    state.startup.enabled = Boolean(enabled);
    return structuredClone(state);
  },
  setLanguage: async (language) => {
    state.language = language === 'en-US' ? 'en-US' : 'zh-CN';
    state.targetGroups = state.targetGroups.map((group) => ({
      ...group,
      name: state.language === 'en-US' ? 'Wide Focus' : '娱乐网站结界',
    }));
    return structuredClone(state);
  },
  checkForUpdates: async () => {
    state.update.state = 'none';
    return structuredClone(state);
  },
  downloadUpdate: async () => {
    state.update.state = 'downloaded';
    state.update.downloaded = true;
    return structuredClone(state);
  },
  installUpdate: async () => structuredClone(state),
  showWindow: async () => structuredClone(state),
});
