import React, { useState, useEffect } from 'react';
import { CheckCircle2, ExternalLink, Copy, Search, Filter, Plus, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscribeJobsByStatus, type PublishJobData } from '../lib/firestoreService';

export default function PublishedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [published, setPublished] = useState<PublishJobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeJobsByStatus(user.uid, 'published', (items) => {
      setPublished(items);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredPosts = published.filter(item => 
    item.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.destinationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Published History</h1>
          <p className="text-muted-foreground">Successfully published posts across your destinations</p>
        </div>
        <button 
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Create New Post
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b flex gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search published posts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="p-4 font-medium">Post Content</th>
                <th className="p-4 font-medium">Destination</th>
                <th className="p-4 font-medium">Published Time</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {loading && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading published posts...
                  </td>
                </tr>
              )}

              {!loading && filteredPosts.map(item => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3 max-w-[320px]">
                      <div className="w-11 h-11 rounded-lg bg-muted shrink-0 border overflow-hidden flex items-center justify-center">
                        {item.mediaUrl ? (
                          <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold">TEXT</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-foreground">{item.caption}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.hashtags?.join(' ') || item.mediaName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{item.destinationName}</td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-green-600" />
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Recently'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 w-fit bg-green-500/10 text-green-600 border border-green-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Published
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/create?prompt=${encodeURIComponent(item.caption)}`)}
                        className="text-brand-600 hover:bg-brand-50 p-1.5 rounded-md text-xs font-medium transition-colors" 
                        title="Duplicate Post"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-green-600" />
                    <p className="font-medium text-foreground">No published posts yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Posts you publish directly or from the queue will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
