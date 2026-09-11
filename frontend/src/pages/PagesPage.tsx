import React, { useState } from 'react';
import { Facebook, CheckCircle2, XCircle, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function PagesPage() {
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);

  // Mock data for development
  const pages = [
    { id: '1', name: 'Viral Animals', category: 'Entertainment', connected: true, permissions: ['publish_video', 'pages_manage_posts'], lastSync: '10 mins ago' },
    { id: '2', name: 'Tech News Daily', category: 'News', connected: true, permissions: ['publish_video', 'pages_manage_posts'], lastSync: '1 hour ago' },
    { id: '3', name: 'My Personal Blog', category: 'Blog', connected: false, permissions: [], lastSync: '2 days ago' },
  ];

  const handleConnect = () => {
    setConnecting(true);
    // Simulate Meta OAuth flow
    setTimeout(() => {
      setConnecting(false);
      alert('Successfully connected to Facebook API (Mock)');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facebook Pages</h1>
          <p className="text-muted-foreground mt-1">Manage your connected Meta Pages for publishing</p>
        </div>
        <button 
          onClick={handleConnect}
          disabled={connecting}
          className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1864D9] text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 shadow-sm"
        >
          {connecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Facebook className="w-5 h-5" />}
          Connect Facebook
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pages.map(page => (
          <div key={page.id} className="bg-card border rounded-xl p-5 hover:border-brand-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Facebook className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{page.name}</h3>
                  <p className="text-sm text-muted-foreground">{page.category}</p>
                </div>
              </div>
              
              {page.connected ? (
                <span className="flex items-center gap-1 bg-green-500/10 text-green-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-red-500/10 text-red-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Disconnected
                </span>
              )}
            </div>
            
            {page.connected && (
              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-brand-500" />
                  <span>Permissions: {page.permissions.length} granted</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-muted-foreground">Synced: {page.lastSync}</span>
                  <div className="flex gap-2">
                    <button className="text-xs font-medium text-brand-600 hover:underline px-2 py-1">Refresh</button>
                    <button className="text-xs font-medium text-red-600 hover:underline px-2 py-1">Disconnect</button>
                  </div>
                </div>
              </div>
            )}
            
            {!page.connected && (
              <div className="pt-4 border-t border-border/50">
                <button className="w-full py-2 bg-accent hover:bg-accent/80 text-foreground text-sm font-medium rounded-lg transition-colors">
                  Reconnect Page
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {pages.length === 0 && (
        <div className="text-center p-12 bg-card border border-dashed rounded-xl">
          <Facebook className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No Pages Connected</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">Connect your Facebook account to start scheduling and publishing content directly to your pages.</p>
          <button onClick={handleConnect} className="bg-[#1877F2] text-white px-6 py-2.5 rounded-lg font-medium">Connect Now</button>
        </div>
      )}
    </div>
  );
}
