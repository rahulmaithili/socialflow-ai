const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow = null;
const activeFbWindows = new Map(); // sessionId -> BrowserWindow

// Standard desktop Chrome User Agent to avoid Facebook blocking embedded logins
const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function createMainWindow() {
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

  const urls = [
    process.env.VITE_DEV_SERVER_URL,
    'http://localhost:5174',
    'http://localhost:5173'
  ].filter(Boolean);

  let loaded = false;
  for (const u of urls) {
    try {
      await mainWindow.loadURL(u);
      loaded = true;
      break;
    } catch (e) {
      // try next url
    }
  }

  if (!loaded) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {});
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
