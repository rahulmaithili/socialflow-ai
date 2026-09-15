import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { useAuth } from '../../contexts/AuthContext';
import { useUIStore } from '../../stores/uiStore';
import { startBackgroundPostingWorker, stopBackgroundPostingWorker } from '../../lib/backgroundPoster';
import { addFacebookAccount, subscribeFacebookAccounts, type FacebookAccount } from '../../lib/facebookService';
import { addDestination } from '../../lib/firestoreService';
import { CheckCircle2, X, Sparkles, RefreshCw, Download } from 'lucide-react';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed, theme } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);
  const location = useLocation();

  // Auto-updater state
  const [updateInfo, setUpdateInfo] = useState<{ version: string; releaseNotes?: string | string[] } | null>(null);
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  // Initialize Background Automated Posting Engine when user is active
  useEffect(() => {
    if (!user) return;
    startBackgroundPostingWorker(user.uid);
    return () => {
      stopBackgroundPostingWorker();
    };
  }, [user]);

  // Global Electron In-App Browser Capture Listeners
  useEffect(() => {
    if (!window.electronAPI || !user) return;

    const cleanupFb = window.electronAPI.onFacebookAccountCaptured?.(async (captured) => {
      try {
        const discoveredPagesCount = Array.isArray(captured.pages) ? captured.pages.length : 0;
        const accountId = await addFacebookAccount({
          userId: user.uid,
          fbUserId: captured.fbUserId,
          name: captured.name,
          email: `${captured.fbUserId}@facebook.com`,
          picture: captured.picture,
          status: 'connected',
          connectedAt: new Date().toISOString(),
          pagesCount: discoveredPagesCount > 0 ? discoveredPagesCount : 1,
          groupsCount: Array.isArray(captured.groups) ? captured.groups.length : 0,
          proxy: captured.proxy || undefined,
          type: 'facebook'
        });

        // Add main personal profile timeline destination
        await addDestination({
          userId: user.uid,
          accountId,
          accountName: captured.name,
          name: `${captured.name} (Main Timeline)`,
          pageId: captured.fbUserId,
          type: 'facebook_page',
          category: 'Personal Profile',
          status: 'active',
          followersCount: 2400
        });

        if (Array.isArray(captured.pages)) {
          for (const p of captured.pages) {
            await addDestination({
              userId: user.uid,
              accountId,
              accountName: captured.name,
              name: p.name,
              pageId: p.pageId || `fb_p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'facebook_page',
              category: p.category || 'Business Page',
              status: 'active',
              followersCount: Math.floor(Math.random() * 5000) + 1200
            });
          }
        }

        setGlobalNotice(`🎉 Facebook Account Connected: "${captured.name}" (ID: ${captured.fbUserId}) with ${discoveredPagesCount} Page(s)!`);
        setTimeout(() => setGlobalNotice(null), 8000);
      } catch (err) {
        console.error('Error auto-capturing FB account:', err);
      }
    });

    const cleanupIg = window.electronAPI.onInstagramAccountCaptured?.(async (captured) => {
      try {
        const accountId = await addFacebookAccount({
          userId: user.uid,
          fbUserId: captured.igUserId,
          name: captured.name,
          email: `${captured.username}@instagram.com`,
          picture: captured.picture,
          status: 'connected',
          connectedAt: new Date().toISOString(),
          pagesCount: 1,
          proxy: captured.proxy || undefined,
          type: 'instagram'
        });

        await addDestination({
          userId: user.uid,
          accountId,
          accountName: captured.name,
          name: `${captured.name} (Instagram Feed & Reels)`,
          pageId: captured.igUserId,
          type: 'instagram_account',
          category: 'Instagram Profile',
          status: 'active',
          followersCount: 3000
        });

        setGlobalNotice(`🎉 Instagram Account Connected: "${captured.name}"!`);
        setTimeout(() => setGlobalNotice(null), 8000);
      } catch (err) {
        console.error('Error auto-capturing IG account:', err);
      }
    });

    return () => {
      cleanupFb?.();
      cleanupIg?.();
    };
  }, [user]);

  // Global Auto-updater Listeners
  useEffect(() => {
    if (!window.electronAPI?.onUpdateAvailable) return;

    const cleanupAvail = window.electronAPI.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setUpdateDismissed(false);
    });

    const cleanupProg = window.electronAPI.onUpdateProgress?.((prog) => {
      setDownloading(true);
      setUpdateProgress(Math.round(prog.percent));
    });

    const cleanupDown = window.electronAPI.onUpdateDownloaded?.(() => {
      setDownloading(false);
      setUpdateProgress(100);
      setUpdateReady(true);
    });

    const cleanupErr = window.electronAPI.onUpdateError?.((err) => {
      console.warn('[AutoUpdater] Error:', err);
      setDownloading(false);
    });

    return () => {
      cleanupAvail?.();
      cleanupProg?.();
      cleanupDown?.();
      cleanupErr?.();
    };
  }, []);

  const handleStartDownload = async () => {
    if (window.electronAPI?.startDownloadUpdate) {
      setDownloading(true);
      await window.electronAPI.startDownloadUpdate();
    }
  };

  const handleInstallNow = () => {
    if (window.electronAPI?.installUpdateNow) {
      window.electronAPI.installUpdateNow();
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Desktop Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 w-64 h-full">
            <Sidebar collapsed={false} onCollapse={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto h-full space-y-4">
            {/* Automatic Update Alert Banner */}
            {updateInfo && !updateDismissed && (
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">⚡ New Version Available: v{updateInfo.version}</span>
                      <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-mono uppercase font-semibold">Update</span>
                    </div>
                    <p className="text-xs text-blue-100 mt-0.5">
                      {updateReady
                        ? '🎉 Update downloaded and ready to install! Restart now to apply new features.'
                        : downloading
                        ? `Downloading update in background: ${updateProgress || 0}% completed...`
                        : 'A new official update of SocialFlow AI Studio is available on GitHub!'}
                    </p>
                    {downloading && (
                      <div className="w-full md:w-64 bg-white/20 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div 
                          className="bg-yellow-400 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${updateProgress || 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  {updateReady ? (
                    <button
                      onClick={handleInstallNow}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Restart & Update Now
                    </button>
                  ) : downloading ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-white/20 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 opacity-90 cursor-not-allowed"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Downloading ({updateProgress || 0}%)
                    </button>
                  ) : (
                    <button
                      onClick={handleStartDownload}
                      className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Update
                    </button>
                  )}

                  <button
                    onClick={() => setUpdateDismissed(true)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/80 hover:text-white"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {globalNotice && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{globalNotice}</span>
                </div>
                <button 
                  onClick={() => setGlobalNotice(null)}
                  className="p-1 hover:bg-emerald-500/20 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <Outlet />
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
