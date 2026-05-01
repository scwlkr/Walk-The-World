import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const host = '127.0.0.1';
const appPort = Number(process.env.WTW_LOCAL_SMOKE_PORT ?? 5191);
const debugPort = Number(process.env.WTW_LOCAL_SMOKE_DEBUG_PORT ?? 9223);
const appUrl = `http://${host}:${appPort}/?dev=1`;
const debugUrl = `http://${host}:${debugPort}`;
const saveKey = 'walk_the_world_save_v1';

const chromeCandidates = [
  process.env.CHROME_BIN,
  process.env.CHROME_EXECUTABLE,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
].filter(Boolean);

const logStep = (message) => {
  console.log(`[local-smoke] ${message}`);
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitFor = async (label, check, timeoutMs = 15000) => {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const result = await check();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await delay(150);
  }
  throw new Error(`${label} timed out${lastError instanceof Error ? `: ${lastError.message}` : ''}`);
};

const waitForHttp = (url) =>
  waitFor(`HTTP ${url}`, async () => {
    const response = await fetch(url);
    return response.ok;
  });

const findChrome = async () => {
  for (const candidate of chromeCandidates) {
    try {
      const process = spawn(candidate, ['--version'], { stdio: 'ignore' });
      const code = await new Promise((resolve) => process.once('exit', resolve));
      if (code === 0) return candidate;
    } catch {
      // Try the next browser path.
    }
  }

  throw new Error('No Chrome-compatible browser found. Set CHROME_BIN to run the local browser smoke.');
};

const startProcess = (command, args, options = {}) => {
  const child = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  });
  child.stdout?.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr?.on('data', (chunk) => process.stderr.write(chunk));
  return child;
};

const stopProcess = async (child) => {
  if (!child || child.killed) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    delay(2000).then(() => {
      if (!child.killed) child.kill('SIGKILL');
    })
  ]);
};

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    });
  }

  call(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.socket.close();
  }
}

const connectCdp = async () => {
  const target = await waitFor('Chrome debug target', async () => {
    const response = await fetch(`${debugUrl}/json`);
    if (!response.ok) return null;
    const targets = await response.json();
    return targets.find((candidate) => candidate.type === 'page' && candidate.url.startsWith(`http://${host}:${appPort}`));
  });

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  return new CdpClient(socket);
};

const evaluate = async (client, expression) => {
  const result = await client.call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });

  if (result.exceptionDetails) {
    const details = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? 'Runtime.evaluate failed';
    throw new Error(details);
  }

  return result.result.value;
};

const click = (selector) => `
(() => {
  const element = document.querySelector(${JSON.stringify(selector)});
  if (!element) return false;
  element.click();
  return true;
})()
`;

const clickByText = (selector, text) => `
(() => {
  const needle = ${JSON.stringify(text)};
  const element = Array.from(document.querySelectorAll(${JSON.stringify(selector)}))
    .find((candidate) => candidate.textContent?.includes(needle));
  if (!element) return false;
  element.click();
  return true;
})()
`;

const hasDisabledButton = (text) => `
(() => {
  const needle = ${JSON.stringify(text)};
  return Array.from(document.querySelectorAll('button'))
    .some((candidate) => candidate.textContent?.includes(needle) && candidate.disabled);
})()
`;

const visibleMenuControls = `
(() => {
  const controls = document.querySelector('.bottom-controls');
  const shell = document.querySelector('.game-shell');
  if (!controls || !shell) return { count: 0, visible: false };
  const rect = controls.getBoundingClientRect();
  const shellRect = shell.getBoundingClientRect();
  return {
    count: document.querySelectorAll('.bottom-controls .icon-control').length,
    visible: rect.width > 0
      && rect.height > 0
      && rect.left >= shellRect.left
      && rect.right <= shellRect.right
      && rect.top >= shellRect.top
      && rect.bottom <= shellRect.bottom
  };
})()
`;

const readSave = (client) =>
  evaluate(
    client,
    `(() => {
      const raw = localStorage.getItem(${JSON.stringify(saveKey)});
      return raw ? JSON.parse(raw) : null;
    })()`
  );

const navigateToApp = async (client, label = 'app render') => {
  await client.call('Page.navigate', { url: appUrl });
  await waitFor(label, () => evaluate(client, 'Boolean(document.querySelector(".walk-btn") && document.querySelector(".game-canvas"))'));
};

