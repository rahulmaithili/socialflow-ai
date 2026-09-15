import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  PenSquare,
  Image as ImageIcon,
  Sparkles,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  XCircle,
  Facebook,
  Users,
  Megaphone,
  TrendingUp,
  BarChart3,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bot
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const { user, logOut } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Create Post', path: '/create', icon: PenSquare },
    { name: 'Media Library', path: '/media', icon: ImageIcon },
    { name: 'AI Studio', path: '/ai-studio', icon: Sparkles },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Queue', path: '/queue', icon: ListTodo },
    { name: 'Published', path: '/published', icon: CheckCircle2 },
    { name: 'Failed', path: '/failed', icon: XCircle },
    { name: 'Pages', path: '/pages', icon: Facebook },
    { name: 'Groups', path: '/groups', icon: Users },
    { name: 'Auto-DM Bot', path: '/auto-dm', icon: Bot },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
    { name: 'Trends', path: '/trends', icon: TrendingUp },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className={`flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} border-r border-sidebar-border hidden md:flex z-10`}>
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-sidebar-border shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <img src="/logo-header.png" alt="Rahul Scripts" className="h-8 max-w-[170px] object-contain" />
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <img src="/logo-icon.png" alt="RS" className="w-8 h-8 object-contain rounded-lg shadow-xs" />
          </div>
        )}
        <button
          onClick={onCollapse}
          className="p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors ml-1"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </div>

      {/* Footer / User / Toggle */}
      <div className="p-4 border-t border-sidebar-border space-y-3 shrink-0">
        <button
          onClick={onCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} pt-2`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'hidden' : 'flex'}`}>
            <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-medium">
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.displayName || 'User'}</span>
              <span className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={logOut}
            className={`p-2 rounded-lg text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors ${collapsed ? 'w-full flex justify-center' : ''}`}
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
