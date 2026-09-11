import React from 'react';
import { History, CalendarDays, CheckCircle2, Sparkles, LogIn, Upload } from 'lucide-react';

export default function HistoryPage() {
  const activities = [
    { id: 1, type: 'post_published', title: 'Successfully published post', desc: 'To "My Main Page"', time: '2 hours ago', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 2, type: 'post_scheduled', title: 'Scheduled new post', desc: 'For Oct 30, 2024 at 14:00', time: '5 hours ago', icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 3, type: 'ai_analysis', title: 'Generated AI Content', desc: 'Analyzed "funny_video.mp4"', time: '5.2 hours ago', icon: Sparkles, color: 'text-brand-500', bg: 'bg-brand-500/10' },
    { id: 4, type: 'media_upload', title: 'Uploaded 5 media files', desc: 'Total size: 45MB', time: '1 day ago', icon: Upload, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 5, type: 'login', title: 'Logged in', desc: 'IP: 192.168.1.1', time: '1 day ago', icon: LogIn, color: 'text-gray-500', bg: 'bg-gray-500/10' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">Complete audit trail of your account</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {activities.map((act) => (
            <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-card ${act.bg} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}>
                <act.icon className={`w-4 h-4 ${act.color}`} />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-background/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm">{act.title}</h4>
                  <time className="text-xs text-muted-foreground">{act.time}</time>
                </div>
                <p className="text-sm text-muted-foreground">{act.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
