import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('week');

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

  // Mock scheduled posts
  const scheduledPosts = [
    { id: 1, date: new Date(), title: 'Funny Dog Video', platform: 'facebook', status: 'scheduled' },
    { id: 2, date: addDays(new Date(), 1), title: 'Product Demo', platform: 'instagram', status: 'draft' },
    { id: 3, date: subDays(new Date(), 1), title: 'Weekend Vibes', platform: 'facebook', status: 'published' },
  ];

  function subDays(date: Date, amount: number): Date {
    return addDays(date, -amount);
  }

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground">Manage your publishing schedule</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-muted rounded-lg p-1">
            <button onClick={() => setView('week')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'week' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>Week</button>
            <button onClick={() => setView('month')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'month' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>Month</button>
          </div>
          <button onClick={() => navigate('/create')} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" /> Schedule Post
          </button>
        </div>
      </div>

      <div className="bg-card border rounded-xl flex-1 flex flex-col overflow-hidden">
        {/* Calendar Toolbar */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <button onClick={prevWeek} className="p-1 hover:bg-background rounded-md"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={today} className="px-3 py-1 hover:bg-background rounded-md text-sm font-medium">Today</button>
              <button onClick={nextWeek} className="p-1 hover:bg-background rounded-md"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm hidden md:flex">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> Draft</span>
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Scheduled</span>
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Published</span>
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Failed</span>
          </div>
        </div>

        {/* Calendar Grid (Week View for demo) */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 h-full min-w-[800px]">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = addDays(startDate, i);
              const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <div key={i} className={`border-r last:border-r-0 flex flex-col ${isToday ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}>
                  <div className={`p-3 text-center border-b ${isToday ? 'border-brand-200' : ''}`}>
                    <p className={`text-sm font-medium ${isToday ? 'text-brand-600' : 'text-muted-foreground'}`}>
                      {format(date, 'EEE')}
                    </p>
                    <p className={`text-2xl mt-1 ${isToday ? 'font-bold text-brand-600' : 'text-foreground'}`}>
                      {format(date, 'd')}
                    </p>
                  </div>
                  
                  <div className="flex-1 p-2 space-y-2 relative group">
                    {/* Render mock posts for this day */}
                    {scheduledPosts.filter(p => format(p.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')).map(post => (
                      <div key={post.id} className={`p-2 rounded-lg border text-sm cursor-pointer hover:shadow-md transition-shadow ${
                        post.status === 'scheduled' ? 'bg-blue-50/50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800' :
                        post.status === 'published' ? 'bg-green-50/50 border-green-200 text-green-900 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800' :
                        'bg-gray-50/50 border-gray-200 text-gray-900 dark:bg-gray-800/50 dark:text-gray-200 dark:border-gray-700'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1 text-xs opacity-80">
                          <Clock className="w-3 h-3" /> {format(post.date, 'HH:mm')}
                        </div>
                        <p className="font-medium truncate">{post.title}</p>
                      </div>
                    ))}
                    
                    <button className="absolute inset-x-2 bottom-2 p-2 border-2 border-dashed rounded-lg text-muted-foreground hover:border-brand-500 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-background/80 backdrop-blur-sm">
                      <Plus className="w-4 h-4" />
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
