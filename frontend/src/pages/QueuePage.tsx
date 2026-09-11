import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, CalendarDays, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QueuePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scheduled');

  // Mock Queue
  const queue = [
    { id: '1', media: 'dog.mp4', dest: 'Funny Animals Page', time: 'Today, 14:30', status: 'processing', caption: 'Wait for it... 😂 #funnydogs' },
    { id: '2', media: 'cat.jpg', dest: 'Funny Animals Page', time: 'Tomorrow, 10:00', status: 'scheduled', caption: 'Morning stretches 🐈' },
    { id: '3', media: 'nature.png', dest: 'Nature Photography', time: 'Oct 30, 09:00', status: 'scheduled', caption: 'Beautiful sunset in Bali 🌅' },
    { id: '4', media: 'tech.mp4', dest: 'Tech Review Group', time: 'Nov 1, 12:00', status: 'draft', caption: 'Reviewing the latest gadget...' },
  ];

  const filteredQueue = queue.filter(q => {
    if (activeTab === 'all') return true;
    if (activeTab === 'scheduled') return q.status === 'scheduled' || q.status === 'processing';
    return q.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Publishing Queue</h1>
          <p className="text-muted-foreground">Manage your scheduled and drafted posts</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="flex gap-2 bg-background p-1 rounded-lg border w-full sm:w-auto">
            {['all', 'scheduled', 'draft'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize flex-1 sm:flex-none transition-colors ${
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
              <input type="text" placeholder="Search queue..." className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
            <button className="px-3 py-2 border rounded-lg bg-background hover:bg-accent text-muted-foreground">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-medium w-12"><input type="checkbox" className="rounded border-gray-300" /></th>
                <th className="p-4 font-medium">Post Content</th>
                <th className="p-4 font-medium">Destination</th>
                <th className="p-4 font-medium">Scheduled Time</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredQueue.map(item => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 max-w-[300px]">
                      <div className="w-10 h-10 rounded bg-muted shrink-0 border"></div>
                      <div>
                        <p className="font-medium truncate">{item.caption}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.media}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{item.dest}</td>
                  <td className="p-4 whitespace-nowrap flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    {item.time}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${
                      item.status === 'processing' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' :
                      item.status === 'scheduled' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                      'bg-gray-500/10 text-gray-600 border border-gray-500/20'
                    }`}>
                      {item.status === 'processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {item.status === 'scheduled' && <Clock className="w-3 h-3" />}
                      {item.status === 'draft' && <Edit2 className="w-3 h-3" />}
                      <span className="capitalize">{item.status}</span>
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-brand-600 hover:bg-brand-50 p-1.5 rounded-md text-sm font-medium transition-colors">Edit</button>
                      <button className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredQueue.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No posts in this queue.</p>
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
