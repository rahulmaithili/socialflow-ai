import React, { useState } from 'react';
import { Sparkles, Calendar, Settings2, ArrowRight } from 'lucide-react';

export default function AIStudioPage() {
  const [loading, setLoading] = useState(false);
  const [calendar, setCalendar] = useState<any[] | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Mock Generation
    setTimeout(() => {
      setCalendar([
        { day: 'Day 1', type: 'Image', topic: 'Productivity Tip', hook: 'Struggling to wake up?', status: 'draft' },
        { day: 'Day 2', type: 'Video', topic: 'Behind the Scenes', hook: 'Come to work with me', status: 'draft' },
        { day: 'Day 3', type: 'Text', topic: 'Quote of the day', hook: 'Read this twice.', status: 'draft' },
      ]);
      setLoading(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Content Calendar Builder</h1>
          <p className="text-muted-foreground">Generate a full week or month of content strategies instantly</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="bg-card border rounded-xl p-6 lg:col-span-1 h-fit">
          <form onSubmit={handleGenerate} className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-brand-500" />
              Calendar Parameters
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Niche</label>
              <input type="text" placeholder="e.g. Real Estate" className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience</label>
              <input type="text" placeholder="e.g. First time home buyers" className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" required />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <select className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                  <option>Facebook</option>
                  <option>Instagram</option>
                  <option>TikTok</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tone</label>
                <select className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                  <option>Professional</option>
                  <option>Casual</option>
                  <option>Viral</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Duration (Days)</label>
                <span className="text-sm font-medium text-brand-600">7</span>
              </div>
              <input type="range" min="1" max="30" defaultValue="7" className="w-full accent-brand-600" />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 mt-4 bg-gradient-brand text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate Calendar</>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {!calendar && !loading ? (
            <div className="h-full min-h-[400px] bg-card border rounded-xl border-dashed flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">Fill the parameters</h3>
              <p className="text-muted-foreground max-w-sm">The AI will generate a structured daily content calendar with topics, hooks, and media prompts.</p>
            </div>
          ) : loading ? (
             <div className="h-full min-h-[400px] bg-card border rounded-xl flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-brand-600 font-medium animate-pulse">Designing your content strategy...</p>
             </div>
          ) : (
            <div className="bg-card border rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
                <h3 className="font-semibold">Generated Plan (7 Days)</h3>
                <button className="text-sm bg-brand-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                  Save to Campaigns
                </button>
              </div>
              <div className="overflow-y-auto max-h-[600px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                    <tr>
                      <th className="p-4 font-medium">Day</th>
                      <th className="p-4 font-medium">Format</th>
                      <th className="p-4 font-medium">Topic</th>
                      <th className="p-4 font-medium">Hook</th>
                      <th className="p-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {calendar?.map((item, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="p-4 font-medium whitespace-nowrap">{item.day}</td>
                        <td className="p-4"><span className="px-2 py-1 bg-accent rounded text-xs">{item.type}</span></td>
                        <td className="p-4">{item.topic}</td>
                        <td className="p-4 italic text-muted-foreground">"{item.hook}"</td>
                        <td className="p-4">
                          <button className="text-brand-600 hover:bg-brand-50 p-1.5 rounded-md flex items-center gap-1 transition-colors">
                            Create <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
