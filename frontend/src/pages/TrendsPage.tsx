import React, { useState } from 'react';
import { TrendingUp, Search, Sparkles, Hash, Lightbulb, Target, PenSquare, Globe, ExternalLink, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { researchLiveTrendsWithGemini, getGeminiApiKey, type LiveTrendResult } from '../lib/geminiService';

export default function TrendsPage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('Global');
  const [platform, setPlatform] = useState('Facebook');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LiveTrendResult | null>(null);

  const hasApiKey = !!getGeminiApiKey();

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await researchLiveTrendsWithGemini(
        topic.trim() || 'Viral Social Media Trends 2026',
        country,
        platform
      );
      setResults(data);
    } catch (err: any) {
      console.error('Error conducting live trend research:', err);
      setError(
        err.message?.includes('NO_API_KEY')
          ? 'Please enter your Google Gemini API Key in Settings to enable real-time web research.'
          : (err.message || 'Failed to complete trend research. Please try again.')
      );
    } finally {
      setLoading(false);
    }
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

      {error && (
        <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-red-900">Research Error</div>
            <p>{error}</p>
            {!hasApiKey && (
              <Link to="/settings" className="inline-block mt-2 font-semibold underline text-red-800 hover:text-red-900">
                Go to Settings & Save Gemini API Key →
              </Link>
            )}
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-950 p-3.5 rounded-xl text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 shrink-0 text-purple-600" />
              <p>
                <strong>Live Web Grounded Research:</strong> Real-time internet discussions & trends analyzed for <strong>"{results.topic}"</strong> in {results.country}.
              </p>
            </div>
            <div className="text-[11px] text-purple-700 font-mono bg-purple-100/80 px-2.5 py-1 rounded-md shrink-0">
              Synced at {results.researchedAt} • {results.modelUsed}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Viral Patterns */}
            <div className="bg-card border rounded-xl p-4 lg:col-span-2 shadow-xs">
              <h3 className="font-semibold text-xs flex items-center gap-2 mb-3 text-foreground">
                <TrendingUp className="w-4 h-4 text-brand-500" /> Current Viral Patterns
              </h3>
              <div className="space-y-3.5">
                {results.trends.map((t, i) => (
                  <div key={i} className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-accent/40 border border-border/40">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground">{t.title}</span>
                      <span className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded font-bold">{t.type}</span>
                    </div>
                    {t.description && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{t.description}</p>
                    )}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full" style={{ width: `${t.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Keywords */}
            <div className="bg-card border rounded-xl p-4 shadow-xs">
              <h3 className="font-semibold text-xs flex items-center gap-2 mb-3 text-foreground">
                <Hash className="w-4 h-4 text-blue-500" /> Live Keywords & Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {results.keywords.map((kw: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-medium rounded-md">
                    #{kw.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            </div>

            {/* Engagement Angles */}
            <div className="bg-card border rounded-xl p-4 shadow-xs">
              <h3 className="font-semibold text-xs flex items-center gap-2 mb-3 text-foreground">
                <Target className="w-4 h-4 text-orange-500" /> Psychological Viral Angles
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                {results.angles.map((a: string, i: number) => (
                  <span key={i} className="flex items-start gap-2 text-foreground font-medium p-1.5 rounded-md bg-accent/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" /> {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Instant Content Concepts */}
            <div className="bg-card border rounded-xl p-4 lg:col-span-4 shadow-xs">
              <h3 className="font-semibold text-xs flex items-center gap-2 mb-3 text-foreground">
                <Lightbulb className="w-4 h-4 text-yellow-500" /> Real-Time Post Ideas (Click to Create Post)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {results.ideas.map((idea: string, i: number) => (
                  <div key={i} className="p-3.5 border rounded-xl bg-background hover:border-brand-500 hover:shadow-xs transition-all flex flex-col justify-between">
                    <p className="text-xs text-foreground font-medium mb-3 leading-relaxed">{idea}</p>
                    <button 
                      onClick={() => handleUseIdea(idea)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 mt-auto pt-2 border-t"
                    >
                      <PenSquare className="w-3.5 h-3.5" /> Turn into Post →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Grounding Web Sources if available */}
            {results.webSources && results.webSources.length > 0 && (
              <div className="bg-card border rounded-xl p-4 lg:col-span-4 shadow-xs">
                <h3 className="font-semibold text-xs flex items-center gap-2 mb-2.5 text-foreground">
                  <Globe className="w-4 h-4 text-emerald-600" /> Verified Live Web Sources (Google Search Grounding)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.webSources.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border bg-accent/50 hover:bg-accent text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate max-w-xs">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
