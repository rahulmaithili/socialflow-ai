import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Settings2, 
  ArrowRight, 
  PenSquare, 
  CheckCircle2, 
  Send, 
  Clock, 
  Film, 
  Image as ImageIcon,
  Facebook,
  Instagram,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  createPublishJob, 
  subscribeDestinations, 
  type DestinationData 
} from '../lib/firestoreService';
import { 
  generateMultiDayViralCalendarWithGemini, 
  getGeminiApiKey, 
  type MultiDayPlanDay 
} from '../lib/geminiService';
import { addDays, format } from 'date-fns';

export default function AIStudioPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [destinations, setDestinations] = useState<DestinationData[]>([]);
  const [selectedDestId, setSelectedDestId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [calendar, setCalendar] = useState<MultiDayPlanDay[] | null>(null);
  const [strategySummary, setStrategySummary] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('');

  // Form state
  const [niche, setNiche] = useState('Tech & AI News');
  const [audience, setAudience] = useState('Creators, entrepreneurs, and digital audience');
  const [platform, setPlatform] = useState<'facebook' | 'instagram'>('facebook');
  const [tone, setTone] = useState('Viral');
  const [language, setLanguage] = useState('Hinglish');
  const [duration, setDuration] = useState<7 | 14 | 30>(7);

  const hasApiKey = !!getGeminiApiKey();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeDestinations(user.uid, 'all', (items) => {
      setDestinations(items);
    });
    return () => unsub();
  }, [user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await generateMultiDayViralCalendarWithGemini({
        niche: niche.trim(),
        audience: audience.trim(),
        platform,
        tone,
        language,
        duration
      });

      setCalendar(res.days);
      setStrategySummary(res.summary);
      setModelUsed(res.modelUsed);
    } catch (err: any) {
      console.error('Error generating calendar:', err);
      alert('Error generating calendar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseInCreator = (day: MultiDayPlanDay) => {
    const fullText = `${day.hook}\n\n${day.caption}\n\n${day.hashtags.join(' ')}`;
    navigate(`/create?prompt=${encodeURIComponent(fullText)}&name=${encodeURIComponent(day.topic)}&type=${day.type.toLowerCase()}`);
  };

  // 1-Click Push All Days to Drip-Feed Queue
  const handlePushAllToQueue = async () => {
    if (!user || !calendar || calendar.length === 0) return;
    setQueueing(true);

    try {
      const targets = selectedDestId === 'all'
        ? (destinations.length > 0 ? destinations : [{ id: 'default_page', name: 'Facebook Page' }])
        : destinations.filter(d => d.id === selectedDestId);

      let totalQueued = 0;
      const today = new Date();

      for (let i = 0; i < calendar.length; i++) {
        const item = calendar[i];
        // Calculate date: day 1 = tomorrow, day 2 = day after, etc.
        const postDate = addDays(today, i + 1);
        const [hours, minutes] = item.bestTime ? item.bestTime.split(':').map(Number) : [19, 30];
        postDate.setHours(hours || 19, minutes || 30, 0, 0);

        const scheduledTime = postDate.toISOString();
        const fullCaption = `${item.hook}\n\n${item.caption}`;

        for (const target of targets) {
          await createPublishJob({
            userId: user.uid,
            caption: fullCaption,
            hashtags: item.hashtags,
            destinationId: target.id || 'default_page',
            destinationName: target.name,
            platform,
            status: 'scheduled',
            scheduledAt: scheduledTime,
            postType: item.type === 'Reel' ? 'reel' : 'post'
          });
          totalQueued++;
        }
      }

      alert(`🚀 Success! Queued all ${calendar.length} days (${totalQueued} total posts) across your selected destinations with optimal AI peak traffic times.`);
      navigate('/queue');
    } catch (err: any) {
      alert('Failed to queue posts: ' + err.message);
    } finally {
      setQueueing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-600" /> AI Viral Calendar & Strategy Studio
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Generate 7, 14, or 30 days of high-retention Facebook & Instagram content powered by Google Gemini 2.5 Flash and 1-click batch schedule.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Panel */}
        <div className="bg-card border rounded-xl p-5 lg:col-span-1 h-fit shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <Settings2 className="w-4 h-4 text-brand-600" /> Campaign Parameters
            </h3>
            {hasApiKey ? (
              <span className="text-[10px] bg-purple-500/10 text-purple-600 font-bold px-2 py-0.5 rounded-full border border-purple-500/20">
                ⚡ Gemini 2.5 Flash
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Algorithmic Engine
              </span>
            )}
          </div>

          <form onSubmit={handleGenerate} className="space-y-3.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Target Niche / Industry</label>
              <input 
                type="text" 
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Real Estate, Viral Memes, Fitness Coaching" 
                className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                required 
              />
            </div>
            
            <div className="space-y-1">
              <label className="font-medium text-foreground">Audience Persona</label>
              <input 
                type="text" 
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Entrepreneurs, gym goers, Hindi speakers" 
                className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Platform</label>
                <select 
                  value={platform}
                  onChange={(e: any) => setPlatform(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="facebook">Facebook (Pages & Groups)</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Tone</label>
                <select 
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="Viral">Viral / High Energy</option>
                  <option value="Storytelling">Storytelling & Relatable</option>
                  <option value="Professional">Professional Authority</option>
                  <option value="Humorous">Humorous & Memes</option>
                  <option value="Curiosity">Curiosity Gap</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="Hinglish">Hinglish</option>
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Duration</label>
                <div className="grid grid-cols-3 gap-1">
                  {[7, 14, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d as any)}
                      className={`py-2 rounded-md font-bold text-[11px] transition-all border ${
                        duration === d ? 'bg-brand-600 text-white border-brand-600' : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Destination for 1-Click Push */}
            <div className="space-y-1 pt-2 border-t">
              <label className="font-medium text-foreground">Destination for 1-Click Queue</label>
              <select
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="all">🌐 All Channels ({destinations.length})</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.category || 'Active'})
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-gradient-brand text-white rounded-lg font-bold text-xs shadow-sm hover:opacity-95 transition-opacity flex justify-center items-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Researching {duration}-Day Plan with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {duration}-Day Viral Strategy</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Calendar Results */}
        <div className="lg:col-span-2 space-y-4">
          {!calendar && !loading && (
            <div className="h-full min-h-[380px] bg-card border rounded-xl border-dashed flex flex-col items-center justify-center p-8 text-center shadow-xs">
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-3">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">No Strategy Generated Yet</h3>
              <p className="text-xs text-muted-foreground max-w-md">
                Configure your niche and duration on the left, then click "Generate Strategy" to let Gemini build an algorithm-optimized viral posting plan.
              </p>
            </div>
          )}

          {calendar && (
            <div className="space-y-4">
              {/* Batch Action Header */}
              <div className="bg-card p-4 border rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{niche} Viral Masterplan</h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {calendar.length} Days Generated
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{strategySummary}</p>
                </div>

                <button
                  type="button"
                  onClick={handlePushAllToQueue}
                  disabled={queueing}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{queueing ? 'Queueing Posts...' : `⚡ Push All ${calendar.length} Days to Queue`}</span>
                </button>
              </div>

              {/* Day Cards Grid */}
              <div className="space-y-3">
                {calendar.map((item) => (
                  <div key={item.dayNumber} className="bg-card border rounded-xl p-4 shadow-xs hover:border-brand-300 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-brand-600 text-white text-[11px] font-bold rounded-md">
                          {item.dayLabel}
                        </span>
                        <h4 className="font-bold text-xs text-foreground">{item.topic}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.type === 'Reel' ? (
                          <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full font-bold border border-purple-500/20 flex items-center gap-1">
                            <Film className="w-3 h-3" /> Reel (9:16)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-semibold border border-blue-500/20 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Image Post
                          </span>
                        )}

                        <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Peak {item.bestTime || '19:30'}
                        </span>

                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                          {item.engagementScore}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-brand-700 dark:text-brand-400">
                        Hook: "{item.hook}"
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-3">
                        {item.caption}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                      <div className="flex flex-wrap gap-1">
                        {item.hashtags.map(t => (
                          <span key={t} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                      
                      <button 
                        onClick={() => handleUseInCreator(item)}
                        className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2.5 py-1 rounded transition-colors"
                      >
                        <PenSquare className="w-3.5 h-3.5" /> Customize in Post Creator →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
