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
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Mock data for initial dev (will be replaced by Firestore hooks in later phases)
  const stats = [
    { label: 'Total Media', value: '42', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'AI Analyses', value: '18', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Scheduled', value: '5', icon: CalendarDays, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Published Today', value: '2', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Failed Posts', value: '0', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Pages Connected', value: '3', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { label: 'Avg AI Score', value: '87/100', icon: BarChart3, color: 'text-brand-500', bg: 'bg-brand-500/10' },
  ];

  const recentActivity = [
    { id: 1, type: 'analyze', text: 'AI analyzed "dog_playing.mp4"', time: '10 mins ago', icon: Sparkles },
    { id: 2, type: 'schedule', text: 'Scheduled post for Facebook Page', time: '1 hour ago', icon: CalendarDays },
    { id: 3, type: 'upload', text: 'Uploaded 3 new media files', time: '2 hours ago', icon: Upload },
    { id: 4, type: 'publish', text: 'Successfully published to Facebook', time: '5 hours ago', icon: CheckCircle2 },
  ];

  const todaysSchedule = [
    { id: 1, time: '14:30', content: 'Here is a funny video of my dog...', dest: 'Comedy Page', status: 'Scheduled' },
    { id: 2, time: '18:00', content: 'Check out these amazing tips for...', dest: 'Tech Group', status: 'Draft' },
  ];

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.displayName}</p>
        </div>
        <button 
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Post
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              {loading ? (
                <div className="h-7 w-16 bg-muted animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold">{stat.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-card border rounded-xl flex flex-col h-[400px]">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Today's Schedule
            </h2>
            <button onClick={() => navigate('/calendar')} className="text-sm text-brand-600 hover:underline">
              View Calendar
            </button>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
                    <div className="flex-1 h-12 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            ) : todaysSchedule.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium p-3">Time</th>
                    <th className="text-left font-medium p-3">Content</th>
                    <th className="text-left font-medium p-3">Destination</th>
                    <th className="text-left font-medium p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {todaysSchedule.map(post => (
                    <tr key={post.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-medium whitespace-nowrap">{post.time}</td>
                      <td className="p-3 truncate max-w-[200px]">{post.content}</td>
                      <td className="p-3 whitespace-nowrap">{post.dest}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.status === 'Scheduled' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <CalendarDays className="w-12 h-12 mb-4 opacity-20" />
                <p>No posts scheduled for today.</p>
                <button onClick={() => navigate('/create')} className="mt-4 text-brand-600 font-medium hover:underline">
                  Schedule your first post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border rounded-xl flex flex-col h-[400px]">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              Recent Activity
            </h2>
            <button onClick={() => navigate('/history')} className="text-sm text-brand-600 hover:underline">
              View All
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
                  </div>
                </div>
              ))
            ) : (
              recentActivity.map(act => (
                <div key={act.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <act.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{act.text}</p>
                    <p className="text-xs text-muted-foreground">{act.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/media')}
            className="p-4 bg-card border rounded-xl hover:border-brand-500 transition-colors flex flex-col items-center justify-center gap-2 text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">Upload Content</span>
          </button>
          
          <button 
            onClick={() => navigate('/create')}
            className="p-4 bg-card border rounded-xl hover:border-brand-500 transition-colors flex flex-col items-center justify-center gap-2 text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center">
              <PenSquare className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">Create Post</span>
          </button>

          <button 
            onClick={() => navigate('/ai-studio')}
            className="p-4 bg-card border rounded-xl hover:border-brand-500 transition-colors flex flex-col items-center justify-center gap-2 text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">AI Analyze</span>
          </button>

          <button 
            onClick={() => navigate('/pages')}
            className="p-4 bg-card border rounded-xl hover:border-brand-500 transition-colors flex flex-col items-center justify-center gap-2 text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center">
              <Facebook className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">Connect Facebook</span>
          </button>
        </div>
      </div>
    </div>
  );
}
