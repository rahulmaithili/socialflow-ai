import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Facebook, 
  Instagram, 
  Youtube, 
  Twitter, 
  CalendarDays,
  Send,
  Save,
  CheckCircle2,
  RefreshCw,
  Copy,
  ChevronDown,
  Plus,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeMedia, 
  subscribeDestinations, 
  createPublishJob, 
  generateSmartContent, 
  type MediaItemData, 
  type DestinationData,
  type GeneratedAIContent
} from '../lib/firestoreService';
import { getGeminiApiKey, generateContentWithGemini } from '../lib/geminiService';

export default function CreatePage() {
  const [searchParams] = useSearchParams();
  const mediaIdParam = searchParams.get('mediaId');
  const mediaUrlParam = searchParams.get('mediaUrl');
  const nameParam = searchParams.get('name');
  const destIdParam = searchParams.get('destId');
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [mediaList, setMediaList] = useState<MediaItemData[]>([]);
  const [destinations, setDestinations] = useState<DestinationData[]>([]);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>(mediaUrlParam || '');
  const [selectedMediaName, setSelectedMediaName] = useState<string>(nameParam || '');
  const [selectedDestId, setSelectedDestId] = useState<string>(destIdParam || '');
  
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'x'>('facebook');
  const [language, setLanguage] = useState('English');
  const [tone, setTone] = useState('Casual');
  const [promptTopic, setPromptTopic] = useState('');

  // AI Generated output
  const [analyzing, setAnalyzing] = useState(false);
  const [aiContent, setAiContent] = useState<GeneratedAIContent | null>(null);
  
  // Final Editor
  const [finalText, setFinalText] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  // Scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [submitting, setSubmitting] = useState(false);

  // Set default schedule date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Subscribe to media and destinations
  useEffect(() => {
    if (!user) return;
    const unsubMedia = subscribeMedia(user.uid, (items) => {
      setMediaList(items);
      if (mediaIdParam && !selectedMediaUrl) {
        const found = items.find(m => m.id === mediaIdParam);
        if (found) {
          setSelectedMediaUrl(found.url);
          setSelectedMediaName(found.name);
          setPromptTopic(found.name.replace(/\.[^/.]+$/, ''));
        }
      }
    });

    const unsubDest = subscribeDestinations(user.uid, 'all', (dests) => {
      setDestinations(dests);
      if (destIdParam && dests.some(d => d.id === destIdParam)) {
        setSelectedDestId(destIdParam);
      } else if (dests.length > 0 && !selectedDestId) {
        setSelectedDestId(dests[0].id || '');
      }
    });

    return () => {
      unsubMedia();
      unsubDest();
    };
  }, [user, mediaIdParam, destIdParam]);

  const [aiSource, setAiSource] = useState<'gemini' | 'engine'>('engine');

  // Handle AI generation with Real Gemini AI
  const handleGenerateAI = async () => {
    setAnalyzing(true);
    const topic = promptTopic || selectedMediaName || 'Viral Content';

    try {
      if (getGeminiApiKey()) {
        const geminiResult = await generateContentWithGemini(topic, tone, language, platform);
        setAiContent(geminiResult);
        setHashtags(geminiResult.hashtags);
        setAiSource('gemini');
        if (geminiResult.captions.length > 0) {
          setFinalText(geminiResult.captions[0].text + '\n\n' + geminiResult.hashtags.slice(0, 6).join(' '));
        }
      } else {
        const result = generateSmartContent(topic, tone, language, platform);
        setAiContent(result);
        setHashtags(result.hashtags);
        setAiSource('engine');
        if (result.captions.length > 0) {
          setFinalText(result.captions[0].text + '\n\n' + result.hashtags.slice(0, 5).join(' '));
        }
      }
    } catch (err: any) {
      console.warn('Gemini call error, falling back to smart engine:', err.message);
      const fallbackResult = generateSmartContent(topic, tone, language, platform);
      setAiContent(fallbackResult);
      setHashtags(fallbackResult.hashtags);
      setAiSource('engine');
      if (fallbackResult.captions.length > 0) {
        setFinalText(fallbackResult.captions[0].text + '\n\n' + fallbackResult.hashtags.slice(0, 5).join(' '));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Get selected destination name
  const getDestinationName = () => {
    const dest = destinations.find(d => d.id === selectedDestId);
    return dest ? dest.name : 'Facebook Page';
  };

  // Action: Publish Now
  const handlePublishNow = async () => {
    if (!user) return;
    if (!finalText.trim()) {
      alert('Please enter post content or generate a caption first.');
      return;
    }
    setSubmitting(true);
    try {
      await createPublishJob({
        userId: user.uid,
        caption: finalText,
        hashtags,
        mediaUrl: selectedMediaUrl,
        mediaName: selectedMediaName,
        destinationId: selectedDestId || 'default_page',
        destinationName: getDestinationName(),
        platform,
        status: 'published',
        publishedAt: new Date().toISOString()
      });
      alert('Post successfully published!');
      navigate('/published');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Schedule Post
  const handleSchedulePost = async () => {
    if (!user) return;
    if (!finalText.trim()) {
      alert('Please enter post content first.');
      return;
    }
    if (!scheduleDate) {
      alert('Please select a date to schedule.');
      return;
    }
    setSubmitting(true);
    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
      await createPublishJob({
        userId: user.uid,
        caption: finalText,
        hashtags,
        mediaUrl: selectedMediaUrl,
        mediaName: selectedMediaName,
        destinationId: selectedDestId || 'default_page',
        destinationName: getDestinationName(),
        platform,
        status: 'scheduled',
        scheduledAt: scheduledDateTime
      });
      setShowScheduleModal(false);
      alert('Post successfully added to Queue!');
      navigate('/queue');
    } catch (err: any) {
      alert('Error scheduling: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Save Draft
  const handleSaveDraft = async () => {
    if (!user) return;
    if (!finalText.trim()) {
      alert('Please enter some text to save as draft.');
      return;
    }
    setSubmitting(true);
    try {
      await createPublishJob({
        userId: user.uid,
        caption: finalText,
        hashtags,
        mediaUrl: selectedMediaUrl,
        mediaName: selectedMediaName,
        destinationId: selectedDestId || 'default_page',
        destinationName: getDestinationName(),
        platform,
        status: 'draft'
      });
      alert('Draft saved!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-8">
      
      {/* LEFT PANEL: Setup & Controls */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col gap-4 overflow-y-auto pr-1">
        
        {/* Media Selector */}
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-xs uppercase text-muted-foreground tracking-wider">1. Media Selected</h2>
            {selectedMediaUrl && (
              <button 
                onClick={() => { setSelectedMediaUrl(''); setSelectedMediaName(''); }} 
                className="text-xs text-brand-600 hover:underline"
              >
                Clear Media
              </button>
            )}
          </div>
          
          {selectedMediaUrl ? (
            <div className="aspect-video bg-muted rounded-lg border overflow-hidden relative group">
              <img src={selectedMediaUrl} alt="Selected" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => navigate('/media')} className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-semibold">
                  Change From Library
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => navigate('/media')} 
              className="aspect-video bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center flex-col gap-2 hover:border-brand-500 hover:bg-accent cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-medium text-xs">Choose Photo/Video from Media Library</span>
            </div>
          )}

          {/* Prompt / Topic input for AI */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-muted-foreground">Topic or Subject</label>
            <input 
              type="text" 
              placeholder="e.g. 5 tips to grow on Facebook, funny cat video..."
              value={promptTopic}
              onChange={(e) => setPromptTopic(e.target.value)}
              className="w-full p-2 bg-background border rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-card border rounded-xl p-4 space-y-4 flex-1">
          <h2 className="font-semibold text-xs uppercase text-muted-foreground tracking-wider">2. Configuration</h2>
          
          {/* Platform */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Target Platform</label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setPlatform('facebook')} 
                className={`p-2 rounded-lg border flex-1 flex justify-center items-center gap-1.5 text-xs font-medium transition-colors ${
                  platform === 'facebook' ? 'bg-[#1877F2] text-white border-[#1877F2]' : 'hover:bg-accent'
                }`}
              >
                <Facebook className="w-4 h-4" /> Facebook
              </button>
              <button 
                type="button"
                onClick={() => setPlatform('instagram')} 
                className={`p-2 rounded-lg border flex-1 flex justify-center items-center gap-1.5 text-xs font-medium transition-colors ${
                  platform === 'instagram' ? 'bg-gradient-to-tr from-[#FD1D1D] to-[#405DE6] text-white border-transparent' : 'hover:bg-accent'
                }`}
              >
                <Instagram className="w-4 h-4" /> Instagram
              </button>
              <button 
                type="button"
                onClick={() => setPlatform('youtube')} 
                className={`p-2 rounded-lg border flex-1 flex justify-center items-center gap-1.5 text-xs font-medium transition-colors ${
                  platform === 'youtube' ? 'bg-[#FF0000] text-white border-[#FF0000]' : 'hover:bg-accent'
                }`}
              >
                <Youtube className="w-4 h-4" /> YouTube
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 rounded-lg border bg-background text-xs outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tone</label>
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full p-2 rounded-lg border bg-background text-xs outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Casual">Casual</option>
                <option value="Professional">Professional</option>
                <option value="Viral">Viral / High Energy</option>
                <option value="Storytelling">Storytelling</option>
                <option value="Humorous">Humorous</option>
              </select>
            </div>
          </div>

          {/* Destinations Selection */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium">Publishing Destination</label>
              <button onClick={() => navigate('/pages')} className="text-[11px] text-brand-600 hover:underline">
                + Add Page
              </button>
            </div>
            
            {destinations.length > 0 ? (
              <select 
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="w-full p-2 rounded-lg border bg-background text-xs outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.accountName ? `[${d.accountName}]` : ''} ({d.category || 'Page'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-muted/40 border border-dashed rounded-lg text-xs flex justify-between items-center">
                <span className="text-muted-foreground">Default Facebook Page</span>
                <button onClick={() => navigate('/pages')} className="text-brand-600 font-medium hover:underline">
                  Connect Page
                </button>
              </div>
            )}
          </div>

          <button 
            type="button"
            onClick={handleGenerateAI}
            disabled={analyzing}
            className="w-full py-2.5 bg-gradient-brand text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI Analyzing & Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Captions & Hooks with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: AI Generated Results & Final Editor */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        
        {/* If AI Generated content exists */}
        {aiContent && (
          <div className="space-y-4">
            {/* Viral Hooks */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-600" /> Viral Hooks (Click to add)
                  </h3>
                  {aiSource === 'gemini' ? (
                    <span className="text-[10px] bg-purple-500/10 text-purple-600 font-bold px-2 py-0.5 rounded-full border border-purple-500/20">
                      ⚡ Google Gemini Real Research
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Smart Engine • <button onClick={() => navigate('/settings')} className="text-brand-600 underline">Add Gemini Key</button>
                    </span>
                  )}
                </div>
                <span className="text-xs bg-green-500/10 text-green-600 font-semibold px-2 py-0.5 rounded-full border border-green-500/20">
                  Engagement: {aiContent.engagementScore}%
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {aiContent.hooks.map((hook, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setFinalText(prev => `${hook}\n\n${prev}`)}
                    className="p-2.5 text-left text-xs bg-muted/40 hover:bg-brand-50 hover:border-brand-300 border rounded-lg transition-colors leading-relaxed"
                  >
                    {hook}
                  </button>
                ))}
              </div>
            </div>

            {/* Captions Options */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-xs uppercase text-muted-foreground">Generated Captions (Click to use)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiContent.captions.map((cap, i) => (
                  <div 
                    key={i} 
                    onClick={() => setFinalText(cap.text + '\n\n' + hashtags.slice(0, 6).join(' '))}
                    className="p-3 border rounded-lg hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer bg-background flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 px-2 py-0.5 rounded uppercase">
                        {cap.type}
                      </span>
                      <p className="text-xs whitespace-pre-wrap mt-2 leading-relaxed">{cap.text}</p>
                    </div>
                    <span className="text-[11px] text-brand-600 font-medium mt-2">Click to insert →</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtags */}
            <div className="bg-card border rounded-xl p-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground mr-1">Hashtags:</span>
              {hashtags.map((tag) => (
                <span 
                  key={tag} 
                  onClick={() => setFinalText(prev => prev.includes(tag) ? prev : `${prev} ${tag}`)}
                  className="px-2 py-0.5 bg-accent hover:bg-brand-100 hover:text-brand-700 text-foreground rounded text-xs font-medium cursor-pointer transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Final Post Editor */}
        <div className="bg-card border-2 border-brand-500/20 rounded-xl overflow-hidden flex flex-col flex-1 min-h-[340px] shadow-sm">
          <div className="p-3 bg-brand-50/50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-xs text-brand-900 uppercase tracking-wider">Final Post Content</h3>
            <span className="text-xs text-muted-foreground">{finalText.length} characters</span>
          </div>
          
          <textarea 
            className="w-full flex-1 p-4 resize-none outline-none bg-background text-sm leading-relaxed"
            value={finalText}
            onChange={(e) => setFinalText(e.target.value)}
            placeholder="Write your post here or generate using AI on the left panel..."
          />
          
          {/* Action Bar */}
          <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Target: <strong>{getDestinationName()}</strong></span>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button 
                type="button"
                onClick={handleSaveDraft}
                disabled={submitting}
                className="px-3.5 py-2 bg-background border hover:bg-accent rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>
              <button 
                type="button"
                onClick={() => setShowScheduleModal(true)}
                disabled={submitting}
                className="px-3.5 py-2 bg-background border hover:bg-accent rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 text-orange-600"
              >
                <CalendarDays className="w-4 h-4" /> Schedule
              </button>
              <button 
                type="button"
                onClick={handlePublishNow}
                disabled={submitting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" /> Publish Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Post Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" /> Schedule Publication
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Select Date</label>
                <input 
                  type="date" 
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Select Time</label>
                <input 
                  type="time" 
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="p-3 bg-brand-50/60 rounded-lg text-xs text-brand-800">
                💡 Post will be queued and published automatically to <strong>{getDestinationName()}</strong>.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button 
                onClick={handleSchedulePost}
                disabled={submitting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {submitting ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
