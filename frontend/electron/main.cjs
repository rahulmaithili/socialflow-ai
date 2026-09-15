const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;
const activeFbWindows = new Map(); // sessionId -> BrowserWindow

function getAppIcon() {
  const iconIco = path.join(__dirname, 'icon.ico');
  const iconPng = path.join(__dirname, 'icon.png');
  const publicIco = path.join(__dirname, '../public/icon.ico');
  const publicPng = path.join(__dirname, '../public/logo-icon.png');

  if (fs.existsSync(iconIco)) return iconIco;
  if (fs.existsSync(publicIco)) return publicIco;
  if (fs.existsSync(iconPng)) return iconPng;
  if (fs.existsSync(publicPng)) return publicPng;
  return undefined;
}

// Standard desktop Chrome User Agent to avoid Facebook blocking embedded logins
const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Rahul Scripts - SocialFlow AI Content Studio',
    icon: getAppIcon(),
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Enable F12 DevTools in dev mode
  if (!app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if ((input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) && input.type === 'keyDown') {
        mainWindow.webContents.toggleDevTools();
      }
    });
  }

  const distHtml = path.join(__dirname, '../dist/index.html');

  if (app.isPackaged) {
    // In compiled .exe installer, always load dist/index.html directly
    mainWindow.loadFile(distHtml).catch(err => {
      console.error('[Electron] Error loading dist/index.html in packaged app:', err);
    });
  } else {
    // In dev mode, attempt to load Vite server with retries, then fallback to dist/index.html
    let attempts = 0;
    const maxAttempts = 10;
    const targetUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

    const tryLoadDevServer = async () => {
      attempts++;
      try {
        await mainWindow.loadURL(targetUrl);
      } catch (err) {
        if (attempts < maxAttempts) {
          setTimeout(tryLoadDevServer, 1000);
        } else {
          // Fallback to built dist/index.html
          if (fs.existsSync(distHtml)) {
            mainWindow.loadFile(distHtml).catch(() => {});
          }
        }
      }
    };

    tryLoadDevServer();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    activeFbWindows.forEach(win => {
      if (!win.isDestroyed()) win.close();
    });
    activeFbWindows.clear();
  });
}

const activeIgWindows = new Map(); // sessionId -> BrowserWindow

/**
 * Open an isolated in-app Facebook browser window for a specific session ID
 */
