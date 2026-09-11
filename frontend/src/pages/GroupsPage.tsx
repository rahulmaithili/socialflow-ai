import React from 'react';
import { Users, CheckCircle2, AlertTriangle, Facebook } from 'lucide-react';

export default function GroupsPage() {
  const groups = [
    { id: '1', name: 'Digital Creators Hub', privacy: 'Public', members: '14.2K', apiSupported: true },
    { id: '2', name: 'AI Enthusiasts', privacy: 'Private', members: '8.5K', apiSupported: true },
    { id: '3', name: 'Local Business Network', privacy: 'Private', members: '2.1K', apiSupported: false, reason: 'Requires admin approval for API apps' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facebook Groups</h1>
          <p className="text-muted-foreground mt-1">Manage Facebook Groups where you can publish content</p>
        </div>
        <button className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1864D9] text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          <Facebook className="w-5 h-5" />
          Sync Groups
        </button>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl flex gap-3 text-sm">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>
          <strong>Note on Facebook Groups API:</strong> Meta requires the SocialFlow AI app to be explicitly added to group settings by a Group Admin before API publishing can work. For groups without API support, we provide a "Manual Publish" workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div key={group.id} className="bg-card border rounded-xl overflow-hidden hover:border-brand-300 transition-colors flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex gap-4 items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold leading-tight mb-1">{group.name}</h3>
                  <p className="text-xs text-muted-foreground">{group.privacy} Group • {group.members} members</p>
                </div>
              </div>
              
              {group.apiSupported ? (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 p-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">API Publishing Supported</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm text-yellow-600 bg-yellow-500/10 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium block">API Publishing Unavailable</span>
                    <span className="text-xs opacity-90">{group.reason}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-muted/20 border-t flex gap-2">
              <button 
                disabled={!group.apiSupported}
                className="flex-1 py-1.5 bg-background border rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule
              </button>
              {!group.apiSupported && (
                <button className="flex-1 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                  Manual Post
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
