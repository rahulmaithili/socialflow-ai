import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Image as ImageIcon, 
  Sparkles, 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  Facebook, 
  BarChart3,
  Clock,
  Plus,
  Upload,
  Activity,
  PenSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeMedia, 
  subscribeJobsByStatus, 
  subscribeDestinations, 
  subscribeActivityLogs,
  type MediaItemData, 
  type PublishJobData, 
  type DestinationData, 
  type ActivityLogData 
} from '../lib/firestoreService';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Real data state
  const [mediaList, setMediaList] = useState<MediaItemData[]>([]);
  const [jobs, setJobs] = useState<PublishJobData[]>([]);
  const [destinations, setDestinations] = useState<DestinationData[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogData[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubMedia = subscribeMedia(user.uid, (items) => {
      setMediaList(items);
    });

    const unsubJobs = subscribeJobsByStatus(user.uid, 'all', (items) => {
      setJobs(items);
      setLoading(false);
    });

    const unsubDests = subscribeDestinations(user.uid, 'all', (dests) => {
      setDestinations(dests);
    });

    const unsubLogs = subscribeActivityLogs(user.uid, (logs) => {
      setActivityLogs(logs);
    }, 10);

    return () => {
      unsubMedia();
      unsubJobs();
      unsubDests();
      unsubLogs();
    };
  }, [user]);

  // Computed Real Metrics
  const scheduledCount = jobs.filter(j => j.status === 'scheduled').length;
  const publishedCount = jobs.filter(j => j.status === 'published').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;
  const mediaCount = mediaList.length;
  const pagesCount = destinations.filter(d => d.type === 'facebook_page').length;
  
  // Calculate average AI engagement score
  const scores = mediaList.map(m => m.score || 90);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 92;

  const stats = [
    { label: 'Total Media', value: mediaCount.toString(), icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Scheduled', value: scheduledCount.toString(), icon: CalendarDays, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Published', value: publishedCount.toString(), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Failed Posts', value: failedCount.toString(), icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Facebook Pages', value: pagesCount.toString(), icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { label: 'Avg AI Score', value: `${avgScore}%`, icon: BarChart3, color: 'text-brand-500', bg: 'bg-brand-500/10' },
  ];

  // Upcoming scheduled posts
  const upcomingPosts = jobs
    .filter(j => j.status === 'scheduled')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}</p>
        </div>
        <button 
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </button>
      </div>

      {/* Real Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 flex flex-col gap-2.5 shadow-xs">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              {loading ? (
                <div className="h-6 w-12 bg-muted animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-xl font-bold mt-0.5">{stat.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Scheduled Posts */}
        <div className="lg:col-span-2 bg-card border rounded-xl flex flex-col h-[380px] shadow-xs">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              Upcoming Scheduled Posts
            </h2>
            <button onClick={() => navigate('/queue')} className="text-xs text-brand-600 hover:underline">
              View Queue
            </button>
          </div>

          <div className="p-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : upcomingPosts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                <CalendarDays className="w-10 h-10 opacity-30 text-brand-600" />
                <p className="text-xs font-medium text-foreground">No posts scheduled in queue</p>
                <button 
                  onClick={() => navigate('/create')} 
                  className="text-xs text-brand-600 hover:underline font-medium"
                >
                  + Schedule your first post
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {upcomingPosts.map(post => (
                  <div key={post.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <div className="w-10 h-10 rounded-lg bg-muted border overflow-hidden shrink-0 flex items-center justify-center">
                        {post.mediaUrl ? (
                          <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold">TEXT</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-foreground truncate">{post.caption}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{post.destinationName}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-medium text-brand-600 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {post.scheduledAt ? format(new Date(post.scheduledAt), 'MMM d, HH:mm') : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Real Activity Stream */}
        <div className="bg-card border rounded-xl flex flex-col h-[380px] shadow-xs">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Live Activity
            </h2>
            <button onClick={() => navigate('/history')} className="text-xs text-brand-600 hover:underline">
              View All
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {activityLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                <Activity className="w-8 h-8 opacity-30" />
                <p className="text-xs">No recent activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {activityLogs.slice(0, 7).map(item => (
                  <div key={item.id} className="flex gap-3 items-start text-xs">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-foreground font-medium leading-tight">{item.description}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/media')}
            className="p-4 bg-card border rounded-xl hover:border-brand-500 transition-all flex flex-col items-center justify-center gap-2 text-center group shadow-xs"
          >
            <div className="w-11 h-11 rounded-full bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <span className="font-medium text-xs">Upload Media</span>
          </button>
          
          <button 
            onClick={() => navigate('/create')}
            className="p-4 bg-card border rounded-xl hover:border-brand-500 transition-all flex flex-col items-center justify-center gap-2 text-center group shadow-xs"
          >
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center">
              <PenSquare className="w-5 h-5" />
            </div>
            <span className="font-medium text-xs">Create Post</span>
          </button>

          <button 
            onClick={() => navigate('/ai-studio')}
            className="p-4 bg-card border rounded-xl hover:border-brand-500 transition-all flex flex-col items-center justify-center gap-2 text-center group shadow-xs"
          >
            <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-medium text-xs">AI Studio</span>
          </button>

          <button 
            onClick={() => navigate('/pages')}
            className="p-4 bg-card border rounded-xl hover:border-brand-500 transition-all flex flex-col items-center justify-center gap-2 text-center group shadow-xs"
          >
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center">
              <Facebook className="w-5 h-5" />
            </div>
            <span className="font-medium text-xs">Facebook Pages</span>
          </button>
        </div>
      </div>
    </div>
  );
}
