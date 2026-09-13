const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow = null;
const activeFbWindows = new Map(); // sessionId -> BrowserWindow

// Standard desktop Chrome User Agent to avoid Facebook blocking embedded logins
const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Rahul Scripts - SocialFlow AI Content Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  const devUrl = 'http://localhost:5173';
  mainWindow.loadURL(devUrl).catch(() => {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    activeFbWindows.forEach(win => {
      if (!win.isDestroyed()) win.close();
    });
    activeFbWindows.clear();
  });
}

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

  const fbWin = new BrowserWindow({
    width: 1050,
    height: 760,
    title: `SocialFlow In-App Browser — [${accountName}]`,
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

        // Try to fetch profile display name from the page DOM
        let extractedName = accountName;
        try {
          const domName = await fbWin.webContents.executeJavaScript(`
            (() => {
              const el = document.querySelector('div[role="navigation"] svg[aria-label="Your profile"]') || 
                         document.querySelector('div[role="banner"] span dir') ||
                         document.querySelector('h1');
              return el ? (el.textContent || el.getAttribute('aria-label')) : null;
            })()
          `);
          if (domName && domName.trim()) extractedName = domName.trim();
        } catch (e) {
          // ignore DOM inspection errors
        }

        const payload = {
          fbUserId,
          sessionId,
          name: extractedName !== 'New Facebook Account' ? extractedName : `Facebook Profile (${fbUserId})`,
          picture: `https://graph.facebook.com/${fbUserId}/picture?type=large`,
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

  // Also check when pages finish loading
  fbWin.webContents.on('did-finish-load', () => {
    setTimeout(checkLoginCookies, 1500);
  });

  fbWin.on('closed', () => {
    activeFbWindows.delete(sessionId);
  });

  return { success: true, sessionId, status: 'opened' };
}

// ----------------------------------------------------------------------
// IPC HANDLERS
// ----------------------------------------------------------------------

ipcMain.handle('open-fb-browser', (_event, options) => {
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

ipcMain.handle('get-active-sessions', () => {
  return Array.from(activeFbWindows.keys());
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
