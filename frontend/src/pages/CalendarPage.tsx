import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscribeJobsByStatus, type PublishJobData } from '../lib/firestoreService';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState<PublishJobData[]>([]);
  const [loading, setLoading] = useState(true);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeJobsByStatus(user.uid, 'all', (items) => {
      setJobs(items);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  // Helper to find posts for a specific date
  const getPostsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return jobs.filter(j => {
      const targetTime = j.scheduledAt || j.publishedAt || j.createdAt;
      if (!targetTime) return false;
      const jDateStr = format(new Date(targetTime), 'yyyy-MM-dd');
      return jDateStr === dateStr;
    });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground text-sm">Manage and visualize your scheduled & published posts</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/create')} 
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Schedule Post
          </button>
        </div>
      </div>

      <div className="bg-card border rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm">
        {/* Calendar Toolbar */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-1 bg-background border rounded-lg p-1">
              <button onClick={prevWeek} className="p-1 hover:bg-accent rounded-md"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={today} className="px-3 py-1 hover:bg-accent rounded-md text-xs font-medium">Today</button>
              <button onClick={nextWeek} className="p-1 hover:bg-accent rounded-md"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-xs hidden md:flex text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> Draft</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Scheduled</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Published</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Failed</span>
          </div>
        </div>

        {/* Calendar Grid (Week View) */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 h-full min-w-[700px]">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = addDays(startDate, i);
              const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const dayPosts = getPostsForDate(date);
              
              return (
                <div key={i} className={`border-r last:border-r-0 flex flex-col ${isToday ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''}`}>
                  <div className={`p-2.5 text-center border-b ${isToday ? 'border-brand-300 bg-brand-50/50' : ''}`}>
                    <p className={`text-xs font-medium ${isToday ? 'text-brand-600 font-semibold' : 'text-muted-foreground'}`}>
                      {format(date, 'EEE')}
                    </p>
                    <p className={`text-lg mt-0.5 ${isToday ? 'font-bold text-brand-600' : 'text-foreground'}`}>
                      {format(date, 'd')}
                    </p>
                  </div>
                  
                  <div className="flex-1 p-2 space-y-2 relative group overflow-y-auto">
                    {/* Render posts for this day */}
                    {dayPosts.map(post => (
                      <div 
                        key={post.id} 
                        onClick={() => navigate(post.status === 'published' ? '/published' : '/queue')}
                        className={`p-2 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-shadow ${
                          post.status === 'scheduled' ? 'bg-blue-500/10 border-blue-500/30 text-blue-700' :
                          post.status === 'published' ? 'bg-green-500/10 border-green-500/30 text-green-700' :
                          post.status === 'failed' ? 'bg-red-500/10 border-red-500/30 text-red-700' :
                          'bg-muted border-border text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1 opacity-80 text-[10px]">
                          <Clock className="w-3 h-3" />
                          <span>{post.scheduledAt ? format(new Date(post.scheduledAt), 'HH:mm') : 'Draft'}</span>
                        </div>
                        <p className="font-medium truncate">{post.caption}</p>
                        <p className="text-[10px] opacity-75 truncate">{post.destinationName}</p>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => navigate('/create')}
                      className="w-full p-2 border border-dashed rounded-lg text-muted-foreground hover:border-brand-500 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-background/80 text-xs gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Post
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
