import React, { useState } from 'react';
import { TrendingUp, Search, Sparkles, Hash, Lightbulb, Target } from 'lucide-react';

export default function TrendsPage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleResearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Mock AI generation
    setTimeout(() => {
      setResults({
        topic: topic || 'General',
        trends: [
          { type: 'CURRENT TRENDING', title: 'Day in the life vlogs', score: 98 },
          { type: 'RELEVANT', title: 'Productivity hacks', score: 85 },
          { type: 'NICHE', title: 'Cozy desk setups', score: 72 }
        ],
        keywords: ['lifestyle', 'aesthetic', 'motivation', 'morning routine', 'setup'],
        ideas: [
          'Show your morning routine before checking emails',
          'A time-lapse of you cleaning your workspace',
          '3 tools you use every day to save time'
        ],
        angles: ['Relatable', 'Inspirational', 'Educational']
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trend Research</h1>
          <p className="text-muted-foreground">Discover what's working in your niche</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <form onSubmit={handleResearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Topic or Niche</label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Fitness, Funny Dogs, Tech Gadgets..." 
                className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                required
              />
            </div>
          </div>
          <div className="w-full md:w-48 space-y-2">
            <label className="text-sm font-medium">Country</label>
            <select className="w-full py-2.5 px-3 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
              <option>Global</option>
              <option>United States</option>
              <option>India</option>
              <option>United Kingdom</option>
            </select>
          </div>
          <div className="w-full md:w-48 space-y-2">
            <label className="text-sm font-medium">Platform</label>
            <select className="w-full py-2.5 px-3 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
              <option>All Platforms</option>
              <option>Instagram</option>
              <option>TikTok</option>
              <option>Facebook</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching...</>
              ) : (
                <><TrendingUp className="w-4 h-4" /> Research Trends</>
              )}
            </button>
          </div>
        </form>
      </div>

      {results && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 p-3 rounded-lg text-sm border border-brand-500/20">
            <Sparkles className="w-5 h-5 shrink-0" />
            <p><strong>AI Recommended:</strong> These insights are generated based on AI analysis of recent platform patterns. Real-time API data may vary.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border rounded-xl p-5 lg:col-span-2">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-brand-500" /> Current Patterns
              </h3>
              <div className="space-y-4">
                {results.trends.map((t: any, i: number) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t.title}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{t.type}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${t.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Hash className="w-4 h-4 text-blue-500" /> Top Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {results.keywords.map((kw: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-accent text-xs font-medium rounded-md">#{kw}</span>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-orange-500" /> Best Angles
              </h3>
              <div className="flex flex-col gap-2">
                {results.angles.map((a: string, i: number) => (
                  <span key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-5 lg:col-span-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-yellow-500" /> Content Ideas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.ideas.map((idea: string, i: number) => (
                  <div key={i} className="p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm">{idea}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
