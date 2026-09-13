import React, { useState } from 'react';
import { Sparkles, Calendar, Settings2, ArrowRight, PenSquare, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateSmartContent, GeneratedAIContent } from '../lib/firestoreService';

interface CalendarDayPlan {
  day: number;
  dayLabel: string;
  topic: string;
  type: 'Image' | 'Video' | 'Text';
  hook: string;
  caption: string;
  hashtags: string[];
  engagementScore: number;
}

export default function AIStudioPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [calendar, setCalendar] = useState<CalendarDayPlan[] | null>(null);

  // Form state
  const [niche, setNiche] = useState('Tech & AI News');
  const [audience, setAudience] = useState('Creators, entrepreneurs, and tech enthusiasts');
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'tiktok'>('facebook');
  const [tone, setTone] = useState('Viral');
  const [language, setLanguage] = useState('English');
  const [duration, setDuration] = useState(7);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const generatedDays: CalendarDayPlan[] = [];
      const topics = [
        `${niche}: Top 3 Myths Busted`,
        `How ${niche} is changing in 2026`,
        `Beginner guide to ${niche}`,
        `Behind the scenes of our workflow`,
        `The biggest mistake people make in ${niche}`,
        `Customer story & real results`,
        `Weekend inspirational thoughts on ${niche}`
      ];

      for (let i = 1; i <= duration; i++) {
        const topic = topics[(i - 1) % topics.length];
        const content = generateSmartContent(topic, tone, language, platform);
        generatedDays.push({
          day: i,
          dayLabel: `Day ${i}`,
          topic,
          type: i % 2 === 0 ? 'Video' : 'Image',
          hook: content.hooks[0],
          caption: content.captions[0].text,
          hashtags: content.hashtags.slice(0, 5),
          engagementScore: content.engagementScore
        });
      }

      setCalendar(generatedDays);
      setLoading(false);
    }, 800);
  };

  const handleUseInCreator = (day: CalendarDayPlan) => {
    const fullText = `${day.hook}\n\n${day.caption}\n\n${day.hashtags.join(' ')}`;
    navigate(`/create?prompt=${encodeURIComponent(fullText)}&name=${encodeURIComponent(day.topic)}`);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Content Strategy & Calendar Studio</h1>
          <p className="text-muted-foreground text-sm">Generate complete multi-day content strategies and post plans with AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-card border rounded-xl p-5 lg:col-span-1 h-fit shadow-xs">
          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-2 text-foreground">
              <Settings2 className="w-4 h-4 text-brand-500" />
              Calendar Parameters
            </h3>
            
            <div className="space-y-1">
              <label className="font-medium text-foreground">Industry / Niche</label>
              <input 
                type="text" 
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Fitness & Health, Real Estate, Comedy" 
                className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                required 
              />
            </div>
            
            <div className="space-y-1">
              <label className="font-medium text-foreground">Target Audience</label>
              <input 
                type="text" 
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Busy professionals, college students" 
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
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
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
                  <option value="Casual">Casual</option>
                  <option value="Professional">Professional</option>
                  <option value="Storytelling">Storytelling</option>
                  <option value="Humorous">Humorous</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>
            
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between font-medium">
                <span className="text-foreground">Schedule Duration</span>
                <span className="text-brand-600 font-bold">{duration} Days</span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="14" 
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-xs shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-70 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Strategy...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate {duration}-Day Calendar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {!calendar && !loading && (
            <div className="h-full min-h-[360px] bg-card border rounded-xl border-dashed flex flex-col items-center justify-center p-8 text-center shadow-xs">
              <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-3">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold mb-1 text-foreground">Ready to Build Your Strategy</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Select your niche, tone, and duration on the left, then click "Generate Calendar" to get ready-to-publish post concepts.
              </p>
            </div>
          )}

          {calendar && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-card p-3.5 border rounded-xl shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Generated Plan for {niche}</h3>
                  <p className="text-xs text-muted-foreground">{calendar.length} posts tailored for {platform} • {tone} Tone</p>
                </div>
                <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2.5 py-1 rounded-full border border-brand-200">
                  Ready to Schedule
                </span>
              </div>

              <div className="space-y-3">
                {calendar.map((item) => (
                  <div key={item.day} className="bg-card border rounded-xl p-4 shadow-xs hover:border-brand-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-brand-100 text-brand-800 text-[11px] font-bold rounded-md">
                          {item.dayLabel}
                        </span>
                        <h4 className="font-semibold text-xs text-foreground">{item.topic}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-semibold border border-green-500/20">
                          {item.engagementScore}% Engagement Score
                        </span>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1.5">
                      Hook: "{item.hook}"
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                      {item.caption}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                      <div className="flex flex-wrap gap-1">
                        {item.hashtags.map(t => (
                          <span key={t} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                      <button 
                        onClick={() => handleUseInCreator(item)}
                        className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2.5 py-1 rounded transition-colors"
                      >
                        <PenSquare className="w-3.5 h-3.5" /> Use in Post Creator →
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
