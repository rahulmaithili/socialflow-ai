import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Plus, Sun, Moon, User as UserIcon, Settings, LogOut, Facebook } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUIStore } from '../../stores/uiStore';
import { subscribeFacebookAccounts, type FacebookAccount } from '../../lib/facebookService';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const { theme, setTheme } = useUIStore();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [accounts, setAccounts] = React.useState<FacebookAccount[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const unsub = subscribeFacebookAccounts(user.uid, (list) => {
      setAccounts(list);
    });
    return () => unsub();
  }, [user]);

  const primaryAccount = accounts[0];

  const getPageTitle = (pathname: string) => {
    const path = pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-accent text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src="/logo-icon.png" alt="RS" className="w-7 h-7 md:hidden rounded-lg" />
        <h1 className="text-lg font-semibold tracking-tight">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => navigate('/create')}
          className="hidden md:flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </button>

        {primaryAccount ? (
          <div 
            onClick={() => navigate('/pages')}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            title={`Connected Facebook ID: ${primaryAccount.fbUserId}\nName: ${primaryAccount.name}`}
          >
            {primaryAccount.pictureUrl ? (
              <img src={primaryAccount.pictureUrl} alt={primaryAccount.name} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <Facebook className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
            )}
            <span className="font-medium max-w-[110px] truncate">{primaryAccount.name}</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded font-mono text-blue-800 dark:text-blue-200">
              ID: {primaryAccount.fbUserId.length > 8 ? `...${primaryAccount.fbUserId.slice(-5)}` : primaryAccount.fbUserId}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active"></span>
          </div>
        ) : (
          <button
            onClick={() => navigate('/pages')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            <Facebook className="w-3.5 h-3.5 text-amber-600" />
            <span>Connect FB ID</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-accent text-muted-foreground"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="p-2 rounded-full hover:bg-accent text-muted-foreground relative hidden md:block">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-card"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-medium hover:ring-2 hover:ring-brand-500 hover:ring-offset-2 transition-all"
          >
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </button>

          {showProfileMenu && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border py-1 z-40">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium truncate">{user?.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={() => { logOut(); setShowProfileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
