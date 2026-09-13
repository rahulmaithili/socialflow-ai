import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  CalendarDays, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Send, 
  ListTodo,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeJobsByStatus, 
  publishJobNow, 
  deletePublishJob, 
  type PublishJobData 
} from '../lib/firestoreService';

export default function QueuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'draft'>('scheduled');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<PublishJobData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeJobsByStatus(user.uid, 'all', (items) => {
      // Filter for queued/scheduled/draft only
      const queueItems = items.filter(i => i.status === 'scheduled' || i.status === 'draft');
      setJobs(queueItems);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handlePublishNow = async (item: PublishJobData) => {
    if (!item.id || !user) return;
    if (window.confirm(`Publish this post immediately to ${item.destinationName}?`)) {
      try {
        await publishJobNow(item.id, user.uid, item.destinationName);
        alert('Post published successfully!');
      } catch (err: any) {
        alert('Failed to publish: ' + err.message);
      }
    }
  };

  const handleDelete = async (item: PublishJobData) => {
    if (!item.id) return;
    if (window.confirm('Delete this post from the queue?')) {
      try {
        await deletePublishJob(item.id);
      } catch (err: any) {
        alert('Failed to delete: ' + err.message);
      }
    }
  };

  const filteredQueue = jobs.filter(q => {
    const matchesSearch = q.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.destinationName.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && q.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Publishing Queue</h1>
          <p className="text-muted-foreground">Manage your scheduled and drafted posts</p>
        </div>
        <button 
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Create New Post
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="flex gap-2 bg-background p-1 rounded-lg border w-full sm:w-auto">
            {(['all', 'scheduled', 'draft'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize flex-1 sm:flex-none transition-colors ${
                  activeTab === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search queue..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="p-4 font-medium">Post Content</th>
                <th className="p-4 font-medium">Destination</th>
                <th className="p-4 font-medium">Scheduled Time</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {loading && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading queue...
                  </td>
                </tr>
              )}

              {!loading && filteredQueue.map(item => (
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
                        <p className="font-medium text-foreground truncate">{item.caption}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.hashtags?.join(' ') || item.mediaName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{item.destinationName}</td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarDays className="w-3.5 h-3.5 text-brand-500" />
                      {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'Not scheduled'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 w-fit ${
                      item.status === 'scheduled' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                      'bg-gray-500/10 text-gray-600 border border-gray-500/20'
                    }`}>
                      {item.status === 'scheduled' ? <Clock className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                      <span className="capitalize">{item.status}</span>
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => handlePublishNow(item)}
                        className="text-brand-600 hover:bg-brand-50 px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 border border-brand-200"
                        title="Publish Immediately"
                      >
                        <Send className="w-3 h-3" /> Publish Now
                      </button>
                      <button 
                        onClick={() => handleDelete(item)}
                        className="text-muted-foreground hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        title="Delete from Queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {!loading && filteredQueue.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <ListTodo className="w-10 h-10 mx-auto mb-2 opacity-30 text-brand-600" />
                    <p className="font-medium text-foreground">No posts found in this queue</p>
                    <p className="text-xs text-muted-foreground mt-1">Create a post and choose "Schedule" or "Save Draft" to add it here.</p>
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
