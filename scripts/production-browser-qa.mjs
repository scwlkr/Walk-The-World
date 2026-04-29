import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const appUrl = process.env.WTW_PRODUCTION_QA_URL ?? 'https://walk-the-world.vercel.app/';
const debugPort = Number(process.env.WTW_PRODUCTION_QA_DEBUG_PORT ?? 9224);
const debugUrl = `http://127.0.0.1:${debugPort}`;
const saveKey = 'walk_the_world_save_v1';
const runStamp = new Date().toISOString().replace(/[:.]/g, '-');
const artifactDir = resolve(process.env.WTW_PRODUCTION_QA_ARTIFACT_DIR ?? `qa-artifacts/production-browser-qa-${runStamp}`);
const qaEmail = process.env.WTW_PRODUCTION_QA_EMAIL ?? `wtw-prod-qa-${Date.now()}@example.com`;
const qaPassword = process.env.WTW_PRODUCTION_QA_PASSWORD ?? `ProdQa-${randomUUID()}`;

const chromeCandidates = [
  process.env.CHROME_BIN,
  process.env.CHROME_EXECUTABLE,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
].filter(Boolean);

const logStep = (message) => {
  console.log(`[production-browser-qa] ${message}`);
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitFor = async (label, check, timeoutMs = 20000) => {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const result = await check();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await delay(200);
  }
  throw new Error(`${label} timed out${lastError instanceof Error ? `: ${lastError.message}` : ''}`);
};

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

  throw new Error('No Chrome-compatible browser found. Set CHROME_BIN to run production browser QA.');
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
    this.events = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) {
        this.events.push(message);
        return;
      }
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
    return targets.find((candidate) => candidate.type === 'page');
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

const hasEnabledButton = (text) => `
(() => {
  const needle = ${JSON.stringify(text)};
  return Array.from(document.querySelectorAll('button'))
    .some((candidate) => candidate.textContent?.includes(needle) && !candidate.disabled);
})()
`;

