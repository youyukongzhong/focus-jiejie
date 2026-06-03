const { contextBridge } = require('electron');

const state = {
  isAdmin: false,
  hostsManaged: false,
  hostsPath: 'C:\\Windows\\System32\\drivers\\etc\\hosts',
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
}

contextBridge.exposeInMainWorld('focusJiejie', {
  getState: async () => structuredClone(state),
  onStateUpdated: () => {},
  setSmokeState: async (patch) => {
    mergeState(patch || {});
    return structuredClone(state);
  },
  startSession: async () => structuredClone(state),
  breakSession: async () => structuredClone(state),
  restoreNow: async () => structuredClone(state),
  completeSession: async () => structuredClone(state),
  showWindow: async () => structuredClone(state),
});
