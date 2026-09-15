import React, { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Sparkles, 
  Hash, 
  Lightbulb, 
  Target, 
  PenSquare, 
  Globe, 
  ExternalLink, 
  AlertCircle, 
  Flame, 
  Share2, 
  ThumbsUp, 
  MessageSquare, 
  RefreshCw, 
  Copy, 
  Check, 
  Radar, 
  Eye, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { researchLiveTrendsWithGemini, getGeminiApiKey, type LiveTrendResult } from '../lib/geminiService';
import { searchViralPosts, rewriteViralPost, type ViralPostItem } from '../lib/viralSpyService';

export default function TrendsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'spy' | 'radar'>('spy');

  // Competitor Viral Spy State
  const [spyNiche, setSpyNiche] = useState('Digital Marketing & AI Tools');
  const [spyTimeframe, setSpyTimeframe] = useState('Last 7 Days');
  const [spyLoading, setSpyLoading] = useState(false);
  const [spyError, setSpyError] = useState<string | null>(null);
  const [viralPosts, setViralPosts] = useState<ViralPostItem[]>([]);
  const [rewritingId, setRewritingId] = useState<string | null>(null);
  const [rewrittenModal, setRewrittenModal] = useState<{
    original: ViralPostItem;
    result: { hook: string; caption: string; hashtags: string[] };
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Live Grounded Radar State
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('Global');
  const [platform, setPlatform] = useState('Facebook');
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [radarResults, setRadarResults] = useState<LiveTrendResult | null>(null);

  const hasApiKey = !!getGeminiApiKey();

  // Action: Search Competitor Viral Posts
  const handleSpySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSpyError(null);
    setSpyLoading(true);

    try {
      const posts = await searchViralPosts(spyNiche.trim() || 'Social Media Growth', spyTimeframe);
      setViralPosts(posts);
    } catch (err: any) {
      console.error('[ViralSpy] Error:', err);
      setSpyError(
        err.message?.includes('NO_API_KEY')
          ? 'Please enter your Google Gemini API Key in Settings to enable the Viral Spy Radar.'
          : (err.message || 'Failed to analyze competitor viral content.')
      );
    } finally {
      setSpyLoading(false);
    }
  };

  // Action: 1-Click AI Rewrite
  const handleRewrite = async (post: ViralPostItem) => {
    setRewritingId(post.id);
    try {
      const result = await rewriteViralPost(post);
      setRewrittenModal({ original: post, result });
    } catch (err: any) {
      alert(err.message || 'Failed to rewrite post.');
    } finally {
      setRewritingId(null);
    }
  };

  // Action: Send rewritten post directly to CreatePage
  const handleSendToEditor = () => {
    if (!rewrittenModal) return;
    const fullText = `${rewrittenModal.result.hook}\n\n${rewrittenModal.result.caption}\n\n${rewrittenModal.result.hashtags.join(' ')}`;
    navigate(`/create?prompt=${encodeURIComponent(rewrittenModal.result.hook)}&name=${encodeURIComponent(rewrittenModal.original.niche)}`, {
      state: { prefillCaption: fullText }
    });
  };

  // Action: Conduct Live Grounded Trends Research
  const handleRadarResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setRadarError(null);
    setRadarLoading(true);

    try {
      const data = await researchLiveTrendsWithGemini(
        topic.trim() || 'Viral Social Media Trends 2026',
        country,
        platform
      );
      setRadarResults(data);
    } catch (err: any) {
      console.error('Error conducting live trend research:', err);
      setRadarError(
        err.message?.includes('NO_API_KEY')
          ? 'Please enter your Google Gemini API Key in Settings to enable real-time web research.'
          : (err.message || 'Failed to complete trend research. Please try again.')
      );
    } finally {
      setRadarLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 text-foreground max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-white shadow-md shadow-rose-500/20">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Competitor Viral Spy & Trend Radar</h1>
              <p className="text-muted-foreground text-xs mt-0.5">
                Analyze breakout competitor posts, reverse-engineer psychological hooks, and 1-click rewrite them for your own pages.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-card border rounded-xl p-1 flex gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('spy')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'spy'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Competitor Viral Spy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'radar'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Trend Radar</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COMPETITOR VIRAL SPY */}
      {activeTab === 'spy' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Search Box */}
          <div className="bg-card border rounded-xl p-5 shadow-xs">
            <form onSubmit={handleSpySearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-foreground">Competitor Niche, Topic or Keyword</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={spyNiche}
                    onChange={(e) => setSpyNiche(e.target.value)}
                    placeholder="e.g. Real Estate, Affiliate Marketing, Fitness Motivation, Tech Gadgets..."
                    className="w-full pl-9 pr-4 py-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                    required
                  />
                </div>
              </div>

              <div className="w-full md:w-52 space-y-1.5">
                <label className="text-xs font-medium text-foreground">Time Window</label>
                <select
                  value={spyTimeframe}
                  onChange={(e) => setSpyTimeframe(e.target.value)}
                  className="w-full py-2.5 px-3 bg-background border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                >
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>All Time Breakouts</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={spyLoading}
                  className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg font-semibold text-xs transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
                >
                  {spyLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scanning Feeds...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      <span>Spy Viral Posts</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {spyError && (
            <div className="p-4 bg-red-950/20 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-red-200">Viral Spy Radar Notice</div>
                <p>{spyError}</p>
                {!hasApiKey && (
                  <Link to="/settings" className="inline-block mt-2 font-semibold underline text-red-300 hover:text-white">
                    Configure Google Gemini API Key in Settings →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Results Grid */}
          {viralPosts.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Breakout Viral Posts Detected in "{spyNiche}"</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
                    {viralPosts.length} Found
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {viralPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-card border rounded-xl p-5 shadow-xs hover:border-rose-500/40 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Creator Info & Viral Score */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                            {post.pageName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-xs text-foreground">{post.pageName}</h3>
                            <span className="text-[10px] text-muted-foreground">{post.postedDate} • Facebook</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/25 font-bold text-xs">
                          <Flame className="w-3.5 h-3.5 fill-rose-500" />
                          <span>{post.viralScore}% Virality</span>
                        </div>
                      </div>

                      {/* Engagement Metrics */}
                      <div className="flex items-center gap-4 py-2 border-y border-border/60 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
                          {post.likes.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                          {post.shares.toLocaleString()} shares
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                          {post.comments.toLocaleString()} comments
                        </span>
                      </div>

                      {/* Winning Hook Analysis */}
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs space-y-1">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                          🎯 The Scroll-Stopping Hook:
                        </span>
                        <p className="font-semibold text-foreground italic">"{post.winningHook}"</p>
                      </div>

                      {/* Core Viral Psychology */}
                      <div className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Psychological Trigger: </strong>
                        <span>{post.coreFormula}</span>
                      </div>

                      {/* Caption Excerpt */}
                      <div className="p-3 bg-background border rounded-lg text-xs text-muted-foreground font-mono whitespace-pre-line max-h-36 overflow-y-auto leading-relaxed">
                        {post.caption}
                      </div>
                    </div>

                    {/* 1-Click AI Rewrite Action */}
                    <div className="pt-2 border-t flex items-center justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground">Original Viral Case Study</span>
                      <button
                        type="button"
                        onClick={() => handleRewrite(post)}
                        disabled={rewritingId === post.id}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition"
                      >
                        {rewritingId === post.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Gemini AI Rewriting...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>⚡ 1-Click AI Rewrite</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !spyLoading && (
              <div className="p-12 text-center bg-card border border-dashed rounded-xl space-y-3">
                <Radar className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-sm">No Competitor Posts Scanned Yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Type a niche or keyword above and click "Spy Viral Posts" to uncover high-retention content dominating Facebook feeds right now.
                </p>
                <button
                  type="button"
                  onClick={() => handleSpySearch()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
                >
                  Scan "{spyNiche}" Now
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* TAB 2: GOOGLE LIVE GROUNDED TREND RADAR */}
      {activeTab === 'radar' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-card border rounded-xl p-5 shadow-xs">
            <form onSubmit={handleRadarResearch} className="flex flex-col md:flex-row gap-4">
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
                  disabled={radarLoading}
                  className="w-full md:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-xs"
                >
                  {radarLoading ? (
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

          {radarError && (
            <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-red-900">Research Error</div>
                <p>{radarError}</p>
                {!hasApiKey && (
                  <Link to="/settings" className="inline-block mt-2 font-semibold underline text-red-800 hover:text-red-900">
                    Go to Settings & Save Gemini API Key →
                  </Link>
                )}
              </div>
            </div>
          )}

          {radarResults && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-950 p-3.5 rounded-xl text-xs shadow-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0 text-purple-600" />
                  <p>
                    <strong>Live Web Grounded Research:</strong> Real-time internet discussions & trends analyzed for <strong>"{radarResults.topic}"</strong> in {radarResults.country}.
                  </p>
                </div>
                <div className="text-[11px] text-purple-700 font-mono bg-purple-100/80 px-2.5 py-1 rounded-md shrink-0">
                  Synced at {radarResults.researchedAt} • {radarResults.modelUsed}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Viral Patterns */}
                <div className="bg-card border rounded-xl p-4 lg:col-span-2 shadow-xs">
                  <h3 className="font-semibold text-xs flex items-center gap-2 mb-3 text-foreground">
                    <TrendingUp className="w-4 h-4 text-brand-500" /> Current Viral Patterns
                  </h3>
                  <div className="space-y-3.5">
                    {radarResults.trends.map((t, i) => (
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
                    {radarResults.keywords.map((kw: string, i: number) => (
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
                    {radarResults.angles.map((a: string, i: number) => (
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
                    {radarResults.ideas.map((idea: string, i: number) => (
                      <div key={i} className="p-3.5 border rounded-xl bg-background hover:border-brand-500 hover:shadow-xs transition-all flex flex-col justify-between">
                        <p className="text-xs text-foreground font-medium mb-3 leading-relaxed">{idea}</p>
                        <button 
                          onClick={() => navigate(`/create?prompt=${encodeURIComponent(idea)}&name=${encodeURIComponent(topic || 'Trending Post')}`)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 mt-auto pt-2 border-t"
                        >
                          <PenSquare className="w-3.5 h-3.5" /> Turn into Post →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grounding Web Sources if available */}
                {radarResults.webSources && radarResults.webSources.length > 0 && (
                  <div className="bg-card border rounded-xl p-4 lg:col-span-4 shadow-xs">
                    <h3 className="font-semibold text-xs flex items-center gap-2 mb-2.5 text-foreground">
                      <Globe className="w-4 h-4 text-emerald-600" /> Verified Live Web Sources (Google Search Grounding)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {radarResults.webSources.map((source, i) => (
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
      )}

      {/* Modal: 1-Click AI Rewritten Post */}
      {rewrittenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-xl rounded-2xl border shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-foreground">1-Click Gemini AI Viral Rewrite</h3>
              </div>
              <button
                onClick={() => setRewrittenModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                  New Scroll-Stopping Hook:
                </span>
                <p className="font-bold text-sm text-foreground">{rewrittenModal.result.hook}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  100% Original High-Converting Caption:
                </label>
                <div className="p-3 bg-muted/40 border rounded-xl font-mono text-xs whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                  {rewrittenModal.result.caption}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {rewrittenModal.result.hashtags.map((h, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 font-mono text-[11px]">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  const full = `${rewrittenModal.result.hook}\n\n${rewrittenModal.result.caption}\n\n${rewrittenModal.result.hashtags.join(' ')}`;
                  navigator.clipboard.writeText(full);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3.5 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-accent transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRewrittenModal(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-accent"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendToEditor}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <PenSquare className="w-3.5 h-3.5" />
                  <span>Send to Editor & Publish →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