const fillInput = (selector, value) => `
(() => {
  const element = document.querySelector(${JSON.stringify(selector)});
  if (!element) return false;
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value');
  descriptor?.set?.call(element, ${JSON.stringify(value)});
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
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

const captureScreenshot = async (client, name) => {
  await mkdir(artifactDir, { recursive: true });
  const result = await client.call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const filePath = join(artifactDir, `${name}.png`);
  await writeFile(filePath, Buffer.from(result.data, 'base64'));
  return filePath;
};

const getRuntimeProblems = (client) =>
  client.events.filter((event) => {
    if (event.method === 'Runtime.exceptionThrown') return true;
    if (event.method !== 'Log.entryAdded') return false;
    const entry = event.params?.entry;
    const isExpectedBridgeAuthCheck =
      entry?.level === 'error' &&
      String(entry?.url ?? '').includes('/functions/v1/walkerbucks-bridge/balance') &&
      String(entry?.text ?? '').includes('401');
    if (isExpectedBridgeAuthCheck) return false;

    return entry?.level === 'error' && !String(entry?.text ?? '').includes('favicon');
  });

const run = async () => {
  const tempProfile = await mkdtemp(join(tmpdir(), 'wtw-production-browser-qa-'));
  let chrome = null;
  let client = null;

  try {
    logStep(`opening production app at ${appUrl}`);
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
    await client.call('Log.enable');
    await client.call('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    logStep('checking clean guest/mobile first screen');
    await waitFor('initial app render', () => evaluate(client, 'Boolean(document.querySelector(".walk-btn") && document.querySelector(".game-canvas"))'));
    await evaluate(client, 'localStorage.clear(); sessionStorage.clear(); true');
    await navigateToApp(client, 'fresh production app render');
    await captureScreenshot(client, '01-guest-first-screen');

    const firstScreen = await evaluate(
      client,
      `(() => ({
        hasCanvas: Boolean(document.querySelector('.game-canvas')),
        hasWalk: Boolean(document.querySelector('.walk-btn')),
        hasJourneyHud: Boolean(document.querySelector('.hud-journey-row')),
        hasBottomControls: Boolean(document.querySelector('.bottom-controls')),
        hasDevLab: document.body.textContent.includes('Dev Lab'),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        bodyOverflows: document.documentElement.scrollWidth > window.innerWidth + 4
      }))()`
    );
    assert(firstScreen.hasCanvas, 'Game canvas did not render.');
    assert(firstScreen.hasWalk, 'Walk button did not render.');
    assert(firstScreen.hasJourneyHud, 'Journey HUD did not render.');
    assert(firstScreen.hasBottomControls, 'Bottom controls did not render.');
    assert(!firstScreen.hasDevLab, 'Dev Lab rendered in production.');
    assert(!firstScreen.bodyOverflows, `Mobile viewport has horizontal overflow at ${firstScreen.viewportWidth}x${firstScreen.viewportHeight}.`);

    logStep('checking Journey reward, local item use, and catalog purchase');
    for (let i = 0; i < 4; i += 1) {
      assert(await evaluate(client, click('.walk-btn')), 'Walk button click failed.');
      await delay(50);
    }
    assert(await evaluate(client, click('[aria-label="Quests"]')), 'Quests control did not open.');
    await waitFor('claimable milestone', () => evaluate(client, 'document.body.textContent.includes("Claim reward")'));
    assert(await evaluate(client, clickByText('button', 'Claim reward')), 'Milestone claim button did not click.');

    assert(await evaluate(client, click('[aria-label="Shop"]')), 'Shop control did not open.');
    assert(await evaluate(client, clickByText('button', 'items')), 'Items tab did not open.');
    await waitFor('starter item use button', () => evaluate(client, 'document.body.textContent.includes("Use")'));
    assert(await evaluate(client, clickByText('button', 'Use')), 'Starter item use button did not click.');
    await waitFor('local catalog buy button', () => evaluate(client, 'document.body.textContent.includes("Buy local item")'));
    assert(await evaluate(client, clickByText('button', 'Buy local item')), 'Local catalog purchase did not click.');
    await captureScreenshot(client, '02-shop-catalog');

    let save = await readSave(client);
    assert(save?.saveVersion === 8, 'Production save did not persist as version 8.');
    assert(save?.stats?.milestonesClaimed >= 1, 'Journey milestone claim did not persist.');
    assert(Object.values(save?.inventory?.items ?? {}).some((quantity) => quantity > 0), 'Inventory did not persist an item.');

    logStep('checking route encounter overlay');
    save = {
      ...save,
      ui: {
        ...save.ui,
        activeTab: 'walk',
        showShop: false
      },
      spawnedRouteEncounter: {
        id: 'route_prod_qa_split_path',
        encounterDefId: 'split_path',
        spawnedAt: Date.now(),
        expiresAt: Date.now() + 60000,
        label: 'Split Path'
      }
    };
    let injection = await client.call('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem(${JSON.stringify(saveKey)}, ${JSON.stringify(JSON.stringify(save))});`
    });
    await navigateToApp(client, 'route encounter reload');
    await client.call('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier });
    await waitFor('route encounter overlay', () => evaluate(client, 'document.body.textContent.includes("Split Path")'));
    assert(await evaluate(client, clickByText('button', 'Sprint line')), 'Route encounter choice did not click.');
    await waitFor('route encounter persisted', () =>
      evaluate(client, `(() => {
        const raw = localStorage.getItem(${JSON.stringify(saveKey)});
        if (!raw) return false;
        return JSON.parse(raw).stats?.routeEncountersClaimed >= 1;
      })()`)
    );
    await captureScreenshot(client, '03-route-encounter');

    logStep('checking production account creation and cloud upload');
    assert(await evaluate(client, click('[aria-label="Settings"]')), 'Settings control did not open.');
    await waitFor('account form', () => evaluate(client, 'Boolean(document.querySelector("input[type=email]") && document.querySelector("input[type=password]"))'));
    assert(await evaluate(client, fillInput('input[type=email]', qaEmail)), 'Email input did not fill.');
    assert(await evaluate(client, fillInput('input[type=password]', qaPassword)), 'Password input did not fill.');
    assert(await evaluate(client, clickByText('button', 'Create Account')), 'Create Account button did not click.');
    await waitFor('signed in account panel', () => evaluate(client, 'document.body.textContent.includes("Upload Local")'));
    await waitFor('enabled upload local button', () => evaluate(client, hasEnabledButton('Upload Local')));
    assert(await evaluate(client, clickByText('button', 'Upload Local')), 'Upload Local button did not click.');
    await waitFor('cloud upload message', () => evaluate(client, 'document.body.textContent.includes("Local save uploaded to cloud.")'));
    await captureScreenshot(client, '04-account-cloud-upload');

    logStep('checking WalkerBucks balance, leaderboard, marketplace, and shared inventory surfaces');
    await waitFor('enabled refresh balance button', () => evaluate(client, hasEnabledButton('Refresh balance')));
    assert(await evaluate(client, clickByText('button', 'Refresh balance')), 'Refresh balance button did not click.');
    await waitFor('WalkerBucks balance state', () =>
      evaluate(client, `(() => {
        const raw = localStorage.getItem(${JSON.stringify(saveKey)});
        if (!raw) return false;
        const state = JSON.parse(raw);
        return Boolean(state.walkerBucksBridge?.accountId && state.walkerBucksBridge?.balance);
      })()`)
    );

    assert(await evaluate(client, click('[aria-label="Stats"]')), 'Stats control did not open.');
    await waitFor('enabled refresh leaderboard button', () => evaluate(client, hasEnabledButton('Refresh leaderboard')));
    assert(await evaluate(client, clickByText('button', 'Refresh leaderboard')), 'Refresh leaderboard button did not click.');
    await waitFor('leaderboard state', () =>
      evaluate(client, `(() => {
        const raw = localStorage.getItem(${JSON.stringify(saveKey)});
        if (!raw) return false;
        const state = JSON.parse(raw);
        return Array.isArray(state.walkerBucksBridge?.leaderboard?.entries);
      })()`)
    );
    await captureScreenshot(client, '05-leaderboard');

    assert(await evaluate(client, click('[aria-label="Shop"]')), 'Shop control did not open for marketplace.');
    await waitFor('enabled refresh offers button', () => evaluate(client, hasEnabledButton('Refresh offers')));
    assert(await evaluate(client, clickByText('button', 'Refresh offers')), 'Refresh offers button did not click.');
    await waitFor('marketplace offers state', () =>
      evaluate(client, `(() => {
        const raw = localStorage.getItem(${JSON.stringify(saveKey)});
        if (!raw) return false;
        const state = JSON.parse(raw);
        return state.walkerBucksBridge?.marketplaceOffers?.length > 0;
      })()`)
    );
    await waitFor('shared inventory panel', () => evaluate(client, 'document.body.textContent.includes("Shared Inventory")'));
    await captureScreenshot(client, '06-marketplace-shared-inventory');

    logStep('checking Mars prototype save entry path');
    save = await readSave(client);
    const now = Date.now();
    const marsSave = {
      ...save,
      currentWorldId: 'mars',
      distanceMiles: 0,
      worlds: {
        ...save.worlds,
        earth: {
          ...save.worlds?.earth,
          unlockedAt: save.worlds?.earth?.unlockedAt ?? now
        },
        moon: {
          ...save.worlds?.moon,
          loopsCompleted: 1,
          unlockedAt: save.worlds?.moon?.unlockedAt ?? now
        },
        mars: {
          ...save.worlds?.mars,
          distanceMiles: 0,
          loopsCompleted: 0,
          unlockedAt: save.worlds?.mars?.unlockedAt ?? now
        }
      },
      ui: {
        ...save.ui,
        activeTab: 'walk',
        showShop: false
      }
    };
    injection = await client.call('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem(${JSON.stringify(saveKey)}, ${JSON.stringify(JSON.stringify(marsSave))});`
    });
    await navigateToApp(client, 'Mars prototype reload');
    await client.call('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier });
    await waitFor('Mars prototype labels', () => evaluate(client, 'document.body.textContent.includes("Mars") && document.body.textContent.includes("Mars Base Camp")'));
    await captureScreenshot(client, '07-mars-prototype');

    logStep('checking sign-out preserves guest/local fallback');
    assert(await evaluate(client, click('[aria-label="Settings"]')), 'Settings control did not open for sign-out.');
    await waitFor('enabled sign out button', () => evaluate(client, hasEnabledButton('Sign Out')));
    assert(await evaluate(client, clickByText('button', 'Sign Out')), 'Sign Out button did not click.');
    await waitFor('signed out account form', () => evaluate(client, 'document.body.textContent.includes("Create Account")'));
    await navigateToApp(client, 'guest fallback reload after sign-out');
    await waitFor('guest fallback walk control', () => evaluate(client, 'Boolean(document.querySelector(".walk-btn") && document.querySelector(".game-canvas"))'));
    await captureScreenshot(client, '08-guest-fallback');

    const runtimeProblems = getRuntimeProblems(client);
    assert(runtimeProblems.length === 0, `Production browser runtime errors were captured: ${JSON.stringify(runtimeProblems.slice(0, 3))}`);

    const finalSave = await readSave(client);
    const bridge = finalSave?.walkerBucksBridge ?? {};
    console.log(
      JSON.stringify(
        {
          ok: true,
          appUrl,
          qaEmail,
          saveVersion: finalSave?.saveVersion,
          accountId: bridge.accountId,
          leaderboardEntries: bridge.leaderboard?.entries?.length ?? 0,
          marketplaceOffers: bridge.marketplaceOffers?.length ?? 0,
          runtimeErrors: runtimeProblems.length,
          screenshots: artifactDir
        },
        null,
        2
      )
    );
  } finally {
    if (client) client.close();
    await stopProcess(chrome);
    await rm(tempProfile, { recursive: true, force: true });
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
