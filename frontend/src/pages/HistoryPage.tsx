import React, { useState, useEffect } from 'react';
import { History, CalendarDays, CheckCircle2, Sparkles, Upload, AlertCircle, BookmarkCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeActivityLogs, type ActivityLogData } from '../lib/firestoreService';

export default function HistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLogData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeActivityLogs(user.uid, (items) => {
      setLogs(items);
      setLoading(false);
    }, 50);
    return () => unsub();
  }, [user]);

  const getIconInfo = (type: ActivityLogData['type']) => {
    switch (type) {
      case 'post_published':
        return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'post_scheduled':
        return { icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'media_uploaded':
        return { icon: Upload, color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'page_connected':
        return { icon: BookmarkCheck, color: 'text-blue-600', bg: 'bg-blue-600/10' };
      case 'post_failed':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
      default:
        return { icon: Sparkles, color: 'text-brand-500', bg: 'bg-brand-500/10' };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Audit Log</h1>
          <p className="text-muted-foreground text-sm">Real-time chronological timeline of actions performed in SocialFlow AI</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-xs">
        {loading && (
          <div className="p-12 text-center text-muted-foreground">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading activity log...
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="text-center p-12 text-muted-foreground space-y-2">
            <History className="w-10 h-10 opacity-30 mx-auto" />
            <p className="font-medium text-foreground text-sm">No activity recorded yet</p>
            <p className="text-xs">When you upload media, create posts, or schedule content, events will appear here.</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:h-full before:w-0.5 before:bg-border">
            {logs.map((log) => {
              const info = getIconInfo(log.type);
              const Icon = info.icon;
              return (
                <div key={log.id} className="relative flex items-start gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-card ${info.bg} shrink-0 shadow-xs z-10`}>
                    <Icon className={`w-4 h-4 ${info.color}`} />
                  </div>
                  <div className="flex-1 p-3.5 rounded-xl border bg-background/50 hover:bg-muted/30 transition-colors text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground capitalize">
                        {log.type.replace('_', ' ')}
                      </h4>
                      <time className="text-[11px] text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{log.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
