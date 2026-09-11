import React from 'react';
import { Megaphone, Plus, Calendar, MoreVertical } from 'lucide-react';

export default function CampaignsPage() {
  const campaigns = [
    { id: 1, name: 'Summer Promo 2024', niche: 'Fashion', platform: 'Instagram', posts: 15, scheduled: 5, status: 'Active' },
    { id: 2, name: 'Daily Motivation', niche: 'Lifestyle', platform: 'Facebook', posts: 30, scheduled: 12, status: 'Active' },
    { id: 3, name: 'Product Launch Q3', niche: 'Tech', platform: 'Twitter', posts: 10, scheduled: 0, status: 'Draft' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Organize your content into targeted campaigns</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(camp => (
          <div key={camp.id} className="bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="font-bold text-lg mb-1">{camp.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{camp.niche} • {camp.platform}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{camp.scheduled}/{camp.posts} Scheduled</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-500 rounded-full" 
                    style={{ width: `${(camp.scheduled / camp.posts) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className={`px-2 py-1 rounded-full ${camp.status === 'Active' ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'}`}>
                  {camp.status}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  <Calendar className="w-3 h-3" /> Auto-schedule
                </span>
              </div>
            </div>
            <div className="p-3 bg-muted/20 border-t flex gap-2">
              <button className="flex-1 py-1.5 bg-background border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                Add Media
              </button>
              <button className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">
                Generate Content
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-card border border-dashed rounded-xl p-8 text-center flex flex-col items-center mt-8">
        <h3 className="font-semibold text-lg mb-2">Bulk Upload (CSV)</h3>
        <p className="text-muted-foreground text-sm max-w-md mb-4">Have your posts ready in a spreadsheet? Upload a CSV file to bulk schedule hundreds of posts at once.</p>
        <button className="px-4 py-2 border rounded-lg hover:bg-accent text-sm font-medium transition-colors">
          Download Template & Upload
        </button>
      </div>
    </div>
  );
}
