import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PenSquare, Image as ImageIcon, ListTodo, Settings } from 'lucide-react';

export default function MobileNav() {
  const navItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Create', path: '/create', icon: PenSquare },
    { name: 'Media', path: '/media', icon: ImageIcon },
    { name: 'Queue', path: '/queue', icon: ListTodo },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-2 z-30 pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive 
                ? 'text-brand-600' 
                : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
}