function openFacebookBrowser(options = {}) {
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const accountName = options.accountName || 'New Facebook Account';

  if (activeFbWindows.has(sessionId)) {
    const existing = activeFbWindows.get(sessionId);
    if (!existing.isDestroyed()) {
      existing.focus();
      return { success: true, sessionId, status: 'focused' };
    }
  }

  // Create isolated partition session so multiple accounts don't overwrite each other's cookies
  const partitionName = `persist:fb_${sessionId}`;
  const fbSession = session.fromPartition(partitionName, { cache: true });

  if (options.proxy && options.proxy.trim()) {
    fbSession.setProxy({ proxyRules: options.proxy.trim() }).catch(err => {
      console.warn('Failed to set proxy for FB session:', err);
    });
  }

  const fbWin = new BrowserWindow({
    width: 1080,
    height: 780,
    title: `SocialFlow Vault — [Facebook: ${accountName}]`,
    icon: getAppIcon(),
    parent: mainWindow || undefined,
    modal: false,
    webPreferences: {
      partition: partitionName,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  fbWin.webContents.setUserAgent(CHROME_USER_AGENT);
  activeFbWindows.set(sessionId, fbWin);

  fbWin.loadURL('https://www.facebook.com');

  // Monitor cookies for successful Facebook login
  let accountCaptured = false;

  const checkLoginCookies = async () => {
    if (accountCaptured) return;
    try {
      const cookies = await fbSession.cookies.get({ domain: '.facebook.com' });
      const cUserCookie = cookies.find(c => c.name === 'c_user');
      const xsCookie = cookies.find(c => c.name === 'xs');

      if (cUserCookie && xsCookie && cUserCookie.value) {
        accountCaptured = true;
        const fbUserId = cUserCookie.value;

        // Try to fetch profile display name, managed pages, and groups from DOM
        let extractedName = accountName;
        let discoveredPages = [];
        let discoveredGroups = [];

        try {
          const domData = await fbWin.webContents.executeJavaScript(`
            (() => {
              let name = '';
              const navAvatar = document.querySelector('div[role="navigation"] svg[aria-label="Your profile"]');
              if (navAvatar && navAvatar.getAttribute('aria-label')) name = navAvatar.getAttribute('aria-label');

              if (!name) {
                const title = document.title || '';
                if (title && !title.toLowerCase().includes('log in') && !title.toLowerCase().includes('facebook')) {
                  name = title.replace(/\\s*\\|\\s*Facebook.*/i, '').trim();
                }
              }

              if (!name) {
                const profileLink = document.querySelector('a[href*="/me/"] span, a[href*="/profile.php"] span');
                if (profileLink && profileLink.textContent) name = profileLink.textContent.trim();
              }

              // Extract Facebook Pages
              const pages = [];
              const pageAnchors = document.querySelectorAll('a[href*="/pages/"], a[href*="/latest/home"]');
              pageAnchors.forEach(a => {
                const txt = a.innerText?.trim();
                if (txt && txt.length > 2 && !txt.includes('Pages') && !txt.includes('See all') && !txt.includes('Create') && !pages.some(p => p.name === txt)) {
                  pages.push({
                    name: txt,
                    pageId: 'fb_' + Math.abs(txt.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0)),
                    category: 'Facebook Page'
                  });
                }
              });

              // Extract Facebook Groups
              const groups = [];
              const groupAnchors = document.querySelectorAll('a[href*="/groups/"]');
              groupAnchors.forEach(a => {
                const txt = a.innerText?.trim();
                const href = a.getAttribute('href') || '';
                const match = href.match(/\\/groups\\/([0-9a-zA-Z._-]+)/);
                if (match && txt && !['feed', 'discover', 'joins', 'notifications', 'categories'].includes(match[1]) && txt.length > 2 && !groups.some(g => g.name === txt)) {
                  groups.push({
                    name: txt,
                    groupId: match[1],
                    category: 'Facebook Group'
                  });
                }
              });

              return { name, pages, groups };
            })()
          `);

          if (domData?.name && domData.name.trim()) extractedName = domData.name.trim();
          if (Array.isArray(domData?.pages)) discoveredPages = domData.pages;
          if (Array.isArray(domData?.groups)) discoveredGroups = domData.groups;
        } catch (e) {
          // ignore DOM inspection errors
        }

        const payload = {
          fbUserId,
          sessionId,
          name: extractedName !== 'New Facebook Account' && extractedName ? extractedName : `Facebook Profile (${fbUserId})`,
          picture: `https://graph.facebook.com/${fbUserId}/picture?type=large`,
          pages: discoveredPages,
          groups: discoveredGroups,
          proxy: options.proxy || undefined,
          connectedAt: new Date().toISOString()
        };

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('fb-account-captured', payload);
        }
      }
    } catch (err) {
      console.warn('Error reading FB cookies:', err);
    }
  };

  // Listen to cookie changes in this session
  fbSession.cookies.on('changed', (_event, cookie, _cause, removed) => {
    if (!removed && cookie.name === 'c_user') {
      setTimeout(checkLoginCookies, 1000);
    }
  });

  fbWin.webContents.on('did-finish-load', () => {
    setTimeout(checkLoginCookies, 1500);
  });

  fbWin.on('closed', () => {
    activeFbWindows.delete(sessionId);
  });

  return { success: true, sessionId, status: 'opened' };
}

/**
 * Open an isolated in-app Instagram browser window
 */
function openInstagramBrowser(options = {}) {
  const sessionId = options.sessionId || `ig_sess_${Date.now()}`;
  const accountName = options.accountName || 'New Instagram Account';

  if (activeIgWindows.has(sessionId)) {
    const existing = activeIgWindows.get(sessionId);
    if (!existing.isDestroyed()) {
      existing.focus();
      return { success: true, sessionId, status: 'focused' };
    }
  }

  const partitionName = `persist:ig_${sessionId}`;
  const igSession = session.fromPartition(partitionName, { cache: true });

  if (options.proxy && options.proxy.trim()) {
    igSession.setProxy({ proxyRules: options.proxy.trim() }).catch(err => {
      console.warn('Failed to set proxy for Instagram session:', err);
    });
  }

  const igWin = new BrowserWindow({
    width: 1050,
    height: 780,
    title: `SocialFlow Vault — [Instagram: ${accountName}]`,
    icon: getAppIcon(),
    parent: mainWindow || undefined,
    modal: false,
    webPreferences: {
      partition: partitionName,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  igWin.webContents.setUserAgent(CHROME_USER_AGENT);
  activeIgWindows.set(sessionId, igWin);

  igWin.loadURL('https://www.instagram.com');

  let accountCaptured = false;

  const checkInstagramCookies = async () => {
    if (accountCaptured) return;
    try {
      const cookies = await igSession.cookies.get({ domain: '.instagram.com' });
      const dsUserCookie = cookies.find(c => c.name === 'ds_user_id');
      const sessionCookie = cookies.find(c => c.name === 'sessionid');

      if (dsUserCookie && sessionCookie && dsUserCookie.value) {
        accountCaptured = true;
        const igUserId = dsUserCookie.value;

        let extractedUsername = accountName;
        try {
          const domData = await igWin.webContents.executeJavaScript(`
            (() => {
              let uname = '';
              const metaEl = document.querySelector('meta[property="og:title"]');
              if (metaEl && metaEl.content) {
                const match = metaEl.content.match(/\\(@([^)]+)\\)/);
                if (match) uname = match[1];
              }
              if (!uname) {
                const profileImg = document.querySelector('header img[alt*="profile picture"]');
                if (profileImg && profileImg.alt) {
                  uname = profileImg.alt.replace("'s profile picture", '').trim();
                }
              }
              return uname;
            })()
          `);
          if (domData && domData.trim()) extractedUsername = domData.trim();
        } catch (e) {
          // ignore
        }

        const payload = {
          igUserId,
          sessionId,
          username: extractedUsername !== 'New Instagram Account' ? extractedUsername : `ig_user_${igUserId}`,
          name: `@${extractedUsername}`,
          picture: `https://instagram.com/${extractedUsername}/media/?size=l`,
          proxy: options.proxy || undefined,
          connectedAt: new Date().toISOString()
        };

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ig-account-captured', payload);
        }
      }
    } catch (err) {
      console.warn('Error reading Instagram cookies:', err);
    }
  };

  igSession.cookies.on('changed', (_event, cookie, _cause, removed) => {
    if (!removed && (cookie.name === 'ds_user_id' || cookie.name === 'sessionid')) {
      setTimeout(checkInstagramCookies, 1000);
    }
  });

  igWin.webContents.on('did-finish-load', () => {
    setTimeout(checkInstagramCookies, 1500);
  });

  igWin.on('closed', () => {
    activeIgWindows.delete(sessionId);
  });

  return { success: true, sessionId, status: 'opened' };
}

// ----------------------------------------------------------------------
// IPC HANDLERS
// ----------------------------------------------------------------------

ipcMain.handle('open-fb-browser', (_event, options) => {
  return openFacebookBrowser(options);
});

ipcMain.handle('open-ig-browser', (_event, options) => {
  return openInstagramBrowser(options);
});

ipcMain.handle('open-account-session', (_event, options) => {
  if (options.type === 'instagram') {
    return openInstagramBrowser(options);
  }
  return openFacebookBrowser(options);
});

ipcMain.handle('close-fb-browser', (_event, sessionId) => {
  if (sessionId && activeFbWindows.has(sessionId)) {
    const win = activeFbWindows.get(sessionId);
    if (!win.isDestroyed()) win.close();
    activeFbWindows.delete(sessionId);
    return true;
  }
  return false;
});

ipcMain.handle('close-ig-browser', (_event, sessionId) => {
  if (sessionId && activeIgWindows.has(sessionId)) {
    const win = activeIgWindows.get(sessionId);
    if (!win.isDestroyed()) win.close();
    activeIgWindows.delete(sessionId);
    return true;
  }
  return false;
});

ipcMain.handle('get-active-sessions', () => {
  return {
    facebook: Array.from(activeFbWindows.keys()),
    instagram: Array.from(activeIgWindows.keys())
  };
});

// ----------------------------------------------------------------------
// AUTO UPDATER (GitHub Releases & electron-updater)
// ----------------------------------------------------------------------

autoUpdater.autoDownload = false; // Controlled download via user action or prompt
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('checking-for-update', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-checking');
  }
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes || 'Bug fixes and performance improvements.',
      releaseName: info.releaseName || `Release v${info.version}`
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-not-available', {
      version: info.version
    });
  }
});

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-progress', {
      bytesPerSecond: progress.bytesPerSecond,
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version
    });
  }
});