const run = async () => {
  logStep('starting Vite dev server');
  const vite = startProcess(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    host,
    '--port',
    String(appPort),
    '--strictPort'
  ]);

  const tempProfile = await mkdtemp(join(tmpdir(), 'wtw-local-smoke-'));
  let chrome = null;
  let client = null;

  try {
    await waitForHttp(`http://${host}:${appPort}/`);

    logStep('starting headless browser');
    const chromePath = await findChrome();
    chrome = startProcess(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${tempProfile}`,
        '--window-size=390,844',
        appUrl
      ],
      { stdio: 'ignore' }
    );

    client = await connectCdp();
    await client.call('Page.enable');
    await client.call('Runtime.enable');
    await client.call('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    logStep('loading fresh save and checking first-screen controls');
    await waitFor('initial app render', () => evaluate(client, 'Boolean(document.querySelector(".walk-btn") && document.querySelector(".game-canvas"))'));
    await evaluate(client, `localStorage.removeItem(${JSON.stringify(saveKey)}); true`);
    await navigateToApp(client, 'fresh app render');

    const firstScreen = await evaluate(
      client,
      `(() => ({
        hasCanvas: Boolean(document.querySelector('.game-canvas')),
        hasWalk: Boolean(document.querySelector('.walk-btn')),
        hasJourneyHud: Boolean(document.querySelector('.hud-journey-row')),
        hasBottomControls: Boolean(document.querySelector('.bottom-controls')),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        bodyOverflows: document.documentElement.scrollWidth > window.innerWidth + 4
      }))()`
    );
    const mobileMenuControls = await evaluate(client, visibleMenuControls);
    assert(firstScreen.hasCanvas, 'Game canvas did not render.');
    assert(firstScreen.hasWalk, 'Walk button did not render.');
    assert(firstScreen.hasJourneyHud, 'Journey HUD did not render.');
    assert(firstScreen.hasBottomControls, 'Bottom controls did not render.');
    assert(mobileMenuControls.count === 4, `Expected 4 mobile menu controls, found ${mobileMenuControls.count}.`);
    assert(mobileMenuControls.visible, 'Mobile controls are clipped or outside the game shell.');
    assert(!firstScreen.bodyOverflows, `Mobile viewport has horizontal overflow at ${firstScreen.viewportWidth}x${firstScreen.viewportHeight}.`);

    await client.call('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await delay(100);
    const desktopMenuControls = await evaluate(client, visibleMenuControls);
    assert(desktopMenuControls.count === 4, `Expected 4 desktop menu controls, found ${desktopMenuControls.count}.`);
    assert(desktopMenuControls.visible, 'Desktop controls are clipped or outside the game shell.');
    await client.call('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await delay(100);

    logStep('walking, claiming first distance milestone, and checking WB spend gating');
    for (let i = 0; i < 6; i += 1) {
      assert(await evaluate(client, click('.walk-btn')), 'Walk button click failed.');
      await delay(50);
    }

    assert(await evaluate(client, click('[aria-label="Milestones"]')), 'Milestones control did not open.');
    await waitFor('claimable milestone', () => evaluate(client, 'document.body.textContent.includes("Claim reward")'));
    assert(await evaluate(client, clickByText('button', 'Claim reward')), 'Milestone claim button did not click.');

    assert(await evaluate(client, click('[aria-label="Shop"]')), 'Shop control did not open.');
    await waitFor('starter generator visible', () => evaluate(client, 'document.body.textContent.includes("Starter Shoes")'));
    const shopSurface = await evaluate(
      client,
      `(() => ({
        hasFollowersTab: document.body.textContent.includes('followers'),
        hasBoostsTab: document.body.textContent.includes('boosts'),
        hasCosmeticsTab: document.body.textContent.includes('cosmetics')
      }))()`
    );
    assert(shopSurface.hasFollowersTab, 'Followers tab did not render.');
    assert(shopSurface.hasBoostsTab, 'Boosts tab did not render.');
    assert(shopSurface.hasCosmeticsTab, 'Cosmetics tab did not render.');
    assert(await evaluate(client, clickByText('button', 'followers')), 'Followers tab did not click.');
    await waitFor('crew status visible', () => evaluate(client, 'document.body.textContent.includes("Crew Status")'));
    assert(await evaluate(client, clickByText('button', 'boosts')), 'Boosts tab did not click.');
    await waitFor('boost shop visible', () => evaluate(client, 'document.body.textContent.includes("Boosts & Regional Gear")'));
    await waitFor('v0.3 regional shop visible', () => evaluate(client, 'document.body.textContent.includes("Regional Gear")'));
    await waitFor('catalog spend blocked without WalkerBucks balance', () =>
      evaluate(client, hasDisabledButton('Not enough WB'))
    );
    assert(await evaluate(client, click('[aria-label="Stats"]')), 'Stats control did not open.');
    await waitFor('achievements visible', () => evaluate(client, 'document.body.textContent.includes("Achievements")'));
    await waitFor('regions visible', () => evaluate(client, 'document.body.textContent.includes("Regions")'));
    await waitFor('journey reset visible', () => evaluate(client, 'document.body.textContent.includes("Journey Reset")'));
    await waitFor('journey upgrades visible', () => evaluate(client, 'document.body.textContent.includes("Journey Upgrades")'));
    await waitFor('collection goals visible', () => evaluate(client, 'document.body.textContent.includes("Collection Goals")'));
    await waitFor('titles visible', () => evaluate(client, 'document.body.textContent.includes("Titles")'));
    assert(await evaluate(client, click('[aria-label="Milestones"]')), 'Milestones control did not reopen.');
    await waitFor('daily and weekly events visible', () => evaluate(client, 'document.body.textContent.includes("Daily & Weekly Events")'));

    const inventorySave = await readSave(client);
    assert(inventorySave?.saveVersion === 14, 'Save did not persist as version 14.');
    assert(inventorySave?.stats?.totalClicks >= 6, 'Walking did not update click stats.');
    assert(inventorySave?.stats?.milestonesClaimed >= 1, 'Milestone claim did not persist.');
    assert(inventorySave?.walkerBucks === 0, 'Guest save created a spendable client-side WB balance.');
    assert(inventorySave?.walkerBucksBridge?.pendingGrantAmount >= 10, 'Earned WB was not queued for WalkerBucks sync.');

    logStep('forcing offline progress notification and checking layout');
    const offlineSave = await readSave(client);
    offlineSave.ui = {
      ...offlineSave.ui,
      activeTab: 'walk',
      showShop: false,
      offlineSummary: {
        distance: 0.12,
        wb: 12
      },
      toast: 'Leave the Couch milestone ready.',
      recentRewards: [
        { id: 'smoke_reward_wb', label: '+12 WB queued', createdAt: Date.now() },
        { id: 'smoke_reward_extra', label: 'milestone ready', createdAt: Date.now() }
      ]
    };
    const offlineInjection = await client.call('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem(${JSON.stringify(saveKey)}, ${JSON.stringify(JSON.stringify(offlineSave))});`
    });
    await navigateToApp(client, 'offline notification reload');
    await client.call('Page.removeScriptToEvaluateOnNewDocument', { identifier: offlineInjection.identifier });
    await waitFor('offline notification', () => evaluate(client, 'document.body.textContent.includes("You walked")'));
    const notificationLayout = await evaluate(
      client,
      `(() => {
        const getRect = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
        };
        const overlaps = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
        const notificationItems = Array.from(document.querySelectorAll('.notification-large-slot > *, .notification-toast'))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
          });
        const hud = getRect('.game-hud');
        const rail = getRect('.bottom-controls');
        const walk = getRect('.walk-btn');
        return {
          largeCount: document.querySelectorAll('.notification-large-slot > *').length,
          toastCount: document.querySelectorAll('.notification-toast').length,
          hasOfflineCard: Boolean(document.querySelector('.notification-large-slot')?.textContent?.includes('You walked')),
          overlapsHud: notificationItems.some((item) => overlaps(item, hud)),
          overlapsRail: notificationItems.some((item) => overlaps(item, rail)),
          overlapsWalk: notificationItems.some((item) => overlaps(item, walk)),
          unsafeEdges: [hud, rail, walk, ...notificationItems].some((item) => item && (item.left < 12 || item.right > window.innerWidth - 12 || item.top < 12 || item.bottom > window.innerHeight - 12))
        };
      })()`
    );
    assert(notificationLayout.largeCount === 1, 'Notification center rendered more than one large card.');
    assert(notificationLayout.toastCount <= 2, 'Notification center rendered more than two toasts.');
    assert(notificationLayout.hasOfflineCard, 'Offline summary was not the visible priority notification.');
    assert(!notificationLayout.overlapsHud, 'Notification overlapped the HUD.');
    assert(!notificationLayout.overlapsRail, 'Notification overlapped the right action rail.');
    assert(!notificationLayout.overlapsWalk, 'Notification overlapped the WALK button.');
    assert(!notificationLayout.unsafeEdges, 'A fixed UI element is too close to the mobile viewport edge.');

    logStep('opening dev lab and checking scene controls');
    assert(await evaluate(client, click('[aria-label="Settings"]')), 'Settings control did not open.');
    await waitFor('dev lab panel', () => evaluate(client, 'document.body.textContent.includes("Dev Lab")'));
    const devLab = await evaluate(
      client,
      `(() => ({
        presets: Array.from(document.querySelectorAll('select option')).some((option) => option.textContent?.includes('Mars prototype')),
        scenes: Array.from(document.querySelectorAll('select option')).some((option) => option.textContent?.includes('Walkertown')),
        hasSpeed: Boolean(document.querySelector('input[type="number"]')),
        hasBankLink: Boolean(document.querySelector('input[placeholder="LINK-0000"]')) && document.body.textContent.includes('Bank Link')
      }))()`
    );
    assert(devLab.presets, 'Dev lab preset options did not render.');
    assert(devLab.scenes, 'Dev lab scene options did not render.');
    assert(devLab.hasSpeed, 'Dev lab speed multiplier did not render.');
    assert(devLab.hasBankLink, 'WalkerBucks Bank link form did not render.');

    logStep('reloading and verifying local save continuity');
    await navigateToApp(client, 'reloaded game');
    await waitFor('saved game after reload', () => evaluate(client, 'Boolean(localStorage.getItem("walk_the_world_save_v1"))'));
    const reloadedSave = await readSave(client);
    assert(reloadedSave?.stats?.milestonesClaimed >= 1, 'Reload lost milestone progress.');

    console.log(JSON.stringify({ ok: true, appUrl, saveVersion: reloadedSave.saveVersion }, null, 2));
  } finally {
    if (client) client.close();
    await stopProcess(chrome);
    await stopProcess(vite);
    await rm(tempProfile, { recursive: true, force: true });
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
