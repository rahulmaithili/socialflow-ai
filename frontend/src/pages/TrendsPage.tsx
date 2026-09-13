import React, { useState } from 'react';
import { TrendingUp, Search, Sparkles, Hash, Lightbulb, Target, PenSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TrendsPage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('Global');
  const [platform, setPlatform] = useState('Facebook');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleResearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const q = topic.trim() || 'General Viral';
      setResults({
        topic: q,
        trends: [
          { type: 'VIRAL BREAKOUT', title: `${q}: Top secrets nobody is talking about`, score: 96 },
          { type: 'HIGH ENGAGEMENT', title: `Why everyone is focusing on ${q} in 2026`, score: 89 },
          { type: 'NICHE SPECIFIC', title: `Step-by-step breakdown of ${q}`, score: 81 }
        ],
        keywords: [
          q.toLowerCase().replace(/\s+/g, ''),
          'viralpost',
          'trendingnow',
          'socialgrowth',
          'contentcreation',
          'engagementtips'
        ],
        ideas: [
          `3 critical things you must know about ${q} before starting`,
          `The ultimate comparison: Why ${q} outperforms the alternatives`,
          `A quick 60-second tutorial to master ${q} easily`
        ],
        angles: ['Relatable Story', 'Curiosity Hook', 'Educational Breakdown', 'Contrarian View']
      });
      setLoading(false);
    }, 600);
  };

  const handleUseIdea = (idea: string) => {
    navigate(`/create?prompt=${encodeURIComponent(idea)}&name=${encodeURIComponent(topic || 'Trending Post')}`);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trend & Viral Angle Research</h1>
          <p className="text-muted-foreground text-sm">Discover what content patterns and hashtags are performing best in your niche</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-5 shadow-xs">
        <form onSubmit={handleResearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-foreground">Topic or Niche</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Real Estate, Funny Memes, Fitness, Tech Gadgets..." 
                className="w-full pl-9 pr-4 py-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-xs"
                required
              />
            </div>
          </div>

          <div className="w-full md:w-44 space-y-1.5">
            <label className="text-xs font-medium text-foreground">Target Country</label>
            <select 
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full py-2.5 px-3 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-xs"
            >
              <option>Global</option>
              <option>India</option>
              <option>United States</option>
              <option>United Kingdom</option>
            </select>
          </div>

          <div className="w-full md:w-44 space-y-1.5">
            <label className="text-xs font-medium text-foreground">Platform</label>
            <select 
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full py-2.5 px-3 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-xs"
            >
              <option>Facebook</option>
              <option>Instagram</option>
              <option>All Platforms</option>
            </select>
          </div>

          <div className="flex items-end">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Research Trends
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {results && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-800 p-3 rounded-xl text-xs">
            <Sparkles className="w-4 h-4 shrink-0 text-brand-600" />
            <p><strong>AI Pattern Match:</strong> Showing viral trends and hook angles identified for <strong>{results.topic}</strong>.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border rounded-xl p-4 lg:col-span-2 shadow-xs">
              <h3 className="font-semibold text-xs flex items-center gap-2 mb-3 text-foreground">
                <TrendingUp className="w-4 h-4 text-brand-500" /> Current Viral Patterns
              </h3>
              <div className="space-y-3">
                {results.trends.map((t: any, i: number) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-foreground">{t.title}</span>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-semibold text-muted-foreground">{t.type}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${t.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-4 shadow-xs">
              <h3 className="font-semibold text-xs flex items-center gap-2 mb-3 text-foreground">
                <Hash className="w-4 h-4 text-blue-500" /> Top Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {results.keywords.map((kw: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-accent text-[11px] font-medium rounded-md text-foreground">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-4 shadow-xs">
              <h3 className="font-semibold text-xs flex items-center gap-2 mb-3 text-foreground">
                <Target className="w-4 h-4 text-orange-500" /> Best Engagement Angles
              </h3>
              <div className="flex flex-col gap-1.5 text-xs">
                {results.angles.map((a: string, i: number) => (
                  <span key={i} className="flex items-center gap-2 text-foreground font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-4 lg:col-span-4 shadow-xs">
              <h3 className="font-semibold text-xs flex items-center gap-2 mb-3 text-foreground">
                <Lightbulb className="w-4 h-4 text-yellow-500" /> Instant Content Concepts (Click to Create)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {results.ideas.map((idea: string, i: number) => (
                  <div key={i} className="p-3.5 border rounded-lg bg-background hover:border-brand-500 transition-all flex flex-col justify-between">
                    <p className="text-xs text-foreground font-medium mb-3 leading-relaxed">{idea}</p>
                    <button 
                      onClick={() => handleUseIdea(idea)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 mt-auto"
                    >
                      <PenSquare className="w-3.5 h-3.5" /> Turn into Post →
                    </button>
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