autoUpdater.on('error', (err) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-error', err ? err.message : 'Unknown update error');
  }
});

ipcMain.handle('check-for-updates', async () => {
  try {
    if (!app.isPackaged) {
      return { status: 'dev_mode', message: 'Running in development mode' };
    }
    const result = await autoUpdater.checkForUpdates();
    return { status: 'success', updateInfo: result?.updateInfo };
  } catch (err) {
    return { status: 'error', message: err ? err.message : 'Check update error' };
  }
});

ipcMain.handle('start-download-update', async () => {
  try {
    if (!app.isPackaged) {
      return { status: 'dev_mode', message: 'Simulation mode in development' };
    }
    await autoUpdater.downloadUpdate();
    return { status: 'downloading' };
  } catch (err) {
    return { status: 'error', message: err ? err.message : 'Download error' };
  }
});

ipcMain.handle('install-update-now', () => {
  try {
    autoUpdater.quitAndInstall(false, true);
  } catch (err) {
    console.error('Error quitting and installing update:', err);
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-machine-id', () => {
  try {
    const net = os.networkInterfaces();
    let macAddress = '';
    for (const name of Object.keys(net)) {
      for (const item of net[name] || []) {
        if (!item.internal && item.mac && item.mac !== '00:00:00:00:00:00') {
          macAddress = item.mac;
          break;
        }
      }
      if (macAddress) break;
    }
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'CPU';
    const hostname = os.hostname();
    const raw = `${macAddress}-${cpuModel}-${hostname}-${os.platform()}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16).toUpperCase();
    return `SF-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
  } catch (e) {
    return 'SF-DEFAULT-NODE-HWID';
  }
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  // Automatically check for updates 4 seconds after launch in production .exe
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('[AutoUpdater] Startup check notice:', err?.message);
      });
    }, 4000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
