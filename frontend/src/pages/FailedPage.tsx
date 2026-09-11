import React from 'react';
import { XCircle, RefreshCw, AlertTriangle, Edit2, Play } from 'lucide-react';

export default function FailedPage() {
  const failed = [
    { id: '1', media: 'promo.mp4', dest: 'My Main Page', time: 'Yesterday, 14:00', error: 'OAuth Exception: Session expired or invalid. Please reconnect Facebook.', attempts: 3, type: 'auth' },
    { id: '2', media: 'meme.jpg', dest: 'Gaming Group', time: 'Oct 28, 10:00', error: 'Permissions Error: You do not have permission to post to this group via API.', attempts: 1, type: 'permission' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-red-600">Failed Posts</h1>
          <p className="text-muted-foreground">Review and retry posts that failed to publish</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {failed.map(item => (
          <div key={item.id} className="bg-card border border-red-500/20 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-red-500/5 border-b border-red-500/10 flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-600 font-semibold">
                <XCircle className="w-5 h-5" />
                Publishing Failed
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Failed: {item.time} ({item.attempts} attempts)
              </span>
            </div>
            
            <div className="p-5 flex flex-col md:flex-row gap-6">
              {/* Media Preview */}
              <div className="w-full md:w-48 aspect-video bg-muted rounded-lg flex-shrink-0 border flex items-center justify-center relative">
                 {item.media.endsWith('.mp4') ? <Play className="w-8 h-8 text-muted-foreground/50" /> : null}
                 <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">{item.media}</span>
              </div>
              
              {/* Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Destination</h4>
                  <p className="font-semibold">{item.dest}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Error Message</h4>
                  <div className="bg-red-500/10 text-red-700 p-3 rounded-lg text-sm border border-red-500/20 flex gap-3 items-start">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{item.error}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Retry Now
                  </button>
                  <button className="bg-background border hover:bg-accent px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <Edit2 className="w-4 h-4" /> Edit Post
                  </button>
                  <button className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto">
                    Cancel Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
