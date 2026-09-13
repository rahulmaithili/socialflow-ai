import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUIStore } from '../stores/uiStore';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useUIStore();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Settings Nav */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r bg-muted/20 p-4 space-y-1">
            <button className="w-full text-left px-3 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg">General</button>
            <button className="w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg">Notifications</button>
            <button className="w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg">Integrations</button>
            <button className="w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg">Billing</button>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Profile</h3>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-xl font-bold border-2 border-brand-500">
                  {user?.displayName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <button className="text-sm font-medium bg-background border px-3 py-1.5 rounded-md hover:bg-accent transition-colors">Change Avatar</button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input type="text" defaultValue={user?.displayName || ''} className="w-full p-2 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <input type="email" defaultValue={user?.email || ''} disabled className="w-full p-2 bg-muted/50 border rounded-lg cursor-not-allowed opacity-70" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Preferences</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  <select 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="w-full p-2 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timezone</label>
                  <select className="w-full p-2 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                    <option>Asia/Kolkata</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
