import React from 'react';
import { CheckCircle2, ExternalLink, Copy, Search, Filter } from 'lucide-react';

export default function PublishedPage() {
  const published = [
    { id: '1', media: 'dog.mp4', dest: 'Funny Animals Page', time: 'Today, 09:00 AM', extId: 'fb_12345', caption: 'Who can resist those eyes? 🥺 #puppylove' },
    { id: '2', media: 'beach.jpg', dest: 'Travel Group', time: 'Yesterday, 18:30 PM', extId: 'fb_67890', caption: 'Sunset in paradise 🌴☀️ #travel' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Published History</h1>
          <p className="text-muted-foreground">Successfully published posts across your destinations</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search published posts..." className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <button className="px-3 py-2 border rounded-lg bg-background hover:bg-accent text-muted-foreground flex gap-2 text-sm items-center font-medium">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Post Content</th>
                <th className="p-4 font-medium">Destination</th>
                <th className="p-4 font-medium">Published Time</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {published.map(item => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
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
                  <td className="p-4 text-muted-foreground">{item.time}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit bg-green-500/10 text-green-600 border border-green-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Published
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-brand-600 hover:bg-brand-50 p-1.5 rounded-md text-sm font-medium transition-colors" title="Duplicate Post">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="text-muted-foreground hover:bg-accent p-1.5 rounded-md transition-colors" title="View on Facebook">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
